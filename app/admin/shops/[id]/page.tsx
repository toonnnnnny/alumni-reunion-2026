"use client";
// รายละเอียดร้าน: ข้อมูลร้าน + บัญชีรับเงิน (แก้ได้) + เมนูและราคาโทเคน (เพิ่ม/แก้ราคา/ปิดขาย/ลบ)

import { use, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { getRecord, listRecords, updateRecord } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { isToday, num } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import { AdminFrame } from "@/components/AdminFrame";
import { ShopForm, validateShop, type ShopFormValue } from "@/components/ShopForm";
import { Badge, Button, Card, CardTitle, ErrorText, Field, InfoRow, Loading, Modal, Select } from "@/components/ui";

export default function ShopDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, reload } = usePolling(async () => {
    const [shop, txs] = await Promise.all([getRecord("shop", id), listRecords("tx")]);
    return { shop, sales: txs.filter((t) => t.type === "sale" && t.shopId === id) };
  });
  const [editShop, setEditShop] = useState<ShopFormValue | null>(null);
  const [editMenu, setEditMenu] = useState<MenuItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (isLoading || !data) return <AdminFrame title="ร้านค้า" back="/admin/shops"><Loading /></AdminFrame>;
  const { shop, sales } = data;
  const today = sales.filter((t) => isToday(t.createdAt));

  async function saveShop() {
    if (!editShop) return;
    const problem = validateShop(editShop);
    if (problem) return setError(problem);
    setBusy(true);
    try {
      await updateRecord("shop", shop.id, editShop);
      await reload();
      setEditShop(null);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  // บันทึกเมนู: ถ้า id มีอยู่แล้ว = แก้ไข ไม่งั้น = เพิ่มใหม่
  async function saveMenu(menu: MenuItem[]) {
    setBusy(true);
    try {
      await updateRecord("shop", shop.id, { menu });
      await reload();
      setEditMenu(null);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  function submitMenu() {
    if (!editMenu) return;
    if (!editMenu.name.trim() || editMenu.price <= 0) return setError("กรอกชื่อเมนูและราคาโทเคนมากกว่า 0");
    const exists = shop.menu.some((m) => m.id === editMenu.id);
    saveMenu(exists ? shop.menu.map((m) => (m.id === editMenu.id ? editMenu : m)) : [...shop.menu, editMenu]);
  }

  return (
    <AdminFrame title={shop.name} subtitle={`${shop.category} · ${shop.booth}`} back="/admin/shops">
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardTitle right={<Button size="sm" variant="ghost" onClick={() => { const { name, category, booth, ownerName, phone, bankName, bankAccount, bankAccountName } = shop; setEditShop({ name, category, booth, ownerName, phone, bankName, bankAccount, bankAccountName }); }}><Pencil className="size-4" /> แก้ไข</Button>}>ข้อมูลร้าน</CardTitle>
            <InfoRow label="บูธ" value={shop.booth} />
            <InfoRow label="ผู้ดูแลร้าน" value={shop.ownerName} />
            <InfoRow label="เบอร์โทร" value={shop.phone} />
            <InfoRow label="บัญชีรับเงิน" value={`${shop.bankName} · ${shop.bankAccount}`} />
            <InfoRow label="ชื่อบัญชี" value={shop.bankAccountName} />
          </Card>
          <Card>
            <CardTitle>ยอดขาย</CardTitle>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl bg-paper p-3"><p className="text-xs text-muted">วันนี้</p><p className="font-bold">{num(today.reduce((s, t) => s - t.amount, 0))}</p></div>
              <div className="rounded-xl bg-paper p-3"><p className="text-xs text-muted">รายการวันนี้</p><p className="font-bold">{today.length}</p></div>
              <div className="rounded-xl bg-paper p-3"><p className="text-xs text-muted">ถอนได้</p><p className="font-bold">{num(shop.balance)}</p></div>
            </div>
          </Card>
        </div>
        <Card className="overflow-x-auto p-0">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="font-semibold">เมนูและราคาโทเคน</p>
              <p className="text-xs text-muted">ร้านค้าแก้ราคาเองไม่ได้ · แก้ได้ที่ Admin เท่านั้น</p>
            </div>
            <Button onClick={() => setEditMenu({ id: `m${Date.now()}`, name: "", price: 0, category: "เครื่องดื่ม", active: true })}><Plus className="size-4" /> เพิ่มเมนู</Button>
          </div>
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-paper text-left text-muted">
              <tr>{["เมนู", "หมวด", "ราคา", "สถานะ", ""].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {shop.menu.map((m) => (
                <tr key={m.id} className="border-t border-line">
                  <td className="px-5 py-3 font-semibold">{m.name}</td>
                  <td className="px-5 py-3">{m.category}</td>
                  <td className="px-5 py-3 font-semibold">{m.price} <span className="text-xs font-normal text-muted">โทเคน</span></td>
                  <td className="px-5 py-3">
                    <button onClick={() => saveMenu(shop.menu.map((x) => (x.id === m.id ? { ...x, active: !x.active } : x)))}>
                      <Badge tone={m.active ? "green" : "gray"}>{m.active ? "ขายอยู่" : "ปิดขาย"}</Badge>
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setEditMenu(m)} className="mr-2 text-navy" aria-label="แก้ไข"><Pencil className="size-4" /></button>
                    <button onClick={() => confirm(`ลบเมนู ${m.name}?`) && saveMenu(shop.menu.filter((x) => x.id !== m.id))} className="text-bad" aria-label="ลบ"><Trash2 className="size-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shop.menu.length === 0 && <p className="p-8 text-center text-sm text-muted">ยังไม่มีเมนู</p>}
        </Card>
      </div>
      <ErrorText text={error} />

      <Modal open={!!editShop} onClose={() => setEditShop(null)} title="แก้ไขข้อมูลร้าน" footer={<><Button loading={busy} onClick={saveShop} className="flex-1">บันทึก</Button><Button variant="outline" onClick={() => setEditShop(null)} className="flex-1">ยกเลิก</Button></>}>
        {editShop && <ShopForm value={editShop} onChange={setEditShop} />}
      </Modal>

      <Modal open={!!editMenu} onClose={() => setEditMenu(null)} title={shop.menu.some((m) => m.id === editMenu?.id) ? "แก้ไขเมนู" : "เพิ่มเมนู"} footer={<><Button loading={busy} onClick={submitMenu} className="flex-1">บันทึก</Button><Button variant="outline" onClick={() => setEditMenu(null)} className="flex-1">ยกเลิก</Button></>}>
        {editMenu && (
          <div className="space-y-3">
            <Field label="ชื่อเมนู" value={editMenu.name} onChange={(e) => setEditMenu({ ...editMenu, name: e.target.value })} />
            <Field label="ราคา (โทเคน)" inputMode="numeric" value={editMenu.price || ""} onChange={(e) => setEditMenu({ ...editMenu, price: parseInt(e.target.value.replace(/\D/g, ""), 10) || 0 })} />
            <Select label="หมวด" value={editMenu.category} onChange={(v) => setEditMenu({ ...editMenu, category: v })} options={["เครื่องดื่ม", "ขนม", "ของกินเล่น", "อาหาร"].map((c) => ({ value: c, label: c }))} />
          </div>
        )}
      </Modal>
    </AdminFrame>
  );
}
