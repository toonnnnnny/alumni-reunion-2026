// งานที่ต้องแก้ข้อมูลหลายที่พร้อมกัน และเป็นจุดที่เชื่อมระหว่าง role
// เขียนรวมไว้ที่นี่ เพื่อให้ทุกหน้าเรียกใช้แบบเดียวกัน

import { createRecord, listRecords, listAccounts, nextNumber, notify, nowIso, randomToken, updateRecord, getRecord } from "./api";
import { canMovePay, canMoveShip } from "./status";
import { BONUS_TOKENS, type Account, type Order, type Shop, type ShipStatus, type Ticket, type Withdrawal } from "./types";
import { num } from "./format";

// ---------------- คำสั่งซื้อ (User -> Admin) ----------------

// Admin อนุมัติสลิป: เป็นหัวใจที่เชื่อม User, Admin, Staff, Packing
export async function approveOrder(order: Order): Promise<void> {
  if (!canMovePay(order.status, "paid")) throw new Error("คำสั่งซื้อนี้อนุมัติไม่ได้แล้ว");

  if (order.type === "ticket") {
    // 1) สร้างบัตร 1 ใบต่อผู้เข้าร่วม 1 คน เลข T-xxx ต่อจากเลขล่าสุด
    const tickets = await listRecords("ticket");
    const txs = await listRecords("tx");
    const ticketNos = tickets.map((t) => t.ticketNo);
    const txNos = txs.map((t) => t.txNo);
    for (let i = 0; i < order.attendees.length; i++) {
      const person = order.attendees[i];
      const ticketNo = nextNumber(ticketNos, "T-", 3);
      ticketNos.push(ticketNo);
      await createRecord("ticket", {
        ticketNo,
        orderId: order.id,
        userId: order.userId,
        holderName: person.name,
        holderEmail: person.email,
        holderIndex: i + 1,
        linkToken: randomToken(),
        tokens: BONUS_TOKENS,
        checkedIn: false,
        checkinAt: "",
        createdAt: nowIso(),
      });
      // 2) บันทึกว่าได้โทเคนฟรีมากับบัตร
      const txNo = nextNumber(txNos, "TX-", 4);
      txNos.push(txNo);
      await createRecord("tx", {
        txNo, ticketNo, type: "bonus", amount: BONUS_TOKENS, shopId: "", shopName: "", items: [], staffId: "", staffName: "", method: "", createdAt: nowIso(),
      });
    }
  } else {
    // เสื้อ: ตัดสต็อกตามสี/ไซซ์ที่สั่ง
    for (const item of order.items) {
      const shirt = await getRecord("shirt", item.shirtId);
      const stock = { ...shirt.stock };
      const colorStock = { ...(stock[item.color] || {}) };
      colorStock[item.size] = Math.max(0, (colorStock[item.size] || 0) - item.qty);
      stock[item.color] = colorStock;
      await updateRecord("shirt", shirt.id, { stock });
    }
  }

  // 3) เปลี่ยนสถานะคำสั่งซื้อ
  const shipStatus: ShipStatus | "" = order.type === "shirt" ? (order.delivery === "ship" ? "wait_pack" : "not_picked") : "";
  await updateRecord("order", order.id, { status: "paid", rejectReason: "", shipStatus, updatedAt: nowIso() });

  // 4) แจ้งเตือนผู้ซื้อ และฝ่ายแพ็คถ้าต้องจัดส่ง
  await notify("user", "ชำระเงินสำเร็จ", `${order.orderNo} ได้รับการยืนยันแล้ว`, `/user/orders/${order.id}`, order.userId);
  if (shipStatus === "wait_pack") {
    await notify("packing", "คำสั่งซื้อใหม่รอแพ็ค", `${order.orderNo} · ${order.items.reduce((s, i) => s + i.qty, 0)} ตัว`, `/packing/${order.id}`);
  }
}

