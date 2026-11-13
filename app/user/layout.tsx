"use client";
// ทุกหน้าใต้ /user ใช้ layout นี้: ระบบล็อกอินของผู้ซื้อ + ตะกร้า + แถบเมนูล่าง

// usePathname = อ่าน URL ปัจจุบัน เช่น /user/shop
import { usePathname } from "next/navigation";
// ไอคอนของเมนูล่าง 5 ปุ่ม (ไลบรารี lucide-react)
import { House, QrCode, ShoppingBag, Ticket, UserRound } from "lucide-react";
// AuthProvider = ระบบจำผู้ที่ล็อกอิน, RequireLogin = กันคนยังไม่ล็อกอิน
import { AuthProvider, RequireLogin } from "@/lib/auth";
// CartProvider = ระบบตะกร้าเสื้อ (ดู lib/cart.tsx)
import { CartProvider } from "@/lib/cart";
// MobileShell = กรอบหน้าจอมือถือ + แถบเมนูล่าง
import { MobileShell, type NavItem } from "@/components/shells";

// รายการเมนูล่าง: href = ลิงก์ไปหน้าไหน, label = ชื่อปุ่ม, icon = ไอคอน
const nav: NavItem[] = [
  // exact: true = ปุ่ม Home จะไฮไลต์เฉพาะตอนอยู่หน้า /user พอดี
  { href: "/user", label: "Home", icon: <House />, exact: true },
  { href: "/user/tickets", label: "Tickets", icon: <Ticket /> },
  { href: "/user/qr", label: "QR", icon: <QrCode /> },
  { href: "/user/shop", label: "Shop", icon: <ShoppingBag /> },
  { href: "/user/me", label: "My Event", icon: <UserRound /> },
];

// children = เนื้อหาของหน้าที่เปิดอยู่ (เช่นหน้า shop) ถูกส่งเข้ามาแสดงข้างใน
export default function UserLayout({ children }: { children: React.ReactNode }) {
  // อ่าน URL ตอนนี้
  const pathname = usePathname();
  // หน้า login/register ไม่ต้องแสดงเมนูล่าง
  const hideNav = pathname === "/user/login" || pathname === "/user/register";
  return (
    // ชั้นที่ 1: บอกว่าเป็นระบบล็อกอินของบทบาท user (เก็บใน localStorage key reunion_session_user)
    <AuthProvider role="user">
      {/* ชั้นที่ 2: ทุกหน้าใต้ /user ใช้ตะกร้าเดียวกัน */}
      <CartProvider>
        {/* ชั้นที่ 3: ถ้ายังไม่ล็อกอิน เด้งไปหน้า login ยกเว้นหน้า Home (/user) กับหน้าสมัคร */}
        <RequireLogin publicPaths={["/user", "/user/register"]}>
          {/* แสดงหน้าที่เปิดอยู่ในกรอบมือถือ ถ้าเป็นหน้า login/register จะไม่ส่งเมนูไป */}
          <MobileShell nav={hideNav ? undefined : nav}>{children}</MobileShell>
        </RequireLogin>
      </CartProvider>
    </AuthProvider>
  );
}
