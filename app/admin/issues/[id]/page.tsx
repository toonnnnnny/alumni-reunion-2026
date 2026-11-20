"use client";
// รายละเอียดเรื่องที่แจ้ง: Admin เขียนบันทึกตอบกลับ แล้วปิดเรื่อง -> ฝั่ง Staff เห็นสถานะ "เสร็จสิ้นแล้ว"

import Link from "next/link";
import { use, useState } from "react";
import { getRecord, notify, updateRecord } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { dateTime } from "@/lib/format";
import { AdminFrame } from "@/components/AdminFrame";
import { Badge, Button, Card, CardTitle, ErrorText, InfoRow, Loading, TextArea } from "@/components/ui";

export default function IssueDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: issue, isLoading, reload } = usePolling(() => getRecord("issue", id));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (isLoading || !issue) return <AdminFrame title="การแจ้งปัญหา" back="/admin/issues"><Loading /></AdminFrame>;

  async function close() {
    if (!note.trim()) return setError("เขียนบันทึกสิ่งที่ทำให้ Staff ทราบ");
    setBusy(true);
    try {
      await updateRecord("issue", issue!.id, { status: "done", adminNote: note.trim() });
      await notify("staff", "Admin ปิดเรื่องที่แจ้งแล้ว", `${issue!.issueNo}: ${note.trim()}`, "/staff/report", issue!.staffId);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminFrame title={`${issue.issueNo} · ${issue.topic}`} subtitle={`${issue.staffName} · ${issue.servicePoint}`} back="/admin/issues">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle right={<Badge tone={issue.status === "open" ? "amber" : "green"}>{issue.status === "open" ? "รอดำเนินการ" : "เสร็จสิ้นแล้ว"}</Badge>}>รายละเอียด</CardTitle>
          <InfoRow label="หัวข้อ" value={issue.topic} />
          <InfoRow label="บัตรที่เกี่ยวข้อง" value={issue.ticketNo || "-"} />
          <InfoRow label="แจ้งโดย" value={`${issue.staffName} · ${issue.servicePoint}`} />
          <InfoRow label="เวลา" value={dateTime(issue.createdAt)} />
          <p className="mt-3 rounded-xl bg-paper p-4 text-sm">{issue.detail}</p>
          {issue.ticketNo && <p className="mt-3 text-sm"><Link href="/admin/buyers" className="text-navy underline">ค้นหาบัตร {issue.ticketNo} ในหน้าบัญชีของผู้เข้าร่วม</Link></p>}
        </Card>
        <Card className="h-fit space-y-3">
          <CardTitle>การดำเนินการ</CardTitle>
          {issue.status === "done" ? (
            <p className="rounded-xl bg-ok-soft p-4 text-sm text-ok">บันทึก: {issue.adminNote}</p>
          ) : (
            <>
              <TextArea label="บันทึกถึง Staff" value={note} onChange={setNote} placeholder="เช่น ตรวจแล้ว ยอดถูกต้อง / คืนเงินให้ลูกค้าแล้ว" />
              <ErrorText text={error} />
              <Button full loading={busy} onClick={close}>ปิดเรื่อง (เสร็จสิ้น)</Button>
            </>
          )}
        </Card>
      </div>
    </AdminFrame>
  );
}