// ส่งอีเมลบัตรจริงผ่าน Resend (เรียก API route ฝั่งเซิร์ฟเวอร์ของเว็บเราเอง)
// ส่งไม่สำเร็จจะไม่ทำให้การอนุมัติล้ม แต่คืนข้อความให้ Admin เห็นและกดส่งซ้ำได้
export async function sendTicketEmail(orderId: string): Promise<{ ok: boolean; to?: string; error?: string }> {
  try {
    const res = await fetch("/api/email/ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const data = (await res.json()) as { ok: boolean; to?: string; error?: string };
    if (!data.ok) await updateRecord("order", orderId, { emailError: data.error ?? "ส่งไม่สำเร็จ" });
    return data;
  } catch {
    return { ok: false, error: "เชื่อมต่อเซิร์ฟเวอร์ส่งอีเมลไม่ได้" };
  }
}

// Admin ปฏิเสธสลิป พร้อมเหตุผล
export async function rejectOrder(order: Order, reason: string): Promise<void> {
  if (!canMovePay(order.status, "rejected")) throw new Error("คำสั่งซื้อนี้ปฏิเสธไม่ได้แล้ว");
  await updateRecord("order", order.id, { status: "rejected", rejectReason: reason, updatedAt: nowIso() });
  await notify("user", "ชำระเงินไม่ผ่าน", `${order.orderNo}: ${reason}`, `/user/orders/${order.id}`, order.userId);
}

// User ส่งสลิปใหม่หลังถูกปฏิเสธ
export async function resubmitSlip(order: Order, slipImage: string): Promise<void> {
  if (!canMovePay(order.status, "pending_slip")) throw new Error("ส่งสลิปใหม่ไม่ได้");
  await updateRecord("order", order.id, { status: "pending_slip", slipImage, updatedAt: nowIso() });
  await notify("admin", "สลิปใหม่รอตรวจสอบ", `${order.orderNo} ส่งสลิปใหม่`, `/admin/payments/${order.id}`);
}

// ---------------- Packing ----------------

export async function moveShip(order: Order, to: ShipStatus): Promise<void> {
  if (!order.shipStatus || !canMoveShip(order.shipStatus, to)) throw new Error("เปลี่ยนสถานะนี้ไม่ได้");
  await updateRecord("order", order.id, { shipStatus: to, updatedAt: nowIso() });
  const text: Record<string, string> = { packed: "แพ็คเสื้อเรียบร้อย รอจัดส่ง", shipped: "จัดส่งเสื้อแล้ว", picked: "รับเสื้อที่หน้างานแล้ว" };
  if (text[to]) await notify("user", "อัปเดตคำสั่งซื้อเสื้อ", `${order.orderNo} ${text[to]}`, `/user/orders/${order.id}`, order.userId);
}

// ---------------- บัตร / โทเคน (Staff, Vendor) ----------------

// หาบัตรจากข้อความที่สแกนได้: รองรับ "T-001" หรือ ลิงก์ ".../t/<token>"
export async function findTicket(code: string): Promise<Ticket | null> {
  const clean = code.trim();
  const tickets = await listRecords("ticket");
  const linkMatch = clean.match(/\/t\/([A-Za-z0-9]+)/);
  if (linkMatch) return tickets.find((t) => t.linkToken === linkMatch[1]) ?? null;
  return tickets.find((t) => t.ticketNo.toUpperCase() === clean.toUpperCase()) ?? null;
}

// Staff เช็กอินเข้างาน (สแกนซ้ำไม่ได้)
export async function checkIn(ticket: Ticket): Promise<Ticket> {
  if (ticket.checkedIn) throw new Error(`บัตรนี้เช็กอินแล้วเมื่อ ${new Date(ticket.checkinAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`);
  return updateRecord("ticket", ticket.id, { checkedIn: true, checkinAt: nowIso() });
}

// Staff เติมโทเคน: ลูกค้าโอนเข้าบัญชีของงาน (ไม่รับเงินสด) บันทึก method ไว้ให้ Admin ตรวจสอบธุรกรรมย้อนหลังได้
export async function topUp(ticket: Ticket, amount: number, method: "cash" | "transfer", staff: Account): Promise<Ticket> {
  if (amount <= 0) throw new Error("จำนวนต้องมากกว่า 0");
  const latest = await getRecord("ticket", ticket.id);
  const updated = await updateRecord("ticket", ticket.id, { tokens: latest.tokens + amount });
  const txs = await listRecords("tx");
  await createRecord("tx", {
    txNo: nextNumber(txs.map((t) => t.txNo), "TX-", 4),
    ticketNo: ticket.ticketNo, type: "topup", amount, shopId: "", shopName: "", items: [],
    staffId: staff.id, staffName: staff.name, method, createdAt: nowIso(),
  });
  return updated;
}

// Vendor ขายของ: ตัดโทเคนลูกค้า + เพิ่มยอดให้ร้าน
export async function sell(ticket: Ticket, shop: Shop, items: { name: string; qty: number; price: number }[]): Promise<{ ticket: Ticket; txNo: string }> {
  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const latest = await getRecord("ticket", ticket.id); // อ่านยอดล่าสุดอีกครั้งก่อนตัด
  if (latest.tokens < total) throw new Error(`โทเคนไม่เพียงพอ (มี ${num(latest.tokens)} ต้องใช้ ${num(total)})`);

  const updated = await updateRecord("ticket", ticket.id, { tokens: latest.tokens - total });
  const latestShop = await getRecord("shop", shop.id);
  await updateRecord("shop", shop.id, { balance: latestShop.balance + total });
  const txs = await listRecords("tx");
  const txNo = nextNumber(txs.map((t) => t.txNo), "TX-", 4);
  await createRecord("tx", {
    txNo, ticketNo: ticket.ticketNo, type: "sale", amount: -total, shopId: shop.id, shopName: shop.name, items,
    staffId: "", staffName: "", method: "", createdAt: nowIso(),
  });
  return { ticket: updated, txNo };
}

// ---------------- ถอนเงินร้านค้า (Vendor -> Admin) ----------------

export const WITHDRAW_COOLDOWN_MS = 24 * 60 * 60 * 1000;

// ถอนได้วันละครั้ง: คืนเวลาที่ถอนได้ครั้งถัดไป (0 = ถอนได้เลย)
export function nextWithdrawAt(history: Withdrawal[]): number {
  const last = [...history].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0];
  if (!last) return 0;
  const next = new Date(last.requestedAt).getTime() + WITHDRAW_COOLDOWN_MS;
  return next > Date.now() ? next : 0;
}

