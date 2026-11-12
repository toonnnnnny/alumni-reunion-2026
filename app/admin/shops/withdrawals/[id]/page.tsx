"use client";
// คำขอถอนเงิน 1 รายการ: Admin โอนเงินเข้าบัญชีร้านเอง แล้วกด "ดำเนินการเสร็จเรียบร้อย"
// แนบสลิปได้ (ไม่บังคับ) เก็บไว้เป็นหลักฐานของ Admin เท่านั้น

import Link from "next/link";
import { use, useState } from "react";
import { getRecord } from "@/lib/api";
import { completeWithdraw } from "@/lib/actions";
import { usePolling } from "@/lib/usePolling";
import { dateTime, num } from "@/lib/format";
import { AdminFrame } from "@/components/AdminFrame";
import { SlipPicker } from "@/components/SlipPicker";
import { Button, ButtonLink, Card, CardTitle, ErrorText, InfoRow, Loading } from "@/components/ui";

export default function WithdrawalDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: wd, isLoading, reload } = usePolling(() => getRecord("withdrawal", id));
  const [slip, setSlip] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (isLoading || !wd) return <AdminFrame title="คำขอถอนเงิน" back="/admin/shops?tab=withdrawals"><Loading /></AdminFrame>;
  const done = wd.status === "done";

  async function finish() {
    setBusy(true);
    setError("");
    try {
      await completeWithdraw(wd!, slip);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminFrame title={`คำขอถอนเงิน ${wd.wdNo}`} subtitle={`ร้าน ${wd.shopName} · ${num(wd.amount)} โทเคน`} back="/admin/shops?tab=withdrawals">
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardTitle>รายละเอียดคำขอ</CardTitle>
            <InfoRow label="เลขคำขอ" value={wd.wdNo} />
            <InfoRow label="ร้านค้า" value={<Link href={`/admin/shops/${wd.shopId}`} className="text-navy underline">{wd.shopName}</Link>} />
            <InfoRow label="ส่งคำขอเมื่อ" value={dateTime(wd.requestedAt)} />
            <InfoRow label="สถานะ" value={done ? "โอนแล้ว" : "รอโอน"} tone={done ? "green" : "amber"} />
            {done && <InfoRow label="โอนเมื่อ" value={dateTime(wd.doneAt)} />}
            <InfoRow label="จำนวนที่ต้องโอน" value={`${num(wd.amount)} บาท`} strong />
            <InfoRow label="โทเคนที่หักจากร้าน" value={`${num(wd.amount)} โทเคน`} />
          </Card>
          <Card>
            <CardTitle>บัญชีรับเงินของร้าน</CardTitle>
            <InfoRow label="ธนาคาร" value={wd.bankName} />
            <InfoRow label="เลขบัญชี" value={wd.bankAccount} />
            <InfoRow label="ชื่อบัญชี" value={wd.bankAccountName} />
          </Card>
        </div>
        <Card className="h-fit space-y-3">
          <CardTitle>{done ? "หลักฐานการโอน" : "ยืนยันการโอนเงิน"}</CardTitle>
          {done ? (
            wd.slipImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={wd.slipImage} alt="สลิป" className="mx-auto max-h-96 rounded-xl" />
            ) : (
              <p className="rounded-xl bg-paper p-6 text-center text-sm text-muted">ไม่ได้แนบสลิป</p>
            )
          ) : (
            <SlipPicker value={slip} onChange={setSlip} title="แนบสลิปการโอน" hint="ลากไฟล์มาวาง หรือกดเพื่อเลือกรูป · JPG, PNG" />
          )}
          <p className="text-sm text-warn">ไม่บังคับแนบสลิป · แนบไว้เป็นหลักฐานเก็บไว้เท่านั้น ร้านค้าไม่เห็นรูปนี้</p>
          {done && <p className="text-sm font-semibold text-ok">โอนเมื่อ {dateTime(wd.doneAt)} · แจ้งร้านค้าแล้ว</p>}
          <ErrorText text={error} />
          {done ? (
            <ButtonLink href="/admin/shops?tab=withdrawals" full>กลับไปรายการคำขอ</ButtonLink>
          ) : (
            <>
              <Button full loading={busy} onClick={finish}>ดำเนินการเสร็จเรียบร้อย</Button>
              <ButtonLink href="/admin/shops?tab=withdrawals" variant="outline" full>ยกเลิก / กลับไปรายการ</ButtonLink>
            </>
          )}
        </Card>
      </div>
    </AdminFrame>
  );
}
