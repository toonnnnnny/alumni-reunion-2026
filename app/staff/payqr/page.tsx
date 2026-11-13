"use client";
// QR รับเงิน: Staff เปิดให้ลูกค้าสแกนโอนเข้าบัญชีของงาน (Admin) ก่อนเติมโทเคน
// Staff ไม่รับเงินสด เงินเข้าบัญชี Admin โดยตรง Admin กระทบยอดกับหน้า "รายการเติมโทเคน"

import { useState } from "react";
import { TopBar, TabletBody } from "@/components/shells";
import { PayQrCard } from "@/components/PayQrCard";
import { Banner, ButtonLink, Card, cx } from "@/components/ui";

const QUICK = [20, 50, 100, 200];

export default function PayQr() {
  const [amount, setAmount] = useState(0);

  return (
    <>
      <TopBar title="QR รับเงิน" subtitle="โอนเข้าบัญชีของงาน · ไม่รับเงินสด" back="/staff" />
      <TabletBody className="max-w-3xl">
        <div className="grid gap-5 lg:grid-cols-2">
          <PayQrCard amount={amount} size={240} />
          <div className="space-y-4">
            <Card>
              <p className="mb-2 text-sm font-semibold">ใส่ยอดใน QR (ไม่บังคับ)</p>
              <div className="grid grid-cols-4 gap-2">
                {QUICK.map((q) => (
                  <button key={q} onClick={() => setAmount(amount === q ? 0 : q)} className={cx("rounded-xl border py-2.5 text-sm font-semibold", amount === q ? "border-navy bg-navy text-white" : "border-line")}>
                    {q} บาท
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">แตะซ้ำเพื่อเอายอดออก ลูกค้าจะกรอกยอดเองในแอปธนาคาร</p>
            </Card>
            <Card>
              <p className="mb-2 font-semibold">ขั้นตอนเติมโทเคน</p>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
                <li>ให้ลูกค้าสแกน QR นี้ แล้วโอนตามจำนวนโทเคนที่ต้องการ (1 โทเคน = 1 บาท)</li>
                <li>ดูหน้าจอโอนสำเร็จบนมือถือลูกค้า ชื่อบัญชีปลายทางต้องเป็น ALUMNI REUNION 2026 และยอดต้องตรง</li>
                <li>สแกนบัตรของลูกค้า แล้วเติมโทเคนเท่ากับยอดที่โอน</li>
              </ol>
            </Card>
            <Banner tone="amber">Staff ไม่รับเงินสดทุกกรณี เงินเข้าบัญชีของงานที่ Admin ดูแลโดยตรง</Banner>
            <ButtonLink href="/staff/topup" full className="min-h-14">ไปหน้าเติมโทเคน</ButtonLink>
          </div>
        </div>
      </TabletBody>
    </>
  );
}
