import { describe, it, expect, afterAll } from "vitest";
import { withTenant } from "@church/core/db/tenant";
import { formField, formAssignment } from "@church/core/db/schema";
import { hasPermission, PERMISSIONS } from "@church/core/rbac/roles";
import { createMember } from "@church/module-members/service";
import { createForm, addField, listFields, setFormStatus } from "@church/module-forms/service";
import {
  submitResponse,
  listResponses,
  getPublicForm,
} from "@church/module-forms/responses";
import { assignMembers, listAssignments } from "@church/module-forms/assignments";
import { fieldDistributions } from "@church/module-forms/aggregate";
import { createChurch, deleteChurches, closeDb } from "./helpers";

// S.7 — 설문·보고 모듈 전반의 격리·권한·공개 경계 통합 검증.
const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("설문·보고 통합: 격리·권한·경계 (S.7)", () => {
  it("타교회 church_id 로의 자식 테이블 INSERT 는 RLS 로 차단된다", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    const { memberId } = await createMember(a, { name: "m" });
    const { formId } = await createForm(a, { title: "폼" });

    // a 컨텍스트에서 b 의 church_id 로 문항/배정 삽입 시도 → WITH CHECK 위반
    await expect(
      withTenant(a, (tx) =>
        tx.insert(formField).values({ churchId: b, formId, label: "x", type: "short_text" }),
      ),
    ).rejects.toThrow();
    await expect(
      withTenant(a, (tx) =>
        tx.insert(formAssignment).values({ churchId: b, formId, memberId }),
      ),
    ).rejects.toThrow();
  });

  it("전체 데이터 체인이 타교회에서 읽히지 않는다", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    const { memberId } = await createMember(a, { name: "응답자" });
    const { formId } = await createForm(a, { title: "보고", category: "report" });
    const q = await addField(a, formId, { label: "Q", type: "short_text" });
    await assignMembers(a, formId, [memberId]);
    const a1 = (await listAssignments(a, formId))[0]!;
    await submitResponse(a, {
      formId,
      assignmentId: a1.assignmentId,
      memberId,
      answers: [{ fieldId: q.fieldId, value: "v" }],
    });

    // b 컨텍스트: 모든 조회가 비어 있음
    expect(await listFields(b, formId)).toHaveLength(0);
    expect(await listAssignments(b, formId)).toHaveLength(0);
    expect(await listResponses(b, formId)).toHaveLength(0);
    expect(await fieldDistributions(b, formId)).toHaveLength(0);
  });

  it("RBAC: forms 권한이 역할별로 올바르게 매핑된다", () => {
    // 쓰기: admin·staff 만
    expect(hasPermission(["admin"], PERMISSIONS.FORMS_WRITE)).toBe(true);
    expect(hasPermission(["staff"], PERMISSIONS.FORMS_WRITE)).toBe(true);
    expect(hasPermission(["viewer"], PERMISSIONS.FORMS_WRITE)).toBe(false);
    expect(hasPermission(["member"], PERMISSIONS.FORMS_WRITE)).toBe(false);
    // 읽기: admin·staff·viewer
    expect(hasPermission(["viewer"], PERMISSIONS.FORMS_READ)).toBe(true);
    expect(hasPermission(["member"], PERMISSIONS.FORMS_READ)).toBe(false);
  });

  it("공개 경계: getPublicForm 은 발행된 폼만 노출한다", async () => {
    const a = await createChurch();
    created.push(a);
    const { formId } = await createForm(a, { title: "공개", anonymous: true });
    await addField(a, formId, { label: "Q", type: "short_text" });

    expect(await getPublicForm(a, formId)).toBeNull(); // draft → 비공개
    await setFormStatus(a, formId, "published");
    expect(await getPublicForm(a, formId)).not.toBeNull(); // 발행 → 공개
    await setFormStatus(a, formId, "closed");
    expect(await getPublicForm(a, formId)).toBeNull(); // 마감 → 비공개
  });
});
