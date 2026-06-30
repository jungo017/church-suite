import { pgTable, uuid, text, boolean, index } from "drizzle-orm/pg-core";
import { church } from "./church";
import { appUser } from "./users";
import { member } from "./members";
import { timestamps } from "./_shared";

/**
 * PIPA 컴플라이언스 (스펙 §5, §14). 종교/헌금=민감정보 → 접근기록·동의 관리.
 * 모든 테이블 church_id + RLS.
 */

/** ACCESS_LOG — 민감정보 접근 기록(append-only). */
export const accessLog = pgTable(
  "access_log",
  {
    logId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    userId: uuid().references(() => appUser.userId, { onDelete: "set null" }),
    action: text().notNull(), // 예: member.view, giving.view
    targetType: text(),
    targetId: text(),
    ...timestamps,
  },
  (t) => [index("access_log_church_idx").on(t.churchId)],
);

/** CONSENT — 개인정보 수집·이용 동의 기록. consentType: privacy | marketing */
export const consent = pgTable(
  "consent",
  {
    consentId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    memberId: uuid().references(() => member.memberId, { onDelete: "set null" }),
    subjectName: text(), // 비회원(새가족 신청자 등) 식별
    consentType: text().notNull().default("privacy"),
    agreed: boolean().notNull().default(true),
    source: text(), // newfamily | offering | ...
    ...timestamps,
  },
  (t) => [index("consent_church_idx").on(t.churchId)],
);
