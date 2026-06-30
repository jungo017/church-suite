import {
  pgTable,
  uuid,
  text,
  date,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { church } from "./church";
import { member } from "./members";
import { timestamps } from "./_shared";

/**
 * ATTENDANCE — 출석 (스펙 §7.2). 예배×날짜×교인 단위. 테넌트 RLS.
 * (member, service_date, service_type) 유니크 → upsert.
 */
export const attendance = pgTable(
  "attendance",
  {
    attendanceId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    memberId: uuid()
      .notNull()
      .references(() => member.memberId, { onDelete: "cascade" }),
    serviceDate: date().notNull(),
    serviceType: text().notNull().default("sunday"),
    present: boolean().notNull().default(true),
    note: text(),
    ...timestamps,
  },
  (t) => [
    index("attendance_church_idx").on(t.churchId),
    index("attendance_member_idx").on(t.memberId),
    index("attendance_date_idx").on(t.serviceDate),
    uniqueIndex("attendance_unique").on(
      t.memberId,
      t.serviceDate,
      t.serviceType,
    ),
  ],
);
