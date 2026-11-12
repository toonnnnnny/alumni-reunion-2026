"use client";
// My Event: โปรไฟล์ (แก้ชื่อ/เบอร์ได้ -> ใช้เป็นข้อมูลบัตรใบที่ 1 ครั้งต่อไป) + ทางลัด

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, LogOut, Package, Ticket, Wallet } from "lucide-react";
import { updateAccount } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useMyData } from "@/lib/useMyData";
import { initials, num } from "@/lib/format";
import { TopBar, MobileBody } from "@/components/shells";
import { NoticeBell } from "@/components/NoticeBell";
import { Button, Card, ErrorText, Field } from "@/components/ui";

export default function MyEvent() {
  const { account, refresh, logout } = useAuth();
  const router = useRouter();
  const { data } = useMyData();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (account) {
      setName(account.name);
      setPhone(account.phone);
    }
  }, [account]);

  if (!account) return null;
  const tickets = data?.tickets ?? [];

  async function save() {
    if (!name.trim() || !phone.trim()) return setError("กรอกชื่อและเบอร์โทรให้ครบ");
    setSaving(true);
    try {
      await updateAccount(account!.id, { name: name.trim(), phone: phone.trim() });
      await refresh();
      setEditing(false);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  const links = [
    { href: "/user/orders", label: "คำสั่งซื้อของฉัน", icon: <Package className="size-5" /> },
    { href: "/user/tickets", label: "บัตรของฉัน", icon: <Ticket className="size-5" /> },
    ...tickets.map((t) => ({ href: `/user/wallet/${t.ticketNo}`, label: `กระเป๋าโทเคน ${t.ticketNo} · ${num(t.tokens)} โทเคน`, icon: <Wallet className="size-5" /> })),
  ];

  return (
    <>
      <TopBar title="My Event" right={<NoticeBell />} />
      <MobileBody>
        <Card>
          <div className="flex items-center gap-3">
            <span className="grid size-14 place-items-center rounded-full bg-navy text-lg font-bold text-white">{initials(account.name)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{account.name}</p>
              <p className="truncate text-sm text-muted">{account.email}</p>
            </div>
            {!editing && <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>แก้ไขโปรไฟล์</Button>}
          </div>
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
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="flex items-center gap-3 px-4 py-4">
              <span className="text-navy">{l.icon}</span>
              <span className="flex-1 text-sm font-semibold">{l.label}</span>
              <ChevronRight className="size-4 text-muted" />
            </Link>
          ))}
        </div>
        <Button full variant="danger" onClick={() => { logout(); router.replace("/user/login"); }}>
          <LogOut className="size-4" /> ออกจากระบบ
        </Button>
      </MobileBody>
    </>
  );
}
