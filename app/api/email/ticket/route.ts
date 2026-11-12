// POST /api/email/ticket  { orderId }
// ส่งอีเมลบัตรเข้ากล่องจดหมายจริงผ่าน Resend (เรียก REST API ด้วย fetch ไม่ต้องลง library)
// ทำฝั่งเซิร์ฟเวอร์ เพราะ RESEND_API_KEY เป็นความลับ ห้ามอยู่ในโค้ดฝั่งเบราว์เซอร์
// QR Code แนบเป็นรูป inline (cid) เพราะ Gmail ไม่แสดงรูปแบบ data:image

import { NextResponse } from "next/server";
import QRCode from "qrcode";
import type { Account, Order, Ticket } from "@/lib/types";

// หา URL ของ API: ถ้าใช้ MockAPI จำลอง (/api/mock) ต้องเติมโดเมนของเว็บเราเองข้างหน้า
function apiBase(origin: string): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE || "/api/mock").replace(/\/$/, "");
  return base.startsWith("http") ? base : origin + base;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) return [] as T;
  if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (${res.status})`);
  return res.json() as Promise<T>;
}

// ป้องกันชื่อที่มีอักขระ HTML ทำให้อีเมลเพี้ยน
function esc(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

// สร้าง HTML อีเมล (ใช้ table + inline style เพราะโปรแกรมอีเมลไม่รองรับ CSS สมัยใหม่)
function buildHtml(buyer: Account, tickets: Ticket[], site: string): string {
  const btn = (href: string, label: string) =>
    `<a href="${href}" style="display:block;border:1.5px solid #253448;border-radius:12px;padding:12px;text-align:center;color:#253448;font-weight:600;text-decoration:none">${label} &rsaquo;</a>`;
  const cards = tickets
    .map((t) => {
      const owner = t.holderIndex === 1;
      const link = `${site}/t/${t.linkToken}`;
      return `
      <tr><td style="padding:0 0 16px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f3;border-radius:16px;padding:16px">
          <tr><td style="font-size:15px;font-weight:600;color:#222">บัตร ${t.ticketNo} · ${esc(t.holderName)}
            <span style="float:right;font-size:12px;border-radius:99px;padding:2px 10px;background:${owner ? "#e8edf2;color:#253448" : "#faf0e1;color:#c28b45"}">${owner ? "บัตรของคุณ" : `ผู้เข้าร่วม ${t.holderIndex}`}</span></td></tr>
          <tr><td align="center" style="padding:14px 0"><img src="cid:qr-${t.ticketNo}" width="170" height="170" alt="QR ${t.ticketNo}" style="background:#fff;border-radius:12px;padding:8px"/></td></tr>
          <tr><td align="center" style="font-size:12px;color:#6b7280;padding-bottom:12px">15 ธ.ค. 2569 · Main Hall · 50 โทเคน</td></tr>
          <tr><td>${owner ? btn(`${site}/user/qr?t=${t.ticketNo}`, "ดูบัตรในเว็บ") : btn(link, `เปิดบัตร ${t.ticketNo}`)}</td></tr>
          <tr><td align="center" style="font-size:12px;color:#6b7280;padding-top:8px">${
            owner ? `บัตรของเจ้าของบัญชี · ต้องเข้าสู่ระบบด้วย ${esc(buyer.email)}` : `<a href="${link}" style="color:#0369a1">${link}</a>`
          }</td></tr>
        </table>
      </td></tr>`;
    })
    .join("");

  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Prompt,Tahoma,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;padding:24px 20px">
      <tr><td style="font-size:20px;font-weight:700;color:#222;padding-bottom:16px">Alumni Reunion 2026 ขอบคุณสำหรับคำสั่งซื้อ !</td></tr>
      <tr><td style="font-size:16px;font-weight:600;color:#222;padding-bottom:6px">สวัสดี ${esc(buyer.name)}</td></tr>
      <tr><td style="font-size:14px;color:#6b7280;padding-bottom:20px">ชำระเงินสำเร็จ ${tickets.map((t) => t.ticketNo).join(" และ ")} สามารถใช้คิวอาร์โค้ดของคุณ เข้างาน เติมโทเคน ซื้อของภายในงาน</td></tr>
      ${cards}
      <tr><td align="center" style="font-size:12px;color:#9aa3af;padding-top:8px">โทเคนแลกคืนเป็นเงินสดไม่ได้ · ใช้ได้เฉพาะภายในงานวันที่ 15 ธ.ค. 2569</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, error: "ยังไม่ได้ตั้งค่า RESEND_API_KEY ใน .env.local" }, { status: 500 });

  try {
    const { orderId } = (await request.json()) as { orderId: string };
    const origin = new URL(request.url).origin;
    const site = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
    const base = apiBase(origin);

    // 1) โหลดคำสั่งซื้อ ผู้ซื้อ และบัตรของคำสั่งซื้อนี้
    const order = await getJson<Order>(`${base}/records/${orderId}`);
    if (order.kind !== "order" || order.type !== "ticket") throw new Error("ไม่ใช่คำสั่งซื้อบัตร");
    if (order.status !== "paid") throw new Error("คำสั่งซื้อนี้ยังไม่ได้รับการอนุมัติ");
    const buyer = await getJson<Account>(`${base}/accounts/${order.userId}`);
    const allTickets = await getJson<Ticket[]>(`${base}/records?kind=ticket`);
    const tickets = allTickets.filter((t) => t.kind === "ticket" && t.orderId === order.id).sort((a, b) => a.holderIndex - b.holderIndex);
    if (tickets.length === 0) throw new Error("ยังไม่มีบัตรของคำสั่งซื้อนี้");

    // 2) สร้างรูป QR เป็นไฟล์ PNG แนบแบบ inline
    const attachments = await Promise.all(
      tickets.map(async (t) => ({
        filename: `${t.ticketNo}.png`,
        content: (await QRCode.toBuffer(t.ticketNo, { width: 340, margin: 1 })).toString("base64"),
        content_id: `qr-${t.ticketNo}`,
      }))
    );

    // 3) ส่งผ่าน Resend REST API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Alumni Reunion 2026 <onboarding@resend.dev>",
        // RESEND_TEST_TO: ตอนยังไม่ยืนยันโดเมน Resend ส่งได้แค่อีเมลเจ้าของบัญชี จึงส่งไปที่อีเมลนี้แทนทุกฉบับ
        to: [(process.env.RESEND_TEST_TO || buyer.email).trim().toLowerCase()], // อีเมลไม่สนตัวพิมพ์เล็ก-ใหญ่ ส่งเป็นตัวเล็กเสมอ
        subject: "Alumni Reunion 2026 ขอบคุณสำหรับคำสั่งซื้อ !",
        html: buildHtml(buyer, tickets, site),
        attachments,
      }),
    });
    const result = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) throw new Error(result.message || `Resend ตอบกลับ ${res.status}`);

    // 4) จดว่าส่งอีเมลแล้ว (Admin จะเห็นในหน้าคำสั่งซื้อ)
    await fetch(`${base}/records/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailSentAt: new Date().toISOString(), emailError: "" }),
    });
    return NextResponse.json({ ok: true, id: result.id, to: process.env.RESEND_TEST_TO ? `${process.env.RESEND_TEST_TO} (โหมดทดสอบ แทน ${buyer.email})` : buyer.email });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "ส่งอีเมลไม่สำเร็จ" }, { status: 500 });
  }
}
