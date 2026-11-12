"use client";
// หน้าหลักร้านค้า: ยอดวันนี้ + ยอดถอนได้ + ทางลัด

import Link from "next/link";
import { ChevronRight, Clock3, Coffee, MapPin, ReceiptText, ShoppingBag, Wallet } from "lucide-react";
import { listRecords } from "@/lib/api";
import { useMyShop } from "@/lib/useMyShop";
import { useAuth } from "@/lib/auth";
import { usePolling } from "@/lib/usePolling";
import { dateTime, isToday, num } from "@/lib/format";
import { TopBar, TabletBody, AccountChip } from "@/components/shells";
import { NoticeBell } from "@/components/NoticeBell";
import { ButtonLink, ErrorText, StatCard } from "@/components/ui";

export default function VendorHome() {
  const { data: shop, error } = useMyShop();
  const { account } = useAuth();
  const { data: txs } = usePolling(async () => (await listRecords("tx")).filter((t) => t.type === "sale" && t.shopId === account?.shopId));
  const today = (txs ?? []).filter((t) => isToday(t.createdAt));
  const todaySales = today.reduce((s, t) => s - t.amount, 0);

  return (
    <>
      <TopBar title={`สวัสดี, ${shop?.name ?? ""}`} subtitle={`${shop?.category ?? ""} · ${shop?.booth ?? ""}`} right={<div className="flex items-center gap-2"><NoticeBell /><Link href="/vendor/shop"><AccountChip subtitle="ร้านค้า" /></Link></div>} />
      <TabletBody>
        <ErrorText text={error} />
        <div className="relative overflow-hidden rounded-3xl bg-navy p-6 text-white">
          <div className="flex justify-between">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs">เปิดร้านอยู่</span>
            <span className="flex items-center gap-1 text-xs text-white/80"><Clock3 className="size-3.5" /> {dateTime(new Date().toISOString())}</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold">{shop?.name}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-white/80"><MapPin className="size-4" /> {shop?.booth} · รับชำระด้วยโทเคนเท่านั้น</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="ยอดขายวันนี้" value={num(todaySales)} unit="โทเคน" icon={<Wallet className="size-5" />} tone="green" />
          <StatCard label="รายการขายวันนี้" value={today.length} unit="รายการ" icon={<ReceiptText className="size-5" />} />
          <StatCard label="โทเคนคงเหลือของร้าน (ถอนได้)" value={num(shop?.balance ?? 0)} unit="โทเคน" icon={<Coffee className="size-5" />} tone="amber" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-5">
            <span className="grid size-12 place-items-center rounded-xl bg-navy text-white"><ShoppingBag /></span>
            <p className="mt-3 font-semibold">รับชำระด้วยโทเคน</p>
            <p className="text-sm text-muted">เลือกสินค้า แล้วสแกน QR Code ของลูกค้าเพื่อรับชำระด้วยโทเคน</p>
            <ButtonLink href="/vendor/sell" full className="mt-4">เริ่มรับชำระ <ChevronRight className="size-4" /></ButtonLink>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <span className="grid size-12 place-items-center rounded-xl bg-warn-soft text-warn"><Wallet /></span>
            <p className="mt-3 font-semibold">ถอนเงิน</p>
            <p className="text-sm text-muted">ถอนได้วันละ 1 ครั้ง · Admin โอนเข้าบัญชี {shop?.bankName} {shop?.bankAccount}</p>
            <ButtonLink href="/vendor/withdraw" variant="outline" full className="mt-4">ไปหน้าถอนเงิน</ButtonLink>
          </div>
        </div>
      </TabletBody>
    </>
  );
}
