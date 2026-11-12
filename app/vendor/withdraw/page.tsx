"use client";
// ถอนเงินของร้าน (วันละ 1 ครั้ง นับถอยหลัง 24 ชม. หลังส่งคำขอ)
// flow: กรอกจำนวน -> ส่งคำขอ -> รอ Admin โอน (หน้านี้รอเอง ไม่ต้องกดรีเฟรช) -> Admin กดเสร็จ -> หน้าเปลี่ยนเป็น "ถอนเงินสำเร็จ"

import { useEffect, useState } from "react";
import { CheckCircle2, Hourglass } from "lucide-react";
import { listRecords } from "@/lib/api";
import { nextWithdrawAt, requestWithdraw } from "@/lib/actions";
import { useMyShop } from "@/lib/useMyShop";
import { useAuth } from "@/lib/auth";
import { usePolling } from "@/lib/usePolling";
import { countdown, dateTime, num } from "@/lib/format";
import type { Withdrawal } from "@/lib/types";
import { TopBar, TabletBody } from "@/components/shells";
import { Banner, Button, ButtonLink, Card, ErrorText, InfoRow, Loading } from "@/components/ui";

export default function Withdraw() {
  const { data: shop, reload: reloadShop } = useMyShop();
  const { account } = useAuth();
  const { data, reload } = usePolling(async () =>
    (await listRecords("withdrawal")).filter((w) => w.shopId === account?.shopId).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
  );
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  // นาฬิกาสำหรับนับถอยหลัง อัปเดตทุก 1 วินาที
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!shop || !data) return <Loading />;

  const history = data;
  const latest: Withdrawal | undefined = history[0];
  const nextAt = nextWithdrawAt(history);
  const left = nextAt ? nextAt - now : 0;
  const value = parseInt(amount, 10) || 0;

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await requestWithdraw(shop!, value);
      setAmount("");
      await Promise.all([reload(), reloadShop()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ส่งคำขอไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  // เลือกว่าจะแสดงหน้าไหน: มีคำขอที่ยังไม่ครบ 24 ชม. -> แสดงสถานะคำขอนั้น, ไม่งั้นแสดงฟอร์ม
  const showStatus = latest && left > 0;
  const cooldownText = `ถอนได้วันละ 1 ครั้ง · ถอนครั้งถัดไปได้ใน ${countdown(left)}`;

  return (
    <>
      <TopBar title={showStatus ? (latest.status === "pending" ? "รอ Admin ดำเนินการ" : "ถอนเงินสำเร็จ") : "ถอนเงิน"} subtitle={showStatus ? latest.wdNo : `ร้าน ${shop.name}`} back="/vendor" />
      <TabletBody>
        {showStatus ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="text-center">
              <div className={`mx-auto grid size-24 place-items-center rounded-full ${latest.status === "pending" ? "bg-warn-soft" : "bg-ok-soft"}`}>
                <div className={`grid size-16 place-items-center rounded-full text-white ${latest.status === "pending" ? "bg-warn" : "bg-ok"}`}>
                  {latest.status === "pending" ? <Hourglass className="size-8" /> : <CheckCircle2 className="size-8" />}
                </div>
              </div>
              <h2 className={`mt-4 text-2xl font-bold ${latest.status === "pending" ? "text-warn" : "text-ok"}`}>{latest.status === "pending" ? "รอ Admin ดำเนินการ" : "ถอนเงินสำเร็จ"}</h2>
              <p className="text-sm text-muted">{latest.status === "pending" ? "ส่งคำขอให้ Admin แล้ว · รอโอนเงินเข้าบัญชีร้าน" : "Admin โอนเงินเข้าบัญชีร้านเรียบร้อยแล้ว"}</p>
              <p className={`mt-3 text-5xl font-bold ${latest.status === "pending" ? "text-warn" : "text-ok"}`}>{num(latest.amount)} <span className="text-base font-normal text-muted">บาท</span></p>
            </Card>
            <div className="space-y-4">
              <Card>
                <p className="mb-1 font-semibold">{latest.status === "pending" ? "รายละเอียดคำขอถอนเงิน" : "รายละเอียดการถอนเงิน"}</p>
                <InfoRow label="เลขคำขอ" value={latest.wdNo} />
                <InfoRow label="โอนเข้าบัญชี" value={`${latest.bankName} · ${latest.bankAccount}`} />
                <InfoRow label="ส่งคำขอเมื่อ" value={dateTime(latest.requestedAt)} />
                {latest.status === "pending" ? <InfoRow label="สถานะ" value="รอ Admin โอนเงิน" tone="amber" /> : <InfoRow label="โอนเมื่อ" value={dateTime(latest.doneAt)} />}
                <InfoRow label={latest.status === "pending" ? "จำนวนที่ขอถอน" : "จำนวนที่โอน"} value={`${num(latest.amount)} บาท`} strong />
                <InfoRow label={latest.status === "pending" ? "โทเคนที่ถูกกันไว้" : "โทเคนคงเหลือของร้าน"} value={`${num(latest.status === "pending" ? latest.amount : shop.balance)} โทเคน`} tone={latest.status === "pending" ? "amber" : "green"} />
              </Card>
              <Banner>{cooldownText}</Banner>
              <ButtonLink href="/vendor" variant="outline" full>กลับหน้าหลัก</ButtonLink>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <Card>
                <p className="text-sm text-muted">โทเคนคงเหลือของร้าน (ถอนได้)</p>
                <p className="mt-1 flex items-baseline gap-2"><span className="text-5xl font-bold text-navy">{num(shop.balance)}</span><span className="text-muted">โทเคน</span></p>
                <p className="mt-2 text-sm text-muted">1 โทเคน = 1 บาท · ถอนได้สูงสุด {num(shop.balance)} บาท</p>
              </Card>
              <Card>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">บัญชีรับเงิน</p>
                  <p className="text-xs text-muted">ตั้งค่าโดย Admin · แก้ไขไม่ได้</p>
                </div>
                <p className="mt-2 text-xl font-semibold text-navy">{shop.bankName} · {shop.bankAccount}</p>
                <p className="text-sm text-muted">ชื่อบัญชี {shop.bankAccountName}</p>
              </Card>
            </div>
            <div className="space-y-4">
              <Card>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">จำนวนที่ต้องการถอน</p>
                  <button onClick={() => setAmount(String(shop.balance))} className="text-sm font-semibold text-navy">ถอนทั้งหมด</button>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-xl border-[1.5px] border-navy bg-gray-50 px-4">
                  <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} placeholder="0" className="h-14 min-w-0 flex-1 bg-transparent text-3xl font-bold text-navy outline-none" />
                  <span className="text-muted">โทเคน</span>
                </div>
                <p className="mt-2 text-xs text-muted">กรอกได้ 1 – {num(shop.balance)} โทเคน · จะได้รับเงิน {num(value)} บาท · โทเคนส่วนนี้ถูกกันไว้จนกว่า Admin โอนเสร็จ</p>
              </Card>
              <Banner>ถอนได้วันละ 1 ครั้ง · หลังส่งคำขอ ถอนครั้งถัดไปได้ใน 24 ชม.</Banner>
              <ErrorText text={error} />
              <Button full size="lg" disabled={value <= 0 || value > shop.balance} loading={busy} onClick={submit}>ส่งคำขอถอนเงิน</Button>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <Card>
            <p className="mb-1 font-semibold">ประวัติการถอน</p>
            {history.map((w) => (
              <InfoRow key={w.id} label={`${w.wdNo} · ${dateTime(w.requestedAt)}`} value={`${num(w.amount)} บาท · ${w.status === "pending" ? "รอโอน" : "โอนแล้ว"}`} tone={w.status === "pending" ? "amber" : "green"} />
            ))}
          </Card>
        )}
      </TabletBody>
    </>
  );
}
