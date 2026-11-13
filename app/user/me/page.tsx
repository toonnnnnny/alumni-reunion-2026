"use client";
// My Event: โปรไฟล์ (แก้ชื่อ/เบอร์ได้ -> ใช้เป็นข้อมูลบัตรใบที่ 1 ครั้งต่อไป) + ทางลัด

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, LogOut, Package, Ticket, Wallet } from "lucide-react";
// updateAccount = แก้ข้อมูลบัญชีใน MockAPI
import { updateAccount } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useMyData } from "@/lib/useMyData";
// initials = ตัวอักษรย่อของชื่อ (ใส่ในวงกลมรูปโปรไฟล์)
import { initials, num } from "@/lib/format";
import { TopBar, MobileBody } from "@/components/shells";
import { NoticeBell } from "@/components/NoticeBell";
import { Button, Card, ErrorText, Field } from "@/components/ui";

// หน้า /user/me (My Event)
export default function MyEvent() {
  // account = ข้อมูลบัญชี, refresh = โหลดบัญชีใหม่, logout = ออกจากระบบ
  const { account, refresh, logout } = useAuth();
  const router = useRouter();
  // ข้อมูลของฉัน (ใช้ทำลิงก์กระเป๋าโทเคนของแต่ละบัตร)
  const { data } = useMyData();
  // true = อยู่ในโหมดแก้ไขโปรไฟล์
  const [editing, setEditing] = useState(false);
  // ชื่อที่กำลังแก้
  const [name, setName] = useState("");
  // เบอร์ที่กำลังแก้
  const [phone, setPhone] = useState("");
  // กำลังบันทึก
  const [saving, setSaving] = useState(false);
  // error
  const [error, setError] = useState("");

  // useEffect = พอได้ข้อมูลบัญชีแล้ว ใส่ชื่อและเบอร์เดิมลงในช่องแก้ไข
  useEffect(() => {
    if (account) {
      setName(account.name);
      setPhone(account.phone);
    }
  }, [account]);

  // ยังโหลดบัญชีไม่เสร็จ -> ยังไม่แสดง
  if (!account) return null;
  const tickets = data?.tickets ?? [];

  // กดบันทึกโปรไฟล์
  async function save() {
    // ห้ามชื่อหรือเบอร์ว่าง
    if (!name.trim() || !phone.trim()) return setError("กรอกชื่อและเบอร์โทรให้ครบ");
    // เริ่มบันทึก -> ปุ่มหมุน
    setSaving(true);
    try {
      // บันทึกชื่อ/เบอร์ใหม่ลง MockAPI (PUT /accounts/id) trim = ตัดช่องว่างหัวท้าย
      await updateAccount(account!.id, { name: name.trim(), phone: phone.trim() });
      // โหลดข้อมูลบัญชีใหม่ ทุกหน้าจะเห็นชื่อใหม่
      await refresh();
      // ปิดโหมดแก้ไข
      setEditing(false);
      setError("");
    // พัง -> แสดง error
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      // หยุดหมุนเสมอ
      setSaving(false);
    }
  }

  // รายการเมนูลัด: คำสั่งซื้อ, บัตร, และกระเป๋าโทเคนของทุกบัตร (...tickets.map = เพิ่มทีละใบ)
  const links = [
    { href: "/user/orders", label: "คำสั่งซื้อของฉัน", icon: <Package className="size-5" /> },
    { href: "/user/tickets", label: "บัตรของฉัน", icon: <Ticket className="size-5" /> },
    ...tickets.map((t) => ({ href: `/user/wallet/${t.ticketNo}`, label: `กระเป๋าโทเคน ${t.ticketNo} · ${num(t.tokens)} โทเคน`, icon: <Wallet className="size-5" /> })),
  ];

  return (
    // ส่วนหน้าตา
    <>
      <TopBar title="My Event" right={<NoticeBell />} />
      <MobileBody>
        {/* การ์ดโปรไฟล์: วงกลมตัวย่อ + ชื่อ + อีเมล + ปุ่มแก้ไข */}
        <Card>
          <div className="flex items-center gap-3">
            <span className="grid size-14 place-items-center rounded-full bg-navy text-lg font-bold text-white">{initials(account.name)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{account.name}</p>
              <p className="truncate text-sm text-muted">{account.email}</p>
            </div>
            {!editing && <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>แก้ไขโปรไฟล์</Button>}
          </div>
          {/* โหมดแก้ไข: ช่องชื่อ, อีเมล (แก้ไม่ได้), เบอร์ + ปุ่มยกเลิก/บันทึก */}
          {editing && (
            <div className="mt-4 space-y-3">
              <Field label="ชื่อ - นามสกุล" value={name} onChange={(e) => setName(e.target.value)} />
              <Field label="อีเมล" value={account.email} disabled hint="อีเมลใช้เข้าสู่ระบบ เปลี่ยนไม่ได้" />
              <Field label="เบอร์โทรศัพท์" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <p className="text-xs text-muted">ข้อมูลนี้ใช้กับบัตรใบที่ 1 ของการซื้อครั้งถัดไป</p>
              <ErrorText text={error} />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setEditing(false)}>ยกเลิก</Button>
                <Button loading={saving} onClick={save}>บันทึก</Button>
              </div>
            </div>
          )}
        </Card>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {/* วนสร้างเมนูลัดแต่ละอัน */}
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="flex items-center gap-3 px-4 py-4">
              <span className="text-navy">{l.icon}</span>
              <span className="flex-1 text-sm font-semibold">{l.label}</span>
              <ChevronRight className="size-4 text-muted" />
            </Link>
          ))}
        </div>
        {/* ปุ่มออกจากระบบ: logout() ลบ reunion_session_user ออกจาก localStorage แล้วไปหน้า login */}
        <Button full variant="danger" onClick={() => { logout(); router.replace("/user/login"); }}>
          <LogOut className="size-4" /> ออกจากระบบ
        </Button>
      </MobileBody>
    </>
  );
}
