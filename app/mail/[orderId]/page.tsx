"use client";
// เทมเพลตอีเมลบัตร (หน้าตาแบบ Gmail) ที่ระบบส่งถึงผู้ซื้อหลัง Admin ยืนยันการชำระเงิน
// งานนี้แสดงเป็นหน้าเว็บแทนการส่งอีเมลจริง
//   - บัตรใบที่ 1 (ของผู้ซื้อ) -> ปุ่ม "ดูบัตรในเว็บ" ไปหน้า My QR ต้องล็อกอิน
//   - บัตรใบที่ 2+ -> ปุ่ม "เปิดบัตร" + ลิงก์ตัวอักษร เปิดได้โดยไม่ต้องล็อกอิน

import Link from "next/link";
import { use } from "react";
import { ArrowLeft, ChevronRight, Ticket } from "lucide-react";
import { getRecord, listRecords, getAccount } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { dateTime } from "@/lib/format";
import { BONUS_TOKENS } from "@/lib/types";
import { QrImage } from "@/components/QrImage";
import { Badge, ErrorText, Loading } from "@/components/ui";

export default function MailPreview({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { data, isLoading, error } = usePolling(async () => {
    const order = await getRecord("order", orderId);
    const buyer = await getAccount(order.userId);
    const tickets = (await listRecords("ticket")).filter((t) => t.orderId === order.id).sort((a, b) => a.holderIndex - b.holderIndex);
    return { order, buyer, tickets };
  }, 30000);

  if (isLoading) return <Loading />;
  if (!data) return <main className="mx-auto max-w-md p-4"><ErrorText text={error || "ไม่พบอีเมล"} /></main>;
  const { order, buyer, tickets } = data;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const host = origin.replace(/^https?:\/\//, "");

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-white">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Link href={`/user/orders/${order.id}`} className="grid size-10 place-items-center rounded-xl bg-gray-100" aria-label="กลับ"><ArrowLeft className="size-5" /></Link>
        <span className="text-xs text-muted">ตัวอย่างอีเมลที่ระบบส่งถึงผู้ซื้อ</span>
      </div>
      <div className="space-y-4 px-5 py-5">
        <h1 className="text-xl font-bold leading-snug">Alumni Reunion 2026 ขอบคุณสำหรับคำสั่งซื้อ !</h1>
        <Badge>กล่องจดหมาย</Badge>
        <div className="flex items-center gap-3 border-b border-line pb-4">
          <span className="grid size-10 place-items-center rounded-full bg-navy font-bold text-white">A</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Alumni Reunion 2026</p>
            <p className="truncate text-xs text-muted">ถึง ฉัน · {buyer.email}</p>
          </div>
          <span className="text-xs text-muted">{dateTime(order.updatedAt)}</span>
        </div>

        <p className="font-semibold">สวัสดี {buyer.name}</p>
        <p className="text-sm text-muted">
          ชำระเงินสำเร็จ {tickets.map((t) => t.ticketNo).join(" และ ")} สามารถใช้คิวอาร์โค้ดของคุณ เข้างาน เติมโทเคน ซื้อของภายในงาน
        </p>

        {order.status !== "paid" && <ErrorText text="คำสั่งซื้อนี้ยังไม่ได้รับการยืนยัน อีเมลบัตรจะส่งหลัง Admin อนุมัติ" />}

        {tickets.map((t) => (
          <div key={t.id} className="space-y-3 rounded-2xl bg-paper p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold"><Ticket className="size-4" /> บัตร {t.ticketNo} · {t.holderName}</p>
              {t.holderIndex === 1 ? <Badge tone="navy">บัตรของคุณ</Badge> : <Badge tone="amber">ผู้เข้าร่วม {t.holderIndex}</Badge>}
            </div>
            <div className="mx-auto w-40 rounded-xl bg-white p-2">
              <QrImage text={t.ticketNo} size={150} className="h-auto w-full" />
            </div>
            <p className="text-center text-xs text-muted">15 ธ.ค. 2569 · Main Hall · {BONUS_TOKENS} โทเคน</p>
            {t.holderIndex === 1 ? (
              <>
                <Link href={`/user/qr?t=${t.ticketNo}`} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border-[1.5px] border-navy bg-white text-sm font-semibold text-navy">
                  ดูบัตรในเว็บ <ChevronRight className="size-4" />
                </Link>
                <p className="text-center text-xs text-muted">บัตรของเจ้าของบัญชี · ต้องเข้าสู่ระบบด้วย {buyer.email}</p>
              </>
            ) : (
              <>
                <Link href={`/t/${t.linkToken}`} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border-[1.5px] border-navy bg-white text-sm font-semibold text-navy">
                  เปิดบัตร {t.ticketNo} <ChevronRight className="size-4" />
                </Link>
                <p className="text-center">
                  <Link href={`/t/${t.linkToken}`} className="text-xs text-sky-700 underline">
                    {host}/t/{t.linkToken.slice(0, 4)}…
                  </Link>
                </p>
              </>
            )}
          </div>
        ))}
        <p className="pb-6 text-center text-xs text-muted">ลิงก์บัตรแต่ละใบเปิดได้เฉพาะบัตรใบนั้น ไม่ต้องเข้าสู่ระบบ</p>
      </div>
    </main>
  );
}
