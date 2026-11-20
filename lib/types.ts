// ชนิดข้อมูลทั้งหมดของระบบ
// MockAPI แผนฟรีมีได้แค่ 2 resource จึงเก็บข้อมูลเป็น 2 กลุ่ม
//   1) accounts = บัญชีผู้ใช้ทุก role
//   2) records  = ข้อมูลอื่นทั้งหมด แยกประเภทด้วยฟิลด์ kind

export type Role = "user" | "staff" | "vendor" | "packing" | "admin";

export type Account = {
  id: string;
  username: string; // ผู้ซื้อใช้อีเมลเป็น username
  password: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  shopId?: string; // ใช้กับ vendor
  servicePoint?: string; // ใช้กับ staff เช่น "จุดบริการ A"
  active: boolean;
  createdAt: string;
};

// ---------- records ----------

export type Attendee = { name: string; email: string; phone: string };

export type CartItem = {
  shirtId: string;
  name: string;
  color: string;
  size: string;
  qty: number;
  price: number;
};

// สถานะการชำระเงิน (Finite State Machine ดู lib/status.ts)
export type PayStatus = "pending_slip" | "paid" | "rejected";
// สถานะการส่งเสื้อ
export type ShipStatus = "wait_pack" | "packed" | "shipped" | "not_picked" | "picked";

export type Order = {
  id: string;
  kind: "order";
  orderNo: string;
  userId: string;
  type: "ticket" | "shirt";
  attendees: Attendee[]; // ใช้กับบัตร
  items: CartItem[]; // ใช้กับเสื้อ
  total: number;
  slipImage: string; // รูปสลิปแบบ base64 (ย่อแล้ว)
  status: PayStatus;
  rejectReason: string;
  delivery: "ship" | "pickup" | "";
  address: string;
  shipStatus: ShipStatus | "";
  tracking: string;
  emailSentAt?: string; // ส่งอีเมลบัตรผ่าน Resend สำเร็จเมื่อ
  emailError?: string; // ข้อความผิดพลาดครั้งล่าสุด
  createdAt: string;
  updatedAt: string;
};

export type Ticket = {
  id: string;
  kind: "ticket";
  ticketNo: string; // T-001
  orderId: string;
  userId: string; // เจ้าของบัญชีที่ซื้อ
  holderName: string;
  holderEmail: string;
  holderIndex: number; // 1 = ผู้ซื้อ, 2+ = ผู้เข้าร่วมคนอื่น
  linkToken: string; // รหัสลับสำหรับลิงก์ /t/[linkToken] (ไม่ต้องล็อกอิน)
  tokens: number;
  checkedIn: boolean;
  checkinAt: string;
  createdAt: string;
};

export type TxType = "bonus" | "topup" | "sale";

export type Transaction = {
  id: string;
  kind: "tx";
  txNo: string;
  ticketNo: string;
  type: TxType; // bonus = 50 โทเคนที่มากับบัตร, topup = เติม, sale = ซื้อของ
  amount: number; // บวก = ได้โทเคน, ลบ = ใช้โทเคน
  shopId: string;
  shopName: string;
  items: { name: string; qty: number; price: number }[];
  staffId: string;
  staffName: string;
  method: "cash" | "transfer" | ""; // วิธีที่ลูกค้าจ่ายเงินตอนเติม
  createdAt: string;
};

export type MenuItem = { id: string; name: string; price: number; category: string; active: boolean };

export type Shop = {
  id: string;
  kind: "shop";
  name: string;
  category: string;
  booth: string;
  ownerName: string;
  phone: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  balance: number; // โทเคนที่ร้านขายได้และยังไม่ได้ถอน
  menu: MenuItem[];
  createdAt: string;
};

export type Shirt = {
  id: string;
  kind: "shirt";
  name: string;
  price: number;
  detail: string;
  colors: string[];
  stock: Record<string, Record<string, number>>; // สี -> ไซซ์ -> จำนวน
  image?: string; // รูปที่ Admin อัปโหลด (ข้อความ base64) ถ้าไม่มีจะใช้รูปจาก public/shirts ตามชื่อ
  createdAt: string;
};

export type Issue = {
  id: string;
  kind: "issue";
  issueNo: string;
  topic: string;
  ticketNo: string;
  detail: string;
  staffId: string;
  staffName: string;
  servicePoint: string;
  status: "open" | "done";
  adminNote: string;
  createdAt: string;
};

export type Notice = {
  id: string;
  kind: "notice";
  toRole: Role;
  toUserId: string; // "" = ทุกคนใน role นั้น
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
};

export type Withdrawal = {
  id: string;
  kind: "withdrawal";
  wdNo: string;
  shopId: string;
  shopName: string;
  amount: number;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  status: "pending" | "done";
  slipImage: string; // ไม่บังคับ Admin แนบไว้เป็นหลักฐานของตัวเอง
  requestedAt: string;
  doneAt: string;
};

export type RecordKind = "order" | "ticket" | "tx" | "shop" | "shirt" | "issue" | "notice" | "withdrawal";

// จับคู่ kind กับชนิดข้อมูล ใช้ให้ฟังก์ชัน listRecords คืนชนิดถูกต้อง
export type KindMap = {
  order: Order;
  ticket: Ticket;
  tx: Transaction;
  shop: Shop;
  shirt: Shirt;
  issue: Issue;
  notice: Notice;
  withdrawal: Withdrawal;
};

export const SIZES = ["S", "M", "L", "XL", "XXL"];
export const TICKET_PRICE = 1000;
export const BONUS_TOKENS = 50;
export const EVENT_DATE = "15 ธ.ค. 2569";

// บัญชีรับเงินของงาน (Admin เป็นผู้ดูแล) ใช้ทั้งตอนซื้อบัตร/เสื้อ และตอน Staff เติมโทเคน
// Staff ไม่รับเงินสด: ลูกค้าโอนเข้าบัญชีนี้ผ่าน QR เท่านั้น
export const PAY_ACCOUNT = {
  name: "ALUMNI REUNION 2026",
  bank: "ธนาคารกรุงเทพ",
  number: "123-4-56789-0",
};

// ข้อความที่ใส่ใน QR รับเงิน (จำลองรูปแบบพร้อมเพย์ ไม่ได้ใช้โอนเงินจริง)
export function payQrText(amount?: number): string {
  return `PROMPTPAY|${PAY_ACCOUNT.name}|${amount && amount > 0 ? amount.toFixed(2) : ""}`;
}
