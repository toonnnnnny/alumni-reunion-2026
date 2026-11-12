"use client";
// ทุกหน้าใต้ /admin ต้องล็อกอินเป็น Super Admin
import { AuthProvider, RequireLogin } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider role="admin">
      <RequireLogin>{children}</RequireLogin>
    </AuthProvider>
  );
}
