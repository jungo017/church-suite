import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { church } from "./church";
import { timestamps } from "./_shared";

/**
 * DEPARTMENT — 부서/구역 (스펙 §6.4).
 * 비품(부서별 관리)과 교적(구역/부서)이 공유하는 조직 단위. 계층(parent) 가능.
 * 속(class)은 별도 테이블 없이 `parentId` 하위 계층(구역 > 속)으로 모델링한다(PRE-2).
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

/**
 * POSITION — 직분 마스터 (PRE-1, module-survey-report.md §5.1).
 * 직분(집사/권사/장로…)은 교단·교회마다 다르므로 고정 enum 이 아니라 교회 범위 마스터.
 * 온보딩 때 기본 직분을 시드하고, 교회가 추가·수정·비활성·정렬할 수 있다.
 * `member.position_id` 가 이 테이블을 참조한다(기존 자유텍스트 `member.position` 은 레거시).
 */
export const position = pgTable(
  "position",
  {
    positionId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    code: text().notNull(), // 교회 내 안정적 키(시드 코드 또는 자동생성)
    label: text().notNull(), // 한글 표시명
    sort: integer().notNull().default(0),
    active: boolean().notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index("position_church_idx").on(t.churchId),
    uniqueIndex("position_church_code_unique").on(t.churchId, t.code),
  ],
);

/**
 * ORG_ROLE — 조직 직책 마스터 (PRE-3).
 * 특정 조직(부서/구역/속) 안에서의 역할: 속장/부장/총무/회계/부원/속원 등.
 * `is_leader=true` 인 직책(속장·부장…)이 "리더 보고서" 일괄 타게팅의 근거.
 * 교회가 직책을 추가해도 코드 수정 없이 편성·집계에 자동 반영된다.
 */
export const orgRole = pgTable(
  "org_role",
  {
    orgRoleId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    code: text().notNull(),
    label: text().notNull(),
    isLeader: boolean().notNull().default(false),
    sort: integer().notNull().default(0),
    active: boolean().notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index("org_role_church_idx").on(t.churchId),
    uniqueIndex("org_role_church_code_unique").on(t.churchId, t.code),
  ],
);
