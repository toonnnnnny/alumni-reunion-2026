"use client";
// คิวแพ็คเสื้อ: แสดงเฉพาะคำสั่งซื้อเสื้อแบบจัดส่งที่ Admin อนุมัติแล้ว แยกแท็บตามสถานะ

import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { listRecords } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { dateTime } from "@/lib/format";
import { shipLabel } from "@/lib/status";
import type { ShipStatus } from "@/lib/types";
import { TopBar, MobileBody, AccountChip } from "@/components/shells";
import { NoticeBell } from "@/components/NoticeBell";
import { Badge, EmptyState, Loading, Tabs } from "@/components/ui";

export default function PackingQueue() {
  const [tab, setTab] = useState<ShipStatus>("wait_pack");
  const { data, isLoading } = usePolling(async () =>
    (await listRecords("order")).filter((o) => o.type === "shirt" && o.status === "paid" && o.delivery === "ship").sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
  );
  const orders = data ?? [];
  const count = (s: ShipStatus) => orders.filter((o) => o.shipStatus === s).length;
  const list = orders.filter((o) => o.shipStatus === tab);

  return (
    <>
      <TopBar title="คิวแพ็คเสื้อ" subtitle="คำสั่งซื้อแบบจัดส่ง" right={<div className="flex items-center gap-2"><NoticeBell /><AccountChip /></div>} />
      <MobileBody>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "wait_pack", label: "รอแพ็ค", count: count("wait_pack"), alert: true },
            { value: "packed", label: "แพ็คเสร็จ", count: count("packed") },
            { value: "shipped", label: "จัดส่งแล้ว", count: count("shipped") },
          ]}
        />
        {isLoading && <Loading />}
        {!isLoading && list.length === 0 && <EmptyState title="ไม่มีคำสั่งซื้อในแท็บนี้" />}
        {list.map((o) => (
          <Link key={o.id} href={`/packing/${o.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{o.orderNo}</p>
                <Badge tone={shipLabel[o.shipStatus as ShipStatus].tone}>{shipLabel[o.shipStatus as ShipStatus].text}</Badge>
              </div>
              <p className="truncate text-sm">{o.items.map((i) => `${i.name} ${i.color} ${i.size}×${i.qty}`).join(", ")}</p>
              <p className="text-xs text-muted">อัปเดตล่าสุด {dateTime(o.updatedAt)}</p>
            </div>
            <ChevronRight className="size-5 text-muted" />
          </Link>
        ))}
      </MobileBody>
    </>
  );
}
