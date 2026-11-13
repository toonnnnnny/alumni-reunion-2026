"use client";
// สถานะคำสั่งซื้อ: ดึงข้อมูลทุก 5 วินาที พอ Admin อนุมัติ/ปฏิเสธ หน้านี้เปลี่ยนเอง
// ปฏิเสธ -> แสดงเหตุผล + อัปโหลดสลิปใหม่

import Link from "next/link";
import { use, useState } from "react";
import { CheckCircle2, Clock3, Mail, XCircle } from "lucide-react";
// getRecord = ดึงคำสั่งซื้อ 1 รายการ
import { getRecord } from "@/lib/api";
// resubmitSlip = ส่งสลิปใหม่ (อยู่ใน lib/actions.ts)
import { resubmitSlip } from "@/lib/actions";
import { usePolling } from "@/lib/usePolling";
import { baht, dateTime } from "@/lib/format";
import { payLabel, shipLabel } from "@/lib/status";
import { TopBar, MobileBody } from "@/components/shells";
// OrderTimeline = เส้นลำดับสถานะ
import { OrderTimeline } from "@/components/OrderTimeline";
// SlipPicker = ช่องเลือกรูปสลิป
import { SlipPicker } from "@/components/SlipPicker";
import { Badge, Button, ButtonLink, Card, ErrorText, InfoRow, Loading } from "@/components/ui";

// หน้า /user/orders/[id]
export default function OrderStatus({ params }: { params: Promise<{ id: string }> }) {
  // รหัสคำสั่งซื้อจาก URL
  const { id } = use(params);
  // ดึงคำสั่งซื้อนี้ทุก 5 วินาที -> แอดมินกดอนุมัติ/ปฏิเสธ หน้านี้เปลี่ยนเองไม่ต้องรีเฟรช
  const { data: order, isLoading, error, reload } = usePolling(() => getRecord("order", id));
  // รูปสลิปใหม่ (ใช้ตอนโดนปฏิเสธ)
  const [newSlip, setNewSlip] = useState("");
  // กำลังส่งสลิปใหม่
  const [sending, setSending] = useState(false);
  // error ตอนส่งสลิปใหม่
  const [sendError, setSendError] = useState("");

  // กดส่งสลิปใหม่
  async function sendNewSlip() {
    // ยังไม่มีสลิป -> ไม่ทำ
    if (!order || !newSlip) return;
    setSending(true);
    setSendError("");
    try {
      // อัปเดตคำสั่งซื้อ: สถานะกลับเป็นรอตรวจ + ใส่สลิปใหม่ + แจ้งแอดมิน (PUT /records/id)
      await resubmitSlip(order, newSlip);
      // ล้างรูปในช่อง
      setNewSlip("");
      // โหลดข้อมูลใหม่ทันที ไม่ต้องรอ 5 วินาที
      await reload();
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "ส่งไม่สำเร็จ");
    } finally {
      setSending(false);
    }
  }

  // ยังโหลดอยู่ -> วงหมุน
  if (isLoading) return <Loading />;
  // ไม่เจอ -> error
  if (!order) return <MobileBody><ErrorText text={error || "ไม่พบคำสั่งซื้อ"} /></MobileBody>;

  // เลือกหัวการ์ด (ไอคอน สี ข้อความ) ตามสถานะ
  const head = {
    // รอตรวจ = นาฬิกา สีส้ม
    pending_slip: { icon: <Clock3 className="size-8" />, color: "bg-warn text-white", ring: "bg-warn-soft", title: "รอตรวจสอบสลิป", desc: "Admin กำลังตรวจสอบการชำระเงิน หน้านี้จะอัปเดตเอง" },
    // จ่ายสำเร็จ = เครื่องหมายถูก สีเขียว
    paid: { icon: <CheckCircle2 className="size-8" />, color: "bg-ok text-white", ring: "bg-ok-soft", title: "ชำระเงินสำเร็จ", desc: order.type === "ticket" ? "บัตรพร้อมใช้งาน ส่ง QR Code ทางอีเมลแล้ว" : "ได้รับคำสั่งซื้อเสื้อแล้ว" },
    // โดนปฏิเสธ = กากบาท สีแดง
    rejected: { icon: <XCircle className="size-8" />, color: "bg-bad text-white", ring: "bg-bad-soft", title: "ชำระเงินไม่ผ่าน", desc: "กรุณาอัปโหลดสลิปใหม่" },
  // [order.status] = หยิบอันที่ตรงกับสถานะตอนนี้
  }[order.status];

  return (
    // ส่วนหน้าตา
    <>
      <TopBar title="สถานะคำสั่งซื้อ" subtitle={order.orderNo} back="/user/orders" />
      <MobileBody>
        {/* การ์ดหัว: ไอคอนวงกลม + ชื่อสถานะ + คำอธิบาย + ยอดเงิน */}
        <Card className="text-center">
          <div className={`mx-auto grid size-20 place-items-center rounded-full ${head.ring}`}>
            <div className={`grid size-14 place-items-center rounded-full ${head.color}`}>{head.icon}</div>
          </div>
          <h2 className="mt-3 text-xl font-bold">{head.title}</h2>
          <p className="text-sm text-muted">{head.desc}</p>
          <p className="mt-2 text-2xl font-bold">{baht(order.total)}</p>
        </Card>

        {/* โดนปฏิเสธ -> แสดงเหตุผลจากแอดมิน + ช่องอัปสลิปใหม่ + ปุ่มส่ง */}
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

        {/* เส้นลำดับสถานะ */}
        <Card>
          <p className="mb-3 font-semibold">ลำดับสถานะ</p>
          <OrderTimeline order={order} />
        </Card>

        {/* รายละเอียด: เลขคำสั่งซื้อ ประเภท วันที่ สถานะ */}
        <Card>
          <InfoRow label="เลขคำสั่งซื้อ" value={order.orderNo} />
          <InfoRow label="ประเภท" value={order.type === "ticket" ? `บัตรเข้างาน × ${order.attendees.length}` : "เสื้อรุ่น"} />
          <InfoRow label="สั่งซื้อเมื่อ" value={dateTime(order.createdAt)} />
          <InfoRow label="สถานะชำระเงิน" value={<Badge tone={payLabel[order.status].tone}>{payLabel[order.status].text}</Badge>} />
          {/* ถ้าเป็นเสื้อ: สถานะการส่ง */}
          {order.shipStatus && <InfoRow label="สถานะเสื้อ" value={<Badge tone={shipLabel[order.shipStatus].tone}>{shipLabel[order.shipStatus].text}</Badge>} />}
          {/* วนแสดงเสื้อแต่ละรายการ (แบบ สี ไซซ์ จำนวน ราคา) */}
          {order.items.map((it, i) => (
            <InfoRow key={i} label={`${it.name} (${it.color} · ${it.size}) × ${it.qty}`} value={baht(it.qty * it.price)} />
          ))}
          {/* จัดส่ง -> แสดงที่อยู่ / รับหน้างาน -> บอกให้แสดงเลขคำสั่งซื้อกับ Staff */}
          {order.delivery === "ship" && <InfoRow label="ที่อยู่จัดส่ง" value={order.address} />}
          {order.delivery === "pickup" && <InfoRow label="รับสินค้า" value="รับที่จุดบริการหน้างาน แสดงเลขคำสั่งซื้อนี้กับ Staff" />}
        </Card>

        {/* บัตรที่จ่ายสำเร็จแล้ว -> ปุ่มไปดู QR และดูอีเมลบัตร */}
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
