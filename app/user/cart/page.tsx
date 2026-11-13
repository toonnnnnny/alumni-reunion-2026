"use client";
// ตะกร้า -> เลือกวิธีรับสินค้า (จัดส่ง/รับหน้างาน) -> ชำระเงิน/ส่งสลิป -> สร้างคำสั่งซื้อ

// ShirtThumb = รูปเสื้อขนาดเล็กในรายการตะกร้า
import { ShirtThumb } from "@/components/ShirtImage";
import { useRouter } from "next/navigation";
import { useState } from "react";
// ไอคอนถังขยะ (ปุ่มลบ)
import { Trash2 } from "lucide-react";
// ฟังก์ชันคุยกับ MockAPI
import { createRecord, listRecords, nextNumber, notify, nowIso } from "@/lib/api";
import { useAuth } from "@/lib/auth";
// ใช้ตะกร้า
import { useCart } from "@/lib/cart";
import { baht } from "@/lib/format";
import { TopBar, MobileBody } from "@/components/shells";
// แถบขั้นตอนด้านบน
import { Steps } from "@/components/Steps";
// หน้าจ่ายเงิน + อัปสลิป (ตัวเดียวกับตอนซื้อบัตร)
import { PaymentStep } from "@/components/PaymentStep";
import { ButtonLink, Button, Card, EmptyState, ErrorText, InfoRow, Stepper, TextArea, cx } from "@/components/ui";


