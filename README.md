# Alumni Reunion 2026 — ระบบขายบัตรและโทเคนงานเลี้ยงรุ่น

Next.js 16 + TypeScript + Tailwind v4 + MockAPI (REST) · เว็บเดียว แยก URL ตาม role · ทุก role ใช้ข้อมูลชุดเดียวกัน

## เริ่มใช้งานในเครื่อง

```bash
npm install
npm run dev
```

เปิด http://localhost:3000 แล้วเลือกบทบาท ถ้ายังไม่ได้ตั้ง MockAPI เว็บจะใช้ **MockAPI จำลองในเครื่อง** (`/api/mock`) ให้อัตโนมัติ
ข้อมูลอยู่ในหน่วยความจำ ปิด `npm run dev` แล้วเปิดใหม่ ข้อมูลกลับเป็นค่าตั้งต้น (หรือเรียก `POST /api/reset`)

## URL และบัญชีทดสอบ (รหัสผ่าน `1234` ทุกบัญชี)

| Role | URL | อุปกรณ์ | ชื่อผู้ใช้ |
|---|---|---|---|
| ผู้ซื้อ | `/user` | มือถือ | `TEST1@gmail.com` (มีบัตร T-001, T-002) · `TEST3@gmail.com` (มีสลิปรอตรวจ) |
| Staff | `/staff` | แท็บเล็ต | `staff1` |
| ร้านค้า | `/vendor` | แท็บเล็ต | `bubbletea.d2` · `alumnicafe.d1` · `snack.d3` |
| Packing | `/packing` | มือถือ | `packing` |
| Super Admin | `/admin` | เดสก์ท็อป | `admin` |
| ลิงก์บัตร (ไม่ต้องล็อกอิน) | `/t/k8QzR4vN2w` | มือถือ | บัตร T-002 ของ TEST TEST2 |
| อีเมลบัตร (เทมเพลต Gmail) | `/mail/8` | มือถือ | อีเมลของ ORD-240001 |

session แยกตาม role (เก็บใน localStorage คนละ key) จึงเปิด `/user` กับ `/admin` พร้อมกันในเบราว์เซอร์เดียวได้

## role เชื่อมกันยังไง

ทุกหน้าอ่าน/เขียน MockAPI ผ่าน `lib/api.ts` และดึงข้อมูลใหม่ทุก 5 วินาทีด้วย `lib/usePolling.ts`
งานที่แก้หลายที่พร้อมกันรวมไว้ใน `lib/actions.ts` และแจ้งเตือนข้าม role ผ่าน record ชนิด `notice`

| เหตุการณ์ | ใครเห็น |
|---|---|
| User ส่งสลิป | Admin: เลขแดงบนเมนู + toast · `/admin/payments` |
| Admin อนุมัติ | User: หน้าสถานะเปลี่ยนเอง · ได้บัตร T-xxx + 50 โทเคน · ดูอีเมลได้ที่ `/mail/<id>` |
| Admin อนุมัติเสื้อแบบจัดส่ง | Packing: คิว "รอแพ็ค" · สต็อกลด |
| Staff เติมโทเคน (เงินสด/โอน) | User: ยอดในกระเป๋าเพิ่ม · Admin: `/admin/topups` |
| Vendor สแกนขาย | User: ยอดลด · ร้าน: ยอดถอนได้เพิ่ม · Admin: กราฟร้าน |
| Vendor ขอถอนเงิน | Admin: เลขแดงที่ "ร้านค้าและเมนู" → แท็บคำขอถอนเงิน |
| Admin กดโอนเสร็จ | Vendor: หน้ารอเปลี่ยนเป็น "ถอนเงินสำเร็จ" เอง |
| Staff แจ้งปัญหา | Admin: `/admin/issues` → ปิดเรื่อง → Staff เห็นสถานะ |

ทดสอบ: เปิด 2 หน้าต่างคู่กัน เช่น มือถือ `/user` กับคอม `/admin`

## กล้องสแกน QR (Staff, Vendor)

`components/QrScanner.tsx` ใช้ `navigator.mediaDevices.getUserMedia` เปิดกล้องหลัง แล้วให้ `jsqr` อ่าน QR จากภาพทุก 250ms

- เบราว์เซอร์เปิดกล้องได้เฉพาะ **https** หรือ **localhost** เท่านั้น
- เทสบนแท็บเล็ต/มือถือจริง ให้ใช้ลิงก์ Vercel (เปิดผ่าน `http://192.168.x.x:3000` กล้องจะไม่ทำงาน)
- ถ้าไม่มีกล้องหรือไม่ให้สิทธิ์ ยังพิมพ์เลขบัตรเองได้ และมีปุ่มลัด T-001 / T-002 สำหรับเดโมบนคอม

## ใช้ MockAPI จริง (ต้องทำก่อน deploy)

MockAPI แผนฟรีสร้างได้ 2 resource ระบบนี้จึงใช้แค่ 2 ตัว: `accounts` และ `records` (แยกประเภทด้วยฟิลด์ `kind`)

1. สร้างโปรเจกต์ใน mockapi.io แล้วสร้าง resource ชื่อ `accounts` และ `records` (ไม่ต้องตั้ง schema)
2. สร้างไฟล์ `.env.local` ใส่ `NEXT_PUBLIC_API_BASE=https://xxxx.mockapi.io/api/v1`
3. เปิด `npm run dev` ไว้ แล้วอีกหน้าต่างรัน `npm run seed:mockapi` เพื่ออัปข้อมูลตัวอย่างขึ้น MockAPI
4. รีสตาร์ต `npm run dev`

## ส่งอีเมลบัตรจริง (Resend)

