"use client";
import { LoginForm } from "@/components/LoginForm";

export default function AdminLogin() {
  return <LoginForm title="Super Admin" subtitle="ระบบจัดการงานเลี้ยงรุ่น" demo={{ username: "admin", password: "1234" }} />;
}
