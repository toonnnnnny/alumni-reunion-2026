"use client";
// คอมโพเนนต์กลางที่ทุก role ใช้ร่วมกัน (ปุ่ม การ์ด ป้ายสถานะ ช่องกรอก modal ...)
// แยกไว้ที่เดียวเพื่อให้หน้าตาเหมือนกันทั้งเว็บ และแก้ทีเดียวได้ทุกหน้า

import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { AlertTriangle, Info, Loader2, X } from "lucide-react";
import type { Tone } from "@/lib/status";

// รวม className หลายตัว ตัดค่าว่างทิ้ง
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

// ---------- ปุ่ม ----------

type ButtonVariant = "primary" | "outline" | "ghost" | "danger" | "success";

const buttonStyle: Record<ButtonVariant, string> = {
  primary: "bg-navy text-white hover:bg-navy/90",
  outline: "border-[1.5px] border-navy bg-white text-navy hover:bg-navy-soft",
  ghost: "bg-navy-soft text-navy hover:bg-navy-soft/70",
  danger: "bg-bad-soft text-bad hover:bg-bad-soft/70",
  success: "bg-ok text-white hover:bg-ok/90",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  full?: boolean;
  size?: "md" | "lg" | "sm";
};

export function Button({ variant = "primary", loading, full, size = "md", className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "lg" && "min-h-14 px-6 text-base",
        size === "md" && "min-h-12 px-5 text-[15px]",
        size === "sm" && "min-h-9 px-3 text-sm",
        full && "w-full",
        buttonStyle[variant],
        className
      )}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

// ลิงก์ที่หน้าตาเหมือนปุ่ม
export function ButtonLink({ href, variant = "primary", full, className, children }: { href: string; variant?: ButtonVariant; full?: boolean; className?: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cx("inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition", full && "w-full", buttonStyle[variant], className)}
    >
      {children}
    </Link>
  );
}

// ---------- การ์ด ----------

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-2xl border border-line bg-white p-5", className)}>{children}</div>;
}

export function CardTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="text-[17px] font-semibold">{children}</h3>
      {right}
    </div>
  );
}

// แถว "หัวข้อ ... ค่า" ในการ์ดรายละเอียด
export function InfoRow({ label, value, strong, tone }: { label: string; value: ReactNode; strong?: boolean; tone?: Tone }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/70 py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-muted">{label}</span>
      <span className={cx("text-right text-sm font-semibold break-words", strong && "text-lg font-bold", tone && toneText[tone])}>{value}</span>
    </div>
  );
}

// ---------- ป้ายสถานะ ----------

const toneBadge: Record<Tone, string> = {
  gray: "bg-gray-100 text-muted",
  green: "bg-ok-soft text-ok",
  amber: "bg-warn-soft text-warn",
  red: "bg-bad-soft text-bad",
  blue: "bg-sky-50 text-sky-700",
  navy: "bg-navy-soft text-navy",
};

const toneText: Record<Tone, string> = {
  gray: "text-muted",
  green: "text-ok",
  amber: "text-warn",
  red: "text-bad",
  blue: "text-sky-700",
  navy: "text-navy",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cx("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", toneBadge[tone])}>{children}</span>;
}

// เลขแจ้งเตือนสีแดงบนเมนู
export function CountDot({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className="grid min-w-5 place-items-center rounded-full bg-bad px-1.5 text-[11px] font-semibold leading-5 text-white">{count}</span>;
}

// ---------- การ์ดสถิติ ----------

export function StatCard({ label, value, unit, icon, tone = "navy" }: { label: string; value: ReactNode; unit?: string; icon?: ReactNode; tone?: Tone }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-muted">{label}</span>
        {icon && <span className={cx("grid size-10 place-items-center rounded-xl", toneBadge[tone])}>{icon}</span>}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold">{value}</span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
    </div>
  );
}

// ---------- ช่องกรอก ----------

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string; required?: boolean };

export function Field({ label, hint, error, required, className, ...rest }: FieldProps) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-sm font-semibold">
        {label} {required && <span className="text-bad">*</span>}
      </span>
      <input
        {...rest}
        className={cx(
          "h-12 w-full rounded-xl border bg-white px-4 text-[15px] outline-none transition focus:border-navy disabled:bg-gray-100 disabled:text-muted",
          error ? "border-bad" : "border-line"
        )}
      />
      {error ? <span className="mt-1 block text-xs text-bad">{error}</span> : hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function TextArea({ label, value, onChange, placeholder, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none focus:border-navy"
      />
    </label>
  );
}

export function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full rounded-xl border border-line bg-white px-4 text-[15px] outline-none focus:border-navy">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// ---------- แถบข้อความ ----------

export function Banner({ tone = "navy", children }: { tone?: "navy" | "amber" | "red" | "green"; children: ReactNode }) {
  const style = {
    navy: "bg-navy-soft text-muted",
    amber: "bg-warn-soft text-warn",
    red: "bg-bad-soft text-bad",
    green: "bg-ok-soft text-ok",
  }[tone];
  const Icon = tone === "amber" || tone === "red" ? AlertTriangle : Info;
  return (
    <div className={cx("flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm", style)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// ข้อความนโยบายโทเคน ใช้ทั้งหน้า User และ Staff
export function TokenPolicy() {
  return (
    <Banner tone="amber">
      <b>โทเคนแลกคืนเป็นเงินสดไม่ได้</b>
      <div className="text-xs">ใช้ได้เฉพาะภายในงานวันที่ 15 ธ.ค. 2569 · โทเคนที่เหลือหลังจบงานขอคืนไม่ได้</div>
    </Banner>
  );
}

// ---------- สถานะโหลด / ว่าง / ผิดพลาด ----------

export function Loading({ text = "กำลังโหลด..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
      <Loader2 className="size-4 animate-spin" /> {text}
    </div>
  );
}

export function EmptyState({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <p className="font-semibold">{title}</p>
      {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorText({ text }: { text: string }) {
  if (!text) return null;
  return <p className="rounded-xl bg-bad-soft px-4 py-3 text-sm text-bad">{text}</p>;
}

// ---------- Modal ----------

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; footer?: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-3">
          {title ? <h3 className="text-lg font-bold">{title}</h3> : <span />}
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full bg-gray-100 text-muted" aria-label="ปิด">
            <X className="size-4" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- แท็บ ----------

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number; alert?: boolean }[] }) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-gray-200/60 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cx(
            "flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
            value === tab.value ? "bg-white text-ink shadow-sm" : "text-muted"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cx("rounded-full px-2 text-xs leading-5", tab.alert && tab.count > 0 ? "bg-bad text-white" : value === tab.value ? "bg-navy text-white" : "bg-gray-300/70")}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ---------- ตัวเลือกจำนวน + / - ----------

export function Stepper({ value, onChange, min = 1, max = 99 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1">
      <button className="grid size-9 place-items-center rounded-lg bg-gray-100 text-lg disabled:opacity-40" disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="w-8 text-center font-semibold">{value}</span>
      <button className="grid size-9 place-items-center rounded-lg bg-navy text-lg text-white disabled:opacity-40" disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}
