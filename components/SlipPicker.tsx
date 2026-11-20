"use client";
// ช่องเลือกรูปสลิป: เลือกไฟล์ -> ย่อรูป -> แสดงตัวอย่าง -> ส่งข้อความ base64 กลับให้หน้าแม่
// ใช้ useRef กับ input type=file เพื่อเปิดหน้าต่างเลือกไฟล์จากปุ่มของเราเอง

// useRef = จับ input เลือกไฟล์ที่ซ่อนอยู่, useState = ตัวแปรของหน้า
import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
// resizeImage = ย่อรูป (lib/image.ts)
import { resizeImage } from "@/lib/image";
import { cx } from "./ui";

// value = รูปปัจจุบัน, onChange = ส่งรูปกลับไปให้หน้าแม่
// maxSize/maxChars = ขนาดรูปสูงสุดหลังย่อ (ใช้กับรูปเสื้อที่ต้องเล็กกว่าสลิป), alt = คำอธิบายรูป
export function SlipPicker({ value, onChange, title = "อัปโหลดสลิปการโอน", hint = "JPG, PNG · ระบบย่อรูปให้อัตโนมัติ", maxSize, maxChars, alt = "สลิป" }: { value: string; onChange: (dataUrl: string) => void; title?: string; hint?: string; maxSize?: number; maxChars?: number; alt?: string }) {
  // ตัวชี้ไปที่ input type=file
  const inputRef = useRef<HTMLInputElement>(null);
  // error
  const [error, setError] = useState("");
  // กำลังย่อรูป
  const [busy, setBusy] = useState(false);

  // ทำงานเมื่อเลือกไฟล์แล้ว
  async function handleFile(file: File | undefined) {
    // ไม่ได้เลือก -> ไม่ทำ
    if (!file) return;
    // เริ่มย่อรูป
    setBusy(true);
    setError("");
    try {
      // ย่อรูป -> ได้ข้อความ base64 -> ส่งให้หน้าแม่เก็บ
      onChange(await resizeImage(file, maxSize, maxChars));
    } catch (e) {
      // ไฟล์ไม่ใช่รูป / อ่านไม่ได้ -> แสดง error
      setError(e instanceof Error ? e.message : "อ่านรูปไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    // ส่วนหน้าตา
    <div>
      {/* ปุ่มกรอบเส้นประ กดแล้วไปกด input เลือกไฟล์ที่ซ่อนอยู่แทน */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cx("flex w-full flex-col items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-slate-300 bg-slate-50 p-5 text-center", value && "border-solid border-line bg-white")}
      >
        {/* มีรูปแล้ว -> แสดงตัวอย่างสลิป / ยังไม่มี -> ไอคอนรูป */}
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={alt} className="max-h-72 rounded-xl object-contain" />
        ) : (
          <ImagePlus className="size-8 text-muted" />
        )}
        {/* ข้อความบนปุ่ม: กำลังย่อรูป / เปลี่ยนรูป / อัปโหลดสลิป */}
        <span className="font-semibold text-navy">{busy ? "กำลังย่อรูป..." : value ? "เปลี่ยนรูป" : title}</span>
        {!value && <span className="text-xs text-muted">{hint}</span>}
      </button>
      {/* input เลือกไฟล์ (ซ่อนไว้) รับเฉพาะรูป เลือกแล้วเรียก handleFile */}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      {/* error สีแดง */}
      {error && <p className="mt-2 text-sm text-bad">{error}</p>}
    </div>
  );
}
