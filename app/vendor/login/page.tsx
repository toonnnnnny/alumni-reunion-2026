"use client";
import { LoginForm } from "@/components/LoginForm";

export default function VendorLogin() {
  return <LoginForm title="ร้านค้าเข้าสู่ระบบ" subtitle="บัญชีร้านสร้างโดย Admin" demo={{ username: "bubbletea.d2", password: "1234" }} />;
}
