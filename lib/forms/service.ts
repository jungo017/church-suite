import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { form, formField } from "@church/core/db/schema";

/**
 * 설문·보고 폼 빌더 서비스 (S.2, module-survey-report.md §4.1). 테넌트 스코프.
 * FORM 템플릿 CRUD + 발행/마감, FORM_FIELD 문항 CRUD.
 */

export type FormInput = {
  title: string;
  description?: string | null;
  category?: string; // survey | report
  periodYear?: number | null;
  targetRole?: string | null;
  anonymous?: boolean;
};

export async function listForms(churchId: string, opts: { category?: string } = {}) {
  return withTenant(churchId, (tx) => {
    const conds = [eq(form.churchId, churchId)];
    if (opts.category) conds.push(eq(form.category, opts.category));
    return tx
      .select()
      .from(form)
      .where(and(...conds))
      .orderBy(desc(form.createdAt));
  });
}

export async function getForm(churchId: string, formId: string) {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select()
      .from(form)
      .where(and(eq(form.churchId, churchId), eq(form.formId, formId)))
      .limit(1),
  );
  return rows[0] ?? null;
}

export async function createForm(
  churchId: string,
  input: FormInput,
): Promise<{ formId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(form)
      .values({
        churchId,
        title: input.title,
        description: input.description ?? null,
        category: input.category ?? "survey",
        periodYear: input.periodYear ?? null,
        targetRole: input.targetRole ?? null,
        anonymous: input.anonymous ?? false,
      })
      .returning({ formId: form.formId });
    return { formId: rows[0]!.formId };
  });
}

export async function updateForm(
  churchId: string,
  formId: string,
  patch: Partial<FormInput>,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .update(form)
      .set(patch)
      .where(and(eq(form.churchId, churchId), eq(form.formId, formId))),
  );
}

/** 발행/마감 등 상태 전이. status: draft | published | closed. */
export async function setFormStatus(
  churchId: string,
  formId: string,
  status: string,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .update(form)
      .set({ status })
      .where(and(eq(form.churchId, churchId), eq(form.formId, formId))),
  );
}

// ───────────────────────── 문항(FORM_FIELD) ─────────────────────────

export type FieldInput = {
  label: string;
  type: string;
  required?: boolean;
  sort?: number;
  options?: string[] | null; // 선택형 보기
};

export async function listFields(churchId: string, formId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(formField)
      .where(
        and(eq(formField.churchId, churchId), eq(formField.formId, formId)),
      )
      .orderBy(asc(formField.sort), asc(formField.createdAt)),
  );
}

export async function addField(
  churchId: string,
  formId: string,
  input: FieldInput,
): Promise<{ fieldId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(formField)
      .values({
        churchId,
        formId,
        label: input.label,
        type: input.type,
        required: input.required ?? false,
        sort: input.sort ?? 100,
        options:
          input.options && input.options.length > 0
            ? JSON.stringify(input.options)
            : null,
      })
      .returning({ fieldId: formField.fieldId });
    return { fieldId: rows[0]!.fieldId };
  });
}

export async function updateField(
  churchId: string,
  fieldId: string,
  patch: {
    label?: string;
    type?: string;
    required?: boolean;
    sort?: number;
    options?: string[] | null;
  },
): Promise<void> {
  const set: Record<string, unknown> = {};
  if (patch.label !== undefined) set.label = patch.label;
  if (patch.type !== undefined) set.type = patch.type;
  if (patch.required !== undefined) set.required = patch.required;
  if (patch.sort !== undefined) set.sort = patch.sort;
  if (patch.options !== undefined) {
    set.options =
      patch.options && patch.options.length > 0
        ? JSON.stringify(patch.options)
        : null;
  }
  if (Object.keys(set).length === 0) return;
  await withTenant(churchId, (tx) =>
    tx
      .update(formField)
      .set(set)
      .where(
        and(eq(formField.churchId, churchId), eq(formField.fieldId, fieldId)),
      ),
  );
}

export async function removeField(
  churchId: string,
  fieldId: string,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .delete(formField)
      .where(
        and(eq(formField.churchId, churchId), eq(formField.fieldId, fieldId)),
      ),
  );
}

/** 선택형 문항 보기 파싱(JSON 문자열 → 배열). */
export function parseOptions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
