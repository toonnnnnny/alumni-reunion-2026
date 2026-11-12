"use client";
// สมัครสมาชิกผู้ซื้อ: ข้อมูลชุดนี้จะถูกใช้เป็นข้อมูลของบัตรใบที่ 1 อัตโนมัติ

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createAccount, listAccounts, nowIso } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, ErrorText, Field } from "@/components/ui";

export default function Register() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // อัปเดตทีละช่อง
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.phone || !form.password) return setError("กรอกข้อมูลให้ครบทุกช่อง");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("รูปแบบอีเมลไม่ถูกต้อง");
    if (form.password.length < 4) return setError("รหัสผ่านอย่างน้อย 4 ตัวอักษร");
    if (form.password !== form.confirm) return setError("ยืนยันรหัสผ่านไม่ตรงกัน");

    setLoading(true);
    try {
      const accounts = await listAccounts();
      if (accounts.some((a) => a.username.toLowerCase() === form.email.toLowerCase())) throw new Error("อีเมลนี้สมัครไว้แล้ว");
      await createAccount({
        username: form.email.trim().toLowerCase(), password: form.password, name: form.name, email: form.email.trim().toLowerCase(), phone: form.phone,
        role: "user", active: true, createdAt: nowIso(),
      });
      await login(form.email.trim().toLowerCase(), form.password);
      router.replace("/user");
    } catch (err) {
      setError(err instanceof Error ? err.message : "สมัครไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-3xl border border-line bg-white p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold">สมัครสมาชิก</h1>
          <p className="text-sm text-muted">ข้อมูลนี้จะใช้เป็นข้อมูลบัตรใบที่ 1 ของคุณ</p>
        </div>
        <Field label="ชื่อ - นามสกุล" required value={form.name} onChange={set("name")} />
        <Field label="อีเมล" required type="email" value={form.email} onChange={set("email")} hint="ใช้เข้าสู่ระบบ และรับอีเมลบัตร" />
        <Field label="เบอร์โทรศัพท์" required value={form.phone} onChange={set("phone")} />
        <Field label="รหัสผ่าน" required type="password" value={form.password} onChange={set("password")} />
        <Field label="ยืนยันรหัสผ่าน" required type="password" value={form.confirm} onChange={set("confirm")} />
        <ErrorText text={error} />
        <Button type="submit" full loading={loading}>
          สมัครสมาชิก
        </Button>
        <p className="text-center text-sm text-muted">
          มีบัญชีแล้ว?{" "}
          <Link href="/user/login" className="font-semibold text-navy">
            เข้าสู่ระบบ
          </Link>
        </p>
      </form>
    </div>
  );
}
