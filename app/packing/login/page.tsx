"use client";
import { LoginForm } from "@/components/LoginForm";

export default function PackingLogin() {
  return <LoginForm title="Packing เข้าสู่ระบบ" subtitle="ฝ่ายแพ็คและจัดส่งเสื้อ" demo={{ username: "packing", password: "1234" }} />;
}
