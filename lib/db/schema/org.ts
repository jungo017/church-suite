import { pgTable, uuid, text, index, type AnyPgColumn } from "drizzle-orm/pg-core";
import { church } from "./church";
import { timestamps } from "./_shared";

/**
 * DEPARTMENT — 부서/구역 (스펙 §6.4).
 * 비품(부서별 관리)과 교적(구역/부서)이 공유하는 조직 단위. 계층(parent) 가능.
 */
export const department = pgTable(
  "department",
  {
    departmentId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    parentId: uuid().references((): AnyPgColumn => department.departmentId, {
      onDelete: "set null",
    }),
    name: text().notNull(),
    ...timestamps,
  },
  (t) => [index("department_church_idx").on(t.churchId)],
);
