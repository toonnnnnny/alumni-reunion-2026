"use client";
// ข้อมูลร้าน (อ่านอย่างเดียว แก้ได้ที่ Admin) + บัญชีรับเงิน + ออกจากระบบ

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useMyShop } from "@/lib/useMyShop";
import { initials, dateTime } from "@/lib/format";
import { TopBar, TabletBody } from "@/components/shells";
import { Banner, Button, Card, InfoRow, Loading } from "@/components/ui";

export default function ShopInfo() {
  const { data: shop } = useMyShop();
  const { account, logout } = useAuth();
  const router = useRouter();
  if (!shop || !account) return <Loading />;

  return (
    <>
      <TopBar title="ข้อมูลร้านค้า" subtitle="บัญชีร้านค้า" back="/vendor" />
      <TabletBody className="max-w-3xl">
        <div className="rounded-3xl bg-navy p-8 text-center text-white">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-white/15 text-2xl font-bold">{initials(shop.name)}</span>
          <h2 className="mt-3 text-2xl font-bold">{shop.name}</h2>
          <p className="text-sm text-white/80">{shop.category} · {shop.booth}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <p className="mb-1 font-semibold">ข้อมูลร้าน</p>
            <InfoRow label="ชื่อร้าน" value={shop.name} />
            <InfoRow label="ประเภทร้าน" value={shop.category} />
            <InfoRow label="ตำแหน่งบูธ" value={shop.booth} />
            <InfoRow label="ผู้ดูแลร้าน" value={shop.ownerName} />
            <InfoRow label="เบอร์โทรศัพท์" value={shop.phone} />
            <InfoRow label="บัญชีรับเงิน" value={`${shop.bankName} · ${shop.bankAccount}`} />
            <InfoRow label="ชื่อบัญชี" value={shop.bankAccountName} />
          </Card>
          <Card>
            <p className="mb-1 font-semibold">ข้อมูลบัญชี</p>
            <InfoRow label="ชื่อผู้ใช้" value={account.username} />
            <InfoRow label="บทบาท" value="ร้านค้า (Vendor)" />
            <InfoRow label="สร้างบัญชีโดย" value={`Admin · ${dateTime(account.createdAt)}`} />
            <InfoRow label="สถานะบัญชี" value="ใช้งานได้" tone="green" />
          </Card>
        </div>
        <Banner>หากต้องการแก้ไขข้อมูลร้าน สินค้า ราคาโทเคน หรือบัญชีรับเงิน ให้ติดต่อ Admin</Banner>
        <Button full variant="danger" onClick={() => { logout(); router.replace("/vendor/login"); }}><LogOut className="size-4" /> ออกจากระบบ</Button>
      </TabletBody>
    </>
  );
}
