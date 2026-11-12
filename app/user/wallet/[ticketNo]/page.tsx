"use client";
// กระเป๋าโทเคนของบัตรหนึ่งใบ: ยอดคงเหลือ + ประวัติ (ทั้งหมด/เติม/ใช้) แบ่งหน้าละ 10 รายการ
// ดึงข้อมูลทุก 5 วินาที ตอนร้านตัดโทเคน ยอดตรงนี้จะลดเอง

import Link from "next/link";
import { use, useState } from "react";
import { useMyData } from "@/lib/useMyData";
import { num } from "@/lib/format";
import { TopBar, MobileBody } from "@/components/shells";
import { TxList } from "@/components/TxList";
import { Button, Card, EmptyState, Loading, Tabs, TokenPolicy, cx } from "@/components/ui";

const PAGE_SIZE = 10;

export default function WalletPage({ params }: { params: Promise<{ ticketNo: string }> }) {
  const { ticketNo } = use(params);
  const { data, isLoading } = useMyData();
  const [tab, setTab] = useState<"all" | "in" | "out">("all");
  const [page, setPage] = useState(1);

  if (isLoading) return <Loading />;
  const tickets = data?.tickets ?? [];
  const ticket = tickets.find((t) => t.ticketNo === ticketNo);
  if (!ticket) return <MobileBody><EmptyState title="ไม่พบบัตรนี้ในบัญชีของคุณ" /></MobileBody>;

  const txs = (data?.txs ?? []).filter((t) => t.ticketNo === ticketNo);
  const received = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const used = txs.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const filtered = txs.filter((t) => (tab === "in" ? t.amount > 0 : tab === "out" ? t.amount < 0 : true));
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <TopBar title="กระเป๋าโทเคน" subtitle="ดูยอดแยกตามบัตร" back="/user/me" />
      <MobileBody>
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
        <div className="rounded-3xl bg-navy p-6 text-white">
          <p className="text-sm text-white/80">โทเคนคงเหลือ · {ticket.ticketNo} {ticket.holderName}</p>
          <p className="mt-2 text-5xl font-bold">{num(ticket.tokens)} <span className="text-lg font-normal">โทเคน</span></p>
          <p className="mt-2 text-xs text-white/70">ใช้ซื้อเครื่องดื่มและขนมภายในงาน · แลกเป็นเงินสดไม่ได้</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/10 p-3"><p className="text-xs text-white/70">ได้รับ/เติมทั้งหมด</p><p className="text-lg font-bold">+{num(received)}</p></div>
            <div className="rounded-xl bg-white/10 p-3"><p className="text-xs text-white/70">ใช้ไปแล้ว</p><p className="text-lg font-bold">{num(used)}</p></div>
          </div>
        </div>
        <TokenPolicy />
        <Card>
          <Tabs
            value={tab}
            onChange={(v) => { setTab(v); setPage(1); }}
            tabs={[
              { value: "all", label: "ทั้งหมด" },
              { value: "in", label: "เติม" },
              { value: "out", label: "ใช้" },
            ]}
          />
          <TxList txs={shown} />
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
