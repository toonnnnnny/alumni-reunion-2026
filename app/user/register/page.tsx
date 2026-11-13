"use client";
// สมัครสมาชิกผู้ซื้อ: ข้อมูลชุดนี้จะถูกใช้เป็นข้อมูลของบัตรใบที่ 1 อัตโนมัติ

// Link = ลิงก์เปลี่ยนหน้าโดยไม่โหลดเว็บใหม่
import Link from "next/link";
// useRouter = สั่งเปลี่ยนหน้าด้วยโค้ด
import { useRouter } from "next/navigation";
// useState = ตัวแปรที่เปลี่ยนแล้วหน้าจอวาดใหม่
import { useState } from "react";
// ฟังก์ชันคุยกับ MockAPI: ดึงบัญชีทั้งหมด / สร้างบัญชีใหม่ / เวลาปัจจุบัน
import { createAccount, listAccounts, nowIso } from "@/lib/api";
// useAuth = เรียกใช้ระบบล็อกอิน
import { useAuth } from "@/lib/auth";
// ชิ้นส่วนหน้าจอสำเร็จรูป: ปุ่ม, ข้อความ error, ช่องกรอก
import { Button, ErrorText, Field } from "@/components/ui";

// หน้า /user/register
export default function Register() {
  // ตัวสั่งเปลี่ยนหน้า
  const router = useRouter();
  // หยิบฟังก์ชัน login มาใช้ เพื่อสมัครเสร็จแล้วล็อกอินให้เลย
  const { login } = useAuth();
  // เก็บค่าที่พิมพ์ในฟอร์มทั้ง 5 ช่องไว้ในก้อนเดียว
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  // ข้อความ error ที่จะแสดงสีแดง (ว่าง = ไม่มี error)
  const [error, setError] = useState("");
  // true = กำลังส่ง ปุ่มจะหมุนและกดซ้ำไม่ได้
  const [loading, setLoading] = useState(false);

  // อัปเดตทีละช่อง
  // ...form = คัดลอกค่าเดิมทั้งหมด แล้วแก้แค่ช่องที่พิมพ์ (key)
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });

  // ทำงานตอนกดปุ่มสมัคร
  async function handleSubmit(e: React.FormEvent) {
    // กันเบราว์เซอร์รีเฟรชหน้าเองตอนส่งฟอร์ม
    e.preventDefault();
    // ล้าง error เก่า
    setError("");
    // เช็ก 1: ห้ามมีช่องว่าง
    if (!form.name || !form.email || !form.phone || !form.password) return setError("กรอกข้อมูลให้ครบทุกช่อง");
    // เช็ก 2: อีเมลต้องมีรูปแบบ xxx@xxx.xxx (Regular Expression)
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("รูปแบบอีเมลไม่ถูกต้อง");
    // เช็ก 3: รหัสผ่านอย่างน้อย 4 ตัว
    if (form.password.length < 4) return setError("รหัสผ่านอย่างน้อย 4 ตัวอักษร");
    // เช็ก 4: รหัสผ่านกับยืนยันรหัสต้องตรงกัน
    if (form.password !== form.confirm) return setError("ยืนยันรหัสผ่านไม่ตรงกัน");

    // เริ่มส่ง -> ปุ่มขึ้นสถานะกำลังโหลด
    setLoading(true);
    // try = ลองทำ ถ้าพังจะกระโดดไป catch
    try {
      // await = รอ MockAPI ส่งรายชื่อบัญชีทั้งหมดกลับมา (GET /accounts)
      const accounts = await listAccounts();
      // .some = มีสักบัญชีไหมที่อีเมลซ้ำ ถ้ามี โยน error
      if (accounts.some((a) => a.username.toLowerCase() === form.email.toLowerCase())) throw new Error("อีเมลนี้สมัครไว้แล้ว");
      // สร้างบัญชีใหม่ใน MockAPI (POST /accounts)
      await createAccount({
        // username กับ email เก็บเป็นตัวพิมพ์เล็ก จะได้ล็อกอินแบบพิมพ์ใหญ่/เล็กก็ได้
        username: form.email.trim().toLowerCase(), password: form.password, name: form.name, email: form.email.trim().toLowerCase(), phone: form.phone,
        // role: "user" = บัญชีผู้ซื้อ, active: true = ใช้งานได้
        role: "user", active: true, createdAt: nowIso(),
      });
      // สมัครเสร็จ ล็อกอินให้อัตโนมัติ
      await login(form.email.trim().toLowerCase(), form.password);
      // พาไปหน้า Home
      router.replace("/user");
    // ถ้าขั้นไหนพัง เอาข้อความ error มาแสดง
    } catch (err) {
      setError(err instanceof Error ? err.message : "สมัครไม่สำเร็จ");
    // finally = ทำเสมอไม่ว่าสำเร็จหรือพัง -> หยุดสถานะโหลด
    } finally {
      setLoading(false);
    }
  }

  // ส่วนหน้าตา (JSX) จัดฟอร์มไว้กลางจอด้วย Tailwind: grid + place-items-center
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      {/* onSubmit = กดปุ่ม submit หรือกด Enter แล้วเรียก handleSubmit */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-3xl border border-line bg-white p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold">สมัครสมาชิก</h1>
          <p className="text-sm text-muted">ข้อมูลนี้จะใช้เป็นข้อมูลบัตรใบที่ 1 ของคุณ</p>
        </div>
        {/* ช่องกรอกแต่ละช่อง: value = ค่าปัจจุบัน, onChange = พิมพ์แล้วอัปเดต form */}
        <Field label="ชื่อ - นามสกุล" required value={form.name} onChange={set("name")} />
        <Field label="อีเมล" required type="email" value={form.email} onChange={set("email")} hint="ใช้เข้าสู่ระบบ และรับอีเมลบัตร" />
        <Field label="เบอร์โทรศัพท์" required value={form.phone} onChange={set("phone")} />
        <Field label="รหัสผ่าน" required type="password" value={form.password} onChange={set("password")} />
        <Field label="ยืนยันรหัสผ่าน" required type="password" value={form.confirm} onChange={set("confirm")} />
        {/* แสดง error สีแดง (ถ้ามี) */}
        <ErrorText text={error} />
        {/* ปุ่มสมัคร loading = หมุนตอนกำลังส่ง */}
        <Button type="submit" full loading={loading}>
          สมัครสมาชิก
        </Button>
        {/* ลิงก์ไปหน้าเข้าสู่ระบบ */}
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