// หน้า /user/cart
export default function Cart() {
  const router = useRouter();
  // ผู้ซื้อที่ล็อกอินอยู่
  const { account } = useAuth();
  // หยิบของจากตะกร้า: รายการ, แก้จำนวน, ลบ, ราคารวม, ล้างตะกร้า
  const { items, changeQty, remove, total, clear } = useCart();
  // step: 0 ตะกร้า -> 1 วิธีรับสินค้า -> 2 ชำระเงิน
  const [step, setStep] = useState(0);
  // วิธีรับ: ship = จัดส่งถึงบ้าน, pickup = รับหน้างาน
  const [delivery, setDelivery] = useState<"ship" | "pickup">("ship");
  // ที่อยู่จัดส่งที่พิมพ์
  const [address, setAddress] = useState("");
  // ข้อความ error
  const [error, setError] = useState("");

  // ยังโหลดบัญชีไม่เสร็จ -> ยังไม่แสดง
  if (!account) return null;
  const grandTotal = total; // ไม่มีค่าส่ง ทั้งจัดส่งและรับหน้างาน

  // กดไปหน้าชำระเงิน
  function goPay() {
    // เลือกจัดส่งแต่ที่อยู่สั้นกว่า 10 ตัวอักษร -> ไม่ให้ไปต่อ
    if (delivery === "ship" && address.trim().length < 10) return setError("กรอกที่อยู่จัดส่งให้ครบ");
    setError("");
    // ผ่าน -> ไปขั้นจ่ายเงิน
    setStep(2);
  }

  // ส่งสลิป -> สร้างคำสั่งซื้อเสื้อ -> แจ้ง Admin -> ล้างตะกร้า
  // slip = รูปสลิป (base64) ที่ส่งมาจาก PaymentStep
  async function submitOrder(slip: string) {
    // ดึงคำสั่งซื้อทั้งหมด เพื่อหาเลขล่าสุด
    const orders = await listRecords("order");
    // เลขคำสั่งซื้อถัดไป เช่น ORD-240013
    const orderNo = nextNumber(orders.map((o) => o.orderNo), "ORD-", 6);
    // บันทึกคำสั่งซื้อเสื้อลง MockAPI (POST /records)
    const order = await createRecord("order", {
      // type: shirt = คำสั่งซื้อเสื้อ, items = เสื้อในตะกร้า, status: pending_slip = รอแอดมินตรวจ
      orderNo, userId: account!.id, type: "shirt", attendees: [], items, total: grandTotal, slipImage: slip, status: "pending_slip", rejectReason: "",
      // delivery = วิธีรับ, address = ชื่อ · ที่อยู่ · เบอร์ (ถ้ารับหน้างานเว้นว่าง)
      delivery, address: delivery === "ship" ? `${account!.name} · ${address.trim()} · ${account!.phone}` : "", shipStatus: "", tracking: "",
      createdAt: nowIso(), updatedAt: nowIso(),
    });
    // แจ้งเตือนแอดมินว่ามีสลิปเสื้อรอตรวจ
    await notify("admin", "สลิปใหม่รอตรวจสอบ (เสื้อ)", `${orderNo} · ${account!.name} · ${baht(grandTotal)}`, `/admin/payments/${order.id}`);
    // สั่งเสร็จแล้ว ล้างตะกร้า
    clear();
    // พาไปหน้าสถานะคำสั่งซื้อ
    router.replace(`/user/orders/${order.id}`);
  }

  // ตะกร้าว่าง (และยังไม่ถึงขั้นจ่าย) -> แสดงหน้าว่าง + ปุ่มกลับไปเลือกเสื้อ
  if (items.length === 0 && step < 2) {
    return (
      <>
        <TopBar title="ตะกร้า" back="/user/shop" />
        <MobileBody><EmptyState title="ตะกร้ายังว่าง" action={<ButtonLink href="/user/shop">เลือกซื้อเสื้อ</ButtonLink>} /></MobileBody>
      </>
    );
  }

  // ส่วนหน้าตา
  return (
    <>
      {/* แถบบน: ขั้น 1 มีปุ่มย้อนกลับไปขั้น 0 */}
      <TopBar title="สั่งซื้อเสื้อ" back={step === 0 ? "/user/shop" : undefined} right={step === 1 ? <Button size="sm" variant="ghost" onClick={() => setStep(0)}>ย้อนกลับ</Button> : undefined} />
      <MobileBody>
        {/* แถบขั้นตอน ตะกร้า -> รับสินค้า -> ชำระเงิน */}
        <Steps labels={["ตะกร้า", "รับสินค้า", "ชำระเงิน"]} current={step} />
        {/* ===== ขั้น 0: รายการในตะกร้า ===== */}
        {step === 0 && (
          <>
            {/* วนแสดงเสื้อในตะกร้าทีละแถว */}
            {items.map((it, i) => (
              <Card key={i} className="flex items-center gap-3">
                <ShirtThumb name={it.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{it.name}</p>
                  <p className="text-xs text-muted">{it.color} · {it.size} · {baht(it.price)}</p>
                </div>
                {/* ปุ่ม - / + แก้จำนวน -> เรียก changeQty ใน lib/cart.tsx */}
                <Stepper value={it.qty} onChange={(n) => changeQty(i, n)} />
                {/* ปุ่มถังขยะ ลบแถวนี้ -> เรียก remove ใน lib/cart.tsx */}
                <button onClick={() => remove(i)} className="grid size-9 place-items-center rounded-lg bg-bad-soft text-bad" aria-label="ลบ"><Trash2 className="size-4" /></button>
              </Card>
            ))}
            {/* ราคารวม */}
            <Card><InfoRow label="ราคาสินค้า" value={baht(total)} strong /></Card>
            {/* ไปขั้น 1 */}
            <Button full size="lg" onClick={() => setStep(1)}>ถัดไป: วิธีรับสินค้า</Button>
          </>
        )}
        {/* ===== ขั้น 1: เลือกวิธีรับสินค้า ===== */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {/* วนสร้าง 2 ปุ่ม จัดส่ง / รับหน้างาน อันที่เลือกเป็นกรอบสีกรม */}
              {(["ship", "pickup"] as const).map((d) => (
                <button key={d} onClick={() => setDelivery(d)} className={cx("rounded-2xl border p-4 text-left", delivery === d ? "border-navy bg-navy-soft" : "border-line bg-white")}>
                  <p className="font-semibold">{d === "ship" ? "จัดส่งถึงบ้าน" : "รับที่หน้างาน"}</p>
                  <p className="text-xs text-muted">{d === "ship" ? "ส่งฟรี · ส่งตามที่อยู่ที่กรอก" : "ฟรี · รับวันงานที่จุด Staff"}</p>
                </button>
              ))}
            </div>
            {/* เลือกจัดส่ง -> ช่องกรอกที่อยู่ / เลือกรับหน้างาน -> ข้อความแนะนำ */}
            {delivery === "ship" ? (
              <TextArea label="ที่อยู่จัดส่ง" value={address} onChange={setAddress} placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์" />
            ) : (
              <p className="rounded-xl bg-navy-soft p-4 text-sm text-muted">แสดงเลขคำสั่งซื้อกับ Staff ที่จุดบริการในวันงาน (15 ธ.ค. 2569)</p>
            )}
            {/* สรุปยอด (ไม่มีค่าส่ง) */}
            <Card>
              <InfoRow label="ราคาสินค้า" value={baht(total)} />
              <InfoRow label="ยอดชำระ" value={baht(grandTotal)} strong />
            </Card>
            <ErrorText text={error} />
            {/* ไปหน้าชำระเงิน (goPay เช็กที่อยู่ก่อน) */}
            <Button full size="lg" onClick={goPay}>ไปหน้าชำระเงิน</Button>
          </>
        )}
        {/* ===== ขั้น 2: จ่ายเงิน + อัปสลิป ===== กดส่งแล้วเรียก submitOrder */}
        {step === 2 && <PaymentStep total={grandTotal} onSubmit={submitOrder} />}
      </MobileBody>
    </>
  );
}
