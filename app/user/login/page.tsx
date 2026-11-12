"use client";
import { LoginForm } from "@/components/LoginForm";

export default function UserLogin() {
  return (
    <LoginForm
      title="เข้าสู่ระบบ"
      subtitle="Alumni Reunion 2026 · สำหรับผู้ซื้อบัตร"
      usernameLabel="อีเมล"
      demo={{ username: "TEST1@gmail.com", password: "1234" }}
      registerHref="/user/register"
    />
  );
}
