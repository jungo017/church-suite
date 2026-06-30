import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";

/**
 * RATE_LIMIT — 전역 고정창(fixed-window) 레이트리밋 카운터.
 *
 * 테넌트 무관(church_id 없음) · RLS 미적용(전역 참조 테이블, `plan` 과 동일 취급).
 * 창(window)을 bucket 키에 포함("<scope>:<window-sec>:<epoch>")하므로
 * upsert 증가 한 번으로 원자적 카운트가 된다(경쟁 안전).
 * 만료 행 정리는 후속(pg-boss cron) — 행이 작아 MVP 에선 누적을 허용한다.
 */
export const rateLimit = pgTable(
  "rate_limit",
  {
    bucket: text().primaryKey(),
    count: integer().notNull().default(0),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
  },
  (t) => [index("rate_limit_expires_idx").on(t.expiresAt)],
);
