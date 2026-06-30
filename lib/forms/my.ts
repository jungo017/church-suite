import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { form, formField, formResponse, formAssignment } from "@church/core/db/schema";
import { submitResponse, getResponseDetail, type AnswerInput } from "./responses";

/**
 * 교인 셀프 제출 (설문 처리 — module-survey-report.md §6 워크플로 3단계).
 * 로그인한 교인이 본인에게 배정된 폼만 작성·제출한다.
 * ⚠️ 소유권은 항상 memberId 일치로 강제(앱 레벨) — 타인 배정 접근 차단.
 */

/** 내 배정 목록(발행/마감된 폼만). */
export async function listMyAssignments(churchId: string, memberId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select({
        assignmentId: formAssignment.assignmentId,
        assignmentStatus: formAssignment.status,
        formId: form.formId,
        title: form.title,
        category: form.category,
        formStatus: form.status,
      })
      .from(formAssignment)
      .innerJoin(form, eq(formAssignment.formId, form.formId))
      .where(
        and(
          eq(formAssignment.churchId, churchId),
          eq(formAssignment.memberId, memberId),
          inArray(form.status, ["published", "closed"]),
        ),
      )
      .orderBy(desc(form.createdAt)),
  );
}

/** 작성용 — 내 배정(소유권 일치) + 문항. 미소유/없음이면 null. */
export async function getMyFillForm(
  churchId: string,
  memberId: string,
  assignmentId: string,
) {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .select({
        assignmentId: formAssignment.assignmentId,
        assignmentStatus: formAssignment.status,
        formId: form.formId,
        title: form.title,
        description: form.description,
        formStatus: form.status,
      })
      .from(formAssignment)
      .innerJoin(form, eq(formAssignment.formId, form.formId))
      .where(
        and(
          eq(formAssignment.churchId, churchId),
          eq(formAssignment.assignmentId, assignmentId),
          eq(formAssignment.memberId, memberId), // 소유권
        ),
      )
      .limit(1);
    const a = rows[0];
    if (!a) return null;
    const fields = await tx
      .select()
      .from(formField)
      .where(
        and(eq(formField.churchId, churchId), eq(formField.formId, a.formId)),
      )
      .orderBy(asc(formField.sort), asc(formField.createdAt));
    return { assignment: a, fields };
  });
}

/** 내 응답 제출 — 소유권·발행·중복 방지 검증 후 저장(배정 status=submitted). */
export async function submitMyResponse(
  churchId: string,
  memberId: string,
  assignmentId: string,
  answers: AnswerInput[],
): Promise<{ responseId: string }> {
  const pf = await getMyFillForm(churchId, memberId, assignmentId);
  if (!pf) throw new Error("not_your_assignment");
  if (pf.assignment.formStatus !== "published") throw new Error("form_not_open");
  if (
    pf.assignment.assignmentStatus === "submitted" ||
    pf.assignment.assignmentStatus === "reviewed"
  ) {
    throw new Error("already_submitted");
  }
  return submitResponse(churchId, {
    formId: pf.assignment.formId,
    assignmentId,
    memberId,
    answers,
  });
}

/** 내가 제출한 응답 상세(소유권 검증). 제출 전이면 null. */
export async function myResponseDetail(
  churchId: string,
  memberId: string,
  assignmentId: string,
) {
  const pf = await getMyFillForm(churchId, memberId, assignmentId);
  if (!pf) return null;
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select({ responseId: formResponse.responseId })
      .from(formResponse)
      .where(
        and(
          eq(formResponse.churchId, churchId),
          eq(formResponse.assignmentId, assignmentId),
        ),
      )
      .limit(1),
  );
  if (!rows[0]) return null;
  return getResponseDetail(churchId, rows[0].responseId);
}
