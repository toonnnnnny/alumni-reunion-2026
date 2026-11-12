"use client";
// เรียกฟังก์ชันโหลดข้อมูลซ้ำทุก ๆ intervalMs (ค่าเริ่มต้น 5 วินาที)
// ทำให้หน้าของแต่ละ role เห็นข้อมูลใหม่จาก role อื่นเอง โดยไม่ต้องกดรีเฟรช
// ใช้ setInterval ใน useEffect และ clearInterval ตอนออกจากหน้า

import { useCallback, useEffect, useRef, useState } from "react";

export function usePolling<T>(loader: () => Promise<T>, intervalMs = 5000) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // เก็บ loader ล่าสุดใน useRef กัน setInterval เรียกฟังก์ชันเก่า
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async () => {
    try {
      const result = await loaderRef.current();
      setData(result);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    const timer = setInterval(reload, intervalMs);
    return () => clearInterval(timer);
  }, [reload, intervalMs]);

  return { data, isLoading, error, reload };
}
