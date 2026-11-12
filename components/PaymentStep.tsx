"use client";
// ขั้นชำระเงิน: แสดง QR พร้อมเพย์ (จำลอง) + ยอดที่ต้องโอน + ช่องอัปโหลดสลิป
// ใช้ทั้งตอนซื้อบัตรและซื้อเสื้อ

import { useState } from "react";
import { QrImage } from "./QrImage";
import { SlipPicker } from "./SlipPicker";
import { Banner, Button, Card, ErrorText } from "./ui";
import { baht } from "@/lib/format";

export function PaymentStep({ total, onSubmit, note }: { total: number; onSubmit: (slip: string) => Promise<void>; note?: React.ReactNode }) {
  const [slip, setSlip] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // ส่งสลิป: กันกดซ้ำด้วย sending
  async function handleSubmit() {
    if (!slip || sending) return;
    setSending(true);
    setError("");
    try {
      await onSubmit(slip);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ส่งสลิปไม่สำเร็จ");
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="text-center">
        <p className="text-sm text-muted">สแกนจ่ายด้วยแอปธนาคาร (Thai QR)</p>
        <div className="mx-auto my-4 w-fit rounded-2xl border border-line p-3">
          <QrImage text={`PROMPTPAY|ALUMNI REUNION 2026|${total.toFixed(2)}`} size={200} />
        </div>
        <p className="text-sm text-muted">ยอดที่ต้องโอน</p>
        <p className="text-3xl font-bold">{baht(total)}</p>
        <p className="mt-1 text-xs text-muted">บัญชี ALUMNI REUNION 2026 · ธนาคารกรุงเทพ (QR จำลองสำหรับงานส่ง)</p>
      </Card>
      {note}
      <SlipPicker value={slip} onChange={setSlip} />
      <Banner>หลังส่งสลิป Admin จะตรวจสอบและยืนยัน หน้าสถานะจะเปลี่ยนเองโดยไม่ต้องรีเฟรช</Banner>
      <ErrorText text={error} />
      <Button full size="lg" disabled={!slip} loading={sending} onClick={handleSubmit}>
        ส่งสลิปการโอน
      </Button>
    </div>
  );
}
