"use client";
// รายละเอียดเสื้อ: เลือกสี ไซซ์ จำนวน (ไม่เกินสต็อก) แล้วใส่ตะกร้า

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { Shirt as ShirtIcon } from "lucide-react";
import { getRecord } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { usePolling } from "@/lib/usePolling";
import { baht } from "@/lib/format";
import { SIZES } from "@/lib/types";
import { TopBar, MobileBody } from "@/components/shells";
import { Button, Card, ErrorText, Loading, Stepper, cx } from "@/components/ui";

export default function ShirtDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { add } = useCart();
  const { data: shirt, isLoading, error } = usePolling(() => getRecord("shirt", id), 15000);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);

  if (isLoading) return <Loading />;
  if (!shirt) return <MobileBody><ErrorText text={error || "ไม่พบสินค้า"} /></MobileBody>;

  const chosenColor = color || shirt.colors[0];
  const left = size ? shirt.stock[chosenColor]?.[size] ?? 0 : 0;

  function addToCart(goCart: boolean) {
    add({ shirtId: shirt!.id, name: shirt!.name, color: chosenColor, size, qty, price: shirt!.price });
    router.push(goCart ? "/user/cart" : "/user/shop");
  }

  return (
    <>
      <TopBar title={shirt.name} back="/user/shop" />
      <MobileBody>
        <div className="grid aspect-[4/3] place-items-center rounded-3xl bg-navy-soft text-navy">
          <ShirtIcon className="size-28" strokeWidth={1} />
        </div>
        <Card>
          <p className="text-lg font-bold">{shirt.name}</p>
          <p className="text-2xl font-bold">{baht(shirt.price)}</p>
          <p className="mt-1 text-sm text-muted">{shirt.detail}</p>
        </Card>
        <Card>
          <p className="mb-2 text-sm font-semibold">สี</p>
          <div className="flex flex-wrap gap-2">
            {shirt.colors.map((c) => (
              <button key={c} onClick={() => { setColor(c); setSize(""); setQty(1); }} className={cx("rounded-xl border px-4 py-2 text-sm", c === chosenColor ? "border-navy bg-navy text-white" : "border-line")}>
                {c}
              </button>
            ))}
          </div>
          <p className="mb-2 mt-4 text-sm font-semibold">ไซซ์</p>
          <div className="grid grid-cols-5 gap-2">
            {SIZES.map((s) => {
              const stock = shirt.stock[chosenColor]?.[s] ?? 0;
              return (
                <button key={s} disabled={stock === 0} onClick={() => { setSize(s); setQty(1); }} className={cx("rounded-xl border py-2 text-sm disabled:opacity-30", s === size ? "border-navy bg-navy text-white" : "border-line")}>
                  {s}
                  <span className="block text-[10px] opacity-70">{stock === 0 ? "หมด" : `เหลือ ${stock}`}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-semibold">จำนวน</p>
            <Stepper value={qty} onChange={setQty} max={Math.max(1, left)} />
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" disabled={!size} onClick={() => addToCart(false)}>ใส่ตะกร้า</Button>
          <Button disabled={!size} onClick={() => addToCart(true)}>ซื้อเลย</Button>
        </div>
        {!size && <p className="text-center text-xs text-muted">เลือกไซซ์ก่อน</p>}
      </MobileBody>
    </>
  );
}
