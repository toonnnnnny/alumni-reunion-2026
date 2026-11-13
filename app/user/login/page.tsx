"use client";
// ใช้ฟอร์มล็อกอินตัวกลาง (ใช้ร่วมกันทุกบทบาท) ตัวตรวจรหัสอยู่ใน lib/auth.tsx ฟังก์ชัน login()
import { LoginForm } from "@/components/LoginForm";

// หน้า /user/login
export default function UserLogin() {
  return (
    // ส่งค่าเข้าไปให้ฟอร์ม: หัวข้อ, ป้ายช่องกรอก, บัญชีตัวอย่าง, ลิงก์ไปหน้าสมัคร
    <LoginForm
      title="เข้าสู่ระบบ"
      subtitle="Alumni Reunion 2026 · สำหรับผู้ซื้อบัตร"
      usernameLabel="อีเมล"
      demo={{ username: "TEST1@gmail.com", password: "1234" }}
      registerHref="/user/register"
    />
  );
}
