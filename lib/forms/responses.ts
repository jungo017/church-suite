import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import {
  form,
  formField,
  formResponse,
  formAnswer,
  formAssignment,
  member,
} from "@church/core/db/schema";

/**
 * 설문·보고 응답 제출/수집 (S.3, module-survey-report.md §4.1).
 * 배정 기반(교인) 또는 익명(공개 링크 — intake 경계, §9) 제출. 테넌트 스코프.
 */

export type AnswerInput = { fieldId: string; value: string | null };

/**
 * 응답 제출. 배정 기반이면 assignmentId·memberId 지정(제출 시 배정 status=submitted),
 * 익명이면 둘 다 생략. 빈 답변은 저장하지 않는다.
 */
export async function submitResponse(
  churchId: string,
  input: {
    formId: string;
    assignmentId?: string | null;
    memberId?: string | null;
    answers: AnswerInput[];
  },
): Promise<{ responseId: string }> {
  return withTenant(churchId, async (tx) => {
    const [resp] = await tx
      .insert(formResponse)
      .values({
        churchId,
        formId: input.formId,
        assignmentId: input.assignmentId ?? null,
        memberId: input.memberId ?? null,
      })
      .returning({ responseId: formResponse.responseId });
    const responseId = resp!.responseId;

    const rows = input.answers.filter(
      (a) => a.value != null && a.value !== "",
    );
    if (rows.length > 0) {
      await tx.insert(formAnswer).values(
        rows.map((a) => ({
          churchId,
          responseId,
          fieldId: a.fieldId,
          value: a.value,
        })),
      );
    }

    if (input.assignmentId) {
      await tx
        .update(formAssignment)
        .set({ status: "submitted" })
        .where(
          and(
            eq(formAssignment.churchId, churchId),
            eq(formAssignment.assignmentId, input.assignmentId),
          ),
        );
    }
    return { responseId };
  });
}

/** 공개(익명) 렌더용 — 발행된 폼 + 문항만 반환. 미발행은 null. */
export async function getPublicForm(churchId: string, formId: string) {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .select()
      .from(form)
      .where(
        and(
          eq(form.churchId, churchId),
          eq(form.formId, formId),
          eq(form.status, "published"),
        ),
      )
      .limit(1);
    const f = rows[0];
    if (!f) return null;
    const fields = await tx
      .select()
      .from(formField)
      .where(
        and(eq(formField.churchId, churchId), eq(formField.formId, formId)),
      )
      .orderBy(asc(formField.sort), asc(formField.createdAt));
    return { form: f, fields };
  });
}

/** 폼의 응답 목록(제출현황 수집). 익명은 memberName=null. */
export async function listResponses(churchId: string, formId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select({
        responseId: formResponse.responseId,
        memberId: formResponse.memberId,
        memberName: member.name,
        submittedAt: formResponse.submittedAt,
      })
      .from(formResponse)
      .leftJoin(member, eq(formResponse.memberId, member.memberId))
      .where(
        and(
          eq(formResponse.churchId, churchId),
          eq(formResponse.formId, formId),
        ),
      )
      .orderBy(desc(formResponse.submittedAt)),
  );
}

/** 응답 1건 상세 — 문항 라벨/타입과 함께. */
export async function getResponseDetail(churchId: string, responseId: string) {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .select()
      .from(formResponse)
      .where(
        and(
          eq(formResponse.churchId, churchId),
          eq(formResponse.responseId, responseId),
        ),
      )
      .limit(1);
    const resp = rows[0];
    if (!resp) return null;
    const answers = await tx
      .select({
        answerId: formAnswer.answerId,
        fieldId: formAnswer.fieldId,
        label: formField.label,
        type: formField.type,
        value: formAnswer.value,
      })
      .from(formAnswer)
      .innerJoin(formField, eq(formAnswer.fieldId, formField.fieldId))
      .where(
        and(
          eq(formAnswer.churchId, churchId),
          eq(formAnswer.responseId, responseId),
        ),
      )
      .orderBy(asc(formField.sort));
    return { response: resp, answers };
  });
}
