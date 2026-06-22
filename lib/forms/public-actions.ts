"use server";

import { redirect } from "next/navigation";
import { getTenant } from "@/lib/tenant/context";
import { getPublicForm, submitResponse, type AnswerInput } from "./responses";

/**
 * 공개(비인증) 설문 제출 — 익명 공개 폼만(intake 경계, module-survey-report.md §9).
 * 호스트로 교회를 해석(getTenant)하고, 발행+익명 폼에 한해 응답을 기록한다.
 */
export async function submitPublicFormAction(formId: string, fd: FormData) {
  const tenant = await getTenant();
  if (!tenant) redirect("/");

  const pf = await getPublicForm(tenant.churchId, formId);
  if (!pf || !pf.form.anonymous) redirect("/"); // 발행된 익명 폼만 접수

  const answers: AnswerInput[] = [];
  for (const field of pf.fields) {
    if (field.type === "multi_choice") {
      const vals = fd
        .getAll(`field_${field.fieldId}`)
        .map(String)
        .filter(Boolean);
      if (field.required && vals.length === 0) {
        redirect(`/online/forms/${formId}?error=1`);
      }
      answers.push({
        fieldId: field.fieldId,
        value: vals.length > 0 ? JSON.stringify(vals) : null,
      });
    } else {
      const raw = fd.get(`field_${field.fieldId}`);
      const value = raw == null ? null : String(raw).trim() || null;
      if (field.required && !value) {
        redirect(`/online/forms/${formId}?error=1`);
      }
      answers.push({ fieldId: field.fieldId, value });
    }
  }

  await submitResponse(tenant.churchId, { formId, answers });
  redirect(`/online/forms/${formId}?submitted=1`);
}
