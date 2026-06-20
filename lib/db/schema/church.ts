import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";

/**
 * CHURCH — 테넌트 루트 테이블 (스펙 §6.1).
 *
 * 주의: church 는 테넌트 식별 주체이므로 그 자체에는 church_id 컬럼이 없습니다.
 * 다른 모든 테넌트 테이블은 church_id FK 를 가집니다(불변 규칙, AGENTS.md §4).
 * RLS 정책은 Phase 0.3 에서 적용합니다.
 */
export const church = pgTable("church", {
  churchId: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  code: text().notNull().unique(),
  plan: text().notNull().default("free"),
  status: text().notNull().default("active"),
  ...timestamps,
});
