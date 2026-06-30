import { describe, it, expect, afterAll } from "vitest";
import { like } from "drizzle-orm";
import { withSystem } from "@church/core/db/tenant";
import { rateLimit } from "@church/core/db/schema";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { closeDb, uniqueCode } from "./helpers";

afterAll(async () => {
  // 테스트가 만든 버킷만 정리(scope 접두사 "test:").
  await withSystem((tx) =>
    tx.delete(rateLimit).where(like(rateLimit.bucket, "test:%")),
  );
  await closeDb();
});

describe("레이트리밋(고정창)", () => {
  it("limit 까지 허용하고 초과분을 거부한다", async () => {
    const scope = `test:${uniqueCode("rl")}`;
    const limit = 3;
    const results = [];
    for (let i = 0; i < 5; i++) {
      results.push(await consumeRateLimit(scope, limit, 3600));
    }
    expect(results.slice(0, 3).every((r) => r.ok)).toBe(true);
    expect(results[2]!.remaining).toBe(0);
    expect(results[3]!.ok).toBe(false);
    expect(results[4]!.ok).toBe(false);
    expect(results[3]!.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("창(window)이 다르면 카운트가 분리된다", async () => {
    const scope = `test:${uniqueCode("rl")}`;
    const hour = await consumeRateLimit(scope, 1, 3600);
    const day = await consumeRateLimit(scope, 1, 24 * 3600);
    expect(hour.ok).toBe(true);
    expect(day.ok).toBe(true); // 다른 window → 다른 버킷이라 서로 무관
  });

  it("scope 가 다르면 서로 간섭하지 않는다", async () => {
    const a = `test:${uniqueCode("rl")}`;
    const b = `test:${uniqueCode("rl")}`;
    await consumeRateLimit(a, 1, 3600); // a 소진
    const aAgain = await consumeRateLimit(a, 1, 3600);
    const bFirst = await consumeRateLimit(b, 1, 3600);
    expect(aAgain.ok).toBe(false);
    expect(bFirst.ok).toBe(true);
  });
});

describe("getClientIp", () => {
  it("x-forwarded-for 첫 홉을 우선한다", () => {
    const h = new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" });
    expect(getClientIp(h)).toBe("1.2.3.4");
  });

  it("x-forwarded-for 없으면 x-real-ip, 둘 다 없으면 unknown", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
