"use client";
// Dashboard ของ Super Admin: ตัวเลขสรุป + กราฟ (อัปเดตเองทุก 5 วินาที)
// ฟังก์ชันคำนวณอยู่ในไฟล์นี้ แยกเป็นฟังก์ชันเล็กๆ อ่านง่าย

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, CreditCard, ScanLine, Shirt, Ticket, Wallet } from "lucide-react";
import { listRecords } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { baht, dateTime, isToday, num, shortDate } from "@/lib/format";
import { shipLabel } from "@/lib/status";
import type { Order, ShipStatus, Transaction } from "@/lib/types";
import { AdminFrame } from "@/components/AdminFrame";
import { BarChart, HBars } from "@/components/charts";
import { Card, CardTitle, Loading, StatCard, Tabs } from "@/components/ui";

const NAVY = "#253448";
const AMBER = "#c28b45";

// วันที่แบบ yyyy-mm-dd ตามเวลาเครื่อง ใช้จัดกลุ่มรายวัน
function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ยอดขายบัตร/เสื้อ (บาท) แยกรายวัน 7 วันล่าสุดที่มีการขาย
function salesByDay(orders: Order[]) {
  const paid = orders.filter((o) => o.status === "paid");
  const days = Array.from(new Set(paid.map((o) => dayKey(o.createdAt)))).sort().slice(-7);
  return {
    labels: days.map((d) => shortDate(d + "T12:00:00")),
    ticket: days.map((d) => paid.filter((o) => o.type === "ticket" && dayKey(o.createdAt) === d).reduce((s, o) => s + o.total, 0)),
    shirt: days.map((d) => paid.filter((o) => o.type === "shirt" && dayKey(o.createdAt) === d).reduce((s, o) => s + o.total, 0)),
  };
}

// ยอดขายวันนี้แยกรายชั่วโมง (10:00 - 22:00)
const HOURS = Array.from({ length: 13 }, (_, i) => i + 10);
function byHourToday<T extends { createdAt: string }>(rows: T[], value: (row: T) => number): number[] {
  const today = rows.filter((r) => isToday(r.createdAt));
  return HOURS.map((h) => today.filter((r) => new Date(r.createdAt).getHours() === h).reduce((s, r) => s + value(r), 0));
}

