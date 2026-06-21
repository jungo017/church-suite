"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/lib/ui/card";
import { Input } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";

// 최소 로그인 폼. 교회는 호스트(테넌트)로 해석되므로 교회 서브도메인에서 로그인.
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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Card className="flex flex-col gap-6 p-8">
        <h1 className="text-2xl font-bold">로그인</h1>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <Input
            placeholder="아이디"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            autoComplete="username"
          />
          <Input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && (
            <p className="text-sm text-destructive">로그인 실패: {error}</p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "로그인 중…" : "로그인"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
