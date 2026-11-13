"use client";
// บัตรของฉัน: ทุกใบที่ซื้อ (ใบที่ 1 ของเรา + ใบของผู้เข้าร่วมคนอื่น) แยกแท็บ ยังไม่เช็กอิน / เช็กอินแล้ว

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Ticket } from "lucide-react";
import { useMyData } from "@/lib/useMyData";
import { num } from "@/lib/format";
import { TopBar, MobileBody } from "@/components/shells";
import { Badge, ButtonLink, EmptyState, Loading, Tabs } from "@/components/ui";

// หน้า /user/tickets
export default function MyTickets() {
  // ข้อมูลของฉัน + สถานะกำลังโหลด
  const { data, isLoading } = useMyData();
  // แท็บที่เลือก: wait = ยังไม่เช็กอิน, in = เช็กอินแล้ว
  const [tab, setTab] = useState<"wait" | "in">("wait");
  // บัตรทั้งหมดของฉัน
  const tickets = data?.tickets ?? [];
  // คัดบัตรตามแท็บที่เลือก
  const list = tickets.filter((t) => (tab === "in" ? t.checkedIn : !t.checkedIn));
  // คำสั่งซื้อบัตรที่ยังไม่อนุมัติ (ไว้แสดงแถบเตือนสีส้ม)
  const pending = (data?.orders ?? []).filter((o) => o.type === "ticket" && o.status !== "paid");

  return (
    // ส่วนหน้าตา
    <>
      {/* แถบบน + ปุ่ม "+ ซื้อบัตร" */}
      <TopBar title="บัตรของฉัน" subtitle={`${tickets.length} ใบ`} right={<ButtonLink href="/user/tickets/buy" variant="ghost" className="min-h-10">+ ซื้อบัตร</ButtonLink>} />
      <MobileBody>
        {/* แถบเตือนสีส้มของคำสั่งซื้อที่รอตรวจ/โดนปฏิเสธ กดแล้วไปหน้าสถานะ */}
        {pending.map((o) => (
          <Link key={o.id} href={`/user/orders/${o.id}`} className="block rounded-2xl bg-warn-soft p-4 text-sm text-warn">
            {o.orderNo} · {o.status === "rejected" ? "ชำระเงินไม่ผ่าน แตะเพื่อส่งสลิปใหม่" : "รอ Admin ตรวจสอบสลิป บัตรจะขึ้นที่นี่หลังยืนยัน"}
          </Link>
        ))}
        {/* แท็บ 2 อัน พร้อมตัวเลขจำนวนบัตรในแต่ละแท็บ */}
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "wait", label: "ยังไม่เช็กอิน", count: tickets.filter((t) => !t.checkedIn).length },
            { value: "in", label: "เช็กอินแล้ว", count: tickets.filter((t) => t.checkedIn).length },
          ]}
        />
        {/* กำลังโหลด -> แสดงวงหมุน */}
        {isLoading && <Loading />}
        {/* โหลดเสร็จแต่ไม่มีบัตร -> แสดงข้อความว่าง */}
        {!isLoading && list.length === 0 && <EmptyState title="ไม่มีบัตรในแท็บนี้" />}
        {/* วนแสดงบัตรทีละใบ กดแล้วไปหน้า QR ของบัตรใบนั้น (?t=เลขบัตร) */}
        {list.map((t) => (
          <Link key={t.id} href={`/user/qr?t=${t.ticketNo}`} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4">
            <span className="grid size-12 place-items-center rounded-xl bg-navy text-white"><Ticket /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t.ticketNo} · {t.holderName}</p>
              <p className="text-xs text-muted">คงเหลือ {num(t.tokens)} โทเคน</p>
              {/* holderIndex 1 = บัตรของเราเอง, 2 ขึ้นไป = ผู้เข้าร่วมคนอื่น */}
              <div className="mt-1.5">{t.holderIndex === 1 ? <Badge tone="navy">บัตรของคุณ</Badge> : <Badge tone="amber">ผู้เข้าร่วม {t.holderIndex}</Badge>}</div>
            </div>
            <ChevronRight className="size-5 text-muted" />
          </Link>
        ))}
      </MobileBody>
    </>
  );
}
