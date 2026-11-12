"use client";
// ผู้ซื้อบัตร: บัญชี role user ทั้งหมด พร้อมจำนวนบัตรและโทเคนรวม + ค้นหา + แบ่งหน้า

import { useRouter } from "next/navigation";
import { useState } from "react";
import { listAccounts, listRecords } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { dateTime, num } from "@/lib/format";
import { AdminFrame } from "@/components/AdminFrame";
import { Button, Card, Loading, StatCard } from "@/components/ui";

const PAGE_SIZE = 10;

export default function Buyers() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePolling(async () => {
    const [accounts, tickets] = await Promise.all([listAccounts(), listRecords("ticket")]);
    return { users: accounts.filter((a) => a.role === "user"), tickets };
  });

  if (isLoading || !data) return <AdminFrame title="ผู้ซื้อบัตร"><Loading /></AdminFrame>;

  const rows = data.users
    .map((u) => {
      const mine = data.tickets.filter((t) => t.userId === u.id);
      return { ...u, ticketCount: mine.length, tokens: mine.reduce((s, t) => s + t.tokens, 0), checkedIn: mine.filter((t) => t.checkedIn).length };
    })
    .filter((u) => `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminFrame title="ผู้ซื้อบัตร" subtitle="บัญชีผู้ซื้อ บัตร และโทเคน">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="ผู้ซื้อทั้งหมด" value={data.users.length} unit="คน" />
        <StatCard label="บัตรทั้งหมด" value={data.tickets.length} unit="ใบ" />
        <StatCard label="โทเคนคงเหลือในระบบ" value={num(data.tickets.reduce((s, t) => s + t.tokens, 0))} unit="โทเคน" tone="amber" />
      </div>
      <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="ค้นหาชื่อ อีเมล เบอร์โทร" className="h-12 w-full max-w-md rounded-xl border border-line bg-white px-4 outline-none focus:border-navy" />
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-paper text-left text-muted">
            <tr>{["ชื่อ", "อีเมล", "เบอร์โทร", "บัตร", "เช็กอิน", "โทเคนคงเหลือ", "สมัครเมื่อ"].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {shown.map((u) => (
              <tr key={u.id} onClick={() => router.push(`/admin/buyers/${u.id}`)} className="cursor-pointer border-t border-line hover:bg-paper">
                <td className="px-5 py-3.5 font-semibold">{u.name}</td>
                <td className="px-5 py-3.5">{u.email}</td>
                <td className="px-5 py-3.5">{u.phone}</td>
                <td className="px-5 py-3.5">{u.ticketCount}</td>
                <td className="px-5 py-3.5">{u.checkedIn}/{u.ticketCount}</td>
                <td className="px-5 py-3.5 font-semibold">{num(u.tokens)}</td>
                <td className="px-5 py-3.5 text-muted">{dateTime(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {pageCount > 1 && (
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>ก่อนหน้า</Button>
          <span className="text-sm text-muted">หน้า {page} / {pageCount}</span>
          <Button size="sm" variant="ghost" disabled={page === pageCount} onClick={() => setPage(page + 1)}>ถัดไป</Button>
        </div>
      )}
    </AdminFrame>
  );
}
