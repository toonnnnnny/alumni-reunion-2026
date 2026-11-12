// MockAPI จำลองในเครื่อง ใช้ตอนยังไม่มี URL ของ MockAPI จริง
// เก็บข้อมูลไว้ในหน่วยความจำของเซิร์ฟเวอร์ (globalThis) รีสตาร์ต npm run dev แล้วข้อมูลจะกลับเป็นค่าตั้งต้น
// พฤติกรรมเลียนแบบ MockAPI: GET รายการ, GET ตาม id, POST, PUT, DELETE และค้นหาด้วย ?field=value

import { seedAccounts, seedRecords } from "@/lib/seed";

type Row = { id: string; [key: string]: unknown };
type Db = { accounts: Row[]; records: Row[] };

const g = globalThis as unknown as { __reunionDb?: Db };

// โหลดฐานข้อมูล ถ้ายังไม่มีให้คัดลอกจากข้อมูลตัวอย่าง
export function getDb(): Db {
  if (!g.__reunionDb) {
    g.__reunionDb = {
      accounts: JSON.parse(JSON.stringify(seedAccounts)),
      records: JSON.parse(JSON.stringify(seedRecords)),
    };
  }
  return g.__reunionDb;
}

export function resetDb() {
  g.__reunionDb = undefined;
  return getDb();
}

// คืนตารางตามชื่อ resource ถ้าไม่ใช่ accounts/records คืน null
export function getTable(resource: string): Row[] | null {
  const db = getDb();
  if (resource === "accounts") return db.accounts;
  if (resource === "records") return db.records;
  return null;
}

// id ถัดไปแบบ MockAPI ("1","2","3",...)
export function nextId(rows: Row[]): string {
  let max = 0;
  for (const r of rows) max = Math.max(max, parseInt(r.id, 10) || 0);
  return String(max + 1);
}
