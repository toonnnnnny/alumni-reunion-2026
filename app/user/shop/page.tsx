"use client";
// ร้านเสื้อรุ่น: รายการเสื้อทั้งหมดจาก MockAPI ซื้อได้แม้ไม่มีบัตร

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
// ShirtImage = รูปเสื้อจาก public/shirts
import { ShirtImage } from "@/components/ShirtImage";
// listRecords = ดึงข้อมูลจาก MockAPI
import { listRecords } from "@/lib/api";
// useCart = ใช้ตะกร้า (เอาจำนวนชิ้นไปแสดงบนไอคอน)
import { useCart } from "@/lib/cart";
// usePolling = ดึงข้อมูลซ้ำอัตโนมัติ
import { usePolling } from "@/lib/usePolling";
import { baht } from "@/lib/format";
// totalStock = รวมสต็อกทุกสีทุกไซซ์
import { totalStock } from "@/lib/stock";
import { TopBar, MobileBody } from "@/components/shells";
import { Badge, ErrorText, Loading } from "@/components/ui";

// หน้า /user/shop
export default function Shop() {
  // count = จำนวนเสื้อในตะกร้า
  const { count } = useCart();
  // ดึงรายการเสื้อทั้งหมดจาก MockAPI ทุก 15 วินาที
  const { data, isLoading, error } = usePolling(() => listRecords("shirt"), 15000);

  return (
    // ส่วนหน้าตา
    <>
      {/* แถบบน + ไอคอนตะกร้ามุมขวา */}
      <TopBar
        title="ร้านเสื้อรุ่น"
        subtitle="จัดส่งหรือรับที่หน้างาน"
        right={
          // ไอคอนตะกร้า กดแล้วไปหน้า /user/cart
          <Link href="/user/cart" className="relative grid size-10 place-items-center rounded-xl bg-gray-100">
            <ShoppingCart className="size-5" />
            {/* มีของในตะกร้า -> วงกลมแดงแสดงจำนวน */}
            {count > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-bad px-1 text-[11px] font-semibold leading-5 text-white">{count}</span>}
          </Link>
        }
      />
      <MobileBody>
        {/* ถ้าโหลดพัง แสดง error */}
        <ErrorText text={error} />
        {isLoading && <Loading />}
        {/* การ์ดเสื้อจัด 2 คอลัมน์ (CSS Grid) */}
        <div className="grid grid-cols-2 gap-3">
          {/* วนสร้างการ์ดเสื้อทีละตัว */}
          {(data ?? []).map((shirt) => {
            // สต็อกรวมของเสื้อตัวนี้
            const left = totalStock(shirt.stock);
            return (
              // การ์ดเสื้อ กดแล้วไปหน้ารายละเอียด /user/shop/รหัสเสื้อ
              <Link key={shirt.id} href={`/user/shop/${shirt.id}`} className="overflow-hidden rounded-2xl border border-line bg-white">
                <ShirtImage name={shirt.name} image={shirt.image} className="aspect-square" />
                <div className="p-3">
                  <p className="truncate text-sm font-semibold">{shirt.name}</p>
                  <p className="font-bold">{baht(shirt.price)}</p>
                  {/* ป้ายสต็อก: 0 = หมด (แดง), น้อยกว่า 10 = เหลือ X ตัว (ส้ม), นอกนั้น = มีสินค้า (เขียว) */}
                  <div className="mt-1">{left === 0 ? <Badge tone="red">สินค้าหมด</Badge> : left < 10 ? <Badge tone="amber">เหลือ {left} ตัว</Badge> : <Badge tone="green">มีสินค้า</Badge>}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </MobileBody>
    </>
  );
}
