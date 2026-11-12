"use client";
// กระดิ่งแจ้งเตือน: ดึง notice ของ role นี้ทุก 5 วินาที แสดงจำนวนที่ยังไม่อ่าน
// เมื่อมีแจ้งเตือนใหม่เข้ามา แสดง toast มุมขวาล่าง 4 วินาที

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { listRecords, updateRecord } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { usePolling } from "@/lib/usePolling";
import { dateTime } from "@/lib/format";
import type { Notice } from "@/lib/types";
import { cx } from "./ui";

export function NoticeBell() {
  const { role, account } = useAuth();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<Notice | null>(null);
  const seenIds = useRef<Set<string> | null>(null);

  // เอาเฉพาะแจ้งเตือนของ role นี้ และ (ส่งถึงทุกคน หรือ ส่งถึงเราคนเดียว)
  const { data, reload } = usePolling(async () => {
    const all = await listRecords("notice");
    return all
      .filter((n) => n.toRole === role && (!n.toUserId || n.toUserId === account?.id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
  const notices = data ?? [];
  const unread = notices.filter((n) => !n.read).length;

  // หาแจ้งเตือนที่เพิ่งเข้ามาใหม่ (ไม่เคยเห็นในรอบก่อน) แล้วโชว์ toast
  useEffect(() => {
    if (!data) return;
    if (seenIds.current === null) {
      seenIds.current = new Set(data.map((n) => n.id)); // รอบแรกไม่ต้องเด้ง
      return;
    }
    const fresh = data.find((n) => !seenIds.current!.has(n.id));
    data.forEach((n) => seenIds.current!.add(n.id));
    if (fresh) {
      setToast(fresh);
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  async function markAllRead() {
    await Promise.all(notices.filter((n) => !n.read).map((n) => updateRecord("notice", n.id, { read: true })));
    reload();
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative grid size-10 place-items-center rounded-xl bg-gray-100" aria-label="แจ้งเตือน">
        <Bell className="size-5" />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-bad px-1 text-[11px] font-semibold leading-5 text-white">{unread}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-80 max-w-[85vw] rounded-2xl border border-line bg-white p-2 shadow-xl">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="font-semibold">แจ้งเตือน</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-semibold text-navy">
                อ่านทั้งหมด
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notices.length === 0 && <p className="px-2 py-6 text-center text-sm text-muted">ยังไม่มีแจ้งเตือน</p>}
            {notices.slice(0, 20).map((n) => (
              <Link
                key={n.id}
                href={n.link || "#"}
                onClick={() => {
                  setOpen(false);
                  if (!n.read) updateRecord("notice", n.id, { read: true }).then(reload);
                }}
                className={cx("block rounded-xl px-3 py-2.5 hover:bg-gray-50", !n.read && "bg-navy-soft/60")}
              >
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-muted">{n.message}</p>
                <p className="mt-0.5 text-[11px] text-muted">{dateTime(n.createdAt)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <Link href={toast.link || "#"} onClick={() => setToast(null)} className="fixed bottom-28 right-4 z-50 w-80 max-w-[90vw] rounded-2xl bg-navy p-4 text-white shadow-2xl lg:bottom-6">
          <p className="text-sm font-semibold">🔔 {toast.title}</p>
          <p className="text-xs text-white/80">{toast.message}</p>
        </Link>
      )}
    </div>
  );
}
