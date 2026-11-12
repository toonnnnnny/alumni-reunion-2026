"use client";
// บัญชีผู้ใช้ระบบ: Admin สร้างบัญชี Staff / Vendor / Packing และเปิด-ปิดการใช้งาน

import { useState } from "react";
import { Plus } from "lucide-react";
import { createAccount, listAccounts, listRecords, nowIso, updateAccount } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { dateTime } from "@/lib/format";
import type { Role } from "@/lib/types";
import { AdminFrame } from "@/components/AdminFrame";
import { Badge, Button, Card, ErrorText, Field, Loading, Modal, Select, Tabs } from "@/components/ui";

const ROLE_NAME: Record<Role, string> = { user: "ผู้ซื้อ", staff: "Staff", vendor: "ร้านค้า", packing: "Packing", admin: "Admin" };

export default function Accounts() {
  const [tab, setTab] = useState<Role>("staff");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ role: "staff" as Role, name: "", username: "", password: "", phone: "", servicePoint: "จุดบริการ A", shopId: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { data, isLoading, reload } = usePolling(async () => {
    const [accounts, shops] = await Promise.all([listAccounts(), listRecords("shop")]);
    return { accounts, shops };
  });

  if (isLoading || !data) return <AdminFrame title="บัญชีผู้ใช้ระบบ"><Loading /></AdminFrame>;
  const list = data.accounts.filter((a) => a.role === tab);

  async function create() {
    if (!form.name || !form.username || form.password.length < 4) return setError("กรอกชื่อ ชื่อผู้ใช้ และรหัสผ่าน (อย่างน้อย 4 ตัว)");
    if (form.role === "vendor" && !form.shopId) return setError("เลือกร้านที่บัญชีนี้ดูแล");
    if (data!.accounts.some((a) => a.username === form.username)) return setError("ชื่อผู้ใช้นี้มีแล้ว");
    setBusy(true);
    try {
      await createAccount({
        username: form.username, password: form.password, name: form.name, email: "", phone: form.phone, role: form.role,
        servicePoint: form.role === "staff" ? form.servicePoint : undefined, shopId: form.role === "vendor" ? form.shopId : undefined, active: true, createdAt: nowIso(),
      });
      await reload();
      setOpen(false);
      setTab(form.role);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "สร้างไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminFrame title="บัญชีผู้ใช้ระบบ" subtitle="บัญชี Staff ร้านค้า และ Packing สร้างโดย Admin เท่านั้น">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onChange={setTab} tabs={(["staff", "vendor", "packing", "admin"] as Role[]).map((r) => ({ value: r, label: ROLE_NAME[r], count: data.accounts.filter((a) => a.role === r).length }))} />
        <Button onClick={() => { setForm({ ...form, role: tab === "admin" ? "staff" : tab }); setOpen(true); }}><Plus className="size-4" /> สร้างบัญชี</Button>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-paper text-left text-muted">
            <tr>{["ชื่อ", "ชื่อผู้ใช้", "รายละเอียด", "สร้างเมื่อ", "สถานะ"].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id} className="border-t border-line">
                <td className="px-5 py-3.5 font-semibold">{a.name}</td>
                <td className="px-5 py-3.5">{a.username}</td>
                <td className="px-5 py-3.5">{a.role === "staff" ? a.servicePoint : a.role === "vendor" ? data.shops.find((s) => s.id === a.shopId)?.name : a.phone}</td>
                <td className="px-5 py-3.5 text-muted">{dateTime(a.createdAt)}</td>
                <td className="px-5 py-3.5">
                  {a.role === "admin" ? <Badge tone="green">ใช้งานได้</Badge> : (
                    <button onClick={() => updateAccount(a.id, { active: !a.active }).then(reload)}>
                      <Badge tone={a.active ? "green" : "gray"}>{a.active ? "ใช้งานได้ (แตะเพื่อปิด)" : "ปิดใช้งาน (แตะเพื่อเปิด)"}</Badge>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="สร้างบัญชีผู้ใช้ระบบ" footer={<><Button loading={busy} onClick={create} className="flex-1">สร้างบัญชี</Button><Button variant="outline" onClick={() => setOpen(false)} className="flex-1">ยกเลิก</Button></>}>
        <div className="space-y-3">
          <Select label="บทบาท" value={form.role} onChange={(v) => setForm({ ...form, role: v as Role })} options={(["staff", "vendor", "packing"] as Role[]).map((r) => ({ value: r, label: ROLE_NAME[r] }))} />
          <Field label="ชื่อ" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label="ชื่อผู้ใช้" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.trim() })} />
          <Field label="รหัสผ่านชั่วคราว" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Field label="เบอร์โทร" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          {form.role === "staff" && <Select label="จุดบริการ" value={form.servicePoint} onChange={(v) => setForm({ ...form, servicePoint: v })} options={["จุดบริการ A", "จุดบริการ B", "จุดบริการ C"].map((p) => ({ value: p, label: p }))} />}
          {form.role === "vendor" && <Select label="ร้านที่ดูแล" value={form.shopId} onChange={(v) => setForm({ ...form, shopId: v })} options={[{ value: "", label: "เลือกร้าน" }, ...data.shops.map((s) => ({ value: s.id, label: s.name }))]} />}
          <ErrorText text={error} />
        </div>
      </Modal>
    </AdminFrame>
  );
}
