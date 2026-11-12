"use client";
import { LoginForm } from "@/components/LoginForm";

export default function StaffLogin() {
  return <LoginForm title="Staff เข้าสู่ระบบ" subtitle="จุดบริการหน้างาน · บัญชีสร้างโดย Admin" demo={{ username: "staff1", password: "1234" }} />;
}
