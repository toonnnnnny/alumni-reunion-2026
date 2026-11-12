"use client";
// โหลดข้อมูลของผู้ซื้อที่ล็อกอินอยู่: คำสั่งซื้อ บัตร และรายการโทเคน (อัปเดตทุก 5 วินาที)

import { listRecords } from "./api";
import { useAuth } from "./auth";
import { usePolling } from "./usePolling";

export function useMyData() {
  const { account } = useAuth();
  const userId = account?.id ?? "";

  return usePolling(async () => {
    if (!userId) return { orders: [], tickets: [], txs: [] };
    const [orders, tickets, txs] = await Promise.all([listRecords("order"), listRecords("ticket"), listRecords("tx")]);
    const myTickets = tickets.filter((t) => t.userId === userId).sort((a, b) => a.ticketNo.localeCompare(b.ticketNo));
    const myTicketNos = myTickets.map((t) => t.ticketNo);
    return {
      orders: orders.filter((o) => o.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      tickets: myTickets,
      txs: txs.filter((t) => myTicketNos.includes(t.ticketNo)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  });
}
