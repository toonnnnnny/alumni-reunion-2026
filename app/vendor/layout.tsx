"use client";
// ทุกหน้าใต้ /vendor (แท็บเล็ตของร้านค้า)

import { usePathname } from "next/navigation";
import { House, ReceiptText, ScanLine, Wallet } from "lucide-react";
import { AuthProvider, RequireLogin } from "@/lib/auth";
import { TabletShell, type NavItem } from "@/components/shells";

const nav: NavItem[] = [
  { href: "/vendor", label: "Home", icon: <House />, exact: true },
  { href: "/vendor/sell", label: "Scan", icon: <ScanLine /> },
  { href: "/vendor/history", label: "History", icon: <ReceiptText /> },
  { href: "/vendor/withdraw", label: "Withdraw", icon: <Wallet /> },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AuthProvider role="vendor">
      <RequireLogin>{pathname === "/vendor/login" ? children : <TabletShell nav={nav}>{children}</TabletShell>}</RequireLogin>
    </AuthProvider>
  );
}
