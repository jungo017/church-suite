import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { church } from "./church";
import { member } from "./members";
import { timestamps } from "./_shared";

/**
 * 설문 · 보고 엔진 (S.1, module-survey-report.md §3).
 *
 * 범용 설문 엔진(계층 A) + 역할 기반 보고(계층 B)가 공유하는 폼 모델.
 *   FORM(템플릿) → FORM_FIELD(문항) / FORM_ASSIGNMENT(대상 교인·제출현황)
 *   FORM_ASSIGNMENT|익명 → FORM_RESPONSE(제출본) → FORM_ANSWER(문항별 답변)
 *
 * 플랫폼 규칙 상속: 모든 테이블에 church_id + RLS. enum 값은 영문 코드(lib/forms/constants.ts).
 * 익명 공개 설문은 member_id / assignment_id 를 비워(intake 경계, §9) 처리한다.
 */

/** FORM — 폼 템플릿. category: survey|report, status: draft|published|closed. */
export const form = pgTable(
  "form",
  {
    formId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    title: text().notNull(),
    description: text(),
    category: text().notNull().default("survey"), // survey | report
    periodYear: integer(), // 보고서 대상 연도(설문은 null 가능)
    targetRole: text(), // 직분/직책 코드(org_role/position 마스터 참조, PRE-1·PRE-3)
    status: text().notNull().default("draft"), // draft | published | closed
    anonymous: boolean().notNull().default(false), // 익명 공개 설문(공개 링크)
    ...timestamps,
  },
  (t) => [
    index("form_church_idx").on(t.churchId),
    index("form_church_category_year_idx").on(
      t.churchId,
      t.category,
      t.periodYear,
    ),
  ],
);

/** FORM_FIELD — 문항. type: FIELD_TYPES. 선택형은 options(JSON 문자열)에 보기 저장. */
export const formField = pgTable(
  "form_field",
  {
    fieldId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    formId: uuid()
      .notNull()
      .references(() => form.formId, { onDelete: "cascade" }),
    label: text().notNull(),
    type: text().notNull(), // short_text|long_text|single_choice|multi_choice|number|date|scale|file
    required: boolean().notNull().default(false),
    sort: integer().notNull().default(0),
    options: text(), // 선택형 보기(JSON 배열 문자열). 비선택형은 null
    ...timestamps,
  },
  (t) => [
    index("form_field_church_idx").on(t.churchId),
    index("form_field_form_idx").on(t.churchId, t.formId),
  ],
);

/** FORM_ASSIGNMENT — 대상 교인 배정 + 제출현황. status: pending|submitted|reviewed. */
export const formAssignment = pgTable(
  "form_assignment",
  {
    assignmentId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    formId: uuid()
      .notNull()
      .references(() => form.formId, { onDelete: "cascade" }),
    memberId: uuid()
      .notNull()
      .references(() => member.memberId, { onDelete: "cascade" }),
    status: text().notNull().default("pending"), // pending | submitted | reviewed
    ...timestamps,
  },
  (t) => [
    index("form_assignment_form_idx").on(t.churchId, t.formId),
    // 제출현황 집계(폼×상태)
    index("form_assignment_status_idx").on(t.churchId, t.formId, t.status),
    index("form_assignment_member_idx").on(t.churchId, t.memberId),
    // 한 폼에 한 교인 1회 배정
    uniqueIndex("form_assignment_unique").on(t.formId, t.memberId),
  ],
);

/**
 * FORM_RESPONSE — 제출본. 배정 기반(assignment_id·member_id) 또는 익명(둘 다 null).
 * form_id 는 익명 응답(배정 없음)도 어느 폼인지 알 수 있도록 항상 보유.
 */
export const formResponse = pgTable(
  "form_response",
  {
    responseId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    formId: uuid()
      .notNull()
      .references(() => form.formId, { onDelete: "cascade" }),
    assignmentId: uuid().references(() => formAssignment.assignmentId, {
      onDelete: "set null",
    }), // 익명이면 null
    memberId: uuid().references(() => member.memberId, {
      onDelete: "set null",
    }), // 익명이면 null
    submittedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [
    index("form_response_form_idx").on(t.churchId, t.formId),
    index("form_response_assignment_idx").on(t.churchId, t.assignmentId),
    // 배정당 제출 1회(익명=null 은 Postgres 에서 서로 distinct → 무제한 허용)
    uniqueIndex("form_response_assignment_unique").on(t.assignmentId),
  ],
);

/** FORM_ANSWER — 문항별 답변. value 는 텍스트(다중선택/파일은 JSON 직렬화). */
export const formAnswer = pgTable(
  "form_answer",
  {
    answerId: uuid().primaryKey().defaultRandom(),
    churchId: uuid()
      .notNull()
      .references(() => church.churchId, { onDelete: "cascade" }),
    responseId: uuid()
      .notNull()
      .references(() => formResponse.responseId, { onDelete: "cascade" }),
    fieldId: uuid()
      .notNull()
      .references(() => formField.fieldId, { onDelete: "cascade" }),
    value: text(),
    ...timestamps,
  },
  (t) => [
    index("form_answer_response_idx").on(t.churchId, t.responseId),
    index("form_answer_field_idx").on(t.churchId, t.fieldId), // 문항별 응답 분포 집계
    uniqueIndex("form_answer_unique").on(t.responseId, t.fieldId),
  ],
);
