import { describe, it, expect, afterAll } from "vitest";
import { createMember } from "@/lib/members/service";
import { createForm } from "@/lib/forms/service";
import { submitResponse } from "@/lib/forms/responses";
import { assignMembers, listAssignments } from "@/lib/forms/assignments";
import { remindPending } from "@/lib/forms/remind";
import { listNotifications } from "@/lib/notify/service";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("미제출 독려 (S.6)", () => {
  it("미제출(pending) 배정자에게만 발송 + 연락처 없으면 제외 + 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    const m1 = await createMember(a, { name: "제출자", phone: "010-1111" });
    const m2 = await createMember(a, { name: "미제출A", phone: "010-2222" });
    const m3 = await createMember(a, { name: "미제출B(연락처없음)" }); // phone 없음

    const { formId } = await createForm(a, { title: "보고", category: "report" });
    await assignMembers(a, formId, [m1.memberId, m2.memberId, m3.memberId]);

    // m1 제출 → pending 에서 빠짐
    const asgs = await listAssignments(a, formId);
    const a1 = asgs.find((x) => x.memberId === m1.memberId)!;
    await submitResponse(a, { formId, assignmentId: a1.assignmentId, memberId: m1.memberId, answers: [] });

    const r = await remindPending(a, formId);
    expect(r.pending).toBe(2); // m2, m3
    expect(r.sent).toBe(1); // 연락처 있는 m2 만

    const notes = await listNotifications(a);
    expect(notes).toHaveLength(1);
    expect(notes[0]!.recipientName).toBe("미제출A");
    expect(notes[0]!.channel).toBe("alimtalk");

    // 격리: b 는 a 의 폼이 안 보이므로 발송 0
    expect(await remindPending(b, formId)).toMatchObject({ pending: 0, sent: 0 });
  });

  it("미제출자가 없으면 발송하지 않는다", async () => {
    const a = await createChurch();
    created.push(a);
    const m1 = await createMember(a, { name: "전원제출", phone: "010-9999" });
    const { formId } = await createForm(a, { title: "설문" });
    await assignMembers(a, formId, [m1.memberId]);
    const asgs = await listAssignments(a, formId);
    await submitResponse(a, {
      formId,
      assignmentId: asgs[0]!.assignmentId,
      memberId: m1.memberId,
      answers: [],
    });
    expect(await remindPending(a, formId)).toMatchObject({ pending: 0, sent: 0 });
  });
});
