"use client";
// คำสั่งซื้อของฉัน แยกแท็บ กำลังดำเนินการ / สำเร็จ

import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useMyData } from "@/lib/useMyData";
import { baht, dateTime } from "@/lib/format";
import { payLabel, shipLabel } from "@/lib/status";
import type { Order } from "@/lib/types";
import { TopBar, MobileBody } from "@/components/shells";
import { Badge, EmptyState, Loading, Tabs, ButtonLink } from "@/components/ui";

// ถือว่า "สำเร็จ" เมื่อจ่ายแล้วและ (เป็นบัตร หรือ เสื้อส่งถึง/รับแล้ว)
// เช็กว่าคำสั่งซื้อนี้จบแล้วหรือยัง
function isDone(o: Order): boolean {
  // ยังไม่จ่ายสำเร็จ = ยังไม่จบ
  if (o.status !== "paid") return false;
  // บัตร: จ่ายแล้วถือว่าจบ / เสื้อ: ต้องส่งถึง (shipped) หรือรับแล้ว (picked)
  return o.type === "ticket" || o.shipStatus === "shipped" || o.shipStatus === "picked";
}

// หน้า /user/orders
export default function MyOrders() {
  // ข้อมูลของฉัน
  const { data, isLoading } = useMyData();
  // แท็บ: active กำลังดำเนินการ / done สำเร็จ
  const [tab, setTab] = useState<"active" | "done">("active");
  // คำสั่งซื้อทั้งหมดของฉัน (เรียงใหม่สุดก่อน)
  const orders = data?.orders ?? [];
  // คัดตามแท็บที่เลือก
  const list = orders.filter((o) => (tab === "done" ? isDone(o) : !isDone(o)));

  return (
    // ส่วนหน้าตา
    <>
      <TopBar title="คำสั่งซื้อของฉัน" back="/user/me" />
      <MobileBody>
        {/* แท็บ 2 อัน พร้อมจำนวน */}
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "active", label: "กำลังดำเนินการ", count: orders.filter((o) => !isDone(o)).length },
            { value: "done", label: "สำเร็จ", count: orders.filter(isDone).length },
          ]}
        />
        {/* กำลังโหลด / ไม่มีรายการ */}
        {isLoading && <Loading />}
        {!isLoading && list.length === 0 && <EmptyState title="ยังไม่มีคำสั่งซื้อ" action={<ButtonLink href="/user/tickets/buy">ซื้อบัตร</ButtonLink>} />}
        {/* วนแสดงคำสั่งซื้อทีละอัน กดแล้วไปหน้าสถานะ */}
        {list.map((o) => (
          <Link key={o.id} href={`/user/orders/${o.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{o.orderNo}</p>
              <p className="text-xs text-muted">
                {/* บัตร -> บัตรเข้างาน × จำนวน / เสื้อ -> รวมจำนวนเสื้อ + วันที่สั่ง */}
                {o.type === "ticket" ? `บัตรเข้างาน × ${o.attendees.length}` : `เสื้อ ${o.items.reduce((s, i) => s + i.qty, 0)} ตัว`} · {dateTime(o.createdAt)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {/* ป้ายสถานะการจ่ายเงิน */}
                <Badge tone={payLabel[o.status].tone}>{payLabel[o.status].text}</Badge>
                {/* ถ้าเป็นเสื้อ มีป้ายสถานะการส่งเพิ่ม (รอแพ็ค / แพ็คเสร็จ / จัดส่งแล้ว / รับแล้ว) */}
                {o.shipStatus && <Badge tone={shipLabel[o.shipStatus].tone}>{shipLabel[o.shipStatus].text}</Badge>}
              </div>
            </div>
            <p className="font-semibold">{baht(o.total)}</p>
            <ChevronRight className="size-4 text-muted" />
          </Link>
        ))}
      </MobileBody>
    </>
  );
}
