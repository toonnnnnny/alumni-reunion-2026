// POST /api/reset  ล้างข้อมูล MockAPI จำลองกลับเป็นข้อมูลตัวอย่าง (ใช้ก่อนเดโม)
import { NextResponse } from "next/server";
import { resetDb } from "../mock/store";

export async function POST() {
  resetDb();
  return NextResponse.json({ ok: true });
}
