// ชั้นเรียก REST API ทั้งหมดของเว็บ (fetch + async/await + try/catch)
// ทุก role เรียกผ่านไฟล์นี้ ข้อมูลเลยเป็นชุดเดียวกัน แม้จะเปิดคนละ URL คนละเครื่อง
//
// API_BASE มาจาก .env.local
//   - ใส่ URL MockAPI จริง เช่น https://xxxx.mockapi.io/api/v1 -> ใช้ MockAPI
//   - เว้นว่าง -> ใช้ MockAPI จำลองในเครื่องที่ /api/mock (app/api/mock)

import type { Account, KindMap, RecordKind } from "./types";

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "/api/mock").replace(/\/$/, "");

// เรียก API แล้วแปลงเป็น JSON ถ้าผิดพลาดโยน Error พร้อมข้อความภาษาไทย
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`เรียกข้อมูลไม่สำเร็จ (${res.status})`);
  }
  return (await res.json()) as T;
}

// ดึงรายการ ถ้า MockAPI หาไม่เจอจะตอบ 404 จึงถือว่าเป็นรายการว่าง
async function requestList<T>(path: string): Promise<T[]> {
  const res = await fetch(API_BASE + path, { cache: "no-store" });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`เรียกข้อมูลไม่สำเร็จ (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? (data as T[]) : [];
}

// ---------------- accounts ----------------

export async function listAccounts(): Promise<Account[]> {
  return requestList<Account>("/accounts");
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
  return request<KindMap[K]>("/records", { method: "POST", body: JSON.stringify({ ...data, kind }) });
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
    await createRecord("notice", { toRole, toUserId, title, message, link, read: false, createdAt: nowIso() });
  } catch {
    // แจ้งเตือนไม่สำเร็จไม่ควรทำให้งานหลักพัง จึงเงียบไว้
  }
}
