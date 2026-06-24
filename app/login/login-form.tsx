"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/form";

export function LoginForm() {
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
      const data = (await res.json().catch(() => ({}))) as { scope?: string };
      router.push(data.scope === "platform" ? "/platform" : "/dashboard");
      router.refresh();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "login_failed");
    }
  }

  return (
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
        {loading ? "로그인 중..." : "로그인"}
      </Button>
    </form>
  );
}
