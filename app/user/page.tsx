"use client";
// หน้าหลักผู้ซื้อ: ข้อมูลงาน + ทางลัดไปซื้อบัตร ดู QR และร้านเสื้อ
// เข้าได้แม้ยังไม่ล็อกอิน (ปุ่มซื้อจะพาไปหน้าเข้าสู่ระบบ)

// Link = ลิงก์ไปหน้าอื่น
import Link from "next/link";
// ไอคอนต่าง ๆ
import { CalendarDays, ChevronRight, MapPin, QrCode, ShoppingBag, Ticket, Wallet } from "lucide-react";
// ระบบล็อกอิน (รู้ว่าใครเข้าอยู่)
import { useAuth } from "@/lib/auth";
// ดึงคำสั่งซื้อ/บัตร/โทเคนของฉัน ทุก 5 วินาที
import { useMyData } from "@/lib/useMyData";
// num = จัดรูปตัวเลขให้มีคอมมา เช่น 1,000
import { num } from "@/lib/format";
import { TopBar, MobileBody, AccountChip } from "@/components/shells";
import { NoticeBell } from "@/components/NoticeBell";
import { ButtonLink, Card, Badge } from "@/components/ui";
// payLabel = แปลงสถานะเป็นข้อความ+สี เช่น pending_slip -> "รอตรวจสอบ" สีส้ม
import { payLabel } from "@/lib/status";

// หน้า /user (Home)
export default function UserHome() {
  // account = ข้อมูลคนที่ล็อกอิน (ถ้ายังไม่ล็อกอิน = null)
  const { account } = useAuth();
  // data = ข้อมูลของฉันจาก MockAPI
  const { data } = useMyData();
  // ?? [] = ถ้ายังไม่มีข้อมูล ใช้ลิสต์ว่างแทน กันพัง
  const tickets = data?.tickets ?? [];
  // .filter = คัดเฉพาะคำสั่งซื้อที่ยังไม่จ่ายสำเร็จ (ไว้แสดงเตือน)
  const pending = (data?.orders ?? []).filter((o) => o.status !== "paid");
  // .reduce = บวกโทเคนของทุกบัตรรวมกัน
  const totalTokens = tickets.reduce((sum, t) => sum + t.tokens, 0);

  return (
    // <> = กล่องเปล่าห่อหลายส่วนไว้ด้วยกัน
    <>
      {/* แถบบน: ล็อกอินแล้วแสดง "สวัสดี ชื่อ" + กระดิ่งแจ้งเตือน ถ้ายังไม่ล็อกอินแสดงปุ่มเข้าสู่ระบบ */}
      <TopBar
        title={account ? `สวัสดี, ${account.name}` : "Alumni Reunion 2026"}
        subtitle="งานเลี้ยงรุ่น 15 ธ.ค. 2569"
        right={account ? <div className="flex items-center gap-2"><NoticeBell /><AccountChip /></div> : <ButtonLink href="/user/login" variant="ghost" className="min-h-10">เข้าสู่ระบบ</ButtonLink>}
      />
      <MobileBody>
        {/* การ์ดสีกรมแสดงชื่องาน วัน เวลา สถานที่ */}
        <div className="relative overflow-hidden rounded-3xl bg-navy p-6 text-white">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs">✦ งานเลี้ยงรุ่น</span>
          <h2 className="mt-4 text-2xl font-bold">ALUMNI REUNION 2026</h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-white/85"><CalendarDays className="size-4" /> 15 ธ.ค. 2569 · 17:00 น.</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-white/85"><MapPin className="size-4" /> Main Hall</p>
          <div className="absolute -right-10 -top-10 size-36 rounded-full bg-white/5" />
        </div>

        {/* && = แสดงเฉพาะตอนล็อกอินแล้ว และมีบัตรอย่างน้อย 1 ใบ */}
        {account && tickets.length > 0 && (
          // grid-cols-2 = แบ่ง 2 คอลัมน์ (CSS Grid)
          <div className="grid grid-cols-2 gap-3">
            {/* กล่องซ้าย: จำนวนบัตร กดแล้วไปหน้า QR */}
            <Link href="/user/qr" className="rounded-2xl border border-line bg-white p-4">
              <QrCode className="size-5 text-navy" />
              <p className="mt-2 text-sm text-muted">บัตรของฉัน</p>
              <p className="text-2xl font-bold">{tickets.length} <span className="text-sm font-normal text-muted">ใบ</span></p>
            </Link>
            {/* กล่องขวา: โทเคนรวม กดแล้วไปกระเป๋าโทเคนของบัตรใบแรก */}
            <Link href={`/user/wallet/${tickets[0].ticketNo}`} className="rounded-2xl border border-line bg-white p-4">
              <Wallet className="size-5 text-navy" />
              <p className="mt-2 text-sm text-muted">โทเคนรวม</p>
              <p className="text-2xl font-bold">{num(totalTokens)} <span className="text-sm font-normal text-muted">โทเคน</span></p>
            </Link>
          </div>
        )}

        {/* .map = วนแสดงคำสั่งซื้อที่ยังไม่เสร็จทีละอัน กดแล้วไปหน้าสถานะ */}
        {pending.map((o) => (
          // key = รหัสไม่ซ้ำ ให้ React รู้ว่าแถวไหนคือแถวไหน
          <Link key={o.id} href={`/user/orders/${o.id}`} className="flex items-center justify-between rounded-2xl border border-line bg-white p-4">
            <div>
              <p className="font-semibold">{o.orderNo}</p>
              <p className="text-xs text-muted">{o.type === "ticket" ? "บัตรเข้างาน" : "เสื้อ"}</p>
            </div>
            {/* ป้ายสถานะ สี+ข้อความมาจาก payLabel */}
            <Badge tone={payLabel[o.status].tone}>{payLabel[o.status].text}</Badge>
          </Link>
        ))}

        {/* การ์ดบัตรเข้างาน + ปุ่มไปหน้าซื้อบัตร */}
        <Card>
          <div className="flex items-start gap-3">
            <span className="grid size-12 place-items-center rounded-xl bg-navy text-white"><Ticket /></span>
            <div className="flex-1">
              <p className="font-semibold">บัตรเข้างาน</p>
              <p className="text-sm text-muted">1,000 บาท / ใบ · ฟรี 50 โทเคนใช้จ่ายในงาน</p>
            </div>
          </div>
          <ButtonLink href="/user/tickets/buy" full className="mt-4">ซื้อบัตร <ChevronRight className="size-4" /></ButtonLink>
        </Card>

        {/* การ์ดร้านเสื้อ กดแล้วไปหน้า /user/shop */}
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
