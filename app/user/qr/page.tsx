"use client";
// QR Code เต็มจอ (My QR) ต้องล็อกอิน เพราะเป็นบัตรของเจ้าของบัญชี
// มีแท็บสลับบัตรแต่ละใบ บัตรใบที่ 2 ขึ้นไปคัดลอกลิงก์ส่งให้ผู้เข้าร่วมได้

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Copy, Wallet } from "lucide-react";
import { useMyData } from "@/lib/useMyData";
import { num, dateTime } from "@/lib/format";
import { TopBar, MobileBody } from "@/components/shells";
import { QrImage } from "@/components/QrImage";
import { Badge, Button, ButtonLink, EmptyState, Loading, cx } from "@/components/ui";

function QrInner() {
  const params = useSearchParams();
  const { data, isLoading } = useMyData();
  const tickets = data?.tickets ?? [];
  const [selected, setSelected] = useState(params.get("t") || "");
  const [copied, setCopied] = useState(false);
  const ticket = tickets.find((t) => t.ticketNo === selected) ?? tickets[0];

  if (isLoading) return <Loading />;
  if (!ticket) return <MobileBody><EmptyState title="ยังไม่มีบัตร" desc="ซื้อบัตรแล้วรอ Admin ยืนยัน QR Code จะขึ้นที่นี่" action={<ButtonLink href="/user/tickets/buy">ซื้อบัตร</ButtonLink>} /></MobileBody>;

  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/t/${ticket.linkToken}`;

  // คัดลอกลิงก์บัตรไปส่งให้ผู้เข้าร่วม
  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <MobileBody>
      {tickets.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {tickets.map((t) => (
            <button key={t.id} onClick={() => setSelected(t.ticketNo)} className={cx("shrink-0 rounded-2xl border px-4 py-2 text-left", t.id === ticket.id ? "border-navy bg-navy text-white" : "border-line bg-white")}>
              <span className="block text-[10px] opacity-70">TICKET</span>
              <span className="block text-sm font-semibold">{t.ticketNo} · {t.holderName}</span>
            </button>
          ))}
        </div>
      )}
      <div className="rounded-3xl border border-line bg-white p-6 text-center">
        <div className="mb-2 flex justify-center gap-2">
          {ticket.holderIndex === 1 ? <Badge tone="navy">บัตรของคุณ</Badge> : <Badge tone="amber">ผู้เข้าร่วม {ticket.holderIndex}</Badge>}
          {ticket.checkedIn ? <Badge tone="green">เช็กอินแล้ว</Badge> : <Badge>ยังไม่เช็กอิน</Badge>}
        </div>
        <p className="text-lg font-bold">{ticket.holderName}</p>
        <p className="text-sm text-muted">{ticket.ticketNo} · 15 ธ.ค. 2569 · Main Hall</p>
        <div className="mx-auto my-5 w-[70%] max-w-xs">
          <QrImage text={ticket.ticketNo} size={280} className="h-auto w-full" />
        </div>
        <p className="text-xs text-muted">แสดง QR นี้กับ Staff เพื่อเช็กอิน เติมโทเคน และกับร้านค้าเพื่อจ่ายด้วยโทเคน</p>
        {ticket.checkedIn && <p className="mt-1 text-xs text-ok">เช็กอินเมื่อ {dateTime(ticket.checkinAt)}</p>}
      </div>
      <Link href={`/user/wallet/${ticket.ticketNo}`} className="flex items-center gap-3 rounded-2xl bg-navy p-4 text-white">
        <Wallet className="size-5" />
        <span className="flex-1 text-sm">โทเคนคงเหลือ</span>
        <span className="text-xl font-bold">{num(ticket.tokens)}</span>
      </Link>
      {ticket.holderIndex > 1 && (
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-sm font-semibold">ลิงก์บัตรของ {ticket.holderName}</p>
          <p className="mb-3 break-all text-xs text-sky-700 underline">{link}</p>
          <Button full variant="outline" onClick={copyLink}><Copy className="size-4" /> {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}</Button>
        </div>
      )}
    </MobileBody>
  );
}

export default function MyQr() {
  return (
    <>
      <TopBar title="My QR" subtitle="QR Code สำหรับเข้างาน" />
      <Suspense fallback={<Loading />}>
        <QrInner />
      </Suspense>
    </>
  );
}
