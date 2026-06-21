"use client";

import { useState } from "react";

// 새 교회 가입 페이지(공개, 루트 도메인). UI 다듬기는 추후.
export default function OnboardPage() {
  const [form, setForm] = useState({
    churchName: "",
    churchCode: "",
    adminName: "",
    adminLoginId: "",
    adminPassword: "",
  });
  const [result, setResult] = useState<{ code: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/onboard", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    const data = (await res.json().catch(() => ({}))) as {
      code?: string;
      error?: string;
    };
    if (res.ok) setResult({ code: data.code! });
    else setError(data.error ?? "onboard_failed");
  }

  if (result) {
    const host =
      typeof window !== "undefined"
        ? `${result.code}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost"}${window.location.port ? ":" + window.location.port : ""}`
        : "";
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
        <h1 className="text-2xl font-bold">교회가 생성되었습니다 🎉</h1>
        <p className="text-sm text-muted-foreground">
          아래 주소에서 관리자 계정으로 로그인하세요:
        </p>
        <a className="font-mono text-sm underline" href={`//${host}/login`}>
          {host}/login
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-bold">교회 가입</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input className="rounded-md border border-border px-3 py-2 dark:bg-transparent" placeholder="교회 이름" value={form.churchName} onChange={set("churchName")} />
        <input className="rounded-md border border-border px-3 py-2 dark:bg-transparent" placeholder="교회 코드 (서브도메인, 영문소문자)" value={form.churchCode} onChange={set("churchCode")} />
        <input className="rounded-md border border-border px-3 py-2 dark:bg-transparent" placeholder="관리자 이름" value={form.adminName} onChange={set("adminName")} />
        <input className="rounded-md border border-border px-3 py-2 dark:bg-transparent" placeholder="관리자 아이디" value={form.adminLoginId} onChange={set("adminLoginId")} autoComplete="username" />
        <input className="rounded-md border border-border px-3 py-2 dark:bg-transparent" type="password" placeholder="관리자 비밀번호 (8자 이상)" value={form.adminPassword} onChange={set("adminPassword")} autoComplete="new-password" />
        {error && <p className="text-sm text-destructive">가입 실패: {error}</p>}
        <button type="submit" disabled={loading} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
          {loading ? "생성 중…" : "교회 만들기"}
        </button>
      </form>
    </main>
  );
}
