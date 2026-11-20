"use client";
// รายละเอียดเสื้อ: เลือกสี ไซซ์ จำนวน (ไม่เกินสต็อก) แล้วใส่ตะกร้า

import { useRouter } from "next/navigation";
// use = อ่านรหัสเสื้อจาก URL, useState = ตัวแปรของหน้า
import { use, useState } from "react";
import { ShirtImage } from "@/components/ShirtImage";
// getRecord = ดึงข้อมูล 1 รายการจาก MockAPI
import { getRecord } from "@/lib/api";
// useCart = ใช้ตะกร้า (เอาฟังก์ชัน add)
import { useCart } from "@/lib/cart";
import { usePolling } from "@/lib/usePolling";
import { baht } from "@/lib/format";
// SIZES = รายการไซซ์ S M L XL XXL
import { SIZES } from "@/lib/types";
import { TopBar, MobileBody } from "@/components/shells";
import { Button, Card, ErrorText, Loading, Stepper, cx } from "@/components/ui";

// หน้า /user/shop/[id] เช่น /user/shop/3
export default function ShirtDetail({ params }: { params: Promise<{ id: string }> }) {
  // รหัสเสื้อจาก URL
  const { id } = use(params);
  // ตัวสั่งเปลี่ยนหน้า
  const router = useRouter();
  // หยิบฟังก์ชันใส่ตะกร้ามาใช้
  const { add } = useCart();
  // ดึงข้อมูลเสื้อตัวนี้จาก MockAPI ทุก 15 วินาที (สต็อกจะอัปเดตเอง)
  const { data: shirt, isLoading, error } = usePolling(() => getRecord("shirt", id), 15000);
  // สีที่เลือก
  const [color, setColor] = useState("");
  // ไซซ์ที่เลือก (ว่าง = ยังไม่เลือก)
  const [size, setSize] = useState("");
  // จำนวนที่เลือก
  const [qty, setQty] = useState(1);

  // ยังโหลดอยู่ -> วงหมุน
  if (isLoading) return <Loading />;
  // ไม่เจอเสื้อ -> แสดง error
  if (!shirt) return <MobileBody><ErrorText text={error || "ไม่พบสินค้า"} /></MobileBody>;

  // ยังไม่เลือกสี -> ใช้สีแรกเป็นค่าเริ่มต้น
  const chosenColor = color || shirt.colors[0];
  // สต็อกคงเหลือของสี + ไซซ์ที่เลือก (ใช้จำกัดจำนวนสูงสุด)
  const left = size ? shirt.stock[chosenColor]?.[size] ?? 0 : 0;

  // goCart = true กดซื้อเลย / false กดใส่ตะกร้า
  function addToCart(goCart: boolean) {
    // ใส่เสื้อลงตะกร้า (ดูฟังก์ชัน add ใน lib/cart.tsx)
    add({ shirtId: shirt!.id, name: shirt!.name, color: chosenColor, size, qty, price: shirt!.price });
    // ซื้อเลย -> ไปหน้าตะกร้า / ใส่ตะกร้า -> กลับไปหน้าร้าน
    router.push(goCart ? "/user/cart" : "/user/shop");
  }

  return (
    // ส่วนหน้าตา
    <>
      {/* แถบบน ชื่อเสื้อ + ปุ่มกลับร้าน */}
      <TopBar title={shirt.name} back="/user/shop" />
      <MobileBody>
        {/* รูปเสื้อสี่เหลี่ยมจัตุรัส */}
        <ShirtImage name={shirt.name} image={shirt.image} className="aspect-square rounded-3xl" iconClass="size-28" />
        {/* ชื่อ ราคา รายละเอียด */}
        <Card>
          <p className="text-lg font-bold">{shirt.name}</p>
          <p className="text-2xl font-bold">{baht(shirt.price)}</p>
          <p className="mt-1 text-sm text-muted">{shirt.detail}</p>
        </Card>
        <Card>
          {/* ===== เลือกสี ===== */}
          <p className="mb-2 text-sm font-semibold">สี</p>
          <div className="flex flex-wrap gap-2">
            {/* วนสร้างปุ่มสี เปลี่ยนสีแล้วล้างไซซ์และจำนวน (เพราะสต็อกแต่ละสีไม่เท่ากัน) */}
            {shirt.colors.map((c) => (
              <button key={c} onClick={() => { setColor(c); setSize(""); setQty(1); }} className={cx("rounded-xl border px-4 py-2 text-sm", c === chosenColor ? "border-navy bg-navy text-white" : "border-line")}>
                {c}
              </button>
            ))}
          </div>
          {/* ===== เลือกไซซ์ ===== */}
          <p className="mb-2 mt-4 text-sm font-semibold">ไซซ์</p>
          <div className="grid grid-cols-5 gap-2">
            {/* วนสร้างปุ่มไซซ์ ไซซ์ที่สต็อกเป็น 0 กดไม่ได้ (disabled) */}
            {SIZES.map((s) => {
              // สต็อกของไซซ์นี้
              const stock = shirt.stock[chosenColor]?.[s] ?? 0;
              return (
                <button key={s} disabled={stock === 0} onClick={() => { setSize(s); setQty(1); }} className={cx("rounded-xl border py-2 text-sm disabled:opacity-30", s === size ? "border-navy bg-navy text-white" : "border-line")}>
                  {s}
                  <span className="block text-[10px] opacity-70">{stock === 0 ? "หมด" : `เหลือ ${stock}`}</span>
                </button>
              );
            })}
          </div>
          {/* ===== เลือกจำนวน ===== กดเพิ่มได้ไม่เกินสต็อก (max = left) */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-semibold">จำนวน</p>
            <Stepper value={qty} onChange={setQty} max={Math.max(1, left)} />
          </div>
        </Card>
        {/* ปุ่มใส่ตะกร้า / ซื้อเลย กดไม่ได้จนกว่าจะเลือกไซซ์ */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" disabled={!size} onClick={() => addToCart(false)}>ใส่ตะกร้า</Button>
          <Button disabled={!size} onClick={() => addToCart(true)}>ซื้อเลย</Button>
        </div>
        {/* ยังไม่เลือกไซซ์ -> ข้อความเตือน */}
        {!size && <p className="text-center text-xs text-muted">เลือกไซซ์ก่อน</p>}
      </MobileBody>
    </>
  );
}
