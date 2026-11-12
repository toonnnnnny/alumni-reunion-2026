"use client";
// ทุกหน้าใต้ /user ใช้ layout นี้: ระบบล็อกอินของผู้ซื้อ + ตะกร้า + แถบเมนูล่าง

import { usePathname } from "next/navigation";
import { House, QrCode, ShoppingBag, Ticket, UserRound } from "lucide-react";
import { AuthProvider, RequireLogin } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { MobileShell, type NavItem } from "@/components/shells";

const nav: NavItem[] = [
  { href: "/user", label: "Home", icon: <House />, exact: true },
  { href: "/user/tickets", label: "Tickets", icon: <Ticket /> },
  { href: "/user/qr", label: "QR", icon: <QrCode /> },
  { href: "/user/shop", label: "Shop", icon: <ShoppingBag /> },
  { href: "/user/me", label: "My Event", icon: <UserRound /> },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/user/login" || pathname === "/user/register";
  return (
    <AuthProvider role="user">
      <CartProvider>
        <RequireLogin publicPaths={["/user", "/user/register"]}>
          <MobileShell nav={hideNav ? undefined : nav}>{children}</MobileShell>
        </RequireLogin>
      </CartProvider>
    </AuthProvider>
  );
}
