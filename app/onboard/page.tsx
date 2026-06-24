"use client";

import { useState } from "react";

/**
 * 서버 에러코드 → 사용자 안내 메시지.
 * 키는 /api/onboard 와 lib/onboarding/onboard.ts(OnboardError)가 내는 코드.
 * 없는 코드는 일반 메시지 + 디버깅용 코드 표기로 폴백한다.
 */
const ONBOARD_ERROR_MESSAGES: Record<string, string> = {
  invalid_body: "요청 형식이 올바르지 않습니다.",
  invalid_request: "요청을 처리할 수 없습니다.",
  rate_limited: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  missing_fields: "필수 항목을 모두 입력해 주세요.",
  invalid_name: "교회 이름을 입력해 주세요.",
  invalid_code:
    "교회 코드 형식이 올바르지 않습니다. (영문 소문자·숫자·하이픈, 2~31자)",
  reserved_code: "사용할 수 없는 교회 코드입니다. (예약된 주소)",
  code_taken: "이미 사용 중인 교회 코드입니다. 다른 코드를 입력해 주세요.",
  invalid_admin_login:
    "사용할 수 없는 관리자 아이디입니다. (admin, root 등 예약어는 쓸 수 없어요)",
  invalid_admin: "관리자 비밀번호는 8자 이상이어야 합니다.",
  onboard_failed: "가입에 실패했습니다. 잠시 후 다시 시도해 주세요.",
};

function onboardErrorMessage(code: string): string {
  return ONBOARD_ERROR_MESSAGES[code] ?? `가입에 실패했습니다. (${code})`;
}

// 새 교회 가입 페이지(공개, 루트 도메인). UI 다듬기는 추후.
export default function OnboardPage() {
  const [form, setForm] = useState({
    churchName: "",
    churchCode: "",
    adminName: "",
    adminLoginId: "churchadmin",
    adminPassword: "",
    website: "", // 허니팟: 사람은 비워둠. 봇이 채우면 서버가 거부.
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
        {/* 허니팟: 사람에겐 보이지 않는 필드(봇 필터). 화면 밖으로 밀어 숨긴다. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
          value={form.website}
          onChange={set("website")}
        />
        <input className="rounded-md border border-border px-3 py-2 dark:bg-transparent" placeholder="교회 이름" value={form.churchName} onChange={set("churchName")} />
        <input className="rounded-md border border-border px-3 py-2 dark:bg-transparent" placeholder="교회 코드 (서브도메인, 영문소문자)" value={form.churchCode} onChange={set("churchCode")} />
        <input className="rounded-md border border-border px-3 py-2 dark:bg-transparent" placeholder="관리자 이름" value={form.adminName} onChange={set("adminName")} />
        <input className="rounded-md border border-border px-3 py-2 dark:bg-transparent" placeholder="관리자 아이디" value={form.adminLoginId} onChange={set("adminLoginId")} autoComplete="username" />
        <input className="rounded-md border border-border px-3 py-2 dark:bg-transparent" type="password" placeholder="관리자 비밀번호 (8자 이상)" value={form.adminPassword} onChange={set("adminPassword")} autoComplete="new-password" />
        {error && (
          <p className="text-sm text-destructive">{onboardErrorMessage(error)}</p>
        )}
        <button type="submit" disabled={loading} className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50">
          {loading ? "생성 중…" : "교회 만들기"}
        </button>
      </form>
    </main>
  );
}
