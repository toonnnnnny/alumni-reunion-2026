"use client";
// การแจ้งปัญหาจาก Staff: เรื่องใหม่โผล่เองทุก 5 วินาที

import { useRouter } from "next/navigation";
import { useState } from "react";
import { listRecords } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { dateTime } from "@/lib/format";
import { AdminFrame } from "@/components/AdminFrame";
import { Badge, Card, EmptyState, Loading, Tabs } from "@/components/ui";

export default function Issues() {
  const router = useRouter();
  const [tab, setTab] = useState<"open" | "done">("open");
  const { data, isLoading } = usePolling(async () => (await listRecords("issue")).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  const all = data ?? [];
  const list = all.filter((i) => i.status === tab);

  return (
    <AdminFrame title="การแจ้งปัญหา" subtitle="เรื่องที่ Staff ส่งมาจากหน้างาน">
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "open", label: "รอดำเนินการ", count: all.filter((i) => i.status === "open").length, alert: true }, { value: "done", label: "เสร็จสิ้นแล้ว", count: all.filter((i) => i.status === "done").length }]} />
      {isLoading && <Loading />}
      {!isLoading && list.length === 0 && <EmptyState title="ไม่มีเรื่องในแท็บนี้" />}
      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((i) => (
          <Card key={i.id}>
            <button onClick={() => router.push(`/admin/issues/${i.id}`)} className="w-full text-left">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{i.issueNo} · {i.topic}</p>
                <Badge tone={i.status === "open" ? "amber" : "green"}>{i.status === "open" ? "รอดำเนินการ" : "เสร็จสิ้นแล้ว"}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">{i.detail}</p>
              <p className="mt-2 text-xs text-muted">{i.staffName} · {i.servicePoint} · {i.ticketNo || "ไม่ระบุบัตร"} · {dateTime(i.createdAt)}</p>
            </button>
          </Card>
        ))}
      </div>
    </AdminFrame>
  );
}
