"use client";
// ทุกหน้าใต้ /staff (แท็บเล็ต ตั้ง/นอน ใช้หน้าเดียวกัน layout ปรับเองด้วย breakpoint)

import { usePathname } from "next/navigation";
import { House, QrCode, ScanLine, Shirt, TriangleAlert, Wallet } from "lucide-react";
import { AuthProvider, RequireLogin } from "@/lib/auth";
import { TabletShell, type NavItem } from "@/components/shells";

const nav: NavItem[] = [
  { href: "/staff", label: "Home", icon: <House />, exact: true },
  { href: "/staff/checkin", label: "Check-in", icon: <ScanLine /> },
  { href: "/staff/payqr", label: "Pay QR", icon: <QrCode /> },
  { href: "/staff/topup", label: "Top-up", icon: <Wallet /> },
  { href: "/staff/pickup", label: "Pickup", icon: <Shirt /> },
  { href: "/staff/report", label: "Report", icon: <TriangleAlert /> },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AuthProvider role="staff">
      <RequireLogin>{pathname === "/staff/login" ? children : <TabletShell nav={nav}>{children}</TabletShell>}</RequireLogin>
    </AuthProvider>
  );
}
