import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alumni Reunion 2026",
  description: "ระบบขายบัตรและโทเคน งานเลี้ยงรุ่น Alumni Reunion 2026",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#253448",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
