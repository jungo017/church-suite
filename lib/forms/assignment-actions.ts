"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPermission } from "@church/core/rbac/guards";
import { requireModuleWrite } from "@church/core/billing/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import {
  autoAssignByRole,
  assignMembers,
  setAssignmentStatus,
  removeAssignment,
} from "./assignments";
import { isAssignmentStatus } from "./constants";
import { sendJob, JOBS } from "@church/core/jobs/queue";

async function requireWrite() {
  const res = await checkPermission(PERMISSIONS.FORMS_WRITE);
  if (!res.ok)
    redirect(res.error === "unauthenticated" ? "/login" : "/forbidden");
  await requireModuleWrite(res.user.church_id, "forms");
  return res.user;
}

export async function autoAssignAction(formId: string) {
  const user = await requireWrite();
  await autoAssignByRole(user.church_id, formId);
  revalidatePath(`/forms/${formId}/assignments`);
}

export async function assignMembersAction(formId: string, fd: FormData) {
  const user = await requireWrite();
  const ids = fd.getAll("memberIds").map(String).filter(Boolean);
  if (ids.length > 0) await assignMembers(user.church_id, formId, ids);
  revalidatePath(`/forms/${formId}/assignments`);
}

export async function setAssignmentStatusAction(
  formId: string,
  assignmentId: string,
  fd: FormData,
) {
  const user = await requireWrite();
  const status = String(fd.get("status") ?? "");
  if (isAssignmentStatus(status)) {
    await setAssignmentStatus(user.church_id, assignmentId, status);
  }
  revalidatePath(`/forms/${formId}/assignments`);
}

export async function removeAssignmentAction(
  formId: string,
  assignmentId: string,
) {
  const user = await requireWrite();
  await removeAssignment(user.church_id, assignmentId);
  revalidatePath(`/forms/${formId}/assignments`);
}

/** 미제출 독려 잡 적재(워커가 발송). */
export async function remindPendingAction(formId: string, fd: FormData) {
  const user = await requireWrite();
  const message = String(fd.get("message") ?? "").trim() || undefined;
  await sendJob(JOBS.FORMS_REMIND, {
    churchId: user.church_id,
    formId,
    message,
  });
  revalidatePath(`/forms/${formId}/assignments`);
}
