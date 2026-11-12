"use client";
// ช่องเลือกรูปสลิป: เลือกไฟล์ -> ย่อรูป -> แสดงตัวอย่าง -> ส่งข้อความ base64 กลับให้หน้าแม่
// ใช้ useRef กับ input type=file เพื่อเปิดหน้าต่างเลือกไฟล์จากปุ่มของเราเอง

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { resizeImage } from "@/lib/image";
import { cx } from "./ui";

export function SlipPicker({ value, onChange, title = "อัปโหลดสลิปการโอน", hint = "JPG, PNG · ระบบย่อรูปให้อัตโนมัติ" }: { value: string; onChange: (dataUrl: string) => void; title?: string; hint?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await resizeImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "อ่านรูปไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cx("flex w-full flex-col items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-slate-300 bg-slate-50 p-5 text-center", value && "border-solid border-line bg-white")}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="สลิป" className="max-h-72 rounded-xl object-contain" />
        ) : (
          <ImagePlus className="size-8 text-muted" />
        )}
        <span className="font-semibold text-navy">{busy ? "กำลังย่อรูป..." : value ? "เปลี่ยนรูป" : title}</span>
        {!value && <span className="text-xs text-muted">{hint}</span>}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      {error && <p className="mt-2 text-sm text-bad">{error}</p>}
    </div>
  );
}
