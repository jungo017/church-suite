import {
  pgTable,
  uuid,
  text,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { church } from "./church";
import { member } from "./members";
import { timestamps } from "./_shared";

/**
 * APP_USER — 로그인해서 시스템을 쓰는 사람(교역자/직원) (스펙 §6.1).
 * MEMBER(관리 대상 교인)와는 분리, 선택적 연결(member_id).
 * 로그인 ID 는 교회 범위 안에서 유일(church_id + login_id).
 */
export const appUser = pgTable(
  "app_user",
  {
    userId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    memberId: uuid().references(() => member.memberId, { onDelete: "set null" }),
    loginId: text().notNull(),
    passwordHash: text().notNull(),
    name: text().notNull(),
    status: text().notNull().default("active"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("app_user_church_login_unique").on(t.churchId, t.loginId),
    index("app_user_church_idx").on(t.churchId),
  ],
);

/**
 * ROLE — 역할 (RBAC, 스펙 §6.1·§9). 역할명은 교회 범위 안에서 유일.
 */
export const role = pgTable(
  "role",
  {
    roleId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    name: text().notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("role_church_name_unique").on(t.churchId, t.name),
    index("role_church_idx").on(t.churchId),
  ],
);

/**
 * USER_ROLE — 사용자-역할 할당(RBAC 조인 테이블).
 * 조인 테이블도 테넌트 테이블이므로 church_id 를 가진다(불변 규칙, RLS 적용 대상).
 */
export const userRole = pgTable(
  "user_role",
  {
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => appUser.userId, { onDelete: "cascade" }),
    roleId: uuid()
      .notNull()
      .references(() => role.roleId, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.roleId] }),
    index("user_role_church_idx").on(t.churchId),
  ],
);
