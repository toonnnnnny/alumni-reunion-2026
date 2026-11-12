"use client";
// ประวัติการเติมโทเคนของ Staff คนนี้ + ยอดเงินสด/โอน ไว้กระทบยอดตอนส่งเงินให้ Admin

import { listRecords } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { usePolling } from "@/lib/usePolling";
import { dateTime, num } from "@/lib/format";
import { TopBar, TabletBody } from "@/components/shells";
import { Badge, Card, EmptyState, StatCard } from "@/components/ui";

export default function StaffHistory() {
  const { account } = useAuth();
  const { data } = usePolling(async () =>
    (await listRecords("tx")).filter((t) => t.type === "topup" && t.staffId === account?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
  const list = data ?? [];
  const cash = list.filter((t) => t.method === "cash").reduce((s, t) => s + t.amount, 0);
  const transfer = list.filter((t) => t.method === "transfer").reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <TopBar title="ประวัติการเติมของฉัน" subtitle={account?.servicePoint} back="/staff" />
      <TabletBody>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="รายการทั้งหมด" value={list.length} unit="รายการ" />
          <StatCard label="เงินสดที่ต้องส่ง Admin" value={num(cash)} unit="บาท" tone="amber" />
          <StatCard label="รับโอน" value={num(transfer)} unit="บาท" tone="green" />
        </div>
        {list.length === 0 ? (
          <EmptyState title="ยังไม่มีรายการเติม" />
        ) : (
          <Card className="divide-y divide-line p-0">
            {list.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1">
                  <p className="font-semibold">{t.ticketNo} · +{num(t.amount)} โทเคน</p>
                  <p className="text-xs text-muted">{t.txNo} · {dateTime(t.createdAt)}</p>
                </div>
                <Badge tone={t.method === "cash" ? "amber" : "green"}>{t.method === "cash" ? "เงินสด" : "โอน"}</Badge>
              </div>
            ))}
          </Card>
        )}
      </TabletBody>
    </>
  );
}
