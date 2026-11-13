"use client";
// หน้าหลัก Staff: สรุปวันนี้ + ยอดที่ลูกค้าโอนเข้าบัญชีของงาน + ทางลัด (ไม่รับเงินสด)

import Link from "next/link";
import { QrCode, ScanLine, Shirt, TriangleAlert, Wallet, History } from "lucide-react";
import { listRecords } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { usePolling } from "@/lib/usePolling";
import { isToday, num } from "@/lib/format";
import { TopBar, TabletBody, AccountChip } from "@/components/shells";
import { NoticeBell } from "@/components/NoticeBell";
import { StatCard } from "@/components/ui";

export default function StaffHome() {
  const { account } = useAuth();
  const { data } = usePolling(async () => {
    const [tickets, txs, issues] = await Promise.all([listRecords("ticket"), listRecords("tx"), listRecords("issue")]);
    return { tickets, txs, issues };
  });

  const checkedIn = (data?.tickets ?? []).filter((t) => t.checkedIn).length;
  const allTickets = data?.tickets.length ?? 0;
  const myTopups = (data?.txs ?? []).filter((t) => t.type === "topup" && t.staffId === account?.id && isToday(t.createdAt));
  const transfer = myTopups.reduce((s, t) => s + t.amount, 0);
  const myOpenIssues = (data?.issues ?? []).filter((i) => i.staffId === account?.id && i.status === "open").length;

  const actions = [
    { href: "/staff/checkin", title: "เช็กอินเข้างาน", desc: "สแกน QR บัตรของผู้เข้าร่วม", icon: <ScanLine /> },
    { href: "/staff/payqr", title: "QR รับเงิน", desc: "เปิด QR บัญชีของงานให้ลูกค้าสแกนโอน", icon: <QrCode /> },
    { href: "/staff/topup", title: "เติมโทเคน", desc: "ลูกค้าโอนผ่าน QR แล้วเติมโทเคนเข้าบัตร", icon: <Wallet /> },
    { href: "/staff/pickup", title: "ส่งมอบเสื้อ", desc: "คำสั่งซื้อแบบรับที่หน้างาน", icon: <Shirt /> },
    { href: "/staff/report", title: "แจ้งปัญหา", desc: `ส่งเรื่องถึง Admin · ค้างอยู่ ${myOpenIssues} เรื่อง`, icon: <TriangleAlert /> },
    { href: "/staff/history", title: "ประวัติการเติมของฉัน", desc: "รายการเติมและยอดโอนของฉัน", icon: <History /> },
  ];

  return (
    <>
      <TopBar title={`สวัสดี, ${account?.name ?? ""}`} subtitle={`${account?.servicePoint ?? ""} · 15 ธ.ค. 2569`} right={<div className="flex items-center gap-2"><NoticeBell /><AccountChip subtitle="Staff" /></div>} />
      <TabletBody>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="เช็กอินแล้ว" value={`${checkedIn}/${allTickets}`} unit="คน" icon={<ScanLine className="size-5" />} />
          <StatCard label="เติมโทเคนวันนี้" value={myTopups.length} unit="รายการ" icon={<Wallet className="size-5" />} />
          <StatCard label="ยอดโอนเข้าบัญชีงานวันนี้" value={num(transfer)} unit="บาท" icon={<QrCode className="size-5" />} tone="green" />
        </div>
        <p className="text-sm text-muted">ไม่รับเงินสด · ลูกค้าโอนเข้าบัญชีของงาน (Admin) ผ่าน QR รับเงินเท่านั้น</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {actions.map((a) => (
            <Link key={a.href} href={a.href} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-5 hover:border-navy">
              <span className="grid size-12 place-items-center rounded-xl bg-navy text-white">{a.icon}</span>
              <span>
                <span className="block font-semibold">{a.title}</span>
                <span className="block text-sm text-muted">{a.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </TabletBody>
    </>
  );
}
