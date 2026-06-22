// 설문·보고 엔진 도메인 상수 — 순수(서버/클라이언트 공용), 시스템 고정 enum.
//
// 직분/직책(target_role)은 교회 확장 마스터(PRE-1·PRE-3)지만, 아래 카테고리·문항타입
// ·상태는 시스템이 정의하는 고정 enum 이다(module-survey-report.md §2.1).
// 값은 영문 코드로 저장하고, 한글은 라벨맵에서만 매핑한다.

/** 폼 종류. */
export const FORM_CATEGORIES = ["survey", "report"] as const;
export type FormCategory = (typeof FORM_CATEGORIES)[number];
export const FORM_CATEGORY_LABELS: Record<FormCategory, string> = {
  survey: "설문",
  report: "보고서",
};
export function isFormCategory(v: string): v is FormCategory {
  return (FORM_CATEGORIES as readonly string[]).includes(v);
}

/** 폼 상태(발행 라이프사이클). */
export const FORM_STATUSES = ["draft", "published", "closed"] as const;
export type FormStatus = (typeof FORM_STATUSES)[number];
export const FORM_STATUS_LABELS: Record<FormStatus, string> = {
  draft: "작성중",
  published: "발행",
  closed: "마감",
};
export function isFormStatus(v: string): v is FormStatus {
  return (FORM_STATUSES as readonly string[]).includes(v);
}

/** 문항 타입. 선택형(single_choice/multi_choice)은 options 사용. */
export const FIELD_TYPES = [
  "short_text",
  "long_text",
  "single_choice",
  "multi_choice",
  "number",
  "date",
  "scale",
  "file",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];
export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  short_text: "단답",
  long_text: "장문",
  single_choice: "단일선택",
  multi_choice: "다중선택",
  number: "숫자",
  date: "날짜",
  scale: "점수(척도)",
  file: "파일첨부",
};
export function isFieldType(v: string): v is FieldType {
  return (FIELD_TYPES as readonly string[]).includes(v);
}
/** 보기(options)가 필요한 선택형 문항인지. */
export function isChoiceType(t: string): boolean {
  return t === "single_choice" || t === "multi_choice";
}

/** 배정 제출현황 상태. pending=배정 직후(미제출). */
export const ASSIGNMENT_STATUSES = [
  "pending",
  "submitted",
  "reviewed",
] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];
export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  pending: "미제출",
  submitted: "제출",
  reviewed: "검토완료",
};
export function isAssignmentStatus(v: string): v is AssignmentStatus {
  return (ASSIGNMENT_STATUSES as readonly string[]).includes(v);
}
