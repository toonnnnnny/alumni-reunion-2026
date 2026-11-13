"use client";
// ตะกร้า -> เลือกวิธีรับสินค้า (จัดส่ง/รับหน้างาน) -> ชำระเงิน/ส่งสลิป -> สร้างคำสั่งซื้อ

import { ShirtThumb } from "@/components/ShirtImage";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { createRecord, listRecords, nextNumber, notify, nowIso } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { baht } from "@/lib/format";
import { TopBar, MobileBody } from "@/components/shells";
import { Steps } from "@/components/Steps";
import { PaymentStep } from "@/components/PaymentStep";
import { ButtonLink, Button, Card, EmptyState, ErrorText, InfoRow, Stepper, TextArea, cx } from "@/components/ui";


export default function Cart() {
  const router = useRouter();
  const { account } = useAuth();
  const { items, changeQty, remove, total, clear } = useCart();
  const [step, setStep] = useState(0);
  const [delivery, setDelivery] = useState<"ship" | "pickup">("ship");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  if (!account) return null;
  const grandTotal = total; // ไม่มีค่าส่ง ทั้งจัดส่งและรับหน้างาน

  function goPay() {
    if (delivery === "ship" && address.trim().length < 10) return setError("กรอกที่อยู่จัดส่งให้ครบ");
    setError("");
    setStep(2);
  }

  // ส่งสลิป -> สร้างคำสั่งซื้อเสื้อ -> แจ้ง Admin -> ล้างตะกร้า
  async function submitOrder(slip: string) {
    const orders = await listRecords("order");
    const orderNo = nextNumber(orders.map((o) => o.orderNo), "ORD-", 6);
    const order = await createRecord("order", {
      orderNo, userId: account!.id, type: "shirt", attendees: [], items, total: grandTotal, slipImage: slip, status: "pending_slip", rejectReason: "",
      delivery, address: delivery === "ship" ? `${account!.name} · ${address.trim()} · ${account!.phone}` : "", shipStatus: "", tracking: "",
      createdAt: nowIso(), updatedAt: nowIso(),
    });
    await notify("admin", "สลิปใหม่รอตรวจสอบ (เสื้อ)", `${orderNo} · ${account!.name} · ${baht(grandTotal)}`, `/admin/payments/${order.id}`);
    clear();
    router.replace(`/user/orders/${order.id}`);
  }

  if (items.length === 0 && step < 2) {
    return (
      <>
        <TopBar title="ตะกร้า" back="/user/shop" />
        <MobileBody><EmptyState title="ตะกร้ายังว่าง" action={<ButtonLink href="/user/shop">เลือกซื้อเสื้อ</ButtonLink>} /></MobileBody>
      </>
    );
  }

  return (
    <>
      <TopBar title="สั่งซื้อเสื้อ" back={step === 0 ? "/user/shop" : undefined} right={step === 1 ? <Button size="sm" variant="ghost" onClick={() => setStep(0)}>ย้อนกลับ</Button> : undefined} />
      <MobileBody>
        <Steps labels={["ตะกร้า", "รับสินค้า", "ชำระเงิน"]} current={step} />
        {step === 0 && (
          <>
            {items.map((it, i) => (
              <Card key={i} className="flex items-center gap-3">
                <ShirtThumb name={it.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{it.name}</p>
                  <p className="text-xs text-muted">{it.color} · {it.size} · {baht(it.price)}</p>
                </div>
                <Stepper value={it.qty} onChange={(n) => changeQty(i, n)} />
                <button onClick={() => remove(i)} className="grid size-9 place-items-center rounded-lg bg-bad-soft text-bad" aria-label="ลบ"><Trash2 className="size-4" /></button>
              </Card>
            ))}
            <Card><InfoRow label="ราคาสินค้า" value={baht(total)} strong /></Card>
            <Button full size="lg" onClick={() => setStep(1)}>ถัดไป: วิธีรับสินค้า</Button>
          </>
        )}
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {(["ship", "pickup"] as const).map((d) => (
                <button key={d} onClick={() => setDelivery(d)} className={cx("rounded-2xl border p-4 text-left", delivery === d ? "border-navy bg-navy-soft" : "border-line bg-white")}>
                  <p className="font-semibold">{d === "ship" ? "จัดส่งถึงบ้าน" : "รับที่หน้างาน"}</p>
                  <p className="text-xs text-muted">{d === "ship" ? "ส่งฟรี · ส่งตามที่อยู่ที่กรอก" : "ฟรี · รับวันงานที่จุด Staff"}</p>
                </button>
              ))}
            </div>
            {delivery === "ship" ? (
              <TextArea label="ที่อยู่จัดส่ง" value={address} onChange={setAddress} placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์" />
            ) : (
              <p className="rounded-xl bg-navy-soft p-4 text-sm text-muted">แสดงเลขคำสั่งซื้อกับ Staff ที่จุดบริการในวันงาน (15 ธ.ค. 2569)</p>
            )}
            <Card>
              <InfoRow label="ราคาสินค้า" value={baht(total)} />
              <InfoRow label="ยอดชำระ" value={baht(grandTotal)} strong />
            </Card>
            <ErrorText text={error} />
            <Button full size="lg" onClick={goPay}>ไปหน้าชำระเงิน</Button>
          </>
        )}
        {step === 2 && <PaymentStep total={grandTotal} onSubmit={submitOrder} />}
      </MobileBody>
    </>
  );
}