// ร้านส่งคำขอถอน: โทเคนส่วนที่ขอถอนถูกกันออกจากยอดทันที
export async function requestWithdraw(shop: Shop, amount: number): Promise<Withdrawal> {
  const latest = await getRecord("shop", shop.id);
  if (amount <= 0 || amount > latest.balance) throw new Error(`กรอกได้ 1 – ${num(latest.balance)} โทเคน`);
  const all = await listRecords("withdrawal");
  if (nextWithdrawAt(all.filter((w) => w.shopId === shop.id))) throw new Error("ถอนได้วันละ 1 ครั้ง");

  await updateRecord("shop", shop.id, { balance: latest.balance - amount });
  const wd = await createRecord("withdrawal", {
    wdNo: nextNumber(all.map((w) => w.wdNo), "WD-", 4),
    shopId: shop.id, shopName: shop.name, amount,
    bankName: shop.bankName, bankAccount: shop.bankAccount, bankAccountName: shop.bankAccountName,
    status: "pending", slipImage: "", requestedAt: nowIso(), doneAt: "",
  });
  await notify("admin", "คำขอถอนเงินใหม่", `${shop.name} · ${num(amount)} บาท`, `/admin/shops/withdrawals/${wd.id}`);
  return wd;
}

// Admin โอนเงินแล้วกด "ดำเนินการเสร็จเรียบร้อย" (แนบสลิปหรือไม่ก็ได้)
export async function completeWithdraw(wd: Withdrawal, slipImage: string): Promise<void> {
  if (wd.status !== "pending") throw new Error("คำขอนี้ดำเนินการแล้ว");
  await updateRecord("withdrawal", wd.id, { status: "done", slipImage, doneAt: nowIso() });
  const vendors = await listAccounts();
  for (const v of vendors.filter((a) => a.role === "vendor" && a.shopId === wd.shopId)) {
    await notify("vendor", "ถอนเงินสำเร็จ", `${wd.wdNo} โอน ${num(wd.amount)} บาทเข้าบัญชีร้านแล้ว`, `/vendor/withdraw`, v.id);
  }
}
