"use client";
// เช็กอินเข้างาน: สแกน QR (หรือพิมพ์เลขบัตร) -> ดูข้อมูล -> ยืนยันเช็กอิน
// สถานะหน้า: scan -> found -> done (สแกนซ้ำ บัตรที่เช็กอินแล้วจะเช็กอินไม่ได้)

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { checkIn, findTicket } from "@/lib/actions";
import { dateTime } from "@/lib/format";
import type { Ticket } from "@/lib/types";
import { TopBar, TabletBody } from "@/components/shells";
import { QrScanner } from "@/components/QrScanner";
import { TicketHolderCard } from "@/components/TicketHolderCard";
import { Banner, Button, ErrorText } from "@/components/ui";

type Stage = "scan" | "found" | "done";

export default function CheckIn() {
  const [stage, setStage] = useState<Stage>("scan");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // สแกนได้ -> หาบัตร
  async function handleScan(code: string) {
    setError("");
    const found = await findTicket(code).catch(() => null);
    if (!found) {
      setError(`ไม่พบบัตร "${code}" ลองสแกนใหม่หรือพิมพ์เลขบัตร`);
      setStage("scan");
      return;
    }
    setTicket(found);
    setStage("found");
  }

  async function confirm() {
    if (!ticket) return;
    setBusy(true);
    try {
      setTicket(await checkIn(ticket));
      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "เช็กอินไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setTicket(null);
    setError("");
    setStage("scan");
  }

  return (
    <>
      <TopBar title="เช็กอินเข้างาน" subtitle="สแกน QR Code บนบัตรของผู้เข้าร่วม" back="/staff" />
      <TabletBody className="max-w-2xl">
        {stage === "scan" && (
          <>
            <ErrorText text={error} />
            <QrScanner onResult={handleScan} demoCodes={["T-001", "T-002"]} />
          </>
        )}

        {stage === "found" && ticket && (
          <>
            <TicketHolderCard ticket={ticket} />
            {ticket.checkedIn ? (
              <div className="rounded-2xl bg-bad-soft p-5 text-bad">
                <p className="flex items-center gap-2 font-semibold"><XCircle className="size-5" /> บัตรนี้เช็กอินแล้ว</p>
                <p className="text-sm">เมื่อ {dateTime(ticket.checkinAt)} · ห้ามให้เข้างานซ้ำ ถ้าลูกค้ายืนยันว่ายังไม่เคยเข้า ให้แจ้งปัญหาถึง Admin</p>
              </div>
            ) : (
              <Banner>ตรวจชื่อกับลูกค้าให้ตรงก่อนกดยืนยัน</Banner>
            )}
            <ErrorText text={error} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={reset}>สแกนใบอื่น</Button>
              <Button disabled={ticket.checkedIn} loading={busy} onClick={confirm}>ยืนยันเช็กอิน</Button>
            </div>
          </>
        )}

        {stage === "done" && ticket && (
          <div className="space-y-4 rounded-3xl border border-line bg-white p-8 text-center">
            <CheckCircle2 className="mx-auto size-16 text-ok" />
            <h2 className="text-2xl font-bold">เช็กอินสำเร็จ</h2>
            <p className="text-muted">{ticket.holderName} · {ticket.ticketNo} · {dateTime(ticket.checkinAt)}</p>
            <Button full size="lg" onClick={reset}>สแกนคนถัดไป</Button>
          </div>
        )}
      </TabletBody>
    </>
  );
}
