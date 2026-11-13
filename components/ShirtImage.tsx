// รูปเสื้อแต่ละรุ่น: จับคู่จากชื่อสินค้า (ไฟล์อยู่ใน public/shirts)
import { Shirt as ShirtIcon } from "lucide-react";

const MAP: [RegExp, string][] = [
  [/classic|เสื้อยืด/i, "/shirts/classic.jpg"],
  [/polo|โปโล/i, "/shirts/polo.jpg"],
  [/oversize|โอเวอร์ไซซ์/i, "/shirts/oversize.jpg"],
  [/แขนยาว|long/i, "/shirts/longsleeve.jpg"],
];

export function shirtImage(name: string): string | null {
  for (const [re, src] of MAP) if (re.test(name)) return src;
  return null;
}

// รูปเต็มกรอบ (หน้าร้าน/รายละเอียด) ถ้าไม่มีรูปจะแสดงไอคอนแทน
export function ShirtImage({ name, className = "", iconClass = "size-16" }: { name: string; className?: string; iconClass?: string }) {
  const src = shirtImage(name);
  return (
    <div className={`grid place-items-center overflow-hidden bg-navy-soft text-navy ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        <ShirtIcon className={iconClass} strokeWidth={1.2} />
      )}
    </div>
  );
}

// รูปย่อสำหรับรายการ (ตะกร้า, รับเสื้อ, แพ็กของ, แอดมิน)
export function ShirtThumb({ name, size = "size-12" }: { name: string; size?: string }) {
  return <ShirtImage name={name} className={`${size} shrink-0 rounded-xl`} iconClass="size-6" />;
}
