// อัปโหลดข้อมูลตัวอย่างขึ้น MockAPI จริง
// วิธีใช้:
//   1) สร้าง resource ชื่อ accounts และ records ใน mockapi.io (ไม่ต้องตั้ง schema)
//   2) ใส่ NEXT_PUBLIC_API_BASE ใน .env.local
//   3) รัน  npm run seed:mockapi
// สคริปต์จะลบข้อมูลเก่าใน 2 resource นี้ก่อน แล้วเพิ่มข้อมูลใหม่ตามลำดับ id 1,2,3...

import { readFileSync } from "node:fs";

// อ่าน .env.local เอง (ไม่ต้องลง library)
function readEnv() {
  try {
    const text = readFileSync(".env.local", "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m) process.env[m[1]] = m[2];
    }
  } catch {}
}
readEnv();

const BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
if (!BASE.startsWith("http")) {
  console.error("ยังไม่ได้ใส่ NEXT_PUBLIC_API_BASE ใน .env.local");
  process.exit(1);
}

// ข้อมูลตัวอย่างอยู่ใน lib/seed.ts (TypeScript) จึงดึงผ่าน MockAPI จำลองของ dev server (/api/mock) ที่ใช้ข้อมูลชุดนั้น
const LOCAL = process.env.LOCAL_URL || "http://localhost:3000";

async function getJson(url) {
  const res = await fetch(url);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(url + " -> " + res.status);
  return res.json();
}

async function main() {
  console.log("ดึงข้อมูลตัวอย่างจาก", LOCAL, "(ต้องเปิด npm run dev ไว้อีกหน้าต่าง)");
  await fetch(LOCAL + "/api/reset", { method: "POST" });
  const seed = {
    accounts: await getJson(LOCAL + "/api/mock/accounts"),
    records: await getJson(LOCAL + "/api/mock/records"),
  };

  for (const resource of ["accounts", "records"]) {
    const old = await getJson(`${BASE}/${resource}`);
    for (const row of old) {
      await fetch(`${BASE}/${resource}/${row.id}`, { method: "DELETE" });
    }
    console.log(`ลบ ${resource} เก่า ${old.length} แถว`);

    for (const row of seed[resource]) {
      const { id, ...data } = row;
      const res = await fetch(`${BASE}/${resource}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const created = await res.json();
      if (created.id !== id) console.warn(`id ไม่ตรง: ตั้งใจ ${id} ได้ ${created.id} (ให้ลบ resource แล้วสร้างใหม่ เพื่อให้ id เริ่มที่ 1)`);
    }
    console.log(`เพิ่ม ${resource} ${seed[resource].length} แถว`);
  }
  console.log("เสร็จแล้ว");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
