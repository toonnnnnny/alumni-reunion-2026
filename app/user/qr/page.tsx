"use client";
// QR Code เต็มจอ (My QR) ต้องล็อกอิน เพราะเป็นบัตรของเจ้าของบัญชี
// มีแท็บสลับบัตรแต่ละใบ บัตรใบที่ 2 ขึ้นไปคัดลอกลิงก์ส่งให้ผู้เข้าร่วมได้

import Link from "next/link";
// useSearchParams = อ่านค่าหลัง ? ใน URL เช่น /user/qr?t=T-002
import { useSearchParams } from "next/navigation";
// Suspense = แสดงวงหมุนระหว่างรออ่าน URL (Next.js บังคับเมื่อใช้ useSearchParams)
import { Suspense, useState } from "react";
import { Copy, Wallet } from "lucide-react";
// ดึงบัตรของฉันทุก 5 วินาที
import { useMyData } from "@/lib/useMyData";
import { num, dateTime } from "@/lib/format";
import { TopBar, MobileBody } from "@/components/shells";
// QrImage = แปลงข้อความเป็นรูป QR (ไลบรารี qrcode)
import { QrImage } from "@/components/QrImage";
import { Badge, Button, ButtonLink, EmptyState, Loading, cx } from "@/components/ui";

// ตัวหน้าจอจริง (แยกออกมาเพื่อห่อด้วย Suspense ด้านล่าง)
function QrInner() {
  // อ่านค่าใน URL
  const params = useSearchParams();
  // ข้อมูลของฉัน + สถานะโหลด
  const { data, isLoading } = useMyData();
  // บัตรทั้งหมดของฉัน
  const tickets = data?.tickets ?? [];
  // บัตรที่เลือกดู: เริ่มจากค่า ?t= ใน URL (ถ้ามี)
  const [selected, setSelected] = useState(params.get("t") || "");
  // true = เพิ่งกดคัดลอก (ปุ่มจะขึ้นคำว่า คัดลอกแล้ว)
  const [copied, setCopied] = useState(false);
  // หาบัตรที่เลือก ถ้าไม่ได้เลือกใช้ใบแรก
  const ticket = tickets.find((t) => t.ticketNo === selected) ?? tickets[0];

  // ยังโหลดอยู่ -> วงหมุน
  if (isLoading) return <Loading />;
  // ยังไม่มีบัตร (ยังไม่อนุมัติ) -> ข้อความว่าง + ปุ่มไปซื้อบัตร
  if (!ticket) return <MobileBody><EmptyState title="ยังไม่มีบัตร" desc="ซื้อบัตรแล้วรอ Admin ยืนยัน QR Code จะขึ้นที่นี่" action={<ButtonLink href="/user/tickets/buy">ซื้อบัตร</ButtonLink>} /></MobileBody>;

  // ลิงก์บัตรสำหรับผู้เข้าร่วม = ชื่อเว็บ + /t/ + รหัสสุ่มของบัตร (linkToken)
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/t/${ticket.linkToken}`;

  // คัดลอกลิงก์บัตรไปส่งให้ผู้เข้าร่วม
  async function copyLink() {
    // คัดลอกลิงก์ลงคลิปบอร์ดของเครื่อง
    await navigator.clipboard.writeText(link);
    // เปลี่ยนปุ่มเป็น "คัดลอกแล้ว"
    setCopied(true);
    // ผ่านไป 2 วินาที เปลี่ยนกลับเหมือนเดิม
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    // ส่วนหน้าตา
    <MobileBody>
      {/* มีบัตรมากกว่า 1 ใบ -> แสดงปุ่มเลือกบัตรแบบเลื่อนซ้ายขวา */}
      {tickets.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {/* วนสร้างปุ่มของแต่ละบัตร กดแล้วเปลี่ยนบัตรที่ดู ใบที่เลือกอยู่เป็นสีกรม */}
          {tickets.map((t) => (
            <button key={t.id} onClick={() => setSelected(t.ticketNo)} className={cx("shrink-0 rounded-2xl border px-4 py-2 text-left", t.id === ticket.id ? "border-navy bg-navy text-white" : "border-line bg-white")}>
              <span className="block text-[10px] opacity-70">TICKET</span>
              <span className="block text-sm font-semibold">{t.ticketNo} · {t.holderName}</span>
            </button>
          ))}
        </div>
      )}
      {/* การ์ด QR หลัก */}
      <div className="rounded-3xl border border-line bg-white p-6 text-center">
        <div className="mb-2 flex justify-center gap-2">
          {/* ป้าย: บัตรของคุณ / ผู้เข้าร่วมคนที่ X และ เช็กอินแล้ว / ยังไม่เช็กอิน */}
          {ticket.holderIndex === 1 ? <Badge tone="navy">บัตรของคุณ</Badge> : <Badge tone="amber">ผู้เข้าร่วม {ticket.holderIndex}</Badge>}
          {ticket.checkedIn ? <Badge tone="green">เช็กอินแล้ว</Badge> : <Badge>ยังไม่เช็กอิน</Badge>}
        </div>
        {/* ชื่อผู้ถือบัตร + เลขบัตร */}
        <p className="text-lg font-bold">{ticket.holderName}</p>
        <p className="text-sm text-muted">{ticket.ticketNo} · 15 ธ.ค. 2569 · Main Hall</p>
        {/* รูป QR: ข้างในคือเลขบัตร เช่น T-001 ใช้สแกนเข้างาน เติมโทเคน และซื้อของ */}
        <div className="mx-auto my-5 w-[70%] max-w-xs">
          <QrImage text={ticket.ticketNo} size={280} className="h-auto w-full" />
        </div>
        <p className="text-xs text-muted">แสดง QR นี้กับ Staff เพื่อเช็กอิน เติมโทเคน และกับร้านค้าเพื่อจ่ายด้วยโทเคน</p>
        {/* ถ้าเช็กอินแล้ว แสดงเวลาที่เช็กอิน */}
        {ticket.checkedIn && <p className="mt-1 text-xs text-ok">เช็กอินเมื่อ {dateTime(ticket.checkinAt)}</p>}
      </div>
      {/* แถบโทเคนคงเหลือ กดแล้วไปหน้ากระเป๋าโทเคนของบัตรนี้ */}
      <Link href={`/user/wallet/${ticket.ticketNo}`} className="flex items-center gap-3 rounded-2xl bg-navy p-4 text-white">
        <Wallet className="size-5" />
        <span className="flex-1 text-sm">โทเคนคงเหลือ</span>
        <span className="text-xl font-bold">{num(ticket.tokens)}</span>
      </Link>
      {/* บัตรของผู้เข้าร่วมคนอื่น (ใบที่ 2 ขึ้นไป) -> แสดงลิงก์ + ปุ่มคัดลอกไปส่งให้เขา */}
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

// หน้า /user/qr
export default function MyQr() {
  return (
    // แถบบน + ตัวหน้าจอห่อด้วย Suspense
    <>
      <TopBar title="My QR" subtitle="QR Code สำหรับเข้างาน" />
      <Suspense fallback={<Loading />}>
        <QrInner />
      </Suspense>
    </>
  );
}
