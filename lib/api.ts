// ชั้นเรียก REST API ทั้งหมดของเว็บ (fetch + async/await + try/catch)
// ทุก role เรียกผ่านไฟล์นี้ ข้อมูลเลยเป็นชุดเดียวกัน แม้จะเปิดคนละ URL คนละเครื่อง
//
// API_BASE มาจาก .env.local
//   - ใส่ URL MockAPI จริง เช่น https://xxxx.mockapi.io/api/v1 -> ใช้ MockAPI
//   - เว้นว่าง -> ใช้ MockAPI จำลองในเครื่องที่ /api/mock (app/api/mock)

import type { Account, KindMap, RecordKind } from "./types";

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "/api/mock").replace(/\/$/, "");

// Error ที่เก็บรหัสสถานะ HTTP ไว้ด้วย เพื่อให้ส่วนอื่นตรวจได้ว่าเป็น 400 (ที่เก็บข้อมูลเต็ม) หรือไม่
export class ApiError extends Error {
  status: number;
  constructor(status: number) {
    super(`เรียกข้อมูลไม่สำเร็จ (${status})`);
    this.status = status;
  }
}

// เรียก API แล้วแปลงเป็น JSON ถ้าผิดพลาดโยน Error พร้อมข้อความภาษาไทย
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    // เก็บข้อความที่เซิร์ฟเวอร์ตอบมาไว้ใน console ช่วยหาสาเหตุ (เช่น 400 จาก MockAPI)
    console.error("API error", options?.method || "GET", path, res.status, await res.text().catch(() => ""));
    throw new ApiError(res.status);
  }
  return (await res.json()) as T;
}

// ดึงรายการ ถ้า MockAPI หาไม่เจอจะตอบ 404 จึงถือว่าเป็นรายการว่าง
async function requestList<T>(path: string): Promise<T[]> {
  const res = await fetch(API_BASE + path, { cache: "no-store" });
  if (res.status === 404) return [];
  if (!res.ok) throw new ApiError(res.status);
  const data = await res.json();
  return Array.isArray(data) ? (data as T[]) : [];
}

// ---------------- accounts ----------------

export async function listAccounts(): Promise<Account[]> {
  const rows = await requestList<Account>("/accounts");
  // ข้ามแถวว่างที่ไม่มี username (เช่นแถวที่ MockAPI สร้างเองจากแถบปรับจำนวนข้อมูล) กันหน้าเว็บพัง
  return rows.filter((a) => typeof a.username === "string" && a.username !== "");
}

export async function getAccount(id: string): Promise<Account> {
  return request<Account>(`/accounts/${id}`);
}

export async function createAccount(data: Omit<Account, "id">): Promise<Account> {
  return request<Account>("/accounts", { method: "POST", body: JSON.stringify(data) });
}

export async function updateAccount(id: string, data: Partial<Account>): Promise<Account> {
  return request<Account>(`/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

// ---------------- records ----------------

// ดึง record ทั้งหมดของประเภทเดียว เช่น listRecords("order")
// กรองซ้ำด้วย kind อีกรอบ เพราะ MockAPI ค้นหาแบบ "มีคำนี้อยู่" ไม่ใช่ "ตรงทุกตัว"
export async function listRecords<K extends RecordKind>(kind: K): Promise<KindMap[K][]> {
  const rows = await requestList<KindMap[K]>(`/records?kind=${kind}`);
  return rows.filter((row) => row.kind === kind);
}

export async function getRecord<K extends RecordKind>(kind: K, id: string): Promise<KindMap[K]> {
  return request<KindMap[K]>(`/records/${id}`);
}

export async function createRecord<K extends RecordKind>(
  kind: K,
  data: Omit<KindMap[K], "id" | "kind">
): Promise<KindMap[K]> {
  const send = () => request<KindMap[K]>("/records", { method: "POST", body: JSON.stringify({ ...data, kind }) });
  try {
    return await send();
  } catch (e) {
    // MockAPI ตอบ 400 เมื่อ resource records เต็มโควตา: ลบแจ้งเตือนเก่าให้เหลือ 5 แถวเพื่อเปิดที่ว่าง แล้วลองส่งใหม่ 1 ครั้ง
    if (kind !== "notice" && e instanceof ApiError && e.status === 400) {
      const freed = await pruneNotices(5);
      if (freed > 0) return await send();
      throw new Error("พื้นที่เก็บข้อมูลเต็ม กรุณาลบข้อมูลทดสอบเก่าใน MockAPI");
    }
    throw e;
  }
}

// ลบแจ้งเตือนเก่า เก็บไว้เฉพาะ keep แถวล่าสุด คืนจำนวนแถวที่ลบได้ (กันไม่ให้ records เต็มจากแจ้งเตือนที่สะสม)
export async function pruneNotices(keep: number): Promise<number> {
  try {
    const rows = await listRecords("notice");
    const oldest = [...rows]
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
      .slice(0, Math.max(0, rows.length - keep));
    const results = await Promise.allSettled(oldest.map((r) => deleteRecord(r.id)));
    return results.filter((r) => r.status === "fulfilled").length;
  } catch {
    return 0;
  }
}

export async function updateRecord<K extends RecordKind>(
  kind: K,
  id: string,
  data: Partial<KindMap[K]>
): Promise<KindMap[K]> {
  return request<KindMap[K]>(`/records/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteRecord(id: string): Promise<void> {
  await request(`/records/${id}`, { method: "DELETE" });
}

// ---------------- helper ----------------

// เวลาปัจจุบันแบบ ISO ใช้เป็น createdAt
export function nowIso(): string {
  return new Date().toISOString();
}

// สร้างเลขรันถัดไป เช่น nextNumber(["T-001","T-002"], "T-", 3) -> "T-003"
export function nextNumber(existing: string[], prefix: string, digits: number): string {
  let max = 0;
  for (const code of existing) {
    const n = parseInt(code.replace(prefix, ""), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return prefix + String(max + 1).padStart(digits, "0");
}

// สร้างรหัสสุ่มสำหรับลิงก์บัตร /t/[token] (เดายาก)
export function randomToken(length = 10): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// ส่งการแจ้งเตือนข้าม role เช่น User ส่งสลิป -> แจ้ง admin
export async function notify(toRole: KindMap["notice"]["toRole"], title: string, message: string, link: string, toUserId = "") {
  try {
    // เก็บแจ้งเตือนไว้ไม่เกิน 20 แถว ลบของเก่าก่อนเพิ่มใหม่ ไม่ให้กินที่ใน MockAPI
    await pruneNotices(19);
    await createRecord("notice", { toRole, toUserId, title, message, link, read: false, createdAt: nowIso() });
  } catch {
    // แจ้งเตือนไม่สำเร็จไม่ควรทำให้งานหลักพัง จึงเงียบไว้
  }
}
