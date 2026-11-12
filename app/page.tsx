// หน้าแรกของเว็บ: เลือกเข้าแต่ละ role (แต่ละ role มี URL ของตัวเอง)
import Link from "next/link";
import { Boxes, ShieldCheck, Store, Ticket, UserRound } from "lucide-react";

const roles = [
  { href: "/user", title: "ผู้ซื้อ (User)", desc: "ซื้อบัตร ซื้อเสื้อ ดู QR และกระเป๋าโทเคน", device: "มือถือ", icon: <UserRound /> },
  { href: "/staff", title: "Staff", desc: "เช็กอิน เติมโทเคน ส่งมอบเสื้อ แจ้งปัญหา", device: "แท็บเล็ต", icon: <Ticket /> },
  { href: "/vendor", title: "ร้านค้า (Vendor)", desc: "ขายสินค้าด้วยโทเคน ประวัติ ถอนเงิน", device: "แท็บเล็ต", icon: <Store /> },
  { href: "/packing", title: "Packing", desc: "แพ็คและจัดส่งเสื้อ", device: "มือถือ", icon: <Boxes /> },
  { href: "/admin", title: "Super Admin", desc: "อนุมัติสลิป ร้านค้า สต็อก รายงาน", device: "เดสก์ท็อป", icon: <ShieldCheck /> },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 rounded-3xl bg-navy p-8 text-white">
        <p className="text-sm text-white/70">15 ธ.ค. 2569 · Main Hall</p>
        <h1 className="mt-1 text-3xl font-bold">Alumni Reunion 2026</h1>
        <p className="mt-2 text-white/80">ระบบขายบัตรและโทเคนงานเลี้ยงรุ่น · เลือกบทบาทเพื่อเข้าใช้งาน</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {roles.map((r) => (
          <Link key={r.href} href={r.href} className="flex gap-4 rounded-2xl border border-line bg-white p-5 transition hover:border-navy">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-navy-soft text-navy">{r.icon}</span>
            <span>
              <span className="block font-semibold">{r.title}</span>
              <span className="block text-sm text-muted">{r.desc}</span>
              <span className="mt-1 block text-xs text-navy">{r.href} · {r.device}</span>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
