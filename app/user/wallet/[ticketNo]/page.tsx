"use client";
// กระเป๋าโทเคนของบัตรหนึ่งใบ: ยอดคงเหลือ + ประวัติ (ทั้งหมด/เติม/ใช้) แบ่งหน้าละ 10 รายการ
// ดึงข้อมูลทุก 5 วินาที ตอนร้านตัดโทเคน ยอดตรงนี้จะลดเอง

import Link from "next/link";
// use = อ่านค่าเลขบัตรจาก URL, useState = ตัวแปรของหน้า
import { use, useState } from "react";
import { useMyData } from "@/lib/useMyData";
import { num } from "@/lib/format";
import { TopBar, MobileBody } from "@/components/shells";
// TxList = รายการประวัติโทเคน (+ เติม / - ใช้)
import { TxList } from "@/components/TxList";
import { Button, Card, EmptyState, Loading, Tabs, TokenPolicy, cx } from "@/components/ui";

// แสดงหน้าละ 10 รายการ
const PAGE_SIZE = 10;

// หน้า /user/wallet/[ticketNo] เช่น /user/wallet/T-001
export default function WalletPage({ params }: { params: Promise<{ ticketNo: string }> }) {
  // ดึงเลขบัตรจาก URL
  const { ticketNo } = use(params);
  // ข้อมูลของฉัน (บัตร + ประวัติโทเคน)
  const { data, isLoading } = useMyData();
  // แท็บ: all ทั้งหมด / in ได้รับ-เติม / out ใช้ไป
  const [tab, setTab] = useState<"all" | "in" | "out">("all");
  // หน้าปัจจุบันของรายการ (pagination)
  const [page, setPage] = useState(1);

  // ยังโหลดอยู่ -> วงหมุน
  if (isLoading) return <Loading />;
  const tickets = data?.tickets ?? [];
  // หาบัตรใบที่ตรงกับเลขใน URL (ต้องเป็นบัตรของเราเท่านั้น)
  const ticket = tickets.find((t) => t.ticketNo === ticketNo);
  // ไม่เจอ = ไม่ใช่บัตรของเรา
  if (!ticket) return <MobileBody><EmptyState title="ไม่พบบัตรนี้ในบัญชีของคุณ" /></MobileBody>;

  // ประวัติโทเคนเฉพาะบัตรใบนี้
  const txs = (data?.txs ?? []).filter((t) => t.ticketNo === ticketNo);
  // รวมยอดที่เป็นบวก (โบนัส 50 + เติม)
  const received = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  // รวมยอดที่เป็นลบ (ซื้อของที่ร้าน)
  const used = txs.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  // กรองตามแท็บที่เลือก
  const filtered = txs.filter((t) => (tab === "in" ? t.amount > 0 : tab === "out" ? t.amount < 0 : true));
  // จำนวนหน้าทั้งหมด = ปัดขึ้น(จำนวนรายการ / 10)
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // slice = ตัดเอาเฉพาะ 10 รายการของหน้าปัจจุบัน
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    // ส่วนหน้าตา
    <>
      <TopBar title="กระเป๋าโทเคน" subtitle="ดูยอดแยกตามบัตร" back="/user/me" />
      <MobileBody>
        {/* มีหลายบัตร -> ปุ่มสลับดูกระเป๋าของแต่ละใบ */}
        {tickets.length > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {tickets.map((t) => (
              <Link key={t.id} href={`/user/wallet/${t.ticketNo}`} className={cx("shrink-0 rounded-2xl border px-4 py-2", t.ticketNo === ticketNo ? "border-navy bg-navy text-white" : "border-line bg-white")}>
                <span className="block text-sm font-semibold">{t.ticketNo} · {t.holderName}</span>
                <span className="block text-xs opacity-70">คงเหลือ {num(t.tokens)}</span>
              </Link>
            ))}
          </div>
        )}
        {/* การ์ดสีกรม: ยอดโทเคนคงเหลือตัวใหญ่ + ได้รับทั้งหมด + ใช้ไปแล้ว */}
        <div className="rounded-3xl bg-navy p-6 text-white">
          <p className="text-sm text-white/80">โทเคนคงเหลือ · {ticket.ticketNo} {ticket.holderName}</p>
          <p className="mt-2 text-5xl font-bold">{num(ticket.tokens)} <span className="text-lg font-normal">โทเคน</span></p>
          <p className="mt-2 text-xs text-white/70">ใช้ซื้อเครื่องดื่มและขนมภายในงาน · แลกเป็นเงินสดไม่ได้</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/10 p-3"><p className="text-xs text-white/70">ได้รับ/เติมทั้งหมด</p><p className="text-lg font-bold">+{num(received)}</p></div>
            <div className="rounded-xl bg-white/10 p-3"><p className="text-xs text-white/70">ใช้ไปแล้ว</p><p className="text-lg font-bold">{num(used)}</p></div>
          </div>
        </div>
        {/* กติกาโทเคน (1 โทเคน = 1 บาท แลกเงินสดไม่ได้) */}
        <TokenPolicy />
        <Card>
          {/* แท็บ ทั้งหมด/เติม/ใช้ เปลี่ยนแท็บแล้วกลับไปหน้า 1 */}
          <Tabs
            value={tab}
            onChange={(v) => { setTab(v); setPage(1); }}
            tabs={[
              { value: "all", label: "ทั้งหมด" },
              { value: "in", label: "เติม" },
              { value: "out", label: "ใช้" },
            ]}
          />
          {/* รายการประวัติของหน้าปัจจุบัน */}
          <TxList txs={shown} />
          {/* มีมากกว่า 1 หน้า -> ปุ่ม ก่อนหน้า / ถัดไป (กดไม่ได้ถ้าอยู่หน้าแรก/หน้าสุดท้าย) */}
          {pageCount > 1 && (
            <div className="mt-2 flex items-center justify-between">
              <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>ก่อนหน้า</Button>
              <span className="text-xs text-muted">หน้า {page} / {pageCount}</span>
              <Button size="sm" variant="ghost" disabled={page === pageCount} onClick={() => setPage(page + 1)}>ถัดไป</Button>
            </div>
          )}
        </Card>
      </MobileBody>
    </>
  );
}
