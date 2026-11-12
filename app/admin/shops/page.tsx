"use client";
// ร้านค้าและเมนู: แท็บ "ร้านค้า" กับ "คำขอถอนเงิน" (มีเลขแดงบอกจำนวนที่ต้องโอน)
// เปิดแท็บถอนเงินตรงๆ ได้ด้วย /admin/shops?tab=withdrawals

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight, Plus, Store } from "lucide-react";
import { listRecords } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { dateTime, isToday, num } from "@/lib/format";
import { AdminFrame } from "@/components/AdminFrame";
import { Badge, ButtonLink, Card, EmptyState, Loading, StatCard, Tabs } from "@/components/ui";

function ShopsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get("tab") === "withdrawals" ? "withdrawals" : "shops";
  const { data, isLoading } = usePolling(async () => {
    const [shops, withdrawals, txs] = await Promise.all([listRecords("shop"), listRecords("withdrawal"), listRecords("tx")]);
    return { shops, withdrawals: withdrawals.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)), sales: txs.filter((t) => t.type === "sale") };
  });

  if (isLoading || !data) return <Loading />;
  const pending = data.withdrawals.filter((w) => w.status === "pending");
  const doneToday = data.withdrawals.filter((w) => w.status === "done" && isToday(w.doneAt));

  return (
    <>
      <Tabs
        value={tab}
        onChange={(v) => router.replace(v === "shops" ? "/admin/shops" : "/admin/shops?tab=withdrawals")}
        tabs={[
          { value: "shops", label: "ร้านค้า", count: data.shops.length },
          { value: "withdrawals", label: "คำขอถอนเงิน", count: pending.length, alert: true },
        ]}
      />

      {tab === "shops" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="ร้านค้า" value={data.shops.length} unit="ร้าน" />
            <StatCard label="เมนูทั้งหมด" value={data.shops.reduce((s, sh) => s + sh.menu.length, 0)} unit="เมนู" />
            <StatCard label="โทเคนที่ใช้วันนี้" value={num(data.sales.filter((t) => isToday(t.createdAt)).reduce((s, t) => s - t.amount, 0))} unit="โทเคน" tone="amber" />
          </div>
          <div className="flex items-center justify-between">
            <p className="font-semibold">ร้านค้าทั้งหมด</p>
            <ButtonLink href="/admin/shops/new"><Plus className="size-4" /> สร้างร้านค้า</ButtonLink>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.shops.map((s) => {
              const sales = data.sales.filter((t) => t.shopId === s.id);
              return (
                <Link key={s.id} href={`/admin/shops/${s.id}`} className="rounded-2xl border border-line bg-white p-5 hover:border-navy">
                  <div className="flex items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-xl bg-navy-soft text-navy"><Store /></span>
                    <div className="flex-1">
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-muted">{s.category} · {s.booth}</p>
                    </div>
                    <ChevronRight className="size-4 text-muted" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-xl bg-paper p-2.5"><p className="text-xs text-muted">เมนู</p><p className="font-semibold">{s.menu.length}</p></div>
                    <div className="rounded-xl bg-paper p-2.5"><p className="text-xs text-muted">ยอดขายรวม</p><p className="font-semibold">{num(sales.reduce((a, t) => a - t.amount, 0))}</p></div>
                    <div className="rounded-xl bg-paper p-2.5"><p className="text-xs text-muted">ถอนได้</p><p className="font-semibold">{num(s.balance)}</p></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="รอดำเนินการ" value={pending.length} unit="คำขอ" tone="red" />
            <StatCard label="ยอดรอโอน" value={num(pending.reduce((s, w) => s + w.amount, 0))} unit="บาท" tone="amber" />
            <StatCard label="โอนแล้ววันนี้" value={num(doneToday.reduce((s, w) => s + w.amount, 0))} unit="บาท" tone="green" />
          </div>
          {data.withdrawals.length === 0 ? (
            <EmptyState title="ยังไม่มีคำขอถอนเงิน" />
          ) : (
            <Card className="overflow-x-auto p-0">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-paper text-left text-muted">
                  <tr>{["เลขคำขอ", "ร้านค้า", "จำนวน (บาท)", "บัญชีรับเงิน", "วัน-เวลาที่ขอ", "สถานะ"].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {data.withdrawals.map((w) => (
                    <tr key={w.id} onClick={() => router.push(`/admin/shops/withdrawals/${w.id}`)} className="cursor-pointer border-t border-line hover:bg-paper">
                      <td className="px-5 py-4 font-semibold">{w.wdNo}</td>
                      <td className="px-5 py-4">{w.shopName}</td>
                      <td className="px-5 py-4 font-semibold">{num(w.amount)}</td>
                      <td className="px-5 py-4">{w.bankName} · {w.bankAccount}</td>
                      <td className="px-5 py-4">{dateTime(w.requestedAt)}</td>
                      <td className="px-5 py-4"><Badge tone={w.status === "pending" ? "amber" : "green"}>{w.status === "pending" ? "รอโอน" : "โอนแล้ว"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
          <p className="text-sm text-muted">ร้านถอนได้วันละ 1 ครั้ง · เมื่อโอนแล้วให้กด “ดำเนินการเสร็จเรียบร้อย” ในหน้ารายละเอียด</p>
        </>
      )}
    </>
  );
}

export default function Shops() {
  return (
    <AdminFrame title="ร้านค้าและเมนู" subtitle="ร้านค้าในงาน ราคาโทเคน และคำขอถอนเงิน">
      <Suspense fallback={<Loading />}>
        <ShopsInner />
      </Suspense>
    </AdminFrame>
  );
}
