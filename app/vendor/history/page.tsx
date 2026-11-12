"use client";
// ประวัติการขายของร้าน (วันนี้/ทั้งหมด)

import { useState } from "react";
import { listRecords } from "@/lib/api";
import { useMyShop } from "@/lib/useMyShop";
import { useAuth } from "@/lib/auth";
import { usePolling } from "@/lib/usePolling";
import { dateTime, isToday, num } from "@/lib/format";
import { TopBar, TabletBody } from "@/components/shells";
import { Card, EmptyState, StatCard, Tabs } from "@/components/ui";

export default function VendorHistory() {
  const { data: shop } = useMyShop();
  const { account } = useAuth();
  const [tab, setTab] = useState<"today" | "all">("today");
  const { data } = usePolling(async () => (await listRecords("tx")).filter((t) => t.type === "sale" && t.shopId === account?.shopId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  const all = data ?? [];
  const list = tab === "today" ? all.filter((t) => isToday(t.createdAt)) : all;
  const sum = list.reduce((s, t) => s - t.amount, 0);

  return (
    <>
      <TopBar title="ประวัติการขาย" subtitle={shop?.name} back="/vendor" />
      <TabletBody>
        <Tabs value={tab} onChange={setTab} tabs={[{ value: "today", label: "วันนี้" }, { value: "all", label: "ทั้งหมด" }]} />
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="ยอดขาย" value={num(sum)} unit="โทเคน" tone="green" />
          <StatCard label="จำนวนรายการ" value={list.length} unit="รายการ" />
        </div>
        {list.length === 0 ? (
          <EmptyState title="ยังไม่มีรายการขาย" />
        ) : (
          <Card className="divide-y divide-line p-0">
            {list.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{t.txNo} · {t.ticketNo}</p>
                  <p className="truncate text-xs text-muted">{t.items.map((i) => `${i.name}×${i.qty}`).join(", ")} · {dateTime(t.createdAt)}</p>
                </div>
                <span className="font-bold text-ok">+{num(-t.amount)}</span>
              </div>
            ))}
          </Card>
        )}
      </TabletBody>
    </>
  );
}
