import { pgTable, uuid, text, date, index } from "drizzle-orm/pg-core";
import { church } from "./church";
import { member } from "./members";
import { timestamps } from "./_shared";

/**
 * PASTORAL_CARE — 목양 기록(심방·기도·상담) (스펙 §7.2). 교인별, 테넌트 RLS.
 * care_type: visitation | prayer | counsel
 */
export const pastoralCare = pgTable(
  "pastoral_care",
  {
    careId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    memberId: uuid()
      .notNull()
      .references(() => member.memberId, { onDelete: "cascade" }),
    careType: text().notNull().default("visitation"),
    careDate: date(),
    content: text().notNull(),
    ...timestamps,
  },
  (t) => [
    index("pastoral_care_church_idx").on(t.churchId),
    index("pastoral_care_member_idx").on(t.memberId),
  ],
);
