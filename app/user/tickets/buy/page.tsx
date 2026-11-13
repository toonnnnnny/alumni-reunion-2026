"use client";
// ซื้อบัตร 4 ขั้น: จำนวน -> ผู้เข้าร่วม -> ตรวจสอบ -> ชำระเงิน/ส่งสลิป
// ใบที่ 1 = ผู้ซื้อเสมอ ดึงข้อมูลจากบัญชีอัตโนมัติและแก้ไม่ได้ ใบที่ 2 ขึ้นไปกรอกเอง

// useRouter = สั่งเปลี่ยนหน้าด้วยโค้ด
import { useRouter } from "next/navigation";
// useState = ตัวแปรที่เปลี่ยนแล้วหน้าจอวาดใหม่
import { useState } from "react";
import { Lock } from "lucide-react";
// ฟังก์ชันคุยกับ MockAPI: สร้างข้อมูล / อ่านทั้งหมด / หาเลขถัดไป / แจ้งเตือน / เวลาปัจจุบัน
import { createRecord, listRecords, nextNumber, notify, nowIso } from "@/lib/api";
// ระบบล็อกอิน (เอาข้อมูลผู้ซื้อมาใส่บัตรใบที่ 1)
import { useAuth } from "@/lib/auth";
// baht = จัดรูปเงิน เช่น 2,000 บาท
import { baht } from "@/lib/format";
// TICKET_PRICE = 1000, BONUS_TOKENS = 50, Attendee = ชนิดข้อมูลผู้เข้าร่วม (ชื่อ อีเมล เบอร์)
import { TICKET_PRICE, BONUS_TOKENS, type Attendee } from "@/lib/types";
import { TopBar, MobileBody } from "@/components/shells";
// Steps = แถบแสดงขั้นตอน 1-2-3-4 ด้านบน
import { Steps } from "@/components/Steps";
// PaymentStep = หน้าจ่ายเงิน + อัปสลิป (ใช้ร่วมกับตะกร้าเสื้อ)
import { PaymentStep } from "@/components/PaymentStep";
import { Badge, Banner, Button, Card, ErrorText, Field, InfoRow, Stepper, TokenPolicy, cx } from "@/components/ui";

// ชื่อของแต่ละขั้น
const STEP_LABELS = ["จำนวน", "ผู้เข้าร่วม", "ตรวจสอบ", "ชำระเงิน"];

