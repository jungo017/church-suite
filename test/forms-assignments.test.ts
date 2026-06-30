import { describe, it, expect, afterAll } from "vitest";
import { createMember } from "@church/module-members/service";
import { createDepartment } from "@church/core/department";
import {
  seedDefaultOrgRoles,
  listOrgRoles,
  assignMembership,
} from "@church/module-members/org";
import { listMembersByOrgRole } from "@church/core/member";
import { createForm } from "@church/module-forms/service";
import { submitResponse } from "@church/module-forms/responses";
import {
  autoAssignByRole,
  assignmentSummary,
  listAssignments,
  setAssignmentStatus,
} from "@church/module-forms/assignments";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("역할 기반 자동 배정 + 제출현황 (S.4)", () => {
  it("그 해 직책 보유자에게 자동 배정(멱등) → 제출/검토 집계 → 연도/격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    await seedDefaultOrgRoles(a);
    const roles = await listOrgRoles(a);
    const leader = roles.find((r) => r.code === "class_leader")!;
    const memberRole = roles.find((r) => r.code === "class_member")!;

    const m1 = await createMember(a, { name: "속장1" });
    const m2 = await createMember(a, { name: "속장2" });
    const m3 = await createMember(a, { name: "속원" });
    const cell1 = await createDepartment(a, "1속");
    const cell2 = await createDepartment(a, "2속");

    // 2026 편성: m1·m2=속장, m3=속원
    await assignMembership(a, { memberId: m1.memberId, departmentId: cell1.departmentId, periodYear: 2026, orgRoleId: leader.orgRoleId });
    await assignMembership(a, { memberId: m2.memberId, departmentId: cell2.departmentId, periodYear: 2026, orgRoleId: leader.orgRoleId });
    await assignMembership(a, { memberId: m3.memberId, departmentId: cell1.departmentId, periodYear: 2026, orgRoleId: memberRole.orgRoleId });

    expect(await listMembersByOrgRole(a, 2026, "class_leader")).toHaveLength(2);

    // 2026 속장보고서 → 자동 배정
    const { formId } = await createForm(a, {
      title: "2026 속장보고서",
      category: "report",
      targetRole: "class_leader",
      periodYear: 2026,
    });

    const r1 = await autoAssignByRole(a, formId);
    expect(r1.assigned).toBe(2); // 속장 2명 (속원 제외)
    expect(r1.targets).toBe(2);

    // 멱등: 재실행은 신규 0
    const r2 = await autoAssignByRole(a, formId);
    expect(r2.assigned).toBe(0);
    expect(r2.targets).toBe(2);

    let summary = await assignmentSummary(a, formId);
    expect(summary).toMatchObject({ total: 2, pending: 2, submitted: 0, reviewed: 0 });

    // 한 명 제출 → submitted
    const assignments = await listAssignments(a, formId);
    const a1 = assignments.find((x) => x.memberId === m1.memberId)!;
    await submitResponse(a, { formId, assignmentId: a1.assignmentId, memberId: m1.memberId, answers: [] });
    summary = await assignmentSummary(a, formId);
    expect(summary).toMatchObject({ total: 2, pending: 1, submitted: 1 });

    // 검토완료
    await setAssignmentStatus(a, a1.assignmentId, "reviewed");
    summary = await assignmentSummary(a, formId);
    expect(summary).toMatchObject({ reviewed: 1, pending: 1 });

    // 다른 연도 폼은 2026 편성과 매칭 안 됨
    const f2025 = await createForm(a, {
      title: "2025 속장보고서",
      category: "report",
      targetRole: "class_leader",
      periodYear: 2025,
    });
    expect((await autoAssignByRole(a, f2025.formId)).assigned).toBe(0);

    // 격리: b 는 a 의 폼을 보지 못함 → 자동배정/목록 0
    expect((await autoAssignByRole(b, formId)).assigned).toBe(0);
    expect(await listAssignments(b, formId)).toHaveLength(0);
  });
});
