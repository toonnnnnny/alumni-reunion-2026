"use client";
// รายละเอียดคำสั่งซื้อที่ต้องแพ็ค: เช็กรายการ -> กด "แพ็คเสร็จ" -> กรอกเลขพัสดุ -> "จัดส่งแล้ว"
// ทุกขั้นแจ้งเตือนผู้ซื้ออัตโนมัติ

import { ShirtThumb } from "@/components/ShirtImage";
import { use, useState } from "react";
import { getRecord } from "@/lib/api";
import { moveShip } from "@/lib/actions";
import { usePolling } from "@/lib/usePolling";
import { dateTime } from "@/lib/format";
import { shipLabel } from "@/lib/status";
import { TopBar, MobileBody } from "@/components/shells";
import { Badge, Button, Card, ErrorText, Field, InfoRow, Loading } from "@/components/ui";

export default function PackingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading, reload } = usePolling(() => getRecord("order", id));
  const [tracking, setTracking] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (isLoading || !order) return <Loading />;

  async function move(to: "packed" | "shipped") {
    if (to === "shipped" && tracking.trim().length < 6) return setError("กรอกเลขพัสดุให้ถูกต้อง");
    setBusy(true);
    setError("");
    try {
      await moveShip(order!, to, tracking.trim().toUpperCase());
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar title={order.orderNo} subtitle="รายละเอียดการแพ็ค" back="/packing" />
      <MobileBody>
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold">สถานะ</p>
            {order.shipStatus && <Badge tone={shipLabel[order.shipStatus].tone}>{shipLabel[order.shipStatus].text}</Badge>}
          </div>
          <InfoRow label="อัปเดตล่าสุด" value={dateTime(order.updatedAt)} />
          {order.tracking && <InfoRow label="เลขพัสดุ" value={order.tracking} />}
        </Card>
        <Card>
          <p className="mb-1 font-semibold">รายการที่ต้องแพ็ค</p>
          {order.items.map((it, i) => (
            <div key={i} className="flex items-center gap-3"><ShirtThumb name={it.name} size="size-10" /><div className="flex-1"><InfoRow label={`${it.name} · สี${it.color}`} value={`ไซซ์ ${it.size} × ${it.qty}`} /></div></div>
          ))}
        </Card>
        <Card>
          <p className="mb-1 font-semibold">ที่อยู่จัดส่ง</p>
          <p className="text-sm">{order.address}</p>
        </Card>
        <ErrorText text={error} />
        {order.shipStatus === "wait_pack" && <Button full size="lg" loading={busy} onClick={() => move("packed")}>แพ็คเสร็จแล้ว</Button>}
        {order.shipStatus === "packed" && (
          <Card className="space-y-3">
            <Field label="เลขพัสดุ" placeholder="เช่น TH1234567890" value={tracking} onChange={(e) => setTracking(e.target.value)} />
            <Button full size="lg" loading={busy} onClick={() => move("shipped")}>ยืนยันจัดส่งแล้ว</Button>
          </Card>
        )}
        {order.shipStatus === "shipped" && <p className="rounded-xl bg-ok-soft p-4 text-center text-sm text-ok">จัดส่งเรียบร้อย ผู้ซื้อได้รับแจ้งเตือนแล้ว</p>}
      </MobileBody>
    </>
  );
}
