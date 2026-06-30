"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/rbac/guards";
import { requireModuleWrite } from "@/lib/billing/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import {
  createPosition,
  updatePosition,
  createOrgRole,
  updateOrgRole,
  assignMembership,
  removeMembership,
} from "./org";

/** 조직/직분 서버 액션. members:write 가드. */
async function requireWrite() {
  const res = await checkPermission(PERMISSIONS.MEMBERS_WRITE);
  if (!res.ok)
    redirect(res.error === "unauthenticated" ? "/login" : "/forbidden");
  await requireModuleWrite(res.user.church_id, "members");
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

const MASTERS = "/members/org";
const ASSIGN = "/members/org/assignments";

// ── 직분 마스터 ──
export async function createPositionAction(fd: FormData) {
  const user = await requireWrite();
  const label = str(fd, "label");
  if (!label) throw new Error("label_required");
  await createPosition(user.church_id, { label });
  revalidatePath(MASTERS);
}

export async function updatePositionAction(positionId: string, fd: FormData) {
  const user = await requireWrite();
  await updatePosition(user.church_id, positionId, {
    label: str(fd, "label") ?? undefined,
    sort: num(fd, "sort") ?? undefined,
    active: fd.get("active") != null,
  });
  revalidatePath(MASTERS);
}

// ── 직책 마스터 ──
export async function createOrgRoleAction(fd: FormData) {
  const user = await requireWrite();
  const label = str(fd, "label");
  if (!label) throw new Error("label_required");
  await createOrgRole(user.church_id, {
    label,
    isLeader: fd.get("isLeader") != null,
  });
  revalidatePath(MASTERS);
}

export async function updateOrgRoleAction(orgRoleId: string, fd: FormData) {
  const user = await requireWrite();
  await updateOrgRole(user.church_id, orgRoleId, {
    label: str(fd, "label") ?? undefined,
    sort: num(fd, "sort") ?? undefined,
    isLeader: fd.get("isLeader") != null,
    active: fd.get("active") != null,
  });
  revalidatePath(MASTERS);
}

// ── 연도별 편성 ──
export async function assignMembershipAction(fd: FormData) {
  const user = await requireWrite();
  const memberId = str(fd, "memberId");
  const departmentId = str(fd, "departmentId");
  const periodYear = num(fd, "periodYear");
  if (!memberId || !departmentId || periodYear == null) {
    throw new Error("assignment_fields_required");
  }
  await assignMembership(user.church_id, {
    memberId,
    departmentId,
    periodYear,
    orgRoleId: str(fd, "orgRoleId"),
  });
  revalidatePath(ASSIGN);
}

export async function removeMembershipAction(membershipId: string) {
  const user = await requireWrite();
  await removeMembership(user.church_id, membershipId);
  revalidatePath(ASSIGN);
}
