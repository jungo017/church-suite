"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import {
  createProgram,
  enroll,
  setEnrollmentStatus,
  removeEnrollment,
} from "./education";
import { isEnrollmentStatus } from "./constants";

/** 교육 모듈 서버 액션. members:write 가드. */
async function requireWrite() {
  const res = await checkPermission(PERMISSIONS.MEMBERS_WRITE);
  if (!res.ok) redirect(res.error === "unauthenticated" ? "/login" : "/forbidden");
  return res.user;
}

function str(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  return v == null || String(v).trim() === "" ? null : String(v).trim();
}

export async function createProgramAction(fd: FormData) {
  const user = await requireWrite();
  const name = str(fd, "name");
  if (!name) throw new Error("name_required");
  const { programId } = await createProgram(user.church_id, {
    name,
    description: str(fd, "description"),
    startDate: str(fd, "startDate"),
    endDate: str(fd, "endDate"),
  });
  revalidatePath("/members/education");
  redirect(`/members/education/${programId}`);
}

export async function enrollAction(programId: string, fd: FormData) {
  const user = await requireWrite();
  const memberId = str(fd, "memberId");
  if (memberId) await enroll(user.church_id, programId, memberId);
  revalidatePath(`/members/education/${programId}`);
}

export async function setEnrollmentStatusAction(
  programId: string,
  enrollmentId: string,
  fd: FormData,
) {
  const user = await requireWrite();
  const status = str(fd, "status");
  if (status && isEnrollmentStatus(status)) {
    await setEnrollmentStatus(user.church_id, enrollmentId, status);
  }
  revalidatePath(`/members/education/${programId}`);
}

export async function removeEnrollmentAction(
  programId: string,
  enrollmentId: string,
) {
  const user = await requireWrite();
  await removeEnrollment(user.church_id, enrollmentId);
  revalidatePath(`/members/education/${programId}`);
}
