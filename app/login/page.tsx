"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 최소 로그인 폼 (0.5). UI 다듬기는 0.8.
// 교회는 호스트(테넌트)로 해석되므로 교회 서브도메인에서 로그인한다(예: cityhope.localhost:3000/login).
export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ loginId, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "login_failed");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-bold">로그인</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
          placeholder="아이디"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          autoComplete="username"
        />
        <input
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20 dark:bg-transparent"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-red-600">로그인 실패: {error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {loading ? "로그인 중…" : "로그인"}
        </button>
      </form>
    </main>
  );
}
