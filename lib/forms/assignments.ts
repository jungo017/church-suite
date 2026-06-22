import "server-only";
import { and, asc, count, eq } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { formAssignment, member } from "@/lib/db/schema";
import { listMembersByOrgRole } from "@/lib/members/org";
import { getForm } from "./service";

/**
 * 설문·보고 대상 배정 + 제출현황 (S.4, module-survey-report.md §4.2).
 * 역할 기반 자동 배정은 PRE.0(연도별 조직 편성 org_membership)을 활용한다.
 */

/**
 * 역할 기반 자동 배정 — form.target_role + form.period_year 로 그 해 해당 직책
 * 보유자를 찾아 FORM_ASSIGNMENT(pending) 생성(중복은 무시). 보고서 자동 배정의 핵심.
 */
export async function autoAssignByRole(
  churchId: string,
  formId: string,
): Promise<{
  assigned: number;
  targets: number;
  targetRole: string | null;
  periodYear: number | null;
}> {
  const f = await getForm(churchId, formId);
  if (!f || !f.targetRole || f.periodYear == null) {
    return {
      assigned: 0,
      targets: 0,
      targetRole: f?.targetRole ?? null,
      periodYear: f?.periodYear ?? null,
    };
  }
  const members = await listMembersByOrgRole(
    churchId,
    f.periodYear,
    f.targetRole,
  );
  const ids = members.map((m) => m.memberId);
  if (ids.length === 0) {
    return { assigned: 0, targets: 0, targetRole: f.targetRole, periodYear: f.periodYear };
  }
  const inserted = await withTenant(churchId, (tx) =>
    tx
      .insert(formAssignment)
      .values(ids.map((memberId) => ({ churchId, formId, memberId })))
      .onConflictDoNothing()
      .returning({ assignmentId: formAssignment.assignmentId }),
  );
  return {
    assigned: inserted.length,
    targets: ids.length,
    targetRole: f.targetRole,
    periodYear: f.periodYear,
  };
}

/** 수동 배정(여러 교인 일괄, 중복 무시). */
export async function assignMembers(
  churchId: string,
  formId: string,
  memberIds: string[],
): Promise<number> {
  const ids = [...new Set(memberIds)].filter(Boolean);
  if (ids.length === 0) return 0;
  const inserted = await withTenant(churchId, (tx) =>
    tx
      .insert(formAssignment)
      .values(ids.map((memberId) => ({ churchId, formId, memberId })))
      .onConflictDoNothing()
      .returning({ assignmentId: formAssignment.assignmentId }),
  );
  return inserted.length;
}

export async function listAssignments(churchId: string, formId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select({
        assignmentId: formAssignment.assignmentId,
        memberId: formAssignment.memberId,
        memberName: member.name,
        status: formAssignment.status,
      })
      .from(formAssignment)
      .innerJoin(member, eq(formAssignment.memberId, member.memberId))
      .where(
        and(
          eq(formAssignment.churchId, churchId),
          eq(formAssignment.formId, formId),
        ),
      )
      .orderBy(asc(member.name)),
  );
}

export type AssignmentSummary = {
  total: number;
  pending: number;
  submitted: number;
  reviewed: number;
};

/** 제출현황 집계(폼×상태 카운트). 대시보드용. */
export async function assignmentSummary(
  churchId: string,
  formId: string,
): Promise<AssignmentSummary> {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select({ status: formAssignment.status, n: count() })
      .from(formAssignment)
      .where(
        and(
          eq(formAssignment.churchId, churchId),
          eq(formAssignment.formId, formId),
        ),
      )
      .groupBy(formAssignment.status),
  );
  const summary: AssignmentSummary = {
    total: 0,
    pending: 0,
    submitted: 0,
    reviewed: 0,
  };
  for (const r of rows) {
    const n = Number(r.n);
    summary.total += n;
    if (r.status === "pending") summary.pending = n;
    else if (r.status === "submitted") summary.submitted = n;
    else if (r.status === "reviewed") summary.reviewed = n;
  }
  return summary;
}

export async function setAssignmentStatus(
  churchId: string,
  assignmentId: string,
  status: string,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .update(formAssignment)
      .set({ status })
      .where(
        and(
          eq(formAssignment.churchId, churchId),
          eq(formAssignment.assignmentId, assignmentId),
        ),
      ),
  );
}

export async function removeAssignment(
  churchId: string,
  assignmentId: string,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .delete(formAssignment)
      .where(
        and(
          eq(formAssignment.churchId, churchId),
          eq(formAssignment.assignmentId, assignmentId),
        ),
      ),
  );
}

/** 미제출(pending) 배정의 member_id 목록 — S.6 독려 잡에서 사용. */
export async function listPendingMemberIds(
  churchId: string,
  formId: string,
): Promise<string[]> {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select({ memberId: formAssignment.memberId })
      .from(formAssignment)
      .where(
        and(
          eq(formAssignment.churchId, churchId),
          eq(formAssignment.formId, formId),
          eq(formAssignment.status, "pending"),
        ),
      ),
  );
  return rows.map((r) => r.memberId);
}
