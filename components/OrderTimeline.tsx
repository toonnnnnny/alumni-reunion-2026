// ลำดับสถานะของคำสั่งซื้อ (ใช้ในหน้ารายละเอียดของ User และ Admin)
import { Check } from "lucide-react";
import type { Order } from "@/lib/types";
import { cx } from "./ui";

export function OrderTimeline({ order }: { order: Order }) {
  const steps: { label: string; done: boolean }[] = [{ label: "ส่งสลิปแล้ว", done: true }, { label: "Admin ยืนยันการชำระเงิน", done: order.status === "paid" }];
  if (order.type === "ticket") {
    steps.push({ label: "ได้รับบัตรและ QR Code", done: order.status === "paid" });
  } else if (order.delivery === "ship") {
    steps.push({ label: "แพ็คเสร็จ", done: order.shipStatus === "packed" || order.shipStatus === "shipped" });
    steps.push({ label: `จัดส่งแล้ว${order.tracking ? ` · ${order.tracking}` : ""}`, done: order.shipStatus === "shipped" });
  } else {
    steps.push({ label: "รับเสื้อที่หน้างานแล้ว", done: order.shipStatus === "picked" });
  }
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={i} className="flex items-center gap-3">
          <span className={cx("grid size-6 place-items-center rounded-full", s.done ? "bg-ok text-white" : "bg-line text-muted")}>
            {s.done ? <Check className="size-3.5" /> : <span className="size-1.5 rounded-full bg-muted" />}
          </span>
          <span className={cx("text-sm", s.done ? "font-semibold" : "text-muted")}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}
