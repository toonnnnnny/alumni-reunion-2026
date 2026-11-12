"use client";
// ตรวจสลิป 1 รายการ: ซ้าย = ข้อมูลคำสั่งซื้อ, ขวา = รูปสลิป + ปุ่มอนุมัติ/ปฏิเสธ
// อนุมัติ -> approveOrder() สร้างบัตร/ตัดสต็อก/แจ้งผู้ซื้อ/แจ้ง Packing

import Link from "next/link";
import { use, useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { getAccount, getRecord } from "@/lib/api";
import { approveOrder, rejectOrder, sendTicketEmail } from "@/lib/actions";
import { usePolling } from "@/lib/usePolling";
import { baht, dateTime } from "@/lib/format";
import { payLabel } from "@/lib/status";
import { AdminFrame } from "@/components/AdminFrame";
import { OrderTimeline } from "@/components/OrderTimeline";
import { Badge, Button, Card, CardTitle, ErrorText, InfoRow, Loading, Modal, TextArea, cx } from "@/components/ui";

const REASONS = ["ยอดเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ", "สลิปไม่ชัด อ่านไม่ได้", "สลิปซ้ำกับคำสั่งซื้ออื่น", "อื่น ๆ"];

export default function PaymentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, reload } = usePolling(async () => {
    const order = await getRecord("order", id);
    const buyer = await getAccount(order.userId);
    return { order, buyer };
  });
  const [modal, setModal] = useState<"" | "approve" | "reject" | "done">("");
  const [reason, setReason] = useState(REASONS[0]);
  const [other, setOther] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(false);
  const [mailText, setMailText] = useState(""); // ผลการส่งอีเมลบัตรล่าสุด
  const [mailBusy, setMailBusy] = useState(false);

  if (isLoading || !data) return <AdminFrame title="ตรวจสอบสลิป" back="/admin/payments"><Loading /></AdminFrame>;
  const { order, buyer } = data;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await reload();
      setModal("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ทำรายการไม่สำเร็จ");
      setModal("");
    } finally {
      setBusy(false);
    }
  }

  const finalReason = reason === "อื่น ๆ" ? other.trim() : reason;

  // ส่งอีเมลบัตรผ่าน Resend แล้วแสดงผลให้ Admin เห็น
  async function sendMail() {
    setMailBusy(true);
    const result = await sendTicketEmail(order.id);
    setMailText(result.ok ? `ส่งอีเมลบัตรถึง ${result.to} แล้ว` : `ส่งอีเมลไม่สำเร็จ: ${result.error}`);
    setMailBusy(false);
    reload();
  }

  // อนุมัติ แล้วถ้าเป็นบัตรให้ส่งอีเมลต่อทันที
  async function approveAndMail() {
    await approveOrder(order);
    if (order.type === "ticket") {
      const result = await sendTicketEmail(order.id);
      setMailText(result.ok ? `ส่งอีเมลบัตรถึง ${result.to} แล้ว` : `ส่งอีเมลไม่สำเร็จ: ${result.error}`);
    }
  }

  return (
    <AdminFrame title={`ตรวจสอบสลิป ${order.orderNo}`} subtitle={`${buyer.name} · ${baht(order.total)}`} back="/admin/payments">
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardTitle right={<Badge tone={payLabel[order.status].tone}>{payLabel[order.status].text}</Badge>}>ข้อมูลคำสั่งซื้อ</CardTitle>
            <InfoRow label="เลขคำสั่งซื้อ" value={order.orderNo} />
            <InfoRow label="ผู้ซื้อ" value={<Link href={`/admin/buyers/${buyer.id}`} className="text-navy underline">{buyer.name}</Link>} />
            <InfoRow label="อีเมล / เบอร์" value={`${buyer.email} · ${buyer.phone}`} />
            <InfoRow label="ส่งสลิปเมื่อ" value={dateTime(order.updatedAt)} />
            {order.type === "ticket" ? (
              order.attendees.map((a, i) => <InfoRow key={i} label={`ผู้เข้าร่วม ${i + 1}`} value={`${a.name} · ${a.email}`} />)
            ) : (
              <>
                {order.items.map((it, i) => <InfoRow key={i} label={`${it.name} (${it.color} · ${it.size}) × ${it.qty}`} value={baht(it.qty * it.price)} />)}
                <InfoRow label="วิธีรับสินค้า" value={order.delivery === "ship" ? "จัดส่ง" : "รับที่หน้างาน"} />
                {order.address && <InfoRow label="ที่อยู่" value={order.address} />}
              </>
            )}
            <InfoRow label="ยอดที่ต้องชำระ" value={baht(order.total)} strong />
            {order.rejectReason && <InfoRow label="เหตุผลที่ปฏิเสธ" value={order.rejectReason} tone="red" />}
          </Card>
          <Card>
            <CardTitle>ลำดับสถานะ</CardTitle>
            <OrderTimeline order={order} />
          </Card>
          {order.type === "ticket" && order.status === "paid" && (
            <Card>
              <CardTitle>อีเมลบัตร (Resend)</CardTitle>
              <p className="text-sm text-muted">
                {order.emailSentAt ? `ส่งแล้วเมื่อ ${dateTime(order.emailSentAt)} ถึง ${buyer.email}` : order.emailError ? `ส่งไม่สำเร็จ: ${order.emailError}` : "ยังไม่ได้ส่ง"}
              </p>
              {mailText && <p className="mt-2 rounded-xl bg-navy-soft p-3 text-sm">{mailText}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" loading={mailBusy} onClick={sendMail}><Mail className="size-4" /> {order.emailSentAt ? "ส่งอีเมลอีกครั้ง" : "ส่งอีเมลบัตร"}</Button>
                <Link href={`/mail/${order.id}`} className="inline-flex min-h-9 items-center rounded-xl px-3 text-sm font-semibold text-navy underline">ดูหน้าตาอีเมล</Link>
              </div>
            </Card>
          )}
        </div>
        <Card>
          <CardTitle>สลิปการโอน</CardTitle>
          <button onClick={() => setZoom(true)} className="block w-full rounded-2xl bg-paper p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={order.slipImage} alt="สลิป" className="mx-auto max-h-[480px] rounded-xl object-contain" />
            <span className="mt-2 block text-xs text-muted">แตะเพื่อดูเต็มจอ</span>
          </button>
          <p className="mt-3 rounded-xl bg-navy-soft p-3 text-sm">ตรวจว่ายอดในสลิป = <b>{baht(order.total)}</b> และชื่อบัญชีปลายทางเป็นของงาน</p>
          <ErrorText text={error} />
          {order.status === "pending_slip" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button variant="danger" onClick={() => setModal("reject")}>ปฏิเสธ</Button>
              <Button variant="success" onClick={() => setModal("approve")}>อนุมัติการชำระเงิน</Button>
            </div>
          )}
        </Card>
      </div>

      <Modal open={modal === "approve"} onClose={() => setModal("")} title="ยืนยันอนุมัติการชำระเงิน"
        footer={<><Button variant="success" loading={busy} onClick={() => run(approveAndMail)} className="flex-1">อนุมัติ</Button><Button variant="outline" onClick={() => setModal("")} className="flex-1">ยกเลิก</Button></>}>
        <p className="text-sm text-muted">
          {order.type === "ticket" ? `ระบบจะสร้างบัตร ${order.attendees.length} ใบ พร้อมโทเคนใบละ 50 และส่งอีเมลบัตรถึงผู้ซื้อ` : order.delivery === "ship" ? "ระบบจะตัดสต็อกเสื้อ และส่งเข้าคิว Packing" : "ระบบจะตัดสต็อกเสื้อ ผู้ซื้อรับเสื้อที่จุด Staff ในวันงาน"}
        </p>
      </Modal>

      <Modal open={modal === "reject"} onClose={() => setModal("")} title="ปฏิเสธการชำระเงิน"
        footer={<><Button variant="danger" disabled={!finalReason} loading={busy} onClick={() => run(() => rejectOrder(order, finalReason))} className="flex-1">ยืนยันปฏิเสธ</Button><Button variant="outline" onClick={() => setModal("")} className="flex-1">ยกเลิก</Button></>}>
        <p className="mb-2 text-sm text-muted">เลือกเหตุผล (ผู้ซื้อจะเห็นข้อความนี้)</p>
        <div className="space-y-2">
          {REASONS.map((r) => (
            <button key={r} onClick={() => setReason(r)} className={cx("w-full rounded-xl border px-4 py-3 text-left text-sm", reason === r ? "border-navy bg-navy-soft font-semibold" : "border-line")}>{r}</button>
          ))}
        </div>
        {reason === "อื่น ๆ" && <div className="mt-3"><TextArea label="ระบุเหตุผล" value={other} onChange={setOther} rows={3} /></div>}
      </Modal>

      <Modal open={modal === "done"} onClose={() => setModal("")}>
        <div className="space-y-3 text-center">
          <CheckCircle2 className="mx-auto size-14 text-ok" />
          <p className="text-lg font-bold">{order.status === "paid" ? "อนุมัติเรียบร้อย" : "ปฏิเสธเรียบร้อย"}</p>
          <p className="text-sm text-muted">แจ้งเตือนผู้ซื้อแล้ว หน้าสถานะของผู้ซื้อจะเปลี่ยนเองภายใน 5 วินาที</p>
          {mailText && <p className="rounded-xl bg-navy-soft p-3 text-sm">{mailText}</p>}
          <Link href="/admin/payments" className="block rounded-xl bg-navy py-3 font-semibold text-white">กลับไปหน้ารายการ</Link>
        </div>
      </Modal>

      {zoom && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setZoom(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.slipImage} alt="สลิป" className="max-h-full max-w-full rounded-xl" />
        </div>
      )}
    </AdminFrame>
  );
}
