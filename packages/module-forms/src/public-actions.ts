"use server";

import { redirect } from "next/navigation";
import { getTenant } from "@church/core/tenant/context";
import { getPublicForm, submitResponse } from "./responses";
import { collectAnswers } from "./files";

/**
 * 공개(비인증) 설문 제출 — 익명 공개 폼만(intake 경계, module-survey-report.md §9).
 * 호스트로 교회를 해석(getTenant)하고, 발행+익명 폼에 한해 응답을 기록한다.
 */
export async function submitPublicFormAction(formId: string, fd: FormData) {
  const tenant = await getTenant();
  if (!tenant) redirect("/");

  const pf = await getPublicForm(tenant.churchId, formId);
  if (!pf || !pf.form.anonymous) redirect("/"); // 발행된 익명 폼만 접수

  const r = await collectAnswers(tenant.churchId, formId, pf.fields, fd);
  if (!r.ok) redirect(`/online/forms/${formId}?error=${r.error}`);

  await submitResponse(tenant.churchId, { formId, answers: r.answers });
  redirect(`/online/forms/${formId}?submitted=1`);
}
