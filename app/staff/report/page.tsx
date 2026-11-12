"use client";
// แจ้งปัญหาถึง Admin + ติดตามสถานะเรื่องที่เคยแจ้ง (อัปเดตเองทุก 5 วินาที)

import { useState } from "react";
import { createRecord, listRecords, nextNumber, notify, nowIso } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { usePolling } from "@/lib/usePolling";
import { dateTime } from "@/lib/format";
import { TopBar, TabletBody } from "@/components/shells";
import { Badge, Button, Card, ErrorText, Field, Select, TextArea } from "@/components/ui";

const TOPICS = ["สแกน QR ไม่ได้", "โทเคนไม่ตรง / เติมผิด", "ลูกค้าขอคืนเงิน / แลกโทเคนเป็นเงินสด", "บัตรเช็กอินซ้ำ", "เสื้อผิดไซซ์ / ของไม่ครบ", "อื่น ๆ"];

export default function Report() {
  const { account } = useAuth();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [ticketNo, setTicketNo] = useState("");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  const { data, reload } = usePolling(async () => (await listRecords("issue")).filter((i) => i.staffId === account?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

  async function submit() {
    if (!account) return;
    if (detail.trim().length < 5) return setError("เล่ารายละเอียดอย่างน้อย 5 ตัวอักษร");
    setBusy(true);
    setError("");
    try {
      const all = await listRecords("issue");
      const issueNo = nextNumber(all.map((i) => i.issueNo), "ISS-", 3);
      const issue = await createRecord("issue", {
        issueNo, topic, ticketNo: ticketNo.trim().toUpperCase(), detail: detail.trim(), staffId: account.id, staffName: account.name,
        servicePoint: account.servicePoint ?? "", status: "open", adminNote: "", createdAt: nowIso(),
      });
      await notify("admin", "มีการแจ้งปัญหาใหม่", `${issueNo} · ${topic}`, `/admin/issues/${issue.id}`);
      setSent(issueNo);
      setDetail("");
      setTicketNo("");
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ส่งไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar title="แจ้งปัญหา" subtitle="ส่งเรื่องถึง Super Admin" back="/staff" />
      <TabletBody>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="space-y-4">
            <Select label="หัวข้อ" value={topic} onChange={setTopic} options={TOPICS.map((t) => ({ value: t, label: t }))} />
            <Field label="เลขบัตรที่เกี่ยวข้อง (ถ้ามี)" placeholder="เช่น T-002" value={ticketNo} onChange={(e) => setTicketNo(e.target.value)} />
            <TextArea label="รายละเอียด" value={detail} onChange={setDetail} placeholder="เกิดอะไรขึ้น ลูกค้าคือใคร ทำอะไรไปแล้วบ้าง" />
            {topic.startsWith("ลูกค้าขอคืนเงิน") && (
              <p className="rounded-xl bg-warn-soft p-3 text-xs text-warn">นโยบาย: โทเคนแลกคืนเป็นเงินสดไม่ได้ Staff ห้ามคืนเงินเอง ให้แจ้งเรื่องนี้ Admin จะตัดสินเป็นกรณีไป</p>
            )}
            <ErrorText text={error} />
            {sent && <p className="rounded-xl bg-ok-soft p-3 text-sm text-ok">ส่งเรื่อง {sent} แล้ว Admin จะได้รับแจ้งเตือนทันที</p>}
            <Button full loading={busy} onClick={submit}>ส่งเรื่องถึง Admin</Button>
          </Card>
          <div className="space-y-3">
            <p className="font-semibold">เรื่องที่ฉันแจ้ง</p>
            {(data ?? []).length === 0 && <p className="text-sm text-muted">ยังไม่มี</p>}
            {(data ?? []).map((i) => (
              <Card key={i.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{i.issueNo} · {i.topic}</p>
                  <Badge tone={i.status === "done" ? "green" : "amber"}>{i.status === "done" ? "เสร็จสิ้นแล้ว" : "รอ Admin"}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{i.detail}</p>
                {i.adminNote && <p className="mt-2 rounded-xl bg-navy-soft p-3 text-sm">Admin: {i.adminNote}</p>}
                <p className="mt-1 text-xs text-muted">{dateTime(i.createdAt)}</p>
              </Card>
            ))}
          </div>
        </div>
      </TabletBody>
    </>
  );
}
