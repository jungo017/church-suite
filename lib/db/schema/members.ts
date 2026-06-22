import {
  pgTable,
  uuid,
  text,
  date,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { church } from "./church";
import { department, position } from "./org";
import { timestamps } from "./_shared";

/**
 * MEMBER — 관리 대상 교인 (스펙 §6.1).
 * 교인 데이터는 단일 원본(스펙 §2). 다른 모듈은 member_id 로 참조만 한다.
 *
 * member ↔ family 는 상호 참조(순환):
 *   - member.family_id  → family (소속 가족)
 *   - family.head_member_id → member (세대주)
 * Drizzle 의 lazy reference(`() =>`)와 AnyPgColumn 타입으로 순환을 해소한다.
 */
export const member = pgTable(
  "member",
  {
    memberId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    familyId: uuid().references((): AnyPgColumn => family.familyId, {
      onDelete: "set null",
    }),
    name: text().notNull(),
    birth: date(),
    gender: text(), // male | female
    phone: text(),
    email: text(),
    address: text(),
    position: text(), // 직분(레거시 자유텍스트 — positionId 로 대체 예정, PRE-1)
    positionId: uuid().references(() => position.positionId, {
      onDelete: "set null",
    }), // 직분(코드 마스터 참조, PRE-1)
    departmentId: uuid().references(() => department.departmentId, {
      onDelete: "set null",
    }), // 구역/부서 — "올해 주 소속" 캐시(연도별 편성 원본은 org_membership, PRE-3)
    registeredDate: date(), // 등록일
    status: text().notNull().default("active"), // active | inactive | transferred | deceased
    ...timestamps,
  },
  (t) => [
    index("member_church_idx").on(t.churchId),
    index("member_family_idx").on(t.familyId),
    index("member_position_idx").on(t.positionId),
    index("member_department_idx").on(t.departmentId),
  ],
);

/**
 * FAMILY — 가족(세대) (스펙 §6.1).
 */
export const family = pgTable(
  "family",
  {
    familyId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    headMemberId: uuid().references((): AnyPgColumn => member.memberId, {
      onDelete: "set null",
    }),
    name: text().notNull(),
    ...timestamps,
  },
  (t) => [index("family_church_idx").on(t.churchId)],
);
