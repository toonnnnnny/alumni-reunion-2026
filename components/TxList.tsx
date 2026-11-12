// รายการโทเคนเข้า/ออก (ใช้ในกระเป๋าโทเคนของ User, หน้าลิงก์บัตร และ Admin)
import type { Transaction } from "@/lib/types";
import { dateTime, num } from "@/lib/format";
import { cx } from "./ui";

const label = { bonus: "ได้รับจากบัตร", topup: "เติมโทเคน", sale: "ซื้อสินค้า" };

export function TxList({ txs, empty = "ยังไม่มีรายการ" }: { txs: Transaction[]; empty?: string }) {
  if (txs.length === 0) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {txs.map((tx) => (
        <li key={tx.id} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{tx.type === "sale" ? tx.shopName : label[tx.type]}</p>
            <p className="truncate text-xs text-muted">
              {tx.type === "sale" ? tx.items.map((i) => `${i.name}×${i.qty}`).join(", ") : tx.type === "topup" ? `โดย ${tx.staffName} · ${tx.method === "cash" ? "เงินสด" : "โอน"}` : tx.ticketNo}
              {" · "}
              {dateTime(tx.createdAt)}
            </p>
          </div>
          <span className={cx("font-semibold", tx.amount > 0 ? "text-ok" : "text-ink")}>
            {tx.amount > 0 ? "+" : ""}
            {num(tx.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}
