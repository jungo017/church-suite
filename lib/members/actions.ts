"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import {
  createMember,
  updateMember,
  deleteMember,
  createFamily,
  type MemberInput,
} from "./service";
import { saveAttendance } from "./attendance";
import { addCare, deleteCare } from "./care";
import { isGender, isMemberStatus, isCareType } from "./constants";

/** 교인 모듈 서버 액션 (스펙 §16). members:write 가드. */
async function requireWrite() {
  const res = await checkPermission(PERMISSIONS.MEMBERS_WRITE);
  if (!res.ok) redirect(res.error === "unauthenticated" ? "/login" : "/forbidden");
  return res.user;
}

function str(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  return v == null || String(v).trim() === "" ? null : String(v).trim();
}

function parseMemberForm(fd: FormData): MemberInput {
  const gender = str(fd, "gender");
  const status = str(fd, "status");
  return {
    name: str(fd, "name") ?? "",
    gender: gender && isGender(gender) ? gender : null,
    birth: str(fd, "birth"),
    phone: str(fd, "phone"),
    email: str(fd, "email"),
    address: str(fd, "address"),
    position: str(fd, "position"),
    departmentId: str(fd, "departmentId"),
    familyId: str(fd, "familyId"),
    registeredDate: str(fd, "registeredDate"),
    status: status && isMemberStatus(status) ? status : undefined,
  };
}

export async function createMemberAction(fd: FormData) {
  const user = await requireWrite();
  const input = parseMemberForm(fd);
  if (!input.name) throw new Error("name_required");
  await createMember(user.church_id, input);
  revalidatePath("/members");
  redirect("/members");
}

export async function updateMemberAction(memberId: string, fd: FormData) {
  const user = await requireWrite();
  const input = parseMemberForm(fd);
  if (!input.name) throw new Error("name_required");
  await updateMember(user.church_id, memberId, input);
  revalidatePath("/members");
  revalidatePath(`/members/${memberId}`);
  redirect(`/members/${memberId}`);
}

export async function deleteMemberAction(memberId: string) {
  const user = await requireWrite();
  await deleteMember(user.church_id, memberId);
  revalidatePath("/members");
  redirect("/members");
}

export async function createFamilyAction(fd: FormData) {
  const user = await requireWrite();
  const name = str(fd, "name");
  if (name) await createFamily(user.church_id, name);
  revalidatePath("/members/families");
}

export async function saveAttendanceAction(
  serviceDate: string,
  serviceType: string,
  fd: FormData,
) {
  const user = await requireWrite();
  const allIds = fd.getAll("member").map(String);
  const presentSet = new Set(fd.getAll("present").map(String));
  const records = allIds.map((id) => ({
    memberId: id,
    present: presentSet.has(id),
  }));
  await saveAttendance(user.church_id, serviceDate, serviceType, records);
  revalidatePath("/members/attendance");
}

export async function addCareAction(memberId: string, fd: FormData) {
  const user = await requireWrite();
  const content = str(fd, "content");
  if (!content) throw new Error("content_required");
  const careType = str(fd, "careType");
  await addCare(user.church_id, {
    memberId,
    careType: careType && isCareType(careType) ? careType : "visitation",
    careDate: str(fd, "careDate"),
    content,
  });
  revalidatePath(`/members/${memberId}`);
}

export async function deleteCareAction(memberId: string, careId: string) {
  const user = await requireWrite();
  await deleteCare(user.church_id, careId);
  revalidatePath(`/members/${memberId}`);
}
