// สถานะคำสั่งซื้อแบบ Finite State Machine (แนวคิดเดียวกับแล็บ Calculator)
// กำหนดว่าจากสถานะหนึ่ง เปลี่ยนไปสถานะไหนได้บ้าง กันการกดข้ามขั้น

import type { PayStatus, ShipStatus } from "./types";

const payMoves: Record<PayStatus, PayStatus[]> = {
  pending_slip: ["paid", "rejected"], // Admin ตรวจสลิป
  rejected: ["pending_slip"], // ผู้ซื้อส่งสลิปใหม่
  paid: [], // จบแล้ว
};

const shipMoves: Record<ShipStatus, ShipStatus[]> = {
  wait_pack: ["packed"],
  packed: ["shipped"],
  shipped: [],
  not_picked: ["picked"],
  picked: [],
};

export function canMovePay(from: PayStatus, to: PayStatus): boolean {
  return payMoves[from].includes(to);
}

export function canMoveShip(from: ShipStatus, to: ShipStatus): boolean {
  return shipMoves[from].includes(to);
}

// ข้อความและสีของแต่ละสถานะ ใช้กับ Badge
export const payLabel: Record<PayStatus, { text: string; tone: Tone }> = {
  pending_slip: { text: "รอตรวจสอบสลิป", tone: "amber" },
  paid: { text: "ชำระเงินสำเร็จ", tone: "green" },
  rejected: { text: "ชำระเงินไม่ผ่าน", tone: "red" },
};

export const shipLabel: Record<ShipStatus, { text: string; tone: Tone }> = {
  wait_pack: { text: "รอแพ็ค", tone: "amber" },
  packed: { text: "แพ็คเสร็จ", tone: "blue" },
  shipped: { text: "จัดส่งแล้ว", tone: "green" },
  not_picked: { text: "รอรับที่หน้างาน", tone: "amber" },
  picked: { text: "รับเสื้อแล้ว", tone: "green" },
};

export type Tone = "gray" | "green" | "amber" | "red" | "blue" | "navy";
