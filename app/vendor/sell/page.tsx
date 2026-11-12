"use client";
// ขายสินค้าด้วยโทเคน: เลือกเมนู -> สแกน QR ลูกค้า -> ตรวจยอด -> ยืนยันตัดโทเคน -> ใบเสร็จ
// ถ้าโทเคนไม่พอ แสดงหน้าแจ้ง พร้อมบอกให้ลูกค้าไปเติมที่จุด Staff

import { useState } from "react";
import { CheckCircle2, Minus, Plus, XCircle } from "lucide-react";
import { findTicket, sell } from "@/lib/actions";
import { useMyShop } from "@/lib/useMyShop";
import { num } from "@/lib/format";
import type { Ticket } from "@/lib/types";
import { TopBar, TabletBody } from "@/components/shells";
import { QrScanner } from "@/components/QrScanner";
import { TicketHolderCard } from "@/components/TicketHolderCard";
import { Button, Card, ErrorText, InfoRow, Loading, Tabs, cx } from "@/components/ui";

type Stage = "menu" | "scan" | "confirm" | "done";

export default function Sell() {
  const { data: shop, isLoading } = useMyShop();
  const [stage, setStage] = useState<Stage>("menu");
  const [qty, setQty] = useState<Record<string, number>>({}); // menuId -> จำนวน
  const [category, setCategory] = useState("ทั้งหมด");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [txNo, setTxNo] = useState("");

  if (isLoading || !shop) return <Loading />;

  const menu = shop.menu.filter((m) => m.active);
  const categories = ["ทั้งหมด", ...Array.from(new Set(menu.map((m) => m.category)))];
  const shown = category === "ทั้งหมด" ? menu : menu.filter((m) => m.category === category);
  const items = menu.filter((m) => (qty[m.id] ?? 0) > 0).map((m) => ({ name: m.name, qty: qty[m.id], price: m.price }));
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);

  function change(id: string, diff: number) {
    setQty((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + diff) }));
  }

  async function handleScan(code: string) {
    setError("");
    const found = await findTicket(code).catch(() => null);
    if (!found) return setError(`ไม่พบบัตร "${code}"`);
    setTicket(found);
    setStage("confirm");
  }

  async function confirm() {
    if (!ticket || !shop) return;
    setBusy(true);
    setError("");
    try {
      const result = await sell(ticket, shop, items);
      setTicket(result.ticket);
      setTxNo(result.txNo);
      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ตัดโทเคนไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setQty({});
    setTicket(null);
    setError("");
    setStage("menu");
  }

  const enough = ticket ? ticket.tokens >= total : false;

  return (
    <>
      <TopBar
        title={stage === "menu" ? "เลือกสินค้า" : stage === "scan" ? "สแกน QR ลูกค้า" : stage === "confirm" ? "ยืนยันการชำระ" : "ชำระสำเร็จ"}
        subtitle={shop.name}
        back={stage === "menu" ? "/vendor" : undefined}
        right={stage === "scan" || stage === "confirm" ? <Button size="sm" variant="ghost" onClick={() => setStage("menu")}>แก้รายการ</Button> : undefined}
      />
      <TabletBody>
        {stage === "menu" && (
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              <Tabs value={category} onChange={setCategory} tabs={categories.map((c) => ({ value: c, label: c }))} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {shown.map((m) => {
                  const n = qty[m.id] ?? 0;
                  return (
                    <div key={m.id} className={cx("rounded-2xl border bg-white p-4", n > 0 ? "border-navy" : "border-line")}>
                      <button onClick={() => change(m.id, 1)} className="w-full text-left">
                        <p className="font-semibold">{m.name}</p>
                        <p className="text-sm text-muted">{m.price} โทเคน</p>
                      </button>
                      <div className="mt-3 flex items-center justify-between">
                        <button onClick={() => change(m.id, -1)} disabled={n === 0} className="grid size-9 place-items-center rounded-lg bg-gray-100 disabled:opacity-30"><Minus className="size-4" /></button>
                        <span className="font-bold">{n}</span>
                        <button onClick={() => change(m.id, 1)} className="grid size-9 place-items-center rounded-lg bg-navy text-white"><Plus className="size-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <Card className="h-fit lg:sticky lg:top-24">
              <p className="mb-2 font-semibold">รายการที่เลือก</p>
              {items.length === 0 && <p className="py-4 text-sm text-muted">แตะสินค้าเพื่อเพิ่ม</p>}
              {items.map((i) => (
                <InfoRow key={i.name} label={`${i.name} × ${i.qty}`} value={`${i.qty * i.price}`} />
              ))}
              <InfoRow label="รวม" value={`${num(total)} โทเคน`} strong />
              <Button full size="lg" className="mt-3" disabled={total === 0} onClick={() => setStage("scan")}>สแกน QR ลูกค้า</Button>
            </Card>
          </div>
        )}

        {stage === "scan" && (
          <div className="mx-auto max-w-2xl space-y-4">
            <p className="text-center text-lg">ยอดที่ต้องชำระ <b>{num(total)} โทเคน</b></p>
            <ErrorText text={error} />
            <QrScanner onResult={handleScan} demoCodes={["T-001", "T-002"]} />
          </div>
        )}

        {stage === "confirm" && ticket && (
          <div className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-2">
            <TicketHolderCard ticket={ticket} />
            <div className="space-y-4">
              <Card>
                {items.map((i) => <InfoRow key={i.name} label={`${i.name} × ${i.qty}`} value={`${i.qty * i.price} โทเคน`} />)}
                <InfoRow label="ยอดชำระ" value={`${num(total)} โทเคน`} strong />
                <InfoRow label="คงเหลือหลังชำระ" value={`${num(ticket.tokens - total)} โทเคน`} tone={enough ? "green" : "red"} />
              </Card>
              {!enough && (
                <div className="rounded-2xl bg-bad-soft p-5 text-bad">
                  <p className="flex items-center gap-2 font-semibold"><XCircle className="size-5" /> โทเคนไม่เพียงพอ</p>
                  <p className="text-sm">ขาดอีก {num(total - ticket.tokens)} โทเคน ให้ลูกค้าไปเติมที่จุดบริการ Staff หรือลดรายการ</p>
                </div>
              )}
              <ErrorText text={error} />
              <Button full size="lg" disabled={!enough} loading={busy} onClick={confirm}>ยืนยันตัดโทเคน</Button>
            </div>
          </div>
        )}

        {stage === "done" && ticket && (
          <div className="mx-auto max-w-lg space-y-4 rounded-3xl border border-line bg-white p-8 text-center">
            <CheckCircle2 className="mx-auto size-16 text-ok" />
            <h2 className="text-2xl font-bold">ชำระโทเคนสำเร็จ</h2>
            <p className="text-muted">{txNo} · {ticket.holderName} ({ticket.ticketNo})</p>
            <p className="text-4xl font-bold">-{num(total)} <span className="text-base font-normal text-muted">โทเคน</span></p>
            <p className="text-sm text-muted">โทเคนคงเหลือของลูกค้า {num(ticket.tokens)}</p>
            <Button full size="lg" onClick={reset}>ขายรายการใหม่</Button>
          </div>
        )}
      </TabletBody>
    </>
  );
}
