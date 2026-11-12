"use client";
// ฟอร์มข้อมูลร้าน + บัญชีรับเงิน ใช้ทั้งหน้าสร้างร้านและแก้ไขร้าน
import { Field, Select } from "./ui";

export type ShopFormValue = {
  name: string;
  category: string;
  booth: string;
  ownerName: string;
  phone: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
};

export const BANKS = ["กสิกรไทย", "ไทยพาณิชย์", "กรุงเทพ", "กรุงไทย", "กรุงศรีอยุธยา", "ทหารไทยธนชาต", "ออมสิน"];

export function emptyShopForm(): ShopFormValue {
  return { name: "", category: "เครื่องดื่ม", booth: "", ownerName: "", phone: "", bankName: BANKS[0], bankAccount: "", bankAccountName: "" };
}

// ตรวจข้อมูลก่อนบันทึก คืนข้อความผิดพลาด หรือ "" ถ้าผ่าน
export function validateShop(v: ShopFormValue): string {
  if (!v.name || !v.booth || !v.ownerName || !v.phone) return "กรอกข้อมูลร้านให้ครบ";
  if (!/^\d{3}-\d-\d{5}-\d$/.test(v.bankAccount)) return "เลขบัญชีต้องเป็นรูปแบบ 000-0-00000-0";
  if (!v.bankAccountName) return "กรอกชื่อบัญชีให้ตรงกับหน้าสมุดบัญชี";
  return "";
}

export function ShopForm({ value, onChange }: { value: ShopFormValue; onChange: (v: ShopFormValue) => void }) {
  const set = (key: keyof ShopFormValue) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [key]: e.target.value });
  return (
    <div className="space-y-4">
      <p className="font-semibold">ข้อมูลร้าน</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ชื่อร้าน" required value={value.name} onChange={set("name")} />
        <Select label="ประเภทร้าน" value={value.category} onChange={(v) => onChange({ ...value, category: v })} options={["เครื่องดื่ม", "กาแฟและเบเกอรี่", "ของกินเล่น", "ของหวาน", "อาหาร"].map((c) => ({ value: c, label: c }))} />
        <Field label="บูธ" required placeholder="Booth D4 · Main Hall" value={value.booth} onChange={set("booth")} />
        <Field label="ผู้ดูแลร้าน" required value={value.ownerName} onChange={set("ownerName")} />
        <Field label="เบอร์โทร" required value={value.phone} onChange={set("phone")} className="sm:col-span-2" />
      </div>
      <p className="border-t border-line pt-4 font-semibold">บัญชีรับเงินของร้าน (ใช้โอนเงินเมื่อร้านขอถอน)</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="ธนาคาร" value={value.bankName} onChange={(v) => onChange({ ...value, bankName: v })} options={BANKS.map((b) => ({ value: b, label: b }))} />
        <Field label="เลขบัญชี" required placeholder="000-0-00000-0" value={value.bankAccount} onChange={set("bankAccount")} />
        <Field label="ชื่อบัญชี (ตรงกับหน้าสมุดบัญชี)" required value={value.bankAccountName} onChange={set("bankAccountName")} className="sm:col-span-2" />
      </div>
    </div>
  );
}
