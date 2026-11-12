"use client";
// เติมโทเคน: สแกนบัตร -> กรอกจำนวน + เลือกวิธีรับเงิน (เงินสด/โอน) -> ยืนยัน -> สำเร็จ
// บันทึกวิธีรับเงินไว้ เพื่อให้ Admin กระทบยอดเงินสดที่ Staff ต้องส่งคืนได้

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { findTicket, topUp } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { num } from "@/lib/format";
import type { Ticket } from "@/lib/types";
import { TopBar, TabletBody } from "@/components/shells";
import { QrScanner } from "@/components/QrScanner";
import { TicketHolderCard } from "@/components/TicketHolderCard";
import { Button, Card, ErrorText, InfoRow, Modal, TokenPolicy, cx } from "@/components/ui";

const QUICK = [20, 50, 100, 200];

export default function TopUp() {
  const { account } = useAuth();
  const [stage, setStage] = useState<"scan" | "amount" | "done">("scan");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "transfer">("cash");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const value = parseInt(amount, 10) || 0;

  async function handleScan(code: string) {
    setError("");
    const found = await findTicket(code).catch(() => null);
    if (!found) return setError(`ไม่พบบัตร "${code}"`);
    setTicket(found);
    setStage("amount");
  }

  async function confirm() {
    if (!ticket || !account) return;
    setBusy(true);
    try {
      setTicket(await topUp(ticket, value, method, account));
      setConfirmOpen(false);
      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "เติมไม่สำเร็จ");
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setTicket(null);
    setAmount("");
    setMethod("cash");
    setError("");
    setStage("scan");
  }

  return (
    <>
      <TopBar title={stage === "scan" ? "เติมโทเคน · สแกน QR" : "กรอกจำนวนโทเคน"} subtitle="1 โทเคน = 1 บาท" back={stage === "scan" ? "/staff" : undefined} right={stage === "amount" ? <Button size="sm" variant="ghost" onClick={reset}>ยกเลิก</Button> : undefined} />
      <TabletBody className="max-w-3xl">
        {stage === "scan" && (
          <>
            <TokenPolicy />
            <ErrorText text={error} />
            <QrScanner onResult={handleScan} demoCodes={["T-001", "T-002"]} />
          </>
        )}

        {stage === "amount" && ticket && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <TicketHolderCard ticket={ticket} />
              <TokenPolicy />
            </div>
            <div className="space-y-4">
              <Card>
                <p className="mb-2 text-sm font-semibold">จำนวนโทเคนที่ต้องการเติม <span className="text-bad">*</span></p>
                <input
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  className="h-14 w-full rounded-xl border-[1.5px] border-navy px-4 text-2xl font-bold outline-none"
                />
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {QUICK.map((q) => (
                    <button key={q} onClick={() => setAmount(String(q))} className={cx("rounded-xl border py-2.5 text-sm font-semibold", value === q ? "border-navy bg-navy text-white" : "border-line")}>
                      +{q}
                    </button>
                  ))}
                </div>
                <p className="mb-2 mt-4 text-sm font-semibold">ลูกค้าจ่ายเงินด้วย</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["cash", "transfer"] as const).map((m) => (
                    <button key={m} onClick={() => setMethod(m)} className={cx("rounded-xl border py-3 text-sm font-semibold", method === m ? "border-navy bg-navy text-white" : "border-line")}>
                      {m === "cash" ? "เงินสด" : "โอนเข้าบัญชีงาน"}
                    </button>
                  ))}
                </div>
                {method === "transfer" && <p className="mt-2 text-xs text-muted">ให้ลูกค้าสแกน QR บัญชีงาน แล้วเช็กยอดเข้าจากแอปธนาคารของจุดบริการก่อนกดเติม</p>}
              </Card>
              <Card>
                <InfoRow label="ยอดเดิม" value={`${num(ticket.tokens)} โทเคน`} />
                <InfoRow label="เติมเพิ่ม" value={`+${num(value)} โทเคน`} tone="green" />
                <InfoRow label="รับเงิน" value={`${num(value)} บาท (${method === "cash" ? "เงินสด" : "โอน"})`} />
                <InfoRow label="ยอดใหม่" value={`${num(ticket.tokens + value)} โทเคน`} strong />
              </Card>
              <ErrorText text={error} />
              <Button full size="lg" disabled={value <= 0} onClick={() => setConfirmOpen(true)}>ตรวจสอบรายการ</Button>
            </div>
          </div>
        )}

        {stage === "done" && ticket && (
          <div className="space-y-4 rounded-3xl border border-line bg-white p-8 text-center">
            <CheckCircle2 className="mx-auto size-16 text-ok" />
            <h2 className="text-2xl font-bold">เติมโทเคนสำเร็จ</h2>
            <p className="text-muted">{ticket.holderName} · {ticket.ticketNo}</p>
            <p className="text-4xl font-bold">{num(ticket.tokens)} <span className="text-base font-normal text-muted">โทเคน</span></p>
            <p className="text-sm text-muted">รับ{method === "cash" ? "เงินสด" : "โอน"} {num(value)} บาท</p>
            <Button full size="lg" onClick={reset}>เติมให้คนถัดไป</Button>
          </div>
        )}
      </TabletBody>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="ยืนยันการเติมโทเคน"
        footer={
          <>
            <Button loading={busy} onClick={confirm} className="flex-1">ยืนยันเติมโทเคน</Button>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="flex-1">แก้ไข</Button>
          </>
        }
      >
        {ticket && (
          <>
            <InfoRow label="ผู้เข้าร่วม" value={ticket.holderName} />
            <InfoRow label="เลขบัตร" value={ticket.ticketNo} />
            <InfoRow label="เติมเพิ่ม" value={`+${num(value)} โทเคน`} tone="green" />
            <InfoRow label="รับเงิน" value={`${num(value)} บาท · ${method === "cash" ? "เงินสด" : "โอน"}`} />
            <InfoRow label="ยอดใหม่" value={`${num(ticket.tokens + value)} โทเคน`} strong />
            <p className="mt-3 rounded-xl bg-warn-soft p-3 text-xs text-warn">โทเคนแลกคืนเป็นเงินสดไม่ได้ · ใช้ได้เฉพาะภายในงานวันที่ 15 ธ.ค. 2569</p>
          </>
        )}
      </Modal>
    </>
  );
}
