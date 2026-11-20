"use client";
// เสื้อและสต็อก: ดูสต็อกแยกสี/ไซซ์ แก้จำนวนได้ทันที + เพิ่มเสื้อแบบใหม่

import { ShirtThumb } from "@/components/ShirtImage";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createRecord, deleteRecord, listRecords, nowIso, updateRecord } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { baht, num } from "@/lib/format";
import { totalStock } from "@/lib/stock";
import { SIZES, type Shirt } from "@/lib/types";
import { AdminFrame } from "@/components/AdminFrame";
import { Badge, Button, Card, ErrorText, Field, Loading, Modal, StatCard } from "@/components/ui";
import { SlipPicker } from "@/components/SlipPicker";

export default function Shirts() {
  const { data, isLoading, reload } = usePolling(() => listRecords("shirt"), 10000);
  const [editing, setEditing] = useState<Shirt | null>(null);
  const [adding, setAdding] = useState(false);
  // เสื้อที่กำลังจะลบ (เปิดหน้าต่างยืนยัน)
  const [deleting, setDeleting] = useState<Shirt | null>(null);
  const [newShirt, setNewShirt] = useState({ name: "", price: "", detail: "", colors: "", image: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (isLoading || !data) return <AdminFrame title="เสื้อและสต็อก"><Loading /></AdminFrame>;

  // แก้ตัวเลขสต็อกในช่อง (เก็บใน state ก่อน กดบันทึกค่อยส่ง API)
  function setStock(color: string, size: string, value: string) {
    if (!editing) return;
    const n = parseInt(value.replace(/\D/g, ""), 10) || 0;
    setEditing({ ...editing, stock: { ...editing.stock, [color]: { ...editing.stock[color], [size]: n } } });
  }

  async function saveStock() {
    if (!editing) return;
    setBusy(true);
    try {
      await updateRecord("shirt", editing.id, { stock: editing.stock, price: editing.price, name: editing.name });
      await reload();
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  // ลบเสื้อ: ถ้ายังมีคำสั่งซื้อเสื้อรุ่นนี้ที่ยังไม่ชำระสำเร็จ (รอตรวจ/ถูกปฏิเสธ) จะไม่ให้ลบ เพราะตอนอนุมัติระบบต้องหาเสื้อเพื่อตัดสต็อก
  async function removeShirt() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      const orders = await listRecords("order");
      const open = orders.filter((o) => o.type === "shirt" && o.status !== "paid" && o.items.some((i) => i.shirtId === deleting.id));
      if (open.length > 0) {
        setError(`ลบไม่ได้ ยังมีคำสั่งซื้อเสื้อรุ่นนี้ที่ยังไม่เสร็จ ${open.length} รายการ (${open.map((o) => o.orderNo).join(", ")}) ให้อนุมัติหรือจัดการก่อน`);
        return;
      }
      await deleteRecord(deleting.id);
      await reload();
      setDeleting(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function addShirt() {
    const colors = newShirt.colors.split(",").map((c) => c.trim()).filter(Boolean);
    const price = parseInt(newShirt.price, 10) || 0;
    if (!newShirt.name || price <= 0 || colors.length === 0) return setError("กรอกชื่อ ราคา และสีอย่างน้อย 1 สี");
    setBusy(true);
    try {
      const stock: Shirt["stock"] = {};
      colors.forEach((c) => (stock[c] = Object.fromEntries(SIZES.map((s) => [s, 0]))));
      await createRecord("shirt", { name: newShirt.name, price, detail: newShirt.detail, colors, stock, ...(newShirt.image ? { image: newShirt.image } : {}), createdAt: nowIso() });
      await reload();
      setAdding(false);
      setNewShirt({ name: "", price: "", detail: "", colors: "", image: "" });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "เพิ่มไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminFrame title="เสื้อและสต็อก" subtitle="สต็อกลดเองเมื่อ Admin อนุมัติคำสั่งซื้อเสื้อ">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="แบบเสื้อ" value={data.length} unit="แบบ" />
        <StatCard label="สต็อกรวม" value={num(data.reduce((s, x) => s + totalStock(x.stock), 0))} unit="ตัว" />
        <StatCard label="ไซซ์ที่หมด" value={data.reduce((s, x) => s + Object.values(x.stock).reduce((a, sizes) => a + Object.values(sizes).filter((n) => n === 0).length, 0), 0)} unit="รายการ" tone="red" />
      </div>
      <div className="flex justify-end"><Button onClick={() => setAdding(true)}><Plus className="size-4" /> เพิ่มเสื้อ</Button></div>
      <div className="grid gap-6 xl:grid-cols-2">
        {data.map((shirt) => (
          <Card key={shirt.id} className="overflow-x-auto">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShirtThumb name={shirt.name} image={shirt.image} size="size-16" />
                <div>
                <p className="font-semibold">{shirt.name}</p>
                <p className="text-sm text-muted">{baht(shirt.price)} · คงเหลือ {totalStock(shirt.stock)} ตัว</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(JSON.parse(JSON.stringify(shirt)))}>แก้ไขสต็อก</Button>
                <Button size="sm" variant="danger" onClick={() => { setError(""); setDeleting(shirt); }}><Trash2 className="size-4" /> ลบ</Button>
              </div>
            </div>
            <table className="w-full min-w-[420px] text-sm">
              <thead><tr className="text-left text-muted"><th className="py-2">สี</th>{SIZES.map((s) => <th key={s} className="py-2 text-center">{s}</th>)}</tr></thead>
              <tbody>
                {shirt.colors.map((c) => (
                  <tr key={c} className="border-t border-line">
                    <td className="py-2.5 font-semibold">{c}</td>
                    {SIZES.map((s) => {
                      const n = shirt.stock[c]?.[s] ?? 0;
                      return <td key={s} className="py-2.5 text-center">{n === 0 ? <Badge tone="red">หมด</Badge> : n < 5 ? <Badge tone="amber">{n}</Badge> : n}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
      <ErrorText text={error} />

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`แก้ไข ${editing?.name ?? ""}`} footer={<><Button loading={busy} onClick={saveStock} className="flex-1">บันทึก</Button><Button variant="outline" onClick={() => setEditing(null)} className="flex-1">ยกเลิก</Button></>}>
        {editing && (
          <div className="space-y-3">
            <Field label="ราคา (บาท)" inputMode="numeric" value={editing.price} onChange={(e) => setEditing({ ...editing, price: parseInt(e.target.value.replace(/\D/g, ""), 10) || 0 })} />
            {editing.colors.map((c) => (
              <div key={c}>
                <p className="mb-1 text-sm font-semibold">สี{c}</p>
                <div className="grid grid-cols-5 gap-2">
                  {SIZES.map((s) => (
                    <label key={s} className="text-center text-xs text-muted">
                      {s}
                      <input inputMode="numeric" value={editing.stock[c]?.[s] ?? 0} onChange={(e) => setStock(c, s, e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line text-center text-sm text-ink" />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => { setDeleting(null); setError(""); }} title="ลบเสื้อแบบนี้?" footer={<><Button variant="danger" loading={busy} onClick={removeShirt} className="flex-1">ลบเสื้อ</Button><Button variant="outline" onClick={() => { setDeleting(null); setError(""); }} className="flex-1">ยกเลิก</Button></>}>
        <div className="space-y-3 text-sm">
          <p>ต้องการลบ <span className="font-semibold">{deleting?.name}</span> ใช่ไหม</p>
          <p className="text-muted">ลบแล้วเสื้อรุ่นนี้จะหายจากหน้าร้านและกู้คืนไม่ได้ คำสั่งซื้อที่ชำระแล้วยังเก็บชื่อเสื้อเดิมไว้</p>
          <ErrorText text={error} />
        </div>
      </Modal>

      <Modal open={adding} onClose={() => setAdding(false)} title="เพิ่มเสื้อแบบใหม่" footer={<><Button loading={busy} onClick={addShirt} className="flex-1">เพิ่ม</Button><Button variant="outline" onClick={() => setAdding(false)} className="flex-1">ยกเลิก</Button></>}>
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-sm font-semibold">รูปเสื้อ</p>
            <SlipPicker value={newShirt.image} onChange={(image) => setNewShirt({ ...newShirt, image })} title="อัปโหลดรูปเสื้อ" hint="JPG, PNG · วางรูปด้วย Ctrl/Cmd+V ได้" maxSize={480} maxChars={45000} alt="รูปเสื้อ" />
          </div>
          <Field label="ชื่อเสื้อ" value={newShirt.name} onChange={(e) => setNewShirt({ ...newShirt, name: e.target.value })} />
          <Field label="ราคา (บาท)" inputMode="numeric" value={newShirt.price} onChange={(e) => setNewShirt({ ...newShirt, price: e.target.value.replace(/\D/g, "") })} />
          <Field label="รายละเอียด" value={newShirt.detail} onChange={(e) => setNewShirt({ ...newShirt, detail: e.target.value })} />
          <Field label="สี (คั่นด้วย ,)" placeholder="กรม, ขาว" value={newShirt.colors} onChange={(e) => setNewShirt({ ...newShirt, colors: e.target.value })} hint="สร้างแล้วค่อยกรอกจำนวนสต็อกแต่ละไซซ์" />
        </div>
      </Modal>
    </AdminFrame>
  );
}
