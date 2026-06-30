import { describe, it, expect, afterAll } from "vitest";
import { createMember } from "@/lib/members/service";
import { createDepartment } from "@church/core/department";
import {
  seedDefaultOrgRoles,
  listOrgRoles,
  assignMembership,
} from "@/lib/members/org";
import { createForm, addField } from "@/lib/forms/service";
import { submitResponse } from "@/lib/forms/responses";
import { autoAssignByRole, listAssignments } from "@/lib/forms/assignments";
import {
  fieldDistributions,
  submissionByDepartment,
  exportResponsesCsv,
} from "@/lib/forms/aggregate";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("집계/내보내기 (S.5)", () => {
  it("문항별 응답 분포 + CSV + 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    const { formId } = await createForm(a, { title: "만족도" });
    const q = await addField(a, formId, {
      label: "전반 만족도",
      type: "single_choice",
      options: ["만족", "불만"],
    });

    await submitResponse(a, { formId, answers: [{ fieldId: q.fieldId, value: "만족" }] });
    await submitResponse(a, { formId, answers: [{ fieldId: q.fieldId, value: "만족" }] });
    await submitResponse(a, { formId, answers: [{ fieldId: q.fieldId, value: "불만" }] });

    const dists = await fieldDistributions(a, formId);
    expect(dists).toHaveLength(1);
    expect(dists[0]!.answered).toBe(3);
    expect(dists[0]!.values.find((v) => v.value === "만족")!.count).toBe(2);
    expect(dists[0]!.values.find((v) => v.value === "불만")!.count).toBe(1);

    const csv = await exportResponsesCsv(a, formId);
    expect(csv).toContain("전반 만족도"); // 헤더 라벨
    expect(csv.trim().split("\n")).toHaveLength(4); // 헤더 + 3행

    // 격리: b 는 a 의 문항/응답 집계가 비어 있음
    expect(await fieldDistributions(b, formId)).toHaveLength(0);
  });

  it("조직별 제출률 — 폼 연도 편성(org_membership) 기준", async () => {
    const a = await createChurch();
    created.push(a);
    await seedDefaultOrgRoles(a);
    const leader = (await listOrgRoles(a)).find((r) => r.code === "class_leader")!;

    const m1 = await createMember(a, { name: "속장1" });
    const m2 = await createMember(a, { name: "속장2" });
    const d1 = await createDepartment(a, "1속");
    const d2 = await createDepartment(a, "2속");
    await assignMembership(a, { memberId: m1.memberId, departmentId: d1.departmentId, periodYear: 2026, orgRoleId: leader.orgRoleId });
    await assignMembership(a, { memberId: m2.memberId, departmentId: d2.departmentId, periodYear: 2026, orgRoleId: leader.orgRoleId });

    const { formId } = await createForm(a, {
      title: "2026 속장보고서",
      category: "report",
      targetRole: "class_leader",
      periodYear: 2026,
    });
    await autoAssignByRole(a, formId);

    // m1 만 제출
    const asgs = await listAssignments(a, formId);
    const a1 = asgs.find((x) => x.memberId === m1.memberId)!;
    await submitResponse(a, { formId, assignmentId: a1.assignmentId, memberId: m1.memberId, answers: [] });

    const byDept = await submissionByDepartment(a, formId);
    expect(byDept).toHaveLength(2);
    const dd1 = byDept.find((x) => x.departmentId === d1.departmentId)!;
    expect(dd1).toMatchObject({ total: 1, submitted: 1 });
    const dd2 = byDept.find((x) => x.departmentId === d2.departmentId)!;
    expect(dd2).toMatchObject({ total: 1, submitted: 0 });
  });
});
