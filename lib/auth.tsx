"use client";
// ระบบเข้าสู่ระบบแบบที่เรียนในแล็บ Login/Logout
// เทียบ username/password กับ accounts ใน MockAPI แล้วเก็บ session ใน localStorage
// แยก key ตาม role -> เปิด /user กับ /admin พร้อมกันในเบราว์เซอร์เดียวได้ (สะดวกตอนเดโม)

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAccount, listAccounts } from "./api";
import type { Account, Role } from "./types";

type AuthValue = {
  role: Role;
  account: Account | null;
  ready: boolean; // true เมื่ออ่าน localStorage เสร็จแล้ว
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

const keyOf = (role: Role) => `reunion_session_${role}`;

// ครอบทุกหน้าของ role หนึ่ง (ใส่ใน app/<role>/layout.tsx)
export function AuthProvider({ role, children }: { role: Role; children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);

  // ตอนเปิดหน้า: อ่าน id ที่จำไว้ แล้วโหลดข้อมูลบัญชีล่าสุดจาก API
  useEffect(() => {
    const savedId = localStorage.getItem(keyOf(role));
    if (!savedId) {
      setReady(true);
      return;
    }
    getAccount(savedId)
      .then((acc) => {
        if (acc.role === role && acc.active) setAccount(acc);
        else localStorage.removeItem(keyOf(role));
      })
      .catch(() => localStorage.removeItem(keyOf(role)))
      .finally(() => setReady(true));
  }, [role]);

  // เช็ก credential ถ้าไม่ตรงโยน Error ให้หน้า login แสดงข้อความ
  async function login(username: string, password: string) {
    const accounts = await listAccounts();
    const found = accounts.find(
      (a) => a.username.toLowerCase() === username.trim().toLowerCase() && a.password === password && a.role === role
    );
    if (!found) throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    if (!found.active) throw new Error("บัญชีนี้ถูกปิดใช้งาน ติดต่อ Admin");
    localStorage.setItem(keyOf(role), found.id);
    setAccount(found);
  }

  function logout() {
    localStorage.removeItem(keyOf(role));
    setAccount(null);
  }

  // โหลดข้อมูลบัญชีใหม่ (เช่น หลังแก้โปรไฟล์)
  async function refresh() {
    if (!account) return;
    setAccount(await getAccount(account.id));
  }

  return (
    <AuthContext.Provider value={{ role, account, ready, login, logout, refresh }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth ต้องใช้ภายใน AuthProvider");
  return value;
}

// กันเข้าหน้าโดยไม่ล็อกอิน: ถ้ายังไม่ล็อกอินพาไปหน้า /<role>/login
// publicPaths = หน้าที่เข้าได้โดยไม่ต้องล็อกอิน เช่น /user (หน้าแรก) /user/register
export function RequireLogin({ children, publicPaths = [] }: { children: ReactNode; publicPaths?: string[] }) {
  const { role, account, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const loginPath = `/${role}/login`;
  const isPublic = pathname === loginPath || publicPaths.includes(pathname);

  useEffect(() => {
    if (ready && !account && !isPublic) {
      router.replace(`${loginPath}?next=${encodeURIComponent(pathname)}`);
    }
  }, [ready, account, isPublic, loginPath, pathname, router]);

  if (!ready) return <div className="grid min-h-dvh place-items-center text-sm text-gray-500">กำลังโหลด...</div>;
  if (!account && !isPublic) return null;
  return <>{children}</>;
}
