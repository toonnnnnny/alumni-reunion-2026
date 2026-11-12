"use client";
// หน้าหลักผู้ซื้อ: ข้อมูลงาน + ทางลัดไปซื้อบัตร ดู QR และร้านเสื้อ
// เข้าได้แม้ยังไม่ล็อกอิน (ปุ่มซื้อจะพาไปหน้าเข้าสู่ระบบ)

import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, QrCode, ShoppingBag, Ticket, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useMyData } from "@/lib/useMyData";
import { num } from "@/lib/format";
import { TopBar, MobileBody, AccountChip } from "@/components/shells";
import { NoticeBell } from "@/components/NoticeBell";
import { ButtonLink, Card, Badge } from "@/components/ui";
import { payLabel } from "@/lib/status";

export default function UserHome() {
  const { account } = useAuth();
  const { data } = useMyData();
  const tickets = data?.tickets ?? [];
  const pending = (data?.orders ?? []).filter((o) => o.status !== "paid");
  const totalTokens = tickets.reduce((sum, t) => sum + t.tokens, 0);

  return (
    <>
      <TopBar
        title={account ? `สวัสดี, ${account.name}` : "Alumni Reunion 2026"}
        subtitle="งานเลี้ยงรุ่น 15 ธ.ค. 2569"
        right={account ? <div className="flex items-center gap-2"><NoticeBell /><AccountChip /></div> : <ButtonLink href="/user/login" variant="ghost" className="min-h-10">เข้าสู่ระบบ</ButtonLink>}
      />
      <MobileBody>
        <div className="relative overflow-hidden rounded-3xl bg-navy p-6 text-white">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs">✦ งานเลี้ยงรุ่น</span>
          <h2 className="mt-4 text-2xl font-bold">ALUMNI REUNION 2026</h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-white/85"><CalendarDays className="size-4" /> 15 ธ.ค. 2569 · 17:00 น.</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-white/85"><MapPin className="size-4" /> Main Hall</p>
          <div className="absolute -right-10 -top-10 size-36 rounded-full bg-white/5" />
        </div>

        {account && tickets.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Link href="/user/qr" className="rounded-2xl border border-line bg-white p-4">
              <QrCode className="size-5 text-navy" />
              <p className="mt-2 text-sm text-muted">บัตรของฉัน</p>
              <p className="text-2xl font-bold">{tickets.length} <span className="text-sm font-normal text-muted">ใบ</span></p>
            </Link>
            <Link href={`/user/wallet/${tickets[0].ticketNo}`} className="rounded-2xl border border-line bg-white p-4">
              <Wallet className="size-5 text-navy" />
              <p className="mt-2 text-sm text-muted">โทเคนรวม</p>
              <p className="text-2xl font-bold">{num(totalTokens)} <span className="text-sm font-normal text-muted">โทเคน</span></p>
            </Link>
          </div>
        )}

        {pending.map((o) => (
          <Link key={o.id} href={`/user/orders/${o.id}`} className="flex items-center justify-between rounded-2xl border border-line bg-white p-4">
            <div>
              <p className="font-semibold">{o.orderNo}</p>
              <p className="text-xs text-muted">{o.type === "ticket" ? "บัตรเข้างาน" : "เสื้อ"}</p>
            </div>
            <Badge tone={payLabel[o.status].tone}>{payLabel[o.status].text}</Badge>
          </Link>
        ))}

        <Card>
          <div className="flex items-start gap-3">
            <span className="grid size-12 place-items-center rounded-xl bg-navy text-white"><Ticket /></span>
            <div className="flex-1">
              <p className="font-semibold">บัตรเข้างาน</p>
              <p className="text-sm text-muted">1,000 บาท / ใบ · รวม 50 โทเคน</p>
            </div>
          </div>
          <ButtonLink href="/user/tickets/buy" full className="mt-4">ซื้อบัตร <ChevronRight className="size-4" /></ButtonLink>
        </Card>

        <Link href="/user/shop" className="flex items-center gap-3 rounded-2xl border border-line bg-white p-5">
          <span className="grid size-12 place-items-center rounded-xl bg-warn-soft text-warn"><ShoppingBag /></span>
          <span className="flex-1">
            <span className="block font-semibold">ร้านเสื้อรุ่น</span>
            <span className="block text-sm text-muted">ซื้อได้โดยไม่ต้องซื้อบัตร · จัดส่งหรือรับหน้างาน</span>
          </span>
          <ChevronRight className="size-5 text-muted" />
        </Link>
      </MobileBody>
    </>
  );
}
