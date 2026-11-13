"use client";
// ขั้นชำระเงิน: แสดง QR พร้อมเพย์ (จำลอง) + ยอดที่ต้องโอน + ช่องอัปโหลดสลิป
// ใช้ทั้งตอนซื้อบัตรและซื้อเสื้อ

// useState = ตัวแปรของหน้า
import { useState } from "react";
// QrImage = สร้างรูป QR
import { QrImage } from "./QrImage";
// SlipPicker = ช่องเลือกรูปสลิป
import { SlipPicker } from "./SlipPicker";
import { Banner, Button, Card, ErrorText } from "./ui";
import { baht } from "@/lib/format";
// PAY_ACCOUNT = ข้อมูลบัญชีรับเงิน, payQrText = ข้อความที่ใส่ใน QR (ชื่อบัญชี + ยอด)
import { PAY_ACCOUNT, payQrText } from "@/lib/types";

// รับค่าเข้ามา: total = ยอดที่ต้องจ่าย, onSubmit = ฟังก์ชันของหน้าแม่ (ซื้อบัตร/ตะกร้า) ที่จะสร้างคำสั่งซื้อ
export function PaymentStep({ total, onSubmit, note }: { total: number; onSubmit: (slip: string) => Promise<void>; note?: React.ReactNode }) {
  // รูปสลิป (base64) ว่าง = ยังไม่เลือก
  const [slip, setSlip] = useState("");
  // กำลังส่ง
  const [sending, setSending] = useState(false);
  // error
  const [error, setError] = useState("");

  // ส่งสลิป: กันกดซ้ำด้วย sending
  async function handleSubmit() {
    // ไม่มีสลิป หรือกำลังส่งอยู่ -> ไม่ทำ (กันกดซ้ำแล้วได้คำสั่งซื้อ 2 อัน)
    if (!slip || sending) return;
    // เริ่มส่ง -> ปุ่มหมุน
    setSending(true);
    setError("");
    try {
      // เรียก submitOrder ของหน้าแม่ พร้อมส่งรูปสลิปไปให้
      await onSubmit(slip);
    } catch (e) {
      // พัง -> แสดง error และให้กดใหม่ได้
      setError(e instanceof Error ? e.message : "ส่งสลิปไม่สำเร็จ");
      setSending(false);
    }
  }

  return (
    // ส่วนหน้าตา
    <div className="space-y-4">
      {/* การ์ด QR ชำระเงิน */}
      <Card className="text-center">
        <p className="text-sm text-muted">สแกนจ่ายด้วยแอปธนาคาร (Thai QR)</p>
        <div className="mx-auto my-4 w-fit rounded-2xl border border-line p-3">
          {/* รูป QR พร้อมยอดเงิน */}
          <QrImage text={payQrText(total)} size={200} />
        </div>
        <p className="text-sm text-muted">ยอดที่ต้องโอน</p>
        {/* ยอดที่ต้องโอนตัวใหญ่ */}
        <p className="text-3xl font-bold">{baht(total)}</p>
        {/* ชื่อบัญชี ธนาคาร เลขบัญชี */}
        <p className="mt-1 text-xs text-muted">บัญชี {PAY_ACCOUNT.name} · {PAY_ACCOUNT.bank} {PAY_ACCOUNT.number} (QR จำลองสำหรับงานส่ง)</p>
      </Card>
      {note}
      {/* ช่องอัปโหลดสลิป: เลือกรูปแล้วเก็บลง slip */}
      <SlipPicker value={slip} onChange={setSlip} />
      <Banner>หลังส่งสลิป Admin จะตรวจสอบและยืนยัน หน้าสถานะจะเปลี่ยนเองโดยไม่ต้องรีเฟรช</Banner>
      <ErrorText text={error} />
      {/* ปุ่มส่งสลิป กดไม่ได้จนกว่าจะเลือกรูป */}
      <Button full size="lg" disabled={!slip} loading={sending} onClick={handleSubmit}>
        ส่งสลิปการโอน
      </Button>
    </div>
  );
}
