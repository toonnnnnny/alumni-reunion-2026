"use client";
// คำสั่งซื้อของฉัน แยกแท็บ กำลังดำเนินการ / สำเร็จ

import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useMyData } from "@/lib/useMyData";
import { baht, dateTime } from "@/lib/format";
import { payLabel, shipLabel } from "@/lib/status";
import type { Order } from "@/lib/types";
import { TopBar, MobileBody } from "@/components/shells";
import { Badge, EmptyState, Loading, Tabs, ButtonLink } from "@/components/ui";

// ถือว่า "สำเร็จ" เมื่อจ่ายแล้วและ (เป็นบัตร หรือ เสื้อส่งถึง/รับแล้ว)
function isDone(o: Order): boolean {
  if (o.status !== "paid") return false;
  return o.type === "ticket" || o.shipStatus === "shipped" || o.shipStatus === "picked";
}

export default function MyOrders() {
  const { data, isLoading } = useMyData();
  const [tab, setTab] = useState<"active" | "done">("active");
  const orders = data?.orders ?? [];
  const list = orders.filter((o) => (tab === "done" ? isDone(o) : !isDone(o)));

  return (
    <>
      <TopBar title="คำสั่งซื้อของฉัน" back="/user/me" />
      <MobileBody>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "active", label: "กำลังดำเนินการ", count: orders.filter((o) => !isDone(o)).length },
            { value: "done", label: "สำเร็จ", count: orders.filter(isDone).length },
          ]}
        />
        {isLoading && <Loading />}
        {!isLoading && list.length === 0 && <EmptyState title="ยังไม่มีคำสั่งซื้อ" action={<ButtonLink href="/user/tickets/buy">ซื้อบัตร</ButtonLink>} />}
        {list.map((o) => (
          <Link key={o.id} href={`/user/orders/${o.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{o.orderNo}</p>
              <p className="text-xs text-muted">
                {o.type === "ticket" ? `บัตรเข้างาน × ${o.attendees.length}` : `เสื้อ ${o.items.reduce((s, i) => s + i.qty, 0)} ตัว`} · {dateTime(o.createdAt)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone={payLabel[o.status].tone}>{payLabel[o.status].text}</Badge>
                {o.shipStatus && <Badge tone={shipLabel[o.shipStatus].tone}>{shipLabel[o.shipStatus].text}</Badge>}
              </div>
            </div>
            <p className="font-semibold">{baht(o.total)}</p>
            <ChevronRight className="size-4 text-muted" />
          </Link>
        ))}
      </MobileBody>
    </>
  );
}
