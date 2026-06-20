import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

/**
 * CHURCH — 테넌트 루트 테이블 (스펙 §6.1).
 *
 * Phase 0.1(스캐폴드)에서는 마이그레이션 파이프라인 검증을 위한 최소 정의만 둡니다.
 * 전체 코어 스키마(app_user / role / member / family 등)와 관계·인덱스는
 * Phase 0.2 에서 확장합니다. RLS 정책은 Phase 0.3.
 *
 * 주의: church 는 테넌트 식별 주체이므로 그 자체에는 church_id 컬럼이 없습니다.
 * 다른 모든 테넌트 테이블은 church_id FK 를 가집니다(불변 규칙, AGENTS.md §4).
 */
export const church = pgTable("church", {
  churchId: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  code: text().notNull().unique(),
  plan: text().notNull().default("free"),
  status: text().notNull().default("active"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
