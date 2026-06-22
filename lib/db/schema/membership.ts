import {
  pgTable,
  uuid,
  integer,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { church } from "./church";
import { member } from "./members";
import { department, orgRole } from "./org";
import { timestamps } from "./_shared";

/**
 * ORG_MEMBERSHIP — 연도별 조직 편성 (PRE-3, module-survey-report.md §5.1).
 *
 * "그 해 누가 어느 조직(부서/구역/속)에 어떤 직책으로 속하는지." 속회는 매년 개편되므로
 *   - 매년 개편 = 새 `period_year` 로 새 편성 레코드 생성(작년 편성은 이력으로 보존)
 *   - 다중 소속 = 한 교인이 같은 해에 속·여러 부서 레코드를 동시 보유
 *   - 속장/부장 식별 = `org_role.is_leader=true`
 * `member.department_id`(단일 FK)는 "올해 주 소속" 캐시로만 두고, 편성 원본은 이 테이블.
 */
export const orgMembership = pgTable(
  "org_membership",
  {
    membershipId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    memberId: uuid()
      .notNull()
      .references(() => member.memberId, { onDelete: "cascade" }),
    departmentId: uuid()
      .notNull()
      .references(() => department.departmentId, { onDelete: "cascade" }),
    orgRoleId: uuid().references(() => orgRole.orgRoleId, {
      onDelete: "set null",
    }),
    periodYear: integer().notNull(),
    status: text().notNull().default("active"), // active | ended
    ...timestamps,
  },
  (t) => [
    // 조직별·연도별 집계 / 멤버별·연도별 소속 조회
    index("org_membership_dept_year_idx").on(
      t.churchId,
      t.departmentId,
      t.periodYear,
    ),
    index("org_membership_member_year_idx").on(
      t.churchId,
      t.memberId,
      t.periodYear,
    ),
    // 한 해 한 조직에 한 번(직책은 갱신=upsert)
    uniqueIndex("org_membership_unique").on(
      t.churchId,
      t.memberId,
      t.departmentId,
      t.periodYear,
    ),
  ],
);
