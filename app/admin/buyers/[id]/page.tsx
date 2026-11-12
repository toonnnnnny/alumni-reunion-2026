"use client";
// รายละเอียดผู้ซื้อ: ข้อมูลบัญชี, คำสั่งซื้อ, บัตรทุกใบ (โทเคน/เช็กอิน) และประวัติโทเคน

import Link from "next/link";
import { use, useState } from "react";
import { getAccount, listRecords } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { baht, dateTime, num } from "@/lib/format";
import { payLabel } from "@/lib/status";
import { AdminFrame } from "@/components/AdminFrame";
import { QrImage } from "@/components/QrImage";
import { TxList } from "@/components/TxList";
import { Badge, Card, CardTitle, InfoRow, Loading, Modal } from "@/components/ui";

export default function BuyerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [qrOf, setQrOf] = useState("");
  const { data, isLoading } = usePolling(async () => {
    const [user, orders, tickets, txs] = await Promise.all([getAccount(id), listRecords("order"), listRecords("ticket"), listRecords("tx")]);
    const myTickets = tickets.filter((t) => t.userId === id).sort((a, b) => a.ticketNo.localeCompare(b.ticketNo));
    const nos = myTickets.map((t) => t.ticketNo);
    return {
      user,
      orders: orders.filter((o) => o.userId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      tickets: myTickets,
      txs: txs.filter((t) => nos.includes(t.ticketNo)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  });

  if (isLoading || !data) return <AdminFrame title="รายละเอียดผู้ซื้อ" back="/admin/buyers"><Loading /></AdminFrame>;
  const { user, orders, tickets, txs } = data;

  return (
    <AdminFrame title={user.name} subtitle={`${user.email} · ${user.phone}`} back>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardTitle>ข้อมูลบัญชี</CardTitle>
          <InfoRow label="ชื่อ" value={user.name} />
          <InfoRow label="อีเมล" value={user.email} />
          <InfoRow label="เบอร์โทร" value={user.phone} />
          <InfoRow label="สมัครเมื่อ" value={dateTime(user.createdAt)} />
          <InfoRow label="โทเคนรวม" value={`${num(tickets.reduce((s, t) => s + t.tokens, 0))} โทเคน`} strong />
        </Card>
        <Card className="xl:col-span-2">
          <CardTitle>บัตร ({tickets.length})</CardTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {tickets.map((t) => (
              <button key={t.id} onClick={() => setQrOf(t.ticketNo)} className="rounded-2xl border border-line p-4 text-left hover:border-navy">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{t.ticketNo} · {t.holderName}</p>
                  <Badge tone={t.checkedIn ? "green" : "gray"}>{t.checkedIn ? "เช็กอินแล้ว" : "ยังไม่เช็กอิน"}</Badge>
                </div>
                <p className="text-sm text-muted">{t.holderEmail} · ผู้เข้าร่วม {t.holderIndex}</p>
                <p className="mt-1 text-lg font-bold">{num(t.tokens)} <span className="text-xs font-normal text-muted">โทเคน</span></p>
              </button>
            ))}
          </div>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle>คำสั่งซื้อ ({orders.length})</CardTitle>
          {orders.map((o) => (
            <Link key={o.id} href={`/admin/payments/${o.id}`} className="flex items-center justify-between border-b border-line py-3 last:border-0">
              <div>
                <p className="text-sm font-semibold">{o.orderNo} · {o.type === "ticket" ? "บัตร" : "เสื้อ"}</p>
                <p className="text-xs text-muted">{dateTime(o.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2"><span className="text-sm font-semibold">{baht(o.total)}</span><Badge tone={payLabel[o.status].tone}>{payLabel[o.status].text}</Badge></div>
            </Link>
          ))}
        </Card>
        <Card>
          <CardTitle>ประวัติโทเคนทุกบัตร</CardTitle>
          <TxList txs={txs} />
        </Card>
      </div>
      <Modal open={!!qrOf} onClose={() => setQrOf("")} title={`QR Code ${qrOf}`}>
        <div className="mx-auto w-64"><QrImage text={qrOf} size={256} className="h-auto w-full" /></div>
      </Modal>
    </AdminFrame>
  );
}
