"use client";
// ลิงก์บัตรสำหรับผู้เข้าร่วมใบที่ 2 ขึ้นไป: เปิดได้โดยไม่ต้องล็อกอิน
// รหัสใน URL เป็นรหัสสุ่ม (linkToken) เดาไม่ได้ เปิดได้เฉพาะบัตรใบนี้ใบเดียว

import { use } from "react";
import { listRecords } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { num, dateTime } from "@/lib/format";
import { QrImage } from "@/components/QrImage";
import { TxList } from "@/components/TxList";
import { Badge, Card, ErrorText, Loading, TokenPolicy } from "@/components/ui";

export default function TicketLink({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { data, isLoading, error } = usePolling(async () => {
    const tickets = await listRecords("ticket");
    const ticket = tickets.find((t) => t.linkToken === token) ?? null;
    const txs = ticket ? (await listRecords("tx")).filter((t) => t.ticketNo === ticket.ticketNo).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
    return { ticket, txs };
  });

  if (isLoading) return <Loading />;
  const ticket = data?.ticket;
  if (!ticket) return <main className="mx-auto max-w-md p-4"><ErrorText text={error || "ลิงก์บัตรไม่ถูกต้อง หรือบัตรถูกยกเลิก"} /></main>;

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-6">
      <div className="text-center">
        <p className="text-xs text-muted">Alumni Reunion 2026 · 15 ธ.ค. 2569 · Main Hall</p>
        <h1 className="text-xl font-bold">บัตรของ {ticket.holderName}</h1>
      </div>
      <div className="rounded-3xl border border-line bg-white p-6 text-center">
        <div className="mb-2 flex justify-center gap-2">
          <Badge tone="navy">{ticket.ticketNo}</Badge>
          {ticket.checkedIn ? <Badge tone="green">เช็กอินแล้ว</Badge> : <Badge>ยังไม่เช็กอิน</Badge>}
        </div>
        <div className="mx-auto my-4 w-[70%] max-w-xs">
          <QrImage text={ticket.ticketNo} size={280} className="h-auto w-full" />
        </div>
        <p className="text-xs text-muted">แสดง QR นี้ที่จุดเช็กอิน และกับร้านค้าเพื่อจ่ายด้วยโทเคน</p>
        {ticket.checkedIn && <p className="mt-1 text-xs text-ok">เช็กอินเมื่อ {dateTime(ticket.checkinAt)}</p>}
      </div>
      <div className="rounded-3xl bg-navy p-5 text-white">
        <p className="text-sm text-white/80">โทเคนคงเหลือ</p>
        <p className="text-4xl font-bold">{num(ticket.tokens)} <span className="text-base font-normal">โทเคน</span></p>
      </div>
      <TokenPolicy />
      <Card>
        <p className="font-semibold">ประวัติโทเคน</p>
        <TxList txs={data?.txs ?? []} />
      </Card>
      <p className="text-center text-xs text-muted">ลิงก์นี้เปิดได้เฉพาะบัตรใบนี้ ไม่ต้องเข้าสู่ระบบ</p>
    </main>
  );
}
