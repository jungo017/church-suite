import "server-only";
import { sql } from "drizzle-orm";
import { withSystem } from "@church/core/db/tenant";
import { rateLimit } from "@church/core/db/schema";

export type RateLimitResult = {
  /** 이번 호출이 한도 내인가(true=허용). */
  ok: boolean;
  /** 현재 창에서 남은 허용 횟수. */
  remaining: number;
  /** 거부 시 재시도까지 권장 대기(초). 허용이면 0. */
  retryAfterSeconds: number;
};

/**
 * 고정창 레이트리밋 소비.
 *
 * scope(예: "onboard:ip:1.2.3.4")에 대해 windowSeconds 창 동안 limit 회까지 허용한다.
 * 창 번호(epoch)를 bucket 키에 포함하므로 upsert 증가 한 번으로 원자적 카운트가 된다
 * — 별도 락 없이 동시 요청에도 정확하다. RLS 무관 전역 테이블이라 withSystem 으로 접근.
 */
export async function consumeRateLimit(
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const nowMs = Date.now();
  const epoch = Math.floor(nowMs / 1000 / windowSeconds);
  const bucket = `${scope}:${windowSeconds}:${epoch}`;
  const expiresAt = new Date((epoch + 1) * windowSeconds * 1000);

  const rows = await withSystem((tx) =>
    tx
      .insert(rateLimit)
      .values({ bucket, count: 1, expiresAt })
      .onConflictDoUpdate({
        target: rateLimit.bucket,
        set: { count: sql`${rateLimit.count} + 1` },
      })
      .returning({ count: rateLimit.count }),
  );

  const count = rows[0]?.count ?? 1;
  const ok = count <= limit;
  const retryAfterSeconds = ok
    ? 0
    : Math.max(1, Math.ceil(expiresAt.getTime() / 1000 - nowMs / 1000));
  return { ok, remaining: Math.max(0, limit - count), retryAfterSeconds };
}

/**
 * 요청 헤더에서 클라이언트 IP 추정.
 *
 * 프록시/플랫폼 뒤에서는 x-forwarded-for(첫 홉) → x-real-ip 순으로 본다.
 * ⚠️ 직접 노출 오리진에서는 클라가 위조 가능하므로, 신뢰 가능한 프록시(Vercel/CF 등)
 *    뒤에서만 IP 기준 한도를 신뢰할 것. 미상이면 "unknown"(공유 버킷)으로 묶인다.
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
