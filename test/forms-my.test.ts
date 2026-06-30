import { describe, it, expect, afterAll } from "vitest";
import { createMember } from "@church/module-members/service";
import { createForm, addField, setFormStatus } from "@church/module-forms/service";
import { assignMembers, listAssignments } from "@church/module-forms/assignments";
import {
  listMyAssignments,
  getMyFillForm,
  submitMyResponse,
  myResponseDetail,
} from "@church/module-forms/my";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("교인 셀프 제출 (설문 처리)", () => {
  it("본인 배정만 작성·제출(소유권) + 중복 방지 + 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    const m1 = await createMember(a, { name: "속장" });
    const m2 = await createMember(a, { name: "타인" });

    const { formId } = await createForm(a, { title: "보고서", category: "report" });
    const q = await addField(a, formId, { label: "활동", type: "short_text" });
    await setFormStatus(a, formId, "published");
    await assignMembers(a, formId, [m1.memberId]);
    const asgId = (await listAssignments(a, formId))[0]!.assignmentId;

    // 내 배정 목록: m1 만 1건
    expect(await listMyAssignments(a, m1.memberId)).toHaveLength(1);
    expect(await listMyAssignments(a, m2.memberId)).toHaveLength(0);

    // 소유권: m2 는 m1 의 배정 접근 불가
    expect(await getMyFillForm(a, m2.memberId, asgId)).toBeNull();
    await expect(
      submitMyResponse(a, m2.memberId, asgId, [{ fieldId: q.fieldId, value: "x" }]),
    ).rejects.toThrow();

    // m1 제출
    await submitMyResponse(a, m1.memberId, asgId, [{ fieldId: q.fieldId, value: "심방 3회" }]);
    const mine = await listMyAssignments(a, m1.memberId);
    expect(mine[0]!.assignmentStatus).toBe("submitted");
    const detail = await myResponseDetail(a, m1.memberId, asgId);
    expect(detail!.answers[0]!.value).toBe("심방 3회");

    // 중복 제출 차단
    await expect(
      submitMyResponse(a, m1.memberId, asgId, [{ fieldId: q.fieldId, value: "again" }]),
    ).rejects.toThrow();

    // 격리: b 컨텍스트에선 m1 의 배정이 보이지 않음
    expect(await listMyAssignments(b, m1.memberId)).toHaveLength(0);
  });

  it("미발행 폼은 제출할 수 없다", async () => {
    const a = await createChurch();
    created.push(a);
    const m1 = await createMember(a, { name: "교인" });
    const { formId } = await createForm(a, { title: "초안" }); // draft
    const q = await addField(a, formId, { label: "Q", type: "short_text" });
    await assignMembers(a, formId, [m1.memberId]);
    const asgId = (await listAssignments(a, formId))[0]!.assignmentId;

    // 미발행이라 목록에는 안 뜨고, 직접 제출 시도는 차단
    expect(await listMyAssignments(a, m1.memberId)).toHaveLength(0);
    await expect(
      submitMyResponse(a, m1.memberId, asgId, [{ fieldId: q.fieldId, value: "x" }]),
    ).rejects.toThrow();
  });
});
