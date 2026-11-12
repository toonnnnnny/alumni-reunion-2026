"use client";
// โครงหน้าของแต่ละขนาดจอ
//   MobileShell  -> User, Packing (มือถือ)     : แถบบน + เนื้อหากลางจอ + แถบเมนูล่าง
//   TabletShell  -> Staff, Vendor (แท็บเล็ต)    : แถบบน + เนื้อหากว้างขึ้น + แถบเมนูล่างแบบลอย
//   AdminShell   -> Super Admin (เดสก์ท็อป)     : Sidebar ซ้าย (จอเล็กกลายเป็นเมนูแฮมเบอร์เกอร์)

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowLeft, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";
import { cx, CountDot } from "./ui";
import { NoticeBell } from "./NoticeBell";

export type NavItem = { href: string; label: string; icon: ReactNode; count?: number; exact?: boolean };

// เช็กว่าเมนูนี้คือหน้าปัจจุบันไหม
function isActive(pathname: string, item: NavItem): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
}

// ---------- แถบบนแบบมีปุ่มย้อนกลับ ----------

export function TopBar({ title, subtitle, back, right }: { title: string; subtitle?: string; back?: string | boolean; right?: ReactNode }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
        {back && (
          <button
            onClick={() => (typeof back === "string" ? router.push(back) : router.back())}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-gray-100"
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

// ---------- แถบเมนูล่าง ----------

function BottomNav({ items, floating }: { items: NavItem[]; floating?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      className={cx(
        "fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)]",
        floating ? "px-4 pb-[max(1rem,env(safe-area-inset-bottom))]" : "border-t border-line bg-white"
      )}
    >
      <div className={cx("mx-auto grid", floating ? "max-w-5xl rounded-2xl border border-line bg-white p-1.5 shadow-lg" : "max-w-md")} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx("relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px]", active ? "bg-navy-soft font-semibold text-navy" : "text-muted")}
            >
              <span className="[&>svg]:size-5">{item.icon}</span>
              {item.label}
              {!!item.count && (
                <span className="absolute right-[22%] top-1">
                  <CountDot count={item.count} />
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ---------- Mobile ----------

export function MobileShell({ children, nav }: { children: ReactNode; nav?: NavItem[] }) {
  return (
    <div className={cx("min-h-dvh", nav && "pb-24")}>
      {children}
      {nav && <BottomNav items={nav} />}
    </div>
  );
}

// เนื้อหามือถือ: กว้างไม่เกิน max-w-md อยู่กลางจอ เปิดบนคอมก็ไม่แตก
export function MobileBody({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cx("mx-auto w-full max-w-md space-y-4 px-4 py-5", className)}>{children}</main>;
}

// ---------- Tablet ----------

export function TabletShell({ children, nav }: { children: ReactNode; nav: NavItem[] }) {
  return (
    <div className="min-h-dvh pb-28">
      {children}
      <BottomNav items={nav} floating />
    </div>
  );
}

// เนื้อหาแท็บเล็ต: แนวตั้งคอลัมน์เดียว แนวนอน (lg) แบ่ง 2 คอลัมน์ได้ด้วย grid ในหน้า
export function TabletBody({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cx("mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6", className)}>{children}</main>;
}

// ปุ่มโปรไฟล์ + ออกจากระบบ (มุมขวาบน)
export function AccountChip({ subtitle }: { subtitle?: string }) {
  const { account, logout, role } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (!account) return null;
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-xl px-1 py-1">
        <span className="grid size-10 place-items-center rounded-full bg-navy-soft text-sm font-bold text-navy">{initials(account.name)}</span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold leading-tight">{account.name}</span>
          <span className="block text-xs text-muted">{subtitle}</span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-48 rounded-xl border border-line bg-white p-1 shadow-lg">
          <button
            onClick={() => {
              logout();
              router.replace(`/${role}/login`);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-bad hover:bg-bad-soft"
          >
            <LogOut className="size-4" /> ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- Admin ----------

export function AdminShell({ children, nav, title, subtitle, back }: { children: ReactNode; nav: NavItem[]; title: string; subtitle?: string; back?: string | boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-line bg-white p-4">
      <div className="mb-6 px-2">
        <p className="text-lg font-bold">Alumni Reunion 2026</p>
        <p className="text-xs text-muted">ระบบจัดการงานเลี้ยงรุ่น · Admin</p>
      </div>
      <p className="mb-2 px-2 text-xs text-muted">เมนู</p>
      <nav className="flex-1 space-y-1">
        {nav.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={cx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm", active ? "bg-navy-soft font-semibold text-navy" : "text-ink hover:bg-gray-50")}
            >
              <span className="[&>svg]:size-[18px]">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              <CountDot count={item.count ?? 0} />
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => {
          logout();
          router.replace("/admin/login");
        }}
        className="flex items-center gap-2 rounded-xl bg-bad-soft px-3 py-2.5 text-sm font-semibold text-bad"
      >
        <LogOut className="size-4" /> ออกจากระบบ
      </button>
    </aside>
  );

  return (
    <div className="min-h-dvh lg:pl-64">
      <div className="fixed inset-y-0 left-0 hidden lg:block">{sidebar}</div>
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div className="h-full w-64" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </div>
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="flex min-h-[72px] items-center gap-3 px-4 sm:px-8">
          <button onClick={() => setMenuOpen(true)} className="grid size-10 place-items-center rounded-xl bg-gray-100 lg:hidden" aria-label="เมนู">
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          {back && (
            <button onClick={() => (typeof back === "string" ? router.push(back) : router.back())} className="grid size-10 place-items-center rounded-xl bg-gray-100" aria-label="ย้อนกลับ">
              <ArrowLeft className="size-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
          </div>
          <NoticeBell />
          <AccountChip subtitle="ผู้ดูแลระบบ" />
        </div>
      </header>
      <main className="space-y-6 px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}
