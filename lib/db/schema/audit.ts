import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { church } from "./church";
import { asset } from "./assets";
import { timestamps } from "./_shared";

/**
 * 전수조사(재고 실사) (스펙 §7.1).
 * 세션 생성 시 현재 자산을 항목으로 스냅샷하고, 실사하며 체크한다.
 */

/** ASSET_AUDIT — 전수조사 세션. status: open | closed. */
export const assetAudit = pgTable(
  "asset_audit",
  {
    auditId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    name: text().notNull(),
    status: text().notNull().default("open"),
    closedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("asset_audit_church_idx").on(t.churchId)],
);

/** ASSET_AUDIT_ITEM — 조사 항목(세션×자산). checked 로 실사 확인. */
export const assetAuditItem = pgTable(
  "asset_audit_item",
  {
    itemId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    auditId: uuid()
      .notNull()
      .references(() => assetAudit.auditId, { onDelete: "cascade" }),
    assetId: uuid()
      .notNull()
      .references(() => asset.assetId, { onDelete: "cascade" }),
    checked: boolean().notNull().default(false),
    checkedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("asset_audit_item_church_idx").on(t.churchId),
    index("asset_audit_item_audit_idx").on(t.auditId),
    uniqueIndex("asset_audit_item_unique").on(t.auditId, t.assetId),
  ],
);
