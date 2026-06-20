import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  date,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { church } from "./church";
import { department } from "./org";
import { timestamps } from "./_shared";

/**
 * 비품(자산) 모듈 스키마 (스펙 §7.1). 모든 테넌트 테이블은 church_id + RLS.
 * 금액은 numeric(부동소수점 금지, 스펙 §4).
 */

/** LOCATION — 자산 보관 장소. 계층 가능. */
export const location = pgTable(
  "location",
  {
    locationId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    parentId: uuid().references((): AnyPgColumn => location.locationId, {
      onDelete: "set null",
    }),
    name: text().notNull(),
    ...timestamps,
  },
  (t) => [index("location_church_idx").on(t.churchId)],
);

/** ASSET_CATEGORY — 품목 분류. 계층 가능. */
export const assetCategory = pgTable(
  "asset_category",
  {
    categoryId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    parentId: uuid().references((): AnyPgColumn => assetCategory.categoryId, {
      onDelete: "set null",
    }),
    name: text().notNull(),
    ...timestamps,
  },
  (t) => [index("asset_category_church_idx").on(t.churchId)],
);

/**
 * ASSET — 자산(비품/토지/건물/소모품).
 * asset_type: equipment | land | building | consumable
 * status:     in_use | in_repair | idle | disposed
 * tag: QR 라벨용 자산 태그(있을 때 교회 범위 유니크).
 */
export const asset = pgTable(
  "asset",
  {
    assetId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    tag: text(),
    name: text().notNull(),
    assetType: text().notNull().default("equipment"),
    status: text().notNull().default("in_use"),
    quantity: integer().notNull().default(1),
    categoryId: uuid().references(() => assetCategory.categoryId, {
      onDelete: "set null",
    }),
    departmentId: uuid().references(() => department.departmentId, {
      onDelete: "set null",
    }),
    locationId: uuid().references(() => location.locationId, {
      onDelete: "set null",
    }),
    acquiredAt: date(),
    acquiredCost: numeric({ precision: 14, scale: 2 }),
    note: text(),
    ...timestamps,
  },
  (t) => [
    index("asset_church_idx").on(t.churchId),
    index("asset_category_idx").on(t.categoryId),
    index("asset_department_idx").on(t.departmentId),
    index("asset_location_idx").on(t.locationId),
    // tag 는 NULL 허용(여러 NULL 공존), 값이 있으면 교회 범위 유니크
    uniqueIndex("asset_church_tag_unique").on(t.churchId, t.tag),
  ],
);
