"use client";
// ทุกหน้าใต้ /packing (มือถือของฝ่ายแพ็คเสื้อ)

import { usePathname } from "next/navigation";
import { AuthProvider, RequireLogin } from "@/lib/auth";
import { MobileShell } from "@/components/shells";

export default function PackingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AuthProvider role="packing">
      <RequireLogin>{pathname === "/packing/login" ? children : <MobileShell>{children}</MobileShell>}</RequireLogin>
    </AuthProvider>
  );
}
