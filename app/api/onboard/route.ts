import { NextResponse } from "next/server";
import { onboardChurch, OnboardError } from "@/lib/onboarding/onboard";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";

/**
 * POST /api/onboard — 새 교회 가입(공개). 루트 도메인에서 호출(테넌트 불필요).
 * body: { churchName, churchCode, adminLoginId, adminPassword, adminName?, website? }
 *
 * 남용 방지(인증 없는 공개 쓰기): 허니팟(봇 필터) + IP/전역 레이트리밋.
 */

// 레이트리밋 한도. IP 당 시간/일 + 전역 시간(분산 플러딩 완화).
const LIMITS = [
  { scope: (ip: string) => `onboard:ip:${ip}`, limit: 5, window: 60 * 60 },
  { scope: (ip: string) => `onboard:ip:${ip}`, limit: 20, window: 24 * 60 * 60 },
  { scope: () => "onboard:global", limit: 100, window: 60 * 60 },
] as const;

export async function POST(req: Request) {
  let body: {
    churchName?: string;
    churchCode?: string;
    adminLoginId?: string;
    adminPassword?: string;
    adminName?: string;
    website?: string; // 허니팟: 사람에겐 숨김. 채워져 있으면 봇.
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // 1) 허니팟 — 봇이 채우는 숨김 필드. DB 접근 전에 조용히 거부.
  if (body.website) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // 2) 레이트리밋 — IP 시간/일 + 전역 시간. 초과 시 429 + Retry-After.
  const ip = getClientIp(req.headers);
  for (const rule of LIMITS) {
    const rl = await consumeRateLimit(rule.scope(ip), rule.limit, rule.window);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited" },
        {
          status: 429,
          headers: { "retry-after": String(rl.retryAfterSeconds) },
        },
      );
    }
  }

  const { churchName, churchCode, adminLoginId, adminPassword, adminName } = body;
  if (!churchName || !churchCode || !adminLoginId || !adminPassword) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  try {
    const result = await onboardChurch({
      churchName,
      churchCode,
      adminLoginId,
      adminPassword,
      adminName,
    });
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (e) {
    if (e instanceof OnboardError) {
      return NextResponse.json({ error: e.code }, { status: 400 });
    }
    throw e;
  }
}
