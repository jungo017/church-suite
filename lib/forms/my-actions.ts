"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getUserMember } from "@/lib/members/portal";
import { getMyFillForm, submitMyResponse } from "./my";
import type { AnswerInput } from "./responses";

/**
 * 교인 셀프 제출 액션. 로그인 교인 본인의 배정만 제출(소유권은 서비스에서 강제).
 * forms 권한 불필요 — 본인 데이터 작성이므로 requireUser + member 연결로 충분.
 */
export async function submitMyResponseAction(
  assignmentId: string,
  fd: FormData,
) {
  const user = await requireUser();
  const me = await getUserMember(user.church_id, user.sub);
  if (!me) redirect("/my");

  const pf = await getMyFillForm(user.church_id, me.memberId, assignmentId);
  if (!pf) redirect("/my/forms");

  const answers: AnswerInput[] = [];
  for (const field of pf.fields) {
    if (field.type === "multi_choice") {
      const vals = fd
        .getAll(`field_${field.fieldId}`)
        .map(String)
        .filter(Boolean);
      if (field.required && vals.length === 0) {
        redirect(`/my/forms/${assignmentId}?error=1`);
      }
      answers.push({
        fieldId: field.fieldId,
        value: vals.length > 0 ? JSON.stringify(vals) : null,
      });
    } else {
      const raw = fd.get(`field_${field.fieldId}`);
      const value = raw == null ? null : String(raw).trim() || null;
      if (field.required && !value) {
        redirect(`/my/forms/${assignmentId}?error=1`);
      }
      answers.push({ fieldId: field.fieldId, value });
    }
  }

  await submitMyResponse(user.church_id, me.memberId, assignmentId, answers);
  redirect("/my/forms?submitted=1");
}
