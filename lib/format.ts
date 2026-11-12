// ฟังก์ชันจัดรูปแบบตัวเลขและวันที่ให้เป็นภาษาไทย

// 1240 -> "1,240"
export function num(n: number): string {
  return n.toLocaleString("th-TH");
}

// 1000 -> "1,000 บาท"
export function baht(n: number): string {
  return `${num(n)} บาท`;
}

// ISO -> "15 ธ.ค. 2569 · 19:12"
export function dateTime(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const date = d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

// ISO -> "15 ธ.ค."
export function shortDate(iso: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

// ISO -> "19:12"
export function timeOnly(iso: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

// เช็กว่าเป็นวันเดียวกับวันนี้ไหม
export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

// มิลลิวินาที -> "23:58:42"
export function countdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// ตัวอักษรย่อสำหรับ avatar: "TEST TEST1" -> "TT"
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}
