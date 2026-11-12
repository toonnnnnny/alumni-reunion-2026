"use client";
// สถานะคำสั่งซื้อ: ดึงข้อมูลทุก 5 วินาที พอ Admin อนุมัติ/ปฏิเสธ หน้านี้เปลี่ยนเอง
// ปฏิเสธ -> แสดงเหตุผล + อัปโหลดสลิปใหม่

import Link from "next/link";
import { use, useState } from "react";
import { CheckCircle2, Clock3, Mail, XCircle } from "lucide-react";
import { getRecord } from "@/lib/api";
import { resubmitSlip } from "@/lib/actions";
import { usePolling } from "@/lib/usePolling";
import { baht, dateTime } from "@/lib/format";
import { payLabel, shipLabel } from "@/lib/status";
import { TopBar, MobileBody } from "@/components/shells";
import { OrderTimeline } from "@/components/OrderTimeline";
import { SlipPicker } from "@/components/SlipPicker";
import { Badge, Button, ButtonLink, Card, ErrorText, InfoRow, Loading } from "@/components/ui";

export default function OrderStatus({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading, error, reload } = usePolling(() => getRecord("order", id));
  const [newSlip, setNewSlip] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  async function sendNewSlip() {
    if (!order || !newSlip) return;
    setSending(true);
    setSendError("");
    try {
      await resubmitSlip(order, newSlip);
      setNewSlip("");
      await reload();
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "ส่งไม่สำเร็จ");
    } finally {
      setSending(false);
    }
  }

  if (isLoading) return <Loading />;
  if (!order) return <MobileBody><ErrorText text={error || "ไม่พบคำสั่งซื้อ"} /></MobileBody>;

  const head = {
    pending_slip: { icon: <Clock3 className="size-8" />, color: "bg-warn text-white", ring: "bg-warn-soft", title: "รอตรวจสอบสลิป", desc: "Admin กำลังตรวจสอบการชำระเงิน หน้านี้จะอัปเดตเอง" },
    paid: { icon: <CheckCircle2 className="size-8" />, color: "bg-ok text-white", ring: "bg-ok-soft", title: "ชำระเงินสำเร็จ", desc: order.type === "ticket" ? "บัตรพร้อมใช้งาน ส่ง QR Code ทางอีเมลแล้ว" : "ได้รับคำสั่งซื้อเสื้อแล้ว" },
    rejected: { icon: <XCircle className="size-8" />, color: "bg-bad text-white", ring: "bg-bad-soft", title: "ชำระเงินไม่ผ่าน", desc: "กรุณาอัปโหลดสลิปใหม่" },
  }[order.status];

  return (
    <>
      <TopBar title="สถานะคำสั่งซื้อ" subtitle={order.orderNo} back="/user/orders" />
      <MobileBody>
        <Card className="text-center">
          <div className={`mx-auto grid size-20 place-items-center rounded-full ${head.ring}`}>
            <div className={`grid size-14 place-items-center rounded-full ${head.color}`}>{head.icon}</div>
          </div>
          <h2 className="mt-3 text-xl font-bold">{head.title}</h2>
          <p className="text-sm text-muted">{head.desc}</p>
          <p className="mt-2 text-2xl font-bold">{baht(order.total)}</p>
        </Card>

        {order.status === "rejected" && (
          <Card>
            <p className="font-semibold text-bad">เหตุผลจาก Admin</p>
            <p className="mt-1 text-sm">{order.rejectReason}</p>
            <div className="mt-4 space-y-3">
              <SlipPicker value={newSlip} onChange={setNewSlip} title="อัปโหลดสลิปใหม่" />
              <ErrorText text={sendError} />
              <Button full disabled={!newSlip} loading={sending} onClick={sendNewSlip}>ส่งสลิปใหม่</Button>
            </div>
          </Card>
        )}

        <Card>
          <p className="mb-3 font-semibold">ลำดับสถานะ</p>
          <OrderTimeline order={order} />
        </Card>

        <Card>
          <InfoRow label="เลขคำสั่งซื้อ" value={order.orderNo} />
          <InfoRow label="ประเภท" value={order.type === "ticket" ? `บัตรเข้างาน × ${order.attendees.length}` : "เสื้อรุ่น"} />
          <InfoRow label="สั่งซื้อเมื่อ" value={dateTime(order.createdAt)} />
          <InfoRow label="สถานะชำระเงิน" value={<Badge tone={payLabel[order.status].tone}>{payLabel[order.status].text}</Badge>} />
          {order.shipStatus && <InfoRow label="สถานะเสื้อ" value={<Badge tone={shipLabel[order.shipStatus].tone}>{shipLabel[order.shipStatus].text}</Badge>} />}
          {order.items.map((it, i) => (
            <InfoRow key={i} label={`${it.name} (${it.color} · ${it.size}) × ${it.qty}`} value={baht(it.qty * it.price)} />
          ))}
          {order.delivery === "ship" && <InfoRow label="ที่อยู่จัดส่ง" value={order.address} />}
          {order.delivery === "pickup" && <InfoRow label="รับสินค้า" value="รับที่จุดบริการหน้างาน แสดงเลขคำสั่งซื้อนี้กับ Staff" />}
        </Card>

        {order.status === "paid" && order.type === "ticket" && (
          <div className="grid gap-2">
            <ButtonLink href="/user/qr" full>ดูบัตรและ QR Code</ButtonLink>
            <ButtonLink href={`/mail/${order.id}`} variant="outline" full><Mail className="size-4" /> ดูอีเมลที่ส่งถึงคุณ</ButtonLink>
          </div>
        )}
        <p className="text-center text-xs text-muted">
          <Link href="/user/orders" className="underline">ดูคำสั่งซื้อทั้งหมด</Link>
        </p>
      </MobileBody>
    </>
  );
}