พอ Admin อนุมัติคำสั่งซื้อบัตร ระบบจะส่งอีเมลบัตรพร้อม QR Code เข้ากล่องจดหมายของผู้ซื้อจริงผ่าน Resend (`app/api/email/ticket/route.ts`)
ในหน้าตรวจสลิปของ Admin มีการ์ด "อีเมลบัตร" บอกว่าส่งแล้วหรือยัง และกดส่งซ้ำได้

1. สมัคร resend.com → API Keys → Create API Key
2. ใส่ใน `.env.local`
   ```
   RESEND_API_KEY=re_xxxxxxxx
   RESEND_FROM=Alumni Reunion 2026 <onboarding@resend.dev>
   ```
3. รีสตาร์ต `npm run dev`

ข้อจำกัดตอนยังไม่ยืนยันโดเมน: ผู้ส่ง `onboarding@resend.dev` ส่งได้เฉพาะอีเมลที่ใช้สมัคร Resend
ตอนเทสให้สมัครบัญชีผู้ซื้อในเว็บด้วยอีเมลเดียวกับที่สมัคร Resend ถ้าต้องการส่งถึงทุกคน ต้องยืนยันโดเมนของตัวเองใน Resend แล้วเปลี่ยน `RESEND_FROM`
บน Vercel ให้ใส่ `RESEND_API_KEY`, `RESEND_FROM` และ `NEXT_PUBLIC_SITE_URL` (ลิงก์ Vercel) ใน Environment Variables ด้วย

## Deploy บน Vercel

1. push โค้ดขึ้น GitHub
2. vercel.com → Add New → Project → เลือก repo
3. Environment Variables: `NEXT_PUBLIC_API_BASE` = URL ของ MockAPI
4. Deploy ได้ลิงก์ `https://<ชื่อ>.vercel.app/user` ฯลฯ

บน Vercel ต้องใช้ MockAPI จริง เพราะ MockAPI จำลองเก็บในหน่วยความจำ ข้อมูลไม่ถาวรบน serverless

## Docker

```bash
docker compose up --build
```

## โครงสร้างโฟลเดอร์

```
app/
  user/  staff/  vendor/  packing/  admin/   หน้าของแต่ละ role (layout.tsx = ระบบล็อกอินของ role นั้น)
  t/[token]/        ลิงก์บัตรผู้เข้าร่วมใบที่ 2+ (ไม่ต้องล็อกอิน)
  mail/[orderId]/   เทมเพลตอีเมลบัตรแบบ Gmail
  api/mock/         MockAPI จำลองในเครื่อง
components/         ui.tsx (ปุ่ม การ์ด ...), shells.tsx (โครงหน้า), QrScanner, QrImage, SlipPicker, charts
lib/
  api.ts            เรียก REST API (fetch, try/catch)
  actions.ts        งานข้าม role: approveOrder, topUp, sell, requestWithdraw, completeWithdraw ...
  auth.tsx          Login/Logout + React Context
  cart.tsx          ตะกร้าเสื้อ (Context + localStorage)
  status.ts         Finite State Machine ของสถานะคำสั่งซื้อ
  usePolling.ts     ดึงข้อมูลซ้ำทุก 5 วินาที
  seed.ts           ข้อมูลตัวอย่างชุดเดียวกับ Figma
```

## สิ่งที่เรียนในเทอม → ใช้ตรงไหน

| เรื่อง | ไฟล์ |
|---|---|
| Next.js multipages + TypeScript | `app/*` · `lib/types.ts` |
| Tailwind v4 + Responsive + Grid/Flexbox | ทุกหน้า (`sm:` `lg:` `xl:`) · `app/globals.css` |
| useState / useEffect / useRef | `QrScanner.tsx` (useRef กล้อง) · `SlipPicker.tsx` (useRef input ไฟล์) |
| React Context | `lib/auth.tsx` · `lib/cart.tsx` |
| map / filter / pagination | `app/user/wallet/[ticketNo]` · `app/admin/buyers` |
| Login/Logout | `lib/auth.tsx` · `components/LoginForm.tsx` |
| REST API / MockAPI / fetch / Route Params | `lib/api.ts` · `app/**/[id]/page.tsx` |
| Suspense | หน้าที่ใช้ `useSearchParams` (`/user/qr`, `/admin/shops`, หน้า login) |
| localStorage | session, ตะกร้า |
| async + exceptions | ทุก action มี try/catch แสดงข้อความภาษาไทย |
| Finite State Machine | `lib/status.ts` |
| Git / Docker / Vercel | `Dockerfile` · `docker-compose.yml` · หัวข้อ Deploy |

## นโยบายที่ใส่ในระบบ

- 1 โทเคน = 1 บาท · บัตร 1 ใบได้ 50 โทเคน
- โทเคนแลกคืนเป็นเงินสดไม่ได้ ใช้ได้เฉพาะในงานวันที่ 15 ธ.ค. 2569 (แสดงที่หน้าซื้อบัตร กระเป๋าโทเคน และหน้าเติมของ Staff)
- บัตรใบที่ 1 = ผู้ซื้อ ดึงข้อมูลจากตอนสมัคร แก้ไม่ได้ (แก้ที่โปรไฟล์) · ใบที่ 2+ เปิดผ่านลิงก์ `/t/<รหัสสุ่ม>`
- Staff ต้องเลือกว่ารับเงินสดหรือโอนทุกครั้งที่เติม หน้าแรก Staff มียอดเงินสดที่ต้องส่ง Admin
- ร้านถอนเงินได้วันละ 1 ครั้ง โทเคนที่ขอถอนถูกกันไว้ทันที Admin โอนเอง แนบสลิปหรือไม่ก็ได้
