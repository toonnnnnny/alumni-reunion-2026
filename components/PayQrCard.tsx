// การ์ด QR รับเงินเข้าบัญชีของงาน (Admin) ใช้ในหน้า QR รับเงินและหน้าเติมโทเคนของ Staff
// ถ้าส่ง amount มา QR จะใส่ยอดเงินไว้ด้วย ลูกค้าสแกนแล้วไม่ต้องพิมพ์ยอดเอง

import { QrImage } from "./QrImage";
import { Card } from "./ui";
import { baht } from "@/lib/format";
import { PAY_ACCOUNT, payQrText } from "@/lib/types";

export function PayQrCard({ amount, size = 220 }: { amount?: number; size?: number }) {
  return (
    <Card className="text-center">
      <p className="text-sm text-muted">ให้ลูกค้าสแกนด้วยแอปธนาคาร (Thai QR)</p>
      <div className="mx-auto my-4 w-fit rounded-2xl border border-line p-3">
        <QrImage text={payQrText(amount)} size={size} />
      </div>
      {amount && amount > 0 ? (
        <>
          <p className="text-sm text-muted">ยอดที่ต้องโอน</p>
          <p className="text-3xl font-bold">{baht(amount)}</p>
        </>
      ) : (
        <p className="text-sm text-muted">ลูกค้ากรอกยอดเองในแอปธนาคาร</p>
      )}
      <div className="mt-3 rounded-xl bg-paper p-3 text-sm">
        <p className="font-semibold">{PAY_ACCOUNT.name}</p>
        <p className="text-muted">{PAY_ACCOUNT.bank} · {PAY_ACCOUNT.number}</p>
      </div>
      <p className="mt-2 text-xs text-muted">บัญชีของงาน ดูแลโดย Admin · QR จำลองสำหรับงานส่ง</p>
    </Card>
  );
}
