"use client";
// ส่งมอบเสื้อ (คำสั่งซื้อแบบรับที่หน้างาน): สแกน/พิมพ์เลขคำสั่งซื้อ -> ตรวจรายการ -> ยืนยันส่งมอบ

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { listRecords } from "@/lib/api";
import { moveShip } from "@/lib/actions";
import { shipLabel } from "@/lib/status";
import type { Order } from "@/lib/types";
import { TopBar, TabletBody } from "@/components/shells";
import { QrScanner } from "@/components/QrScanner";
import { Badge, Button, Card, ErrorText, InfoRow } from "@/components/ui";

export default function Pickup() {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleScan(code: string) {
    setError("");
    const orders = await listRecords("order").catch(() => []);
    const found = orders.find((o) => o.orderNo.toUpperCase() === code.trim().toUpperCase() && o.type === "shirt");
    if (!found) return setError(`ไม่พบคำสั่งซื้อเสื้อ "${code}"`);
    setOrder(found);
  }

  async function handOver() {
    if (!order) return;
    setBusy(true);
    try {
      await moveShip(order, "picked");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setOrder(null);
    setDone(false);
    setError("");
  }

  // เหตุผลที่ส่งมอบไม่ได้
  const problem = !order ? "" : order.status !== "paid" ? "คำสั่งซื้อนี้ยังไม่ได้ชำระเงิน / Admin ยังไม่อนุมัติ" : order.delivery !== "pickup" ? "คำสั่งซื้อนี้เป็นแบบจัดส่ง ไม่ได้รับที่หน้างาน" : order.shipStatus === "picked" ? "ส่งมอบไปแล้ว" : "";

  return (
    <>
      <TopBar title="ส่งมอบเสื้อ" subtitle="คำสั่งซื้อแบบรับที่หน้างาน" back="/staff" />
      <TabletBody className="max-w-2xl">
        {!order && (
          <>
            <ErrorText text={error} />
            <QrScanner onResult={handleScan} manualLabel="กรอกเลขคำสั่งซื้อ" manualPlaceholder="เช่น ORD-240005" />
          </>
        )}
        {order && !done && (
          <>
            <Card>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-lg font-bold">{order.orderNo}</p>
                {order.shipStatus && <Badge tone={shipLabel[order.shipStatus].tone}>{shipLabel[order.shipStatus].text}</Badge>}
              </div>
              {order.items.map((it, i) => (
                <InfoRow key={i} label={`${it.name} · ${it.color}`} value={`ไซซ์ ${it.size} × ${it.qty}`} />
              ))}
            </Card>
            <ErrorText text={problem || error} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={reset}>ค้นหาใหม่</Button>
              <Button disabled={!!problem} loading={busy} onClick={handOver}>ยืนยันส่งมอบเสื้อ</Button>
            </div>
          </>
        )}
        {done && order && (
          <div className="space-y-4 rounded-3xl border border-line bg-white p-8 text-center">
            <CheckCircle2 className="mx-auto size-16 text-ok" />
            <h2 className="text-2xl font-bold">ส่งมอบเสื้อแล้ว</h2>
            <p className="text-muted">{order.orderNo}</p>
            <Button full onClick={reset}>คำสั่งซื้อถัดไป</Button>
          </div>
        )}
      </TabletBody>
    </>
  );
}
