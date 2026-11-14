"use client";
// รายการเติมโทเคนทั้งหมด: ดูว่าโทเคนเข้าบัตร/ผู้ใช้คนไหน เติมโดย Staff คนไหน
// ทุกรายการเป็นการโอนเงิน (ไม่รับเงินสด) Admin ใช้หน้านี้ตรวจสอบธุรกรรมย้อนหลัง
// การ์ดสรุปมีแค่ 2 ใบ (โทเคนที่เติมวันนี้, รายการเติมวันนี้) เพื่อไม่ให้สับสน

import Link from "next/link";
import { useState } from "react";
import { listAccounts, listRecords } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { dateTime, isToday, num } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { AdminFrame } from "@/components/AdminFrame";
import { Badge, Card, EmptyState, InfoRow, Loading, Modal, StatCard } from "@/components/ui";
import { ReceiptText, Wallet } from "lucide-react";

export default function Topups() {
  const [selected, setSelected] = useState<Transaction | null>(null);
  const { data, isLoading } = usePolling(async () => {
    const [txs, tickets, accounts] = await Promise.all([listRecords("tx"), listRecords("ticket"), listAccounts()]);
    return { topups: txs.filter((t) => t.type === "topup").sort((a, b) => b.createdAt.localeCompare(a.createdAt)), tickets, accounts };
  });

  if (isLoading || !data) return <AdminFrame title="รายการเติมโทเคน"><Loading /></AdminFrame>;
  const today = data.topups.filter((t) => isToday(t.createdAt));
  const list = data.topups;

  // หาเจ้าของบัตรและบัญชีผู้ซื้อของรายการเติม
  const ticketOf = (no: string) => data.tickets.find((t) => t.ticketNo === no);
  const buyerOf = (no: string) => data.accounts.find((a) => a.id === ticketOf(no)?.userId);
  const sel = selected ? { ticket: ticketOf(selected.ticketNo), buyer: buyerOf(selected.ticketNo) } : null;

  return (
    <AdminFrame title="รายการเติมโทเคน" subtitle="โทเคนเข้าบัตรของใคร เติมโดย Staff คนไหน">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="โทเคนที่เติมวันนี้" value={num(today.reduce((s, t) => s + t.amount, 0))} unit="โทเคน" icon={<Wallet className="size-5" />} />
        <StatCard label="รายการเติมวันนี้" value={today.length} unit="รายการ" icon={<ReceiptText className="size-5" />} />
      </div>
      <p className="text-sm text-muted">ทุกรายการเป็นการโอนเงิน ใช้ตรวจสอบธุรกรรมการเติมโทเคนย้อนหลังได้</p>
      {list.length === 0 ? (
        <EmptyState title="ยังไม่มีรายการเติม" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-paper text-left text-muted">
              <tr>{["เลขรายการ", "บัตร / ผู้ถือบัตร", "บัญชีผู้ซื้อ", "จำนวน", "ชำระโดย", "Staff", "เวลา"].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} onClick={() => setSelected(t)} className="cursor-pointer border-t border-line hover:bg-paper">
                  <td className="px-5 py-3.5 font-semibold">{t.txNo}</td>
                  <td className="px-5 py-3.5">{t.ticketNo} · {ticketOf(t.ticketNo)?.holderName}</td>
                  <td className="px-5 py-3.5">{buyerOf(t.ticketNo)?.name ?? "-"}</td>
                  <td className="px-5 py-3.5 font-semibold text-ok">+{num(t.amount)}</td>
                  <td className="px-5 py-3.5"><Badge tone="green">โอน</Badge></td>
                  <td className="px-5 py-3.5">{t.staffName}</td>
                  <td className="px-5 py-3.5 text-muted">{dateTime(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`รายการเติม ${selected?.txNo ?? ""}`}>
        {selected && sel && (
          <>
            <InfoRow label="จำนวน" value={`+${num(selected.amount)} โทเคน`} tone="green" />
            <InfoRow label="ลูกค้าโอน" value={`${num(selected.amount)} บาท · เข้าบัญชีของงาน`} />
            <InfoRow label="เติมโดย" value={selected.staffName} />
            <InfoRow label="เวลา" value={dateTime(selected.createdAt)} />
            <p className="mb-1 mt-4 font-semibold">โทเคนเข้าบัตร</p>
            <InfoRow label="เลขบัตร" value={selected.ticketNo} />
            <InfoRow label="ผู้ถือบัตร" value={`${sel.ticket?.holderName ?? "-"} · ${sel.ticket?.holderEmail ?? ""}`} />
            <InfoRow label="โทเคนคงเหลือตอนนี้" value={`${num(sel.ticket?.tokens ?? 0)} โทเคน`} />
            <p className="mb-1 mt-4 font-semibold">บัญชีผู้ซื้อ</p>
            <InfoRow label="ชื่อ" value={sel.buyer ? <Link href={`/admin/buyers/${sel.buyer.id}`} className="text-navy underline">{sel.buyer.name}</Link> : "-"} />
            <InfoRow label="อีเมล / เบอร์" value={sel.buyer ? `${sel.buyer.email} · ${sel.buyer.phone}` : "-"} />
          </>
        )}
      </Modal>
    </AdminFrame>
  );
}
