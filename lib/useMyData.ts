"use client";
// โหลดข้อมูลของผู้ซื้อที่ล็อกอินอยู่: คำสั่งซื้อ บัตร และรายการโทเคน (อัปเดตทุก 5 วินาที)

import { listRecords } from "./api";
import { useAuth } from "./auth";
import { usePolling } from "./usePolling";

// หน้าไหนอยากได้ข้อมูลของฉัน เรียก useMyData()
export function useMyData() {
  // คนที่ล็อกอินอยู่
  const { account } = useAuth();
  // id ของเรา (ยังไม่ล็อกอิน = ว่าง)
  const userId = account?.id ?? "";

  // usePolling = ทำฟังก์ชันข้างในซ้ำทุก 5 วินาที
  return usePolling(async () => {
    // ยังไม่ล็อกอิน -> คืนลิสต์ว่าง
    if (!userId) return { orders: [], tickets: [], txs: [] };
    // Promise.all = ดึง 3 อย่างจาก MockAPI พร้อมกัน (เร็วกว่าดึงทีละอัน)
    const [orders, tickets, txs] = await Promise.all([listRecords("order"), listRecords("ticket"), listRecords("tx")]);
    // เอาเฉพาะบัตรที่ userId เป็นของเรา แล้วเรียงตามเลขบัตร
    const myTickets = tickets.filter((t) => t.userId === userId).sort((a, b) => a.ticketNo.localeCompare(b.ticketNo));
    // ลิสต์เลขบัตรของเรา เช่น [T-001, T-002]
    const myTicketNos = myTickets.map((t) => t.ticketNo);
    return {
      // คำสั่งซื้อของเรา เรียงใหม่สุดก่อน
      orders: orders.filter((o) => o.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      tickets: myTickets,
      // ประวัติโทเคนเฉพาะบัตรของเรา เรียงใหม่สุดก่อน
      txs: txs.filter((t) => myTicketNos.includes(t.ticketNo)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  });
}
