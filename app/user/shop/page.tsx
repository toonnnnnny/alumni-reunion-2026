"use client";
// ร้านเสื้อรุ่น: รายการเสื้อทั้งหมดจาก MockAPI ซื้อได้แม้ไม่มีบัตร

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { ShirtImage } from "@/components/ShirtImage";
import { listRecords } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { usePolling } from "@/lib/usePolling";
import { baht } from "@/lib/format";
import { totalStock } from "@/lib/stock";
import { TopBar, MobileBody } from "@/components/shells";
import { Badge, ErrorText, Loading } from "@/components/ui";

export default function Shop() {
  const { count } = useCart();
  const { data, isLoading, error } = usePolling(() => listRecords("shirt"), 15000);

  return (
    <>
      <TopBar
        title="ร้านเสื้อรุ่น"
        subtitle="จัดส่งหรือรับที่หน้างาน"
        right={
          <Link href="/user/cart" className="relative grid size-10 place-items-center rounded-xl bg-gray-100">
            <ShoppingCart className="size-5" />
            {count > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-bad px-1 text-[11px] font-semibold leading-5 text-white">{count}</span>}
          </Link>
        }
      />
      <MobileBody>
        <ErrorText text={error} />
        {isLoading && <Loading />}
        <div className="grid grid-cols-2 gap-3">
          {(data ?? []).map((shirt) => {
            const left = totalStock(shirt.stock);
            return (
              <Link key={shirt.id} href={`/user/shop/${shirt.id}`} className="overflow-hidden rounded-2xl border border-line bg-white">
                <ShirtImage name={shirt.name} className="aspect-square" />
                <div className="p-3">
                  <p className="truncate text-sm font-semibold">{shirt.name}</p>
                  <p className="font-bold">{baht(shirt.price)}</p>
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
