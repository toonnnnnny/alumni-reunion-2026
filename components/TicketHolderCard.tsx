// การ์ดแสดงเจ้าของบัตรหลังสแกน (Staff, Vendor)
import type { Ticket } from "@/lib/types";
import { initials, num } from "@/lib/format";
import { Badge } from "./ui";

export function TicketHolderCard({ ticket }: { ticket: Ticket }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-navy p-6 text-white">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-white/15 font-bold">{initials(ticket.holderName)}</span>
        <div className="flex-1">
          <p className="text-lg font-bold">{ticket.holderName}</p>
          <p className="text-sm text-white/75">เลขบัตร {ticket.ticketNo} · ผู้เข้าร่วม {ticket.holderIndex}</p>
        </div>
        <Badge tone={ticket.checkedIn ? "green" : "gray"}>{ticket.checkedIn ? "เช็กอินแล้ว" : "ยังไม่เช็กอิน"}</Badge>
      </div>
      <p className="mt-4 text-sm text-white/75">โทเคนคงเหลือ</p>
      <p className="text-4xl font-bold">{num(ticket.tokens)} <span className="text-base font-normal">โทเคน</span></p>
    </div>
  );
}
