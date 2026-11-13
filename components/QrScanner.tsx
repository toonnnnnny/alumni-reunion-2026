"use client";
// ตัวสแกน QR ด้วยกล้องของแท็บเล็ต/มือถือ (ใช้กับ Staff และ Vendor)
//
// ขั้นตอน
//   1) ขอสิทธิ์กล้องด้วย navigator.mediaDevices.getUserMedia (ต้องเป็น https หรือ localhost)
//   2) เอาภาพจากกล้องใส่ <video> (useRef)
//   3) ทุก 250ms วาดภาพจาก video ลง <canvas> แล้วให้ jsQR อ่าน QR จากพิกเซล
//   4) อ่านเจอ -> ปิดกล้อง แล้วส่งข้อความใน QR ให้ onResult
//   5) ออกจากหน้า -> ปิดกล้องใน cleanup ของ useEffect (ไม่งั้นไฟกล้องจะค้าง)
// ถ้าใช้กล้องไม่ได้ ยังพิมพ์รหัสบัตรเองได้เสมอ

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff, Keyboard, RefreshCw } from "lucide-react";
import { Button } from "./ui";

type CameraState = "starting" | "scanning" | "denied" | "insecure" | "nocamera";

type Props = {
  onResult: (code: string) => void;
  manualLabel?: string; // ข้อความช่องพิมพ์เอง
  manualPlaceholder?: string;
  demoCodes?: string[]; // ปุ่มลัดสำหรับเดโมบนคอมที่ไม่มีกล้อง
};

export function QrScanner({ onResult, manualLabel = "สแกนไม่ได้? กรอกรหัสบัตร", manualPlaceholder = "เช่น T-001", demoCodes = [] }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(false); // กันเรียก onResult ซ้ำหลายครั้ง
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const [state, setState] = useState<CameraState>("starting");
  const [manualCode, setManualCode] = useState("");
  const [attempt, setAttempt] = useState(0); // เพิ่มค่าเพื่อสั่งเปิดกล้องใหม่

  // ปิดกล้องและหยุดการอ่านภาพ
  function stopCamera() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    doneRef.current = false;

    // กล้องใช้ได้เฉพาะเว็บที่ปลอดภัย (https หรือ localhost)
    if (!window.isSecureContext) {
      setState("insecure");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("nocamera");
      return;
    }

    let cancelled = false;
    setState("starting");

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false }) // environment = กล้องหลัง
      .then(async (stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play().catch(() => {});
        setState("scanning");

        // อ่านภาพทุก 250ms
        timerRef.current = setInterval(() => {
          const canvas = canvasRef.current;
          if (!canvas || !video.videoWidth || doneRef.current) return;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qr = jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" });
          if (qr && qr.data) {
            doneRef.current = true;
            stopCamera();
            if ("vibrate" in navigator) navigator.vibrate(80);
            onResultRef.current(qr.data.trim());
          }
        }, 250);
      })
      .catch((err: DOMException) => {
        if (cancelled) return;
        // NotAllowedError = ผู้ใช้กดไม่อนุญาต, NotFoundError = ไม่มีกล้อง
        setState(err.name === "NotFoundError" || err.name === "OverconstrainedError" ? "nocamera" : "denied");
      });

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [attempt]);

  // ส่งรหัสที่พิมพ์เอง
  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    stopCamera();
    // ไม่แปลงเป็นตัวพิมพ์ใหญ่: ลิงก์บัตร /t/<token> แยกตัวพิมพ์เล็ก-ใหญ่ ส่วนเลขบัตร/เลขคำสั่งซื้อฝั่งค้นหาเทียบแบบไม่สนตัวพิมพ์อยู่แล้ว
    onResult(manualCode.trim());
  }

  const message: Record<Exclude<CameraState, "scanning">, string> = {
    starting: "กำลังเปิดกล้อง... ถ้าเบราว์เซอร์ถาม ให้กด \"อนุญาต\"",
    denied: "ไม่ได้รับสิทธิ์ใช้กล้อง เปิดสิทธิ์กล้องในการตั้งค่าเบราว์เซอร์ แล้วกดลองอีกครั้ง",
    insecure: "เปิดกล้องไม่ได้ เพราะเว็บนี้ไม่ได้เปิดผ่าน https (ใช้ลิงก์ Vercel หรือ localhost)",
    nocamera: "ไม่พบกล้องในอุปกรณ์นี้ ใช้ช่องกรอกรหัสด้านล่างแทน",
  };

  return (
    <div className="space-y-4">
      <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl bg-[#1b2433]">
        <video ref={videoRef} playsInline muted className={state === "scanning" ? "size-full object-cover" : "hidden"} />
        <canvas ref={canvasRef} className="hidden" />

        {/* กรอบเล็ง */}
        <div className="pointer-events-none absolute inset-[14%] rounded-2xl border-[3px] border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />

        {state !== "scanning" && (
          <div className="absolute inset-0 grid place-items-center p-8 text-center text-sm text-white/90">
            <div className="space-y-3">
              {state === "starting" ? <Camera className="mx-auto size-8 animate-pulse" /> : <CameraOff className="mx-auto size-8" />}
              <p>{message[state]}</p>
              {(state === "denied" || state === "nocamera") && (
                <Button variant="ghost" size="sm" onClick={() => setAttempt((n) => n + 1)}>
                  <RefreshCw className="size-4" /> ลองอีกครั้ง
                </Button>
              )}
            </div>
          </div>
        )}
        {state === "scanning" && (
          <p className="absolute inset-x-0 bottom-4 text-center text-sm text-white/90">หันกล้องไปที่ QR Code ของลูกค้า</p>
        )}
      </div>

      <form onSubmit={submitManual} className="mx-auto max-w-md rounded-2xl border border-line bg-white p-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Keyboard className="size-4" /> {manualLabel}
        </p>
        <div className="flex gap-2">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder={manualPlaceholder}
            className="h-12 min-w-0 flex-1 rounded-xl border border-line px-4 uppercase outline-none focus:border-navy"
          />
          <Button type="submit">ค้นหา</Button>
        </div>
        {demoCodes.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
            ตัวอย่างสำหรับเดโม:
            {demoCodes.map((code) => (
              <button key={code} type="button" onClick={() => onResult(code)} className="rounded-full bg-navy-soft px-3 py-1 font-semibold text-navy">
                {code}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
