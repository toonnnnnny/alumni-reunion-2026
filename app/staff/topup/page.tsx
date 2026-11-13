"use client";
// เติมโทเคน: สแกนบัตร -> กรอกจำนวน -> ลูกค้าสแกน QR โอนเข้าบัญชีของงาน (Admin) -> Staff ตรวจหน้าจอโอนสำเร็จ -> ยืนยัน
// ไม่รับเงินสด ทุกรายการบันทึกเป็น "โอน" ให้ Admin กระทบยอดกับบัญชีธนาคารได้

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { findTicket, topUp } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { num } from "@/lib/format";
import type { Ticket } from "@/lib/types";
import { TopBar, TabletBody } from "@/components/shells";
import { QrScanner } from "@/components/QrScanner";
import { PayQrCard } from "@/components/PayQrCard";
import { TicketHolderCard } from "@/components/TicketHolderCard";
import { Button, Card, ErrorText, InfoRow, Modal, TokenPolicy, cx } from "@/components/ui";

const QUICK = [20, 50, 100, 200];

export default function TopUp() {
  const { account } = useAuth();
  const [stage, setStage] = useState<"scan" | "amount" | "done">("scan");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [amount, setAmount] = useState("");
  const [slipChecked, setSlipChecked] = useState(false); // Staff ตรวจหน้าจอโอนสำเร็จบนมือถือลูกค้าแล้ว
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
      setTicket(await topUp(ticket, value, "transfer", account));
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
    setSlipChecked(false);
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
                <p className="mt-3 text-xs text-muted">ไม่รับเงินสด · ลูกค้าโอนเข้าบัญชีของงานผ่าน QR ด้านล่างเท่านั้น</p>
              </Card>
              {value > 0 && <PayQrCard amount={value} size={180} />}
              <label className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 text-sm">
                <input type="checkbox" checked={slipChecked} onChange={(e) => setSlipChecked(e.target.checked)} className="mt-0.5 size-5 accent-[var(--color-navy)]" />
                <span>ตรวจหน้าจอโอนสำเร็จบนมือถือลูกค้าแล้ว ชื่อบัญชีปลายทางเป็น ALUMNI REUNION 2026 และยอดตรงกับที่เติม</span>
              </label>
              <Card>
                <InfoRow label="ยอดเดิม" value={`${num(ticket.tokens)} โทเคน`} />
                <InfoRow label="เติมเพิ่ม" value={`+${num(value)} โทเคน`} tone="green" />
                <InfoRow label="ลูกค้าโอน" value={`${num(value)} บาท`} />
                <InfoRow label="ยอดใหม่" value={`${num(ticket.tokens + value)} โทเคน`} strong />
              </Card>
              <ErrorText text={error} />
              <Button full size="lg" disabled={value <= 0 || !slipChecked} onClick={() => setConfirmOpen(true)}>ตรวจสอบรายการ</Button>
            </div>
          </div>
        )}

        {stage === "done" && ticket && (
          <div className="space-y-4 rounded-3xl border border-line bg-white p-8 text-center">
            <CheckCircle2 className="mx-auto size-16 text-ok" />
            <h2 className="text-2xl font-bold">เติมโทเคนสำเร็จ</h2>
            <p className="text-muted">{ticket.holderName} · {ticket.ticketNo}</p>
            <p className="text-4xl font-bold">{num(ticket.tokens)} <span className="text-base font-normal text-muted">โทเคน</span></p>
            <p className="text-sm text-muted">ลูกค้าโอนเข้าบัญชีของงาน {num(value)} บาท</p>
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
            <InfoRow label="ลูกค้าโอน" value={`${num(value)} บาท · เข้าบัญชีของงาน`} />
            <InfoRow label="ยอดใหม่" value={`${num(ticket.tokens + value)} โทเคน`} strong />
            <p className="mt-3 rounded-xl bg-warn-soft p-3 text-xs text-warn">โทเคนแลกคืนเป็นเงินสดไม่ได้ · ใช้ได้เฉพาะภายในงานวันที่ 15 ธ.ค. 2569</p>
          </>
        )}
      </Modal>
    </>
  );
}
