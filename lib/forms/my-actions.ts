"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@church/core/auth/session";
import { getUserMember } from "@/lib/members/portal";
import { getMyFillForm, submitMyResponse } from "./my";
import { collectAnswers } from "./files";

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

  const r = await collectAnswers(
    user.church_id,
    pf.assignment.formId,
    pf.fields,
    fd,
  );
  if (!r.ok) redirect(`/my/forms/${assignmentId}?error=${r.error}`);

  await submitMyResponse(user.church_id, me.memberId, assignmentId, r.answers);
  redirect("/my/forms?submitted=1");
}
