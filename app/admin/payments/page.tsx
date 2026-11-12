"use client";
// อนุมัติการชำระเงิน: ตารางสลิปทั้งหมด แยกแท็บตามสถานะ สลิปใหม่จาก User โผล่เองทุก 5 วินาที

import { useRouter } from "next/navigation";
import { useState } from "react";
import { listRecords, listAccounts } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { baht, dateTime } from "@/lib/format";
import { payLabel } from "@/lib/status";
import type { PayStatus } from "@/lib/types";
import { AdminFrame } from "@/components/AdminFrame";
import { Badge, Card, EmptyState, Loading, Tabs } from "@/components/ui";

export default function Payments() {
  const router = useRouter();
  const [tab, setTab] = useState<PayStatus | "all">("pending_slip");
  const { data, isLoading } = usePolling(async () => {
    const [orders, accounts] = await Promise.all([listRecords("order"), listAccounts()]);
    return { orders: orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), accounts };
  });

  const orders = data?.orders ?? [];
  const nameOf = (userId: string) => data?.accounts.find((a) => a.id === userId)?.name ?? "-";
  const count = (s: PayStatus) => orders.filter((o) => o.status === s).length;
  const list = tab === "all" ? orders : orders.filter((o) => o.status === tab);

  return (
    <AdminFrame title="อนุมัติการชำระเงิน" subtitle="ตรวจสลิปของผู้ซื้อบัตรและเสื้อ">
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "all", label: "ทั้งหมด", count: orders.length },
          { value: "pending_slip", label: "รอตรวจสอบ", count: count("pending_slip"), alert: true },
          { value: "paid", label: "อนุมัติแล้ว", count: count("paid") },
          { value: "rejected", label: "ปฏิเสธ", count: count("rejected") },
        ]}
      />
      {isLoading && <Loading />}
      {!isLoading && list.length === 0 && <EmptyState title="ไม่มีรายการ" />}
      {list.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-paper text-left text-muted">
              <tr>
                {["เลขคำสั่งซื้อ", "ผู้ซื้อ", "ประเภท", "ยอด", "ส่งสลิปเมื่อ", "สถานะ"].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} onClick={() => router.push(`/admin/payments/${o.id}`)} className="cursor-pointer border-t border-line hover:bg-paper">
                  <td className="px-5 py-3.5 font-semibold">{o.orderNo}</td>
                  <td className="px-5 py-3.5">{nameOf(o.userId)}</td>
                  <td className="px-5 py-3.5">{o.type === "ticket" ? `บัตร × ${o.attendees.length}` : `เสื้อ ${o.items.reduce((s, i) => s + i.qty, 0)} ตัว`}</td>
                  <td className="px-5 py-3.5 font-semibold">{baht(o.total)}</td>
                  <td className="px-5 py-3.5 text-muted">{dateTime(o.updatedAt)}</td>
                  <td className="px-5 py-3.5"><Badge tone={payLabel[o.status].tone}>{payLabel[o.status].text}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </AdminFrame>
  );
}