export default function Dashboard() {
  const [salesRange, setSalesRange] = useState<"all" | "today">("all");
  const [shopRange, setShopRange] = useState<"today" | "all">("today");
  const { data, isLoading } = usePolling(async () => {
    const [orders, tickets, txs, shops] = await Promise.all([listRecords("order"), listRecords("ticket"), listRecords("tx"), listRecords("shop")]);
    return { orders, tickets, txs, shops };
  });

  if (isLoading || !data) return <AdminFrame title="Dashboard"><Loading /></AdminFrame>;
  const { orders, tickets, txs, shops } = data;

  const paid = orders.filter((o) => o.status === "paid");
  const ticketRevenue = paid.filter((o) => o.type === "ticket").reduce((s, o) => s + o.total, 0);
  const shirtOrders = paid.filter((o) => o.type === "shirt");
  const shirtRevenue = shirtOrders.reduce((s, o) => s + o.total, 0);
  const pendingSlips = orders.filter((o) => o.status === "pending_slip");
  const topups = txs.filter((t) => t.type === "topup");
  const sales = txs.filter((t) => t.type === "sale");
  const topupToday = topups.filter((t) => isToday(t.createdAt)).reduce((s, t) => s + t.amount, 0);

  const daily = salesByDay(orders);
  const todayPaid = paid.filter((o) => isToday(o.createdAt));
  const shopSales = (rows: Transaction[]) => shops.map((s) => ({ label: s.name, value: rows.filter((t) => t.shopId === s.id).reduce((sum, t) => sum - t.amount, 0) }));
  const shopRows = shopSales(shopRange === "today" ? sales.filter((t) => isToday(t.createdAt)) : sales);

  // สถานะคำสั่งซื้อเสื้อ (ตัวเลขอยู่ติดชื่อ ไม่ห่างจากเนื้อหา)
  const shipCounts = (["wait_pack", "packed", "shipped", "not_picked", "picked"] as ShipStatus[]).map((s) => ({ status: s, count: shirtOrders.filter((o) => o.shipStatus === s).length }));

  const activity = [
    ...orders.map((o) => ({ at: o.createdAt, text: `${o.orderNo} ส่งสลิป ${baht(o.total)}` })),
    ...txs.filter((t) => t.type !== "bonus").map((t) => ({ at: t.createdAt, text: t.type === "topup" ? `${t.ticketNo} เติม ${num(t.amount)} โทเคน (${t.staffName})` : `${t.shopName} ขาย ${num(-t.amount)} โทเคน` })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);

  return (
    <AdminFrame title="Dashboard" subtitle="ภาพรวมงาน Alumni Reunion 2026 · อัปเดตอัตโนมัติ">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="บัตรที่ขายแล้ว" value={num(tickets.length)} unit="ใบ" icon={<Ticket className="size-5" />} />
        <StatCard label="เช็กอินแล้ว" value={`${tickets.filter((t) => t.checkedIn).length}/${tickets.length}`} unit="คน" icon={<ScanLine className="size-5" />} tone="green" />
        <StatCard label="ยอดขายบัตร + เสื้อ" value={num(ticketRevenue + shirtRevenue)} unit="บาท" icon={<CreditCard className="size-5" />} tone="amber" />
        <StatCard label="ยอดเติมโทเคนวันนี้" value={num(topupToday)} unit="โทเคน" icon={<Wallet className="size-5" />} tone="blue" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardTitle right={<Tabs value={salesRange} onChange={setSalesRange} tabs={[{ value: "all", label: "รายวัน" }, { value: "today", label: "เฉพาะวันนี้" }]} />}>กราฟแสดงยอดขาย</CardTitle>
          {salesRange === "all" ? (
            <BarChart labels={daily.labels} unit="บาท" series={[{ name: "บัตร", color: NAVY, values: daily.ticket }, { name: "เสื้อ", color: AMBER, values: daily.shirt }]} />
          ) : (
            <>
              <p className="mb-2 text-sm text-muted">วันนี้: บัตร {baht(todayPaid.filter((o) => o.type === "ticket").reduce((s, o) => s + o.total, 0))} · เสื้อ {baht(todayPaid.filter((o) => o.type === "shirt").reduce((s, o) => s + o.total, 0))}</p>
              <BarChart labels={HOURS.map((h) => `${h}:00`)} unit="บาท" series={[{ name: "บัตร", color: NAVY, values: byHourToday(todayPaid.filter((o) => o.type === "ticket"), (o) => o.total) }, { name: "เสื้อ", color: AMBER, values: byHourToday(todayPaid.filter((o) => o.type === "shirt"), (o) => o.total) }]} />
            </>
          )}
        </Card>
        <Card>
          <CardTitle right={<Link href="/admin/payments" className="text-sm font-semibold text-navy">ทั้งหมด</Link>}>รอตรวจสอบสลิป ({pendingSlips.length})</CardTitle>
          {pendingSlips.length === 0 && <p className="py-6 text-center text-sm text-muted">ไม่มีสลิปค้าง</p>}
          {pendingSlips.slice(0, 5).map((o) => (
            <Link key={o.id} href={`/admin/payments/${o.id}`} className="flex items-center gap-2 border-b border-line py-3 last:border-0">
              <div className="flex-1">
                <p className="text-sm font-semibold">{o.orderNo}</p>
                <p className="text-xs text-muted">{o.type === "ticket" ? "บัตร" : "เสื้อ"} · {dateTime(o.createdAt)}</p>
              </div>
              <span className="text-sm font-semibold">{baht(o.total)}</span>
              <ChevronRight className="size-4 text-muted" />
            </Link>
          ))}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardTitle right={<Link href="/admin/topups" className="text-sm font-semibold text-navy">ดูรายการ</Link>}>ยอดเติมโทเคนวันนี้ (รายชั่วโมง)</CardTitle>
          <BarChart labels={HOURS.map((h) => `${h}:00`)} unit="โทเคน" series={[{ name: "เติมโทเคน", color: "#5e7f67", values: byHourToday(topups, (t) => t.amount) }]} height={200} />
        </Card>
        <Card>
          <CardTitle>คำสั่งซื้อเสื้อ</CardTitle>
          <div className="space-y-2">
            {shipCounts.map((s) => (
              <div key={s.status} className="flex items-center justify-between rounded-xl bg-paper px-3 py-2.5 text-sm">
                <span>{shipLabel[s.status].text} <b className="ml-1">{s.count}</b> <span className="text-xs text-muted">รายการ</span></span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardTitle right={<Tabs value={shopRange} onChange={setShopRange} tabs={[{ value: "today", label: "วันนี้" }, { value: "all", label: "ทั้งหมด" }]} />}>
            {shopRange === "today" ? "ยอดขายแต่ละร้านวันนี้ (โทเคน)" : "ยอดขายแต่ละร้านทั้งหมด (โทเคน)"}
          </CardTitle>
          <HBars rows={shopRows} unit="โทเคน" />
        </Card>
        <Card>
          <CardTitle>กิจกรรมล่าสุด</CardTitle>
          {activity.map((a, i) => (
            <div key={i} className="border-b border-line py-2.5 last:border-0">
              <p className="text-sm">{a.text}</p>
              <p className="text-xs text-muted">{dateTime(a.at)}</p>
            </div>
          ))}
        </Card>
      </div>
      <p className="flex items-center gap-2 text-xs text-muted"><Shirt className="size-3.5" /> เสื้อขายแล้ว {shirtOrders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0)} ตัว · {baht(shirtRevenue)}</p>
    </AdminFrame>
  );
}
