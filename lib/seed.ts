// ข้อมูลตัวอย่าง ชุดเดียวกับใน Figma (TEST TEST1, ORD-240001, T-001/T-002, Bubble Tea Bar ...)
// ใช้ 2 ที่: MockAPI จำลองในเครื่อง และสคริปต์ scripts/seed-mockapi.mjs ที่อัปโหลดขึ้น MockAPI จริง
// id เรียง "1","2","3"... ตามลำดับใน array เพราะ MockAPI จะสร้าง id ให้ตามลำดับแบบนี้เหมือนกัน

import type { Account, Order, Ticket, Transaction, Shop, Shirt, Issue, Notice, Withdrawal } from "./types";

// รูปสลิปตัวอย่าง (SVG เล็กๆ) ใช้แทนรูปจริงในข้อมูลตั้งต้น
function fakeSlip(amount: string, time: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420"><rect width="300" height="420" rx="16" fill="#fff"/><rect width="300" height="70" rx="16" fill="#3a8a5c"/><text x="150" y="44" font-size="20" fill="#fff" text-anchor="middle" font-family="sans-serif">โอนเงินสำเร็จ</text><text x="150" y="150" font-size="34" fill="#222" text-anchor="middle" font-family="sans-serif">${amount}</text><text x="150" y="185" font-size="14" fill="#666" text-anchor="middle" font-family="sans-serif">บาท</text><text x="30" y="250" font-size="13" fill="#666" font-family="sans-serif">ไปยัง ALUMNI REUNION 2026</text><text x="30" y="275" font-size="13" fill="#666" font-family="sans-serif">${time}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

const t = (iso: string) => new Date(iso).toISOString();

export const seedAccounts: Account[] = [
  { id: "1", username: "admin", password: "1234", name: "Admin", email: "admin@reunion.app", phone: "080-000-0000", role: "admin", active: true, createdAt: t("2026-12-01T09:00:00+07:00") },
  { id: "2", username: "TEST1@gmail.com", password: "1234", name: "TEST TEST1", email: "TEST1@gmail.com", phone: "081-234-5678", role: "user", active: true, createdAt: t("2026-11-18T10:00:00+07:00") },
  { id: "3", username: "TEST3@gmail.com", password: "1234", name: "TEST TEST3", email: "TEST3@gmail.com", phone: "089-111-2233", role: "user", active: true, createdAt: t("2026-12-10T10:00:00+07:00") },
  { id: "4", username: "staff1", password: "1234", name: "TEST STAFF", email: "staff1@reunion.app", phone: "085-555-0001", role: "staff", servicePoint: "จุดบริการ A", active: true, createdAt: t("2026-12-01T09:00:00+07:00") },
  { id: "5", username: "bubbletea.d2", password: "1234", name: "TEST VENDOR", email: "btb@reunion.app", phone: "083-456-7890", role: "vendor", shopId: "1", active: true, createdAt: t("2026-12-01T09:00:00+07:00") },
  { id: "6", username: "alumnicafe.d1", password: "1234", name: "TEST CAFE", email: "cafe@reunion.app", phone: "082-333-4455", role: "vendor", shopId: "2", active: true, createdAt: t("2026-12-01T09:00:00+07:00") },
  { id: "7", username: "snack.d3", password: "1234", name: "TEST SNACK", email: "snack@reunion.app", phone: "084-222-6677", role: "vendor", shopId: "3", active: true, createdAt: t("2026-12-01T09:00:00+07:00") },
  { id: "8", username: "packing", password: "1234", name: "TEST PACKING", email: "packing@reunion.app", phone: "086-777-0001", role: "packing", active: true, createdAt: t("2026-12-01T09:00:00+07:00") },
];

// ร้านค้า (id 1-3) เสื้อ (id 4-7) แล้วตามด้วยข้อมูลอื่น ลำดับนี้สำคัญเพราะ id อ้างถึงกัน
const shops: Shop[] = [
  {
    id: "1", kind: "shop", name: "Bubble Tea Bar", category: "เครื่องดื่ม", booth: "Booth D2 · Main Hall", ownerName: "TEST VENDOR", phone: "083-456-7890",
    bankName: "กสิกรไทย", bankAccount: "012-3-45678-9", bankAccountName: "TEST VENDOR", balance: 1240, createdAt: t("2026-12-01T09:00:00+07:00"),
    menu: [
      { id: "m1", name: "ชานมไข่มุก", price: 35, category: "เครื่องดื่ม", active: true },
      { id: "m2", name: "ชาเขียวนม", price: 35, category: "เครื่องดื่ม", active: true },
      { id: "m3", name: "ชาไทย", price: 30, category: "เครื่องดื่ม", active: true },
      { id: "m4", name: "โกโก้เย็น", price: 30, category: "เครื่องดื่ม", active: true },
      { id: "m5", name: "บราวนี่", price: 15, category: "ขนม", active: true },
      { id: "m6", name: "คุกกี้ช็อกโกแลต", price: 15, category: "ขนม", active: true },
    ],
  },
  {
    id: "2", kind: "shop", name: "Alumni Cafe", category: "กาแฟและเบเกอรี่", booth: "Booth D1 · Main Hall", ownerName: "TEST CAFE", phone: "082-333-4455",
    bankName: "ไทยพาณิชย์", bankAccount: "456-7-89012-3", bankAccountName: "TEST CAFE", balance: 1560, createdAt: t("2026-12-01T09:00:00+07:00"),
    menu: [
      { id: "m1", name: "อเมริกาโน่", price: 40, category: "เครื่องดื่ม", active: true },
      { id: "m2", name: "ลาเต้", price: 45, category: "เครื่องดื่ม", active: true },
      { id: "m3", name: "ครัวซองต์", price: 35, category: "ขนม", active: true },
      { id: "m4", name: "เค้กช็อกโกแลต", price: 50, category: "ขนม", active: true },
      { id: "m5", name: "น้ำเปล่า", price: 10, category: "เครื่องดื่ม", active: true },
    ],
  },
  {
    id: "3", kind: "shop", name: "Snack Corner", category: "ของกินเล่น", booth: "Booth D3 · Main Hall", ownerName: "TEST SNACK", phone: "084-222-6677",
    bankName: "กรุงไทย", bankAccount: "987-6-54321-0", bankAccountName: "TEST SNACK", balance: 1020, createdAt: t("2026-12-01T09:00:00+07:00"),
    menu: [
      { id: "m1", name: "เฟรนช์ฟรายส์", price: 40, category: "ของกินเล่น", active: true },
      { id: "m2", name: "ไก่ป๊อป", price: 45, category: "ของกินเล่น", active: true },
      { id: "m3", name: "ไส้กรอกทอด", price: 30, category: "ของกินเล่น", active: true },
      { id: "m4", name: "ป๊อปคอร์น", price: 25, category: "ของกินเล่น", active: true },
      { id: "m5", name: "น้ำอัดลม", price: 20, category: "เครื่องดื่ม", active: true },
    ],
  },
];

const fullStock = (n: number) => ({ S: n, M: n + 4, L: n + 4, XL: n, XXL: Math.max(0, n - 6) });

const shirts: Shirt[] = [
  { id: "4", kind: "shirt", name: "เสื้อยืดรุ่น Classic", price: 350, detail: "ผ้าคอตตอน 100% สกรีนโลโก้งานรุ่นด้านหน้า", colors: ["กรมท่า", "ขาว"], stock: { "กรมท่า": fullStock(12), "ขาว": fullStock(10) }, createdAt: t("2026-11-15T09:00:00+07:00") },
  { id: "5", kind: "shirt", name: "เสื้อโปโลรุ่น 2026", price: 450, detail: "ผ้าจูติ ปักโลโก้ที่อก ใส่ได้ทั้งงานและทำงาน", colors: ["กรมท่า", "เทา"], stock: { "กรมท่า": fullStock(8), "เทา": fullStock(6) }, createdAt: t("2026-11-15T09:00:00+07:00") },
  { id: "6", kind: "shirt", name: "เสื้อ Oversize", price: 390, detail: "ทรงหลวม สกรีนลายด้านหลัง", colors: ["ดำ", "ครีม"], stock: { "ดำ": fullStock(10), "ครีม": fullStock(2) }, createdAt: t("2026-11-15T09:00:00+07:00") },
  { id: "7", kind: "shirt", name: "เสื้อแขนยาว", price: 490, detail: "ผ้าหนานุ่ม เหมาะกับอากาศเย็นเดือนธันวาคม", colors: ["กรมท่า"], stock: { "กรมท่า": fullStock(6) }, createdAt: t("2026-11-15T09:00:00+07:00") },
];

const orders: Order[] = [
  {
    id: "8", kind: "order", orderNo: "ORD-240001", userId: "2", type: "ticket",
    attendees: [
      { name: "TEST TEST1", email: "TEST1@gmail.com", phone: "081-234-5678" },
      { name: "TEST TEST2", email: "TEST2@gmail.com", phone: "082-345-6789" },
    ],
    items: [], total: 2000, slipImage: fakeSlip("2,000.00", "20 พ.ย. 69 · 14:58"), status: "paid", rejectReason: "",
    delivery: "", address: "", shipStatus: "", tracking: "", createdAt: t("2026-11-20T14:58:00+07:00"), updatedAt: t("2026-11-20T15:02:00+07:00"),
  },
  {
    id: "9", kind: "order", orderNo: "ORD-240002", userId: "2", type: "shirt", attendees: [],
    items: [{ shirtId: "4", name: "เสื้อยืดรุ่น Classic", color: "กรมท่า", size: "L", qty: 2, price: 350 }],
    total: 700, slipImage: fakeSlip("700.00", "1 ธ.ค. 69 · 10:12"), status: "paid", rejectReason: "",
    delivery: "ship", address: "TEST TEST1 · 99/9 ถ.พหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900 · 081-234-5678",
    shipStatus: "wait_pack", tracking: "", createdAt: t("2026-12-01T10:12:00+07:00"), updatedAt: t("2026-12-01T10:30:00+07:00"),
  },
  {
    id: "10", kind: "order", orderNo: "ORD-240003", userId: "3", type: "ticket",
    attendees: [{ name: "TEST TEST3", email: "TEST3@gmail.com", phone: "089-111-2233" }],
    items: [], total: 1000, slipImage: fakeSlip("1,000.00", "14 ธ.ค. 69 · 20:41"), status: "pending_slip", rejectReason: "",
    delivery: "", address: "", shipStatus: "", tracking: "", createdAt: t("2026-12-14T20:41:00+07:00"), updatedAt: t("2026-12-14T20:41:00+07:00"),
  },
];

const tickets: Ticket[] = [
  { id: "11", kind: "ticket", ticketNo: "T-001", orderId: "8", userId: "2", holderName: "TEST TEST1", holderEmail: "TEST1@gmail.com", holderIndex: 1, linkToken: "a7Hk2pQm9x", tokens: 20, checkedIn: true, checkinAt: t("2026-12-15T17:32:00+07:00"), createdAt: t("2026-11-20T15:02:00+07:00") },
  { id: "12", kind: "ticket", ticketNo: "T-002", orderId: "8", userId: "2", holderName: "TEST TEST2", holderEmail: "TEST2@gmail.com", holderIndex: 2, linkToken: "k8QzR4vN2w", tokens: 25, checkedIn: false, checkinAt: "", createdAt: t("2026-11-20T15:02:00+07:00") },
];

const txBase = { shopId: "", shopName: "", items: [], staffId: "", staffName: "", method: "" as const };
const txs: Transaction[] = [
  { id: "13", kind: "tx", txNo: "TX-0001", ticketNo: "T-001", type: "bonus", amount: 50, ...txBase, createdAt: t("2026-11-20T15:02:00+07:00") },
  { id: "14", kind: "tx", txNo: "TX-0002", ticketNo: "T-002", type: "bonus", amount: 50, ...txBase, createdAt: t("2026-11-20T15:02:00+07:00") },
  { id: "15", kind: "tx", txNo: "TX-0003", ticketNo: "T-001", type: "topup", amount: 50, ...txBase, staffId: "4", staffName: "TEST STAFF", method: "cash", createdAt: t("2026-12-15T18:10:00+07:00") },
  { id: "16", kind: "tx", txNo: "TX-0004", ticketNo: "T-001", type: "sale", amount: -65, ...txBase, shopId: "1", shopName: "Bubble Tea Bar", items: [{ name: "ชานมไข่มุก", qty: 1, price: 35 }, { name: "ชาไทย", qty: 1, price: 30 }], createdAt: t("2026-12-15T18:25:00+07:00") },
  { id: "17", kind: "tx", txNo: "TX-0005", ticketNo: "T-001", type: "sale", amount: -15, ...txBase, shopId: "1", shopName: "Bubble Tea Bar", items: [{ name: "บราวนี่", qty: 1, price: 15 }], createdAt: t("2026-12-15T18:40:00+07:00") },
  { id: "18", kind: "tx", txNo: "TX-0006", ticketNo: "T-002", type: "sale", amount: -25, ...txBase, shopId: "3", shopName: "Snack Corner", items: [{ name: "ป๊อปคอร์น", qty: 1, price: 25 }], createdAt: t("2026-12-15T18:45:00+07:00") },
];

const issues: Issue[] = [
  { id: "19", kind: "issue", issueNo: "ISS-001", topic: "สแกน QR ไม่ได้", ticketNo: "T-002", detail: "หน้าจอลูกค้ามืด สแกนไม่ติด ค้นหาด้วยรหัสบัตรแทนแล้ว", staffId: "4", staffName: "TEST STAFF", servicePoint: "จุดบริการ A", status: "open", adminNote: "", createdAt: t("2026-12-15T18:05:00+07:00") },
];

const notices: Notice[] = [
  { id: "20", kind: "notice", toRole: "admin", toUserId: "", title: "สลิปใหม่รอตรวจสอบ", message: "ORD-240003 · TEST TEST3 · 1,000 บาท", link: "/admin/payments/10", read: false, createdAt: t("2026-12-14T20:41:00+07:00") },
];

const withdrawals: Withdrawal[] = [
  { id: "21", kind: "withdrawal", wdNo: "WD-0001", shopId: "3", shopName: "Snack Corner", amount: 800, bankName: "กรุงไทย", bankAccount: "987-6-54321-0", bankAccountName: "TEST SNACK", status: "done", slipImage: "", requestedAt: t("2026-11-10T21:05:00+07:00"), doneAt: t("2026-11-10T21:30:00+07:00") },
];

export const seedRecords = [...shops, ...shirts, ...orders, ...tickets, ...txs, ...issues, ...notices, ...withdrawals];
