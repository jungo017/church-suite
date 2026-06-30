"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPermission } from "@church/core/rbac/guards";
import { requireModuleWrite } from "@/lib/billing/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import {
  createForm,
  updateForm,
  setFormStatus,
  addField,
  updateField,
  removeField,
} from "./service";
import {
  isFormCategory,
  isFormStatus,
  isFieldType,
  isChoiceType,
} from "./constants";

/** 설문·보고 서버 액션. forms:write 가드. */
async function requireWrite() {
  const res = await checkPermission(PERMISSIONS.FORMS_WRITE);
  if (!res.ok)
    redirect(res.error === "unauthenticated" ? "/login" : "/forbidden");
  await requireModuleWrite(res.user.church_id, "forms");
  return res.user;
}

function str(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  return v == null || String(v).trim() === "" ? null : String(v).trim();
}
function num(fd: FormData, k: string): number | null {
  const s = str(fd, k);
  if (s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
/** 줄바꿈 구분 보기 입력 → 배열. */
function lines(fd: FormData, k: string): string[] {
  const s = str(fd, k);
  if (!s) return [];
  return s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

export async function createFormAction(fd: FormData) {
  const user = await requireWrite();
  const title = str(fd, "title");
  if (!title) throw new Error("title_required");
  const category = str(fd, "category");
  const { formId } = await createForm(user.church_id, {
    title,
    description: str(fd, "description"),
    category: category && isFormCategory(category) ? category : "survey",
    periodYear: num(fd, "periodYear"),
    targetRole: str(fd, "targetRole"),
    anonymous: fd.get("anonymous") != null,
  });
  revalidatePath("/forms");
  redirect(`/forms/${formId}`);
}

export async function updateFormAction(formId: string, fd: FormData) {
  const user = await requireWrite();
  const category = str(fd, "category");
  await updateForm(user.church_id, formId, {
    title: str(fd, "title") ?? undefined,
    description: str(fd, "description"),
    category: category && isFormCategory(category) ? category : undefined,
    periodYear: num(fd, "periodYear"),
    targetRole: str(fd, "targetRole"),
    anonymous: fd.get("anonymous") != null,
  });
  revalidatePath(`/forms/${formId}`);
}

export async function setFormStatusAction(formId: string, fd: FormData) {
  const user = await requireWrite();
  const status = str(fd, "status");
  if (status && isFormStatus(status)) {
    await setFormStatus(user.church_id, formId, status);
  }
  revalidatePath(`/forms/${formId}`);
  revalidatePath("/forms");
}

export async function addFieldAction(formId: string, fd: FormData) {
  const user = await requireWrite();
  const label = str(fd, "label");
  const type = str(fd, "type");
  if (!label || !type || !isFieldType(type)) throw new Error("field_invalid");
  await addField(user.church_id, formId, {
    label,
    type,
    required: fd.get("required") != null,
    sort: num(fd, "sort") ?? 100,
    options: isChoiceType(type) ? lines(fd, "options") : null,
  });
  revalidatePath(`/forms/${formId}`);
}

export async function updateFieldAction(
  formId: string,
  fieldId: string,
  fd: FormData,
) {
  const user = await requireWrite();
  const type = str(fd, "type");
  await updateField(user.church_id, fieldId, {
    label: str(fd, "label") ?? undefined,
    type: type && isFieldType(type) ? type : undefined,
    required: fd.get("required") != null,
    sort: num(fd, "sort") ?? undefined,
    options:
      type && isChoiceType(type)
        ? lines(fd, "options")
        : type
          ? null
          : undefined,
  });
  revalidatePath(`/forms/${formId}`);
}

export async function removeFieldAction(formId: string, fieldId: string) {
  const user = await requireWrite();
  await removeField(user.church_id, fieldId);
  revalidatePath(`/forms/${formId}`);
}
