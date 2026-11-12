"use client";
// แสดงรูป QR Code จากข้อความ ใช้ library qrcode แปลงเป็นรูป (data URL)

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrImage({ text, size = 240, className }: { text: string; size?: number; className?: string }) {
  const [src, setSrc] = useState("");

  // สร้างรูปใหม่ทุกครั้งที่ข้อความเปลี่ยน
  useEffect(() => {
    QRCode.toDataURL(text, { width: size * 2, margin: 1, color: { dark: "#1b2433", light: "#ffffff" } })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [text, size]);

  if (!src) return <div className={className} style={{ width: size, height: size }} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={`QR ${text}`} width={size} height={size} className={className} />;
}
