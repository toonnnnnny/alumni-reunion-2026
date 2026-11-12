"use client";
// ซื้อบัตร 4 ขั้น: จำนวน -> ผู้เข้าร่วม -> ตรวจสอบ -> ชำระเงิน/ส่งสลิป
// ใบที่ 1 = ผู้ซื้อเสมอ ดึงข้อมูลจากบัญชีอัตโนมัติและแก้ไม่ได้ ใบที่ 2 ขึ้นไปกรอกเอง

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";
import { createRecord, listRecords, nextNumber, notify, nowIso } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { baht } from "@/lib/format";
import { TICKET_PRICE, BONUS_TOKENS, type Attendee } from "@/lib/types";
import { TopBar, MobileBody } from "@/components/shells";
import { Steps } from "@/components/Steps";
import { PaymentStep } from "@/components/PaymentStep";
import { Badge, Banner, Button, Card, ErrorText, Field, InfoRow, Stepper, TokenPolicy, cx } from "@/components/ui";

const STEP_LABELS = ["จำนวน", "ผู้เข้าร่วม", "ตรวจสอบ", "ชำระเงิน"];

export default function BuyTicket() {
  const router = useRouter();
  const { account } = useAuth();
  const [step, setStep] = useState(0);
  const [qty, setQty] = useState(1);
  const [others, setOthers] = useState<Attendee[]>([]); // ผู้เข้าร่วมใบที่ 2 เป็นต้นไป
  const [error, setError] = useState("");

  if (!account) return null;

  // ใบที่ 1 มาจากข้อมูลตอนสมัครเสมอ
  const owner: Attendee = { name: account.name, email: account.email, phone: account.phone };
  const attendees = [owner, ...others];
  const total = qty * TICKET_PRICE;

  // ปรับจำนวนช่องกรอกผู้เข้าร่วมให้ตรงกับจำนวนบัตร
  function changeQty(n: number) {
    setQty(n);
    setOthers((prev) => {
      const list = prev.slice(0, n - 1);
      while (list.length < n - 1) list.push({ name: "", email: "", phone: "" });
      return list;
    });
  }

  function updateOther(index: number, key: keyof Attendee, value: string) {
    setOthers((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)));
  }

  // ตรวจว่ากรอกผู้เข้าร่วมครบก่อนไปขั้นถัดไป
  function goReview() {
    const missing = others.findIndex((p) => !p.name.trim() || !/^\S+@\S+\.\S+$/.test(p.email) || !p.phone.trim());
    if (missing !== -1) {
      setError(`กรอกข้อมูลผู้เข้าร่วมคนที่ ${missing + 2} ให้ครบ (อีเมลต้องถูกรูปแบบ)`);
      return;
    }
    setError("");
    setStep(2);
  }

  // ส่งสลิป -> สร้างคำสั่งซื้อสถานะรอตรวจ -> แจ้ง Admin
  async function submitOrder(slip: string) {
    const orders = await listRecords("order");
    const orderNo = nextNumber(orders.map((o) => o.orderNo), "ORD-", 6);
    const order = await createRecord("order", {
      orderNo, userId: account!.id, type: "ticket", attendees, items: [], total, slipImage: slip, status: "pending_slip", rejectReason: "",
      delivery: "", address: "", shipStatus: "", tracking: "", createdAt: nowIso(), updatedAt: nowIso(),
    });
    await notify("admin", "สลิปใหม่รอตรวจสอบ", `${orderNo} · ${account!.name} · ${baht(total)}`, `/admin/payments/${order.id}`);
    router.replace(`/user/orders/${order.id}`);
  }

  return (
    <>
      <TopBar title="ซื้อบัตรเข้างาน" back={step === 0 ? "/user" : undefined} right={step > 0 && step < 3 ? <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>ย้อนกลับ</Button> : undefined} />
      <MobileBody>
        <Steps labels={STEP_LABELS} current={step} />

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
                <li>✓ รวม {BONUS_TOKENS} โทเคนต่อบัตร 1 ใบ</li>
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
                <Stepper value={qty} onChange={changeQty} min={1} max={10} />
              </div>
            </Card>
            <Card>
              <InfoRow label="ราคาบัตร" value={`1,000 × ${qty}`} />
              <InfoRow label="โทเคนที่ได้รับ" value={`${BONUS_TOKENS * qty} โทเคน`} />
              <InfoRow label="ยอดรวม" value={baht(total)} strong />
            </Card>
            <Button full size="lg" onClick={() => { changeQty(qty); setStep(1); }}>ถัดไป: ข้อมูลผู้เข้าร่วม</Button>
          </>
        )}

        {step === 1 && (
          <>
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

            {others.map((person, i) => (
              <Card key={i}>
                <p className="mb-3 font-semibold">ผู้เข้าร่วมคนที่ {i + 2}</p>
                <div className="space-y-3">
                  <Field label="ชื่อ - นามสกุล" required value={person.name} onChange={(e) => updateOther(i, "name", e.target.value)} />
                  <Field label="อีเมล" required type="email" value={person.email} onChange={(e) => updateOther(i, "email", e.target.value)} />
                  <Field label="เบอร์โทรศัพท์" required value={person.phone} onChange={(e) => updateOther(i, "phone", e.target.value)} />
                </div>
                <p className="mt-2 text-xs text-muted">ผู้เข้าร่วมคนนี้จะเปิดบัตรผ่านลิงก์ในอีเมลได้ โดยไม่ต้องมีบัญชี</p>
              </Card>
            ))}
            <ErrorText text={error} />
            <Button full size="lg" onClick={goReview}>ถัดไป: ตรวจสอบข้อมูล</Button>
          </>
        )}

        {step === 2 && (
          <>
            <Card>
              <p className="mb-2 font-semibold">ผู้เข้าร่วม ({attendees.length})</p>
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
            <Card>
              <InfoRow label={`บัตรเข้างาน × ${qty}`} value={baht(total)} />
              <InfoRow label="โทเคนที่ได้รับ" value={`${BONUS_TOKENS * qty} โทเคน`} />
              <InfoRow label="ยอดชำระ" value={baht(total)} strong />
            </Card>
            <Banner tone="amber">
              <b>บัตรไม่สามารถยกเลิกได้</b> กรุณาตรวจสอบชื่อผู้เข้าร่วมให้ถูกต้องก่อนชำระเงิน
            </Banner>
            <TokenPolicy />
            <Button full size="lg" onClick={() => setStep(3)}>ยืนยันและไปหน้าชำระเงิน</Button>
          </>
        )}

        {step === 3 && <PaymentStep total={total} onSubmit={submitOrder} />}
      </MobileBody>
    </>
  );
}