// หน้า /user/tickets/buy
export default function BuyTicket() {
  // ตัวสั่งเปลี่ยนหน้า
  const router = useRouter();
  // account = ข้อมูลผู้ซื้อที่ล็อกอินอยู่
  const { account } = useAuth();
  // step = อยู่ขั้นไหน: 0 จำนวน, 1 ผู้เข้าร่วม, 2 ตรวจสอบ, 3 ชำระเงิน
  const [step, setStep] = useState(0);
  // qty = จำนวนบัตร เริ่มที่ 1
  const [qty, setQty] = useState(1);
  const [others, setOthers] = useState<Attendee[]>([]); // ผู้เข้าร่วมใบที่ 2 เป็นต้นไป
  // ข้อความ error
  const [error, setError] = useState("");

  // ยังโหลดข้อมูลบัญชีไม่เสร็จ -> ยังไม่แสดงอะไร
  if (!account) return null;

  // ใบที่ 1 มาจากข้อมูลตอนสมัครเสมอ
  // owner = ข้อมูลใบที่ 1 ดึงจากบัญชี
  const owner: Attendee = { name: account.name, email: account.email, phone: account.phone };
  // รวมรายชื่อทุกใบ: [ใบที่ 1, ...ใบที่ 2 เป็นต้นไป]
  const attendees = [owner, ...others];
  // ยอดรวม = จำนวน × 1,000
  const total = qty * TICKET_PRICE;

  // ปรับจำนวนช่องกรอกผู้เข้าร่วมให้ตรงกับจำนวนบัตร
  function changeQty(n: number) {
    // เก็บจำนวนใหม่
    setQty(n);
    // ปรับลิสต์ผู้เข้าร่วมให้มี (จำนวน - 1) ช่อง
    setOthers((prev) => {
      // slice = ตัดช่องที่เกินทิ้ง (กรณีลดจำนวน)
      const list = prev.slice(0, n - 1);
      // while = เพิ่มช่องว่างจนครบ (กรณีเพิ่มจำนวน)
      while (list.length < n - 1) list.push({ name: "", email: "", phone: "" });
      return list;
    });
  }

  // พิมพ์ในช่องของผู้เข้าร่วมคนที่ index -> แก้เฉพาะช่องนั้น (key = name/email/phone)
  function updateOther(index: number, key: keyof Attendee, value: string) {
    // .map = วนทุกคน ถ้าเป็นคนที่แก้ก็สร้างข้อมูลใหม่ คนอื่นคงเดิม
    setOthers((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)));
  }

  // ตรวจว่ากรอกผู้เข้าร่วมครบก่อนไปขั้นถัดไป
  function goReview() {
    // findIndex = หาคนแรกที่ชื่อว่าง หรืออีเมลผิดรูปแบบ หรือเบอร์ว่าง (ไม่เจอ = -1)
    const missing = others.findIndex((p) => !p.name.trim() || !/^\S+@\S+\.\S+$/.test(p.email) || !p.phone.trim());
    // เจอคนกรอกไม่ครบ -> แจ้งว่าคนที่เท่าไหร่ (+2 เพราะลิสต์นี้เริ่มที่ใบที่ 2)
    if (missing !== -1) {
      setError(`กรอกข้อมูลผู้เข้าร่วมคนที่ ${missing + 2} ให้ครบ (อีเมลต้องถูกรูปแบบ)`);
      return;
    }
    // ครบแล้ว -> ล้าง error แล้วไปขั้นตรวจสอบ
    setError("");
    setStep(2);
  }

  // ส่งสลิป -> สร้างคำสั่งซื้อสถานะรอตรวจ -> แจ้ง Admin
  // slip = รูปสลิป (ข้อความ base64) ที่ส่งมาจาก PaymentStep
  async function submitOrder(slip: string) {
    // ดึงคำสั่งซื้อทั้งหมดมาเพื่อหาเลขล่าสุด (GET /records แล้วกรอง kind = order)
    const orders = await listRecords("order");
    // สร้างเลขคำสั่งซื้อถัดไป เช่น ORD-240012
    const orderNo = nextNumber(orders.map((o) => o.orderNo), "ORD-", 6);
    // บันทึกคำสั่งซื้อใหม่ลง MockAPI (POST /records)
    const order = await createRecord("order", {
      // type: ticket = คำสั่งซื้อบัตร, attendees = รายชื่อผู้เข้าร่วม, slipImage = รูปสลิป, status: pending_slip = รอแอดมินตรวจ
      orderNo, userId: account!.id, type: "ticket", attendees, items: [], total, slipImage: slip, status: "pending_slip", rejectReason: "",
      // ช่องของเสื้อ (delivery/address/shipStatus) เว้นว่าง เพราะนี่คือบัตร
      delivery: "", address: "", shipStatus: "", tracking: "", createdAt: nowIso(), updatedAt: nowIso(),
    });
    // ส่งแจ้งเตือนไปที่กระดิ่งของแอดมิน พร้อมลิงก์ไปหน้าตรวจสลิป
    await notify("admin", "สลิปใหม่รอตรวจสอบ", `${orderNo} · ${account!.name} · ${baht(total)}`, `/admin/payments/${order.id}`);
    // พาไปหน้าสถานะคำสั่งซื้อ (หน้านั้นจะเปลี่ยนเองเมื่อแอดมินอนุมัติ)
    router.replace(`/user/orders/${order.id}`);
  }

  return (
    // ส่วนหน้าตา
    <>
      {/* แถบบน: ขั้น 0 มีปุ่มกลับ Home, ขั้น 1-2 มีปุ่ม "ย้อนกลับ" (step - 1) */}
      <TopBar title="ซื้อบัตรเข้างาน" back={step === 0 ? "/user" : undefined} right={step > 0 && step < 3 ? <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>ย้อนกลับ</Button> : undefined} />
      <MobileBody>
        {/* แถบขั้นตอนด้านบน ไฮไลต์ขั้นปัจจุบัน */}
        <Steps labels={STEP_LABELS} current={step} />

        {/* ===== ขั้น 0: เลือกจำนวนบัตร ===== (&& = แสดงเฉพาะตอน step เป็น 0) */}
        {step === 0 && (
          <>
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">บัตรเข้างาน</p>
                  <p className="text-sm text-muted">บัตรราคาเดียว 1,000 บาท</p>
                </div>
                <p className="text-xl font-bold">1,000<span className="text-xs font-normal text-muted"> บาท/ใบ</span></p>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                <li>✓ บัตรราคา 1,000 ฟรี! โทเคนใช้จ่ายในงาน {BONUS_TOKENS} โทเคนฟรี</li>
                <li>✓ QR Code ของบัตรส่งทางอีเมล หลัง Admin ยืนยันการชำระเงิน</li>
                <li>ⓘ บัตรไม่สามารถยกเลิกได้หลังชำระเงิน</li>
              </ul>
            </Card>
            <TokenPolicy />
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">จำนวนบัตร</p>
                  <p className="text-xs text-muted">ต้องกรอกข้อมูลผู้เข้าร่วมทุกคน</p>
                </div>
                {/* ปุ่ม - / + เลือกจำนวน 1-10 ใบ เปลี่ยนแล้วเรียก changeQty */}
                <Stepper value={qty} onChange={changeQty} min={1} max={10} />
              </div>
            </Card>
            <Card>
              {/* สรุปราคา / โทเคนที่ได้ (50 × จำนวน) / ยอดรวม */}
              <InfoRow label="ราคาบัตร" value={`1,000 × ${qty}`} />
              <InfoRow label="โทเคนที่ได้รับ" value={`${BONUS_TOKENS * qty} โทเคน`} />
              <InfoRow label="ยอดรวม" value={baht(total)} strong />
            </Card>
            {/* ปุ่มถัดไป -> ไปขั้น 1 */}
            <Button full size="lg" onClick={() => { changeQty(qty); setStep(1); }}>ถัดไป: ข้อมูลผู้เข้าร่วม</Button>
          </>
        )}

        {/* ===== ขั้น 1: กรอกข้อมูลผู้เข้าร่วม ===== */}
        {step === 1 && (
          <>
            {/* การ์ดบัตรใบที่ 1 = ของผู้ซื้อ ล็อกไว้ แก้ไม่ได้ (disabled) */}
            <Card>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">บัตรใบที่ 1 เป็นของคุณ (ผู้ซื้อ)</p>
                  <p className="text-xs text-muted">ดึงจากข้อมูลตอนสมัครอัตโนมัติ · แก้ไขไม่ได้</p>
                </div>
                <Badge tone="navy"><Lock className="mr-1 size-3" /> ล็อกไว้</Badge>
              </div>
              <div className="space-y-3">
                <Field label="ชื่อ - นามสกุล" value={owner.name} disabled />
                <Field label="อีเมล" value={owner.email} disabled />
                <Field label="เบอร์โทรศัพท์" value={owner.phone} disabled />
              </div>
              <p className="mt-2 text-xs text-muted">(ถ้าข้อมูลผิด ให้ไปแก้ที่หน้าโปรไฟล์)</p>
            </Card>

            {/* วนสร้างฟอร์มของผู้เข้าร่วมคนที่ 2, 3, ... ตามจำนวนบัตร */}
            {others.map((person, i) => (
              <Card key={i}>
                <p className="mb-3 font-semibold">ผู้เข้าร่วมคนที่ {i + 2}</p>
                <div className="space-y-3">
                  {/* พิมพ์แล้วเรียก updateOther แก้เฉพาะช่องของคนนั้น */}
                  <Field label="ชื่อ - นามสกุล" required value={person.name} onChange={(e) => updateOther(i, "name", e.target.value)} />
                  <Field label="อีเมล" required type="email" value={person.email} onChange={(e) => updateOther(i, "email", e.target.value)} />
                  <Field label="เบอร์โทรศัพท์" required value={person.phone} onChange={(e) => updateOther(i, "phone", e.target.value)} />
                </div>
                <p className="mt-2 text-xs text-muted">ผู้เข้าร่วมคนนี้จะเปิดบัตรผ่านลิงก์ในอีเมลได้ โดยไม่ต้องมีบัญชี</p>
              </Card>
            ))}
            {/* error ถ้ากรอกไม่ครบ */}
            <ErrorText text={error} />
            {/* ปุ่มถัดไป -> goReview ตรวจก่อนไปขั้น 2 */}
            <Button full size="lg" onClick={goReview}>ถัดไป: ตรวจสอบข้อมูล</Button>
          </>
        )}

        {/* ===== ขั้น 2: ตรวจสอบข้อมูลก่อนจ่าย ===== */}
        {step === 2 && (
          <>
            <Card>
              <p className="mb-2 font-semibold">ผู้เข้าร่วม ({attendees.length})</p>
              {/* วนแสดงรายชื่อผู้เข้าร่วมทุกคน (padStart = เลข 01, 02) */}
              {attendees.map((p, i) => (
                <div key={i} className={cx("flex items-center gap-3 py-2", i > 0 && "border-t border-line")}>
                  <span className="grid size-9 place-items-center rounded-full bg-navy-soft text-xs font-bold text-navy">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="truncate text-xs text-muted">{p.email} · {p.phone}</p>
                  </div>
                </div>
              ))}
            </Card>
            {/* สรุปยอดชำระ */}
            <Card>
              <InfoRow label={`บัตรเข้างาน × ${qty}`} value={baht(total)} />
              <InfoRow label="โทเคนที่ได้รับ" value={`${BONUS_TOKENS * qty} โทเคน`} />
              <InfoRow label="ยอดชำระ" value={baht(total)} strong />
            </Card>
            {/* แถบเตือนสีเหลือง: บัตรยกเลิกไม่ได้ */}
            <Banner tone="amber">
              <b>บัตรไม่สามารถยกเลิกได้</b> กรุณาตรวจสอบชื่อผู้เข้าร่วมให้ถูกต้องก่อนชำระเงิน
            </Banner>
            <TokenPolicy />
            {/* ปุ่มยืนยัน -> ไปขั้น 3 */}
            <Button full size="lg" onClick={() => setStep(3)}>ยืนยันและไปหน้าชำระเงิน</Button>
          </>
        )}

        {/* ===== ขั้น 3: จ่ายเงิน + อัปสลิป ===== กดส่งแล้ว PaymentStep จะเรียก submitOrder */}
        {step === 3 && <PaymentStep total={total} onSubmit={submitOrder} />}
      </MobileBody>
    </>
  );
}
