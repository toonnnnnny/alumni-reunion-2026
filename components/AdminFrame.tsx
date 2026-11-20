"use client";
// โครงหน้าของ Super Admin + ตัวเลขแจ้งเตือนสีแดงบนเมนู (นับใหม่ทุก 5 วินาที)

import type { ReactNode } from "react";
import { LayoutDashboard, CreditCard, Users, Wallet, Store, Shirt, KeyRound, TriangleAlert } from "lucide-react";
import { listRecords } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { AdminShell, type NavItem } from "./shells";

// นับงานที่ Admin ต้องทำ
function useAdminCounts() {
  const { data } = usePolling(async () => {
    const [orders, withdrawals, issues] = await Promise.all([listRecords("order"), listRecords("withdrawal"), listRecords("issue")]);
    return {
      slips: orders.filter((o) => o.status === "pending_slip").length,
      withdrawals: withdrawals.filter((w) => w.status === "pending").length,
      issues: issues.filter((i) => i.status === "open").length,
    };
  });
  return data ?? { slips: 0, withdrawals: 0, issues: 0 };
}

export function AdminFrame({ title, subtitle, back, children }: { title: string; subtitle?: string; back?: string | boolean; children: ReactNode }) {
  const counts = useAdminCounts();
  const nav: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard />, exact: true },
    { href: "/admin/payments", label: "อนุมัติการชำระเงิน", icon: <CreditCard />, count: counts.slips },
    { href: "/admin/buyers", label: "บัญชีของผู้เข้าร่วม", icon: <Users /> },
    { href: "/admin/topups", label: "รายการเติมโทเคน", icon: <Wallet /> },
    { href: "/admin/shops", label: "ร้านค้าและเมนู", icon: <Store />, count: counts.withdrawals },
    { href: "/admin/shirts", label: "เสื้อและสต็อก", icon: <Shirt /> },
    { href: "/admin/accounts", label: "บัญชีผู้ใช้ระบบ", icon: <KeyRound /> },
    { href: "/admin/issues", label: "การแจ้งปัญหา", icon: <TriangleAlert />, count: counts.issues },
  ];
  return (
    <AdminShell nav={nav} title={title} subtitle={subtitle} back={back}>
      {children}
    </AdminShell>
  );
}
