"use client";
// ฟอร์มเข้าสู่ระบบที่ทุก role ใช้ร่วมกัน (ต่างกันแค่หัวข้อและบัญชีตัวอย่าง)

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button, ErrorText, Field } from "./ui";

type Props = {
  title: string;
  subtitle: string;
  usernameLabel?: string;
  demo: { username: string; password: string };
  registerHref?: string;
};

function LoginInner({ title, subtitle, usernameLabel = "ชื่อผู้ใช้", demo, registerHref }: Props) {
  const { login, account, ready, role } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || `/${role}`;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ล็อกอินอยู่แล้วให้ไปหน้าหลักเลย
  useEffect(() => {
    if (ready && account) router.replace(next);
  }, [ready, account, next, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("กรอกชื่อผู้ใช้และรหัสผ่านให้ครบ");
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-3xl border border-line bg-white p-6 sm:p-8">
        <div className="mb-2 text-center">
          <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-navy text-lg font-bold text-white">AR</div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
        <Field label={usernameLabel} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        <Field label="รหัสผ่าน" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        <ErrorText text={error} />
        <Button type="submit" full loading={loading}>
          เข้าสู่ระบบ
        </Button>
        <button
          type="button"
          onClick={() => {
            setUsername(demo.username);
            setPassword(demo.password);
          }}
          className="w-full rounded-xl bg-navy-soft px-3 py-2 text-xs text-muted"
        >
          บัญชีทดสอบ: <b>{demo.username}</b> / {demo.password} (แตะเพื่อกรอก)
        </button>
        {registerHref && (
          <p className="text-center text-sm text-muted">
            ยังไม่มีบัญชี?{" "}
            <Link href={registerHref} className="font-semibold text-navy">
              สมัครสมาชิก
            </Link>
          </p>
        )}
        <p className="text-center text-xs">
          <Link href="/" className="text-muted underline">
            กลับหน้าเลือกบทบาท
          </Link>
        </p>
      </form>
    </div>
  );
}

// useSearchParams ต้องอยู่ใน Suspense ตามกติกาของ Next.js
export function LoginForm(props: Props) {
  return (
    <Suspense>
      <LoginInner {...props} />
    </Suspense>
  );
}
