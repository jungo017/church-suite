import {
  pgTable,
  uuid,
  text,
  bigint,
  integer,
  numeric,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { church } from "./church";
import { timestamps } from "./_shared";

/**
 * 저장소·과금 (스펙 §6.3, §10). 금액은 numeric(부동소수점 금지, 스펙 §4).
 */

/** PLAN — 요금제 카탈로그(전역 참조 데이터, church_id 없음 → RLS 미적용). */
export const plan = pgTable("plan", {
  planId: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique(),
  storageLimit: bigint({ mode: "number" }).notNull().default(0), // bytes
  price: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
  ...timestamps,
});

/** SUBSCRIPTION — 교회별 구독(테넌트 테이블 → RLS). */
export const subscription = pgTable(
  "subscription",
  {
    subscriptionId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    planId: uuid()
      .notNull()
      .references(() => plan.planId),
    status: text().notNull().default("active"),
    currentPeriodEnd: date(),
    ...timestamps,
  },
  (t) => [index("subscription_church_idx").on(t.churchId)],
);

/** CHURCH_STORAGE_USAGE — 교회별 사용량 카운터(테넌트 테이블 → RLS). PK=church_id. */
export const churchStorageUsage = pgTable("church_storage_usage", {
  churchId: uuid()
    .primaryKey()
    .references(() => church.churchId, { onDelete: "cascade" }),
  bytesUsed: bigint({ mode: "number" }).notNull().default(0),
  fileCount: integer().notNull().default(0),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
