import {
  pgTable,
  uuid,
  text,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { church } from "./church";
import { member } from "./members";
import { timestamps } from "./_shared";

/**
 * 교육 관리 (스펙 §7.2). 교육 프로그램 + 수강 등록. 테넌트 RLS.
 */

/** EDUCATION_PROGRAM — 교육 과정. status: open | closed */
export const educationProgram = pgTable(
  "education_program",
  {
    programId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text(),
    startDate: date(),
    endDate: date(),
    status: text().notNull().default("open"),
    ...timestamps,
  },
  (t) => [index("education_program_church_idx").on(t.churchId)],
);

/** EDUCATION_ENROLLMENT — 수강 등록. status: enrolled | completed | dropped */
export const educationEnrollment = pgTable(
  "education_enrollment",
  {
    enrollmentId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    programId: uuid()
      .notNull()
      .references(() => educationProgram.programId, { onDelete: "cascade" }),
    memberId: uuid()
      .notNull()
      .references(() => member.memberId, { onDelete: "cascade" }),
    status: text().notNull().default("enrolled"),
    ...timestamps,
  },
  (t) => [
    index("education_enrollment_church_idx").on(t.churchId),
    index("education_enrollment_program_idx").on(t.programId),
    uniqueIndex("education_enrollment_unique").on(t.programId, t.memberId),
  ],
);
