"use client";
// สร้างร้านค้าใหม่ + บัญชีเข้าสู่ระบบของร้าน (role vendor) ในครั้งเดียว

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createAccount, createRecord, listAccounts, nowIso } from "@/lib/api";
import { AdminFrame } from "@/components/AdminFrame";
import { ShopForm, emptyShopForm, validateShop } from "@/components/ShopForm";
import { Banner, Button, Card, ErrorText, Field } from "@/components/ui";

export default function NewShop() {
  const router = useRouter();
  const [form, setForm] = useState(emptyShopForm());
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const problem = validateShop(form) || (!username || password.length < 4 ? "กรอกชื่อผู้ใช้และรหัสผ่านชั่วคราว (อย่างน้อย 4 ตัว)" : "");
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      const accounts = await listAccounts();
      if (accounts.some((a) => a.username === username)) throw new Error("ชื่อผู้ใช้นี้มีแล้ว");
      const shop = await createRecord("shop", { ...form, balance: 0, menu: [], createdAt: nowIso() });
      await createAccount({ username, password, name: form.ownerName, email: "", phone: form.phone, role: "vendor", shopId: shop.id, active: true, createdAt: nowIso() });
      router.replace(`/admin/shops/${shop.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "สร้างร้านไม่สำเร็จ");
      setBusy(false);
    }
  }

  return (
    <AdminFrame title="สร้างร้านค้า" subtitle="สร้างร้านและบัญชีเข้าสู่ระบบของร้าน" back="/admin/shops">
      <Card className="mx-auto max-w-3xl space-y-5">
        <ShopForm value={form} onChange={setForm} />
        <p className="border-t border-line pt-4 font-semibold">บัญชีเข้าสู่ระบบของร้าน</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ชื่อผู้ใช้" required value={username} onChange={(e) => setUsername(e.target.value.trim())} />
          <Field label="รหัสผ่านชั่วคราว" required value={password} onChange={(e) => setPassword(e.target.value)} hint="ให้ร้านเปลี่ยนรหัสหลังเข้าสู่ระบบครั้งแรก" />
        </div>
        <Banner>สร้างร้านแล้วเพิ่มเมนูได้ในหน้าร้าน</Banner>
        <ErrorText text={error} />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()}>ยกเลิก</Button>
          <Button loading={busy} onClick={save}>สร้างร้านค้า</Button>
        </div>
      </Card>
    </AdminFrame>
  );
}
