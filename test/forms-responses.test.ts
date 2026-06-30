import { describe, it, expect, afterAll } from "vitest";
import { and, eq } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { formAssignment } from "@church/core/db/schema";
import { createMember } from "@/lib/members/service";
import { createForm, addField, setFormStatus } from "@/lib/forms/service";
import {
  submitResponse,
  listResponses,
  getResponseDetail,
  getPublicForm,
} from "@/lib/forms/responses";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("응답 제출/수집 (S.3)", () => {
  it("배정 기반 제출 → 배정 status=submitted + 답변 저장 + 수집/격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    const { memberId } = await createMember(a, { name: "제출자" });

    const { formId } = await createForm(a, { title: "보고", category: "report" });
    const q1 = await addField(a, formId, { label: "활동", type: "long_text", sort: 10 });
    const q2 = await addField(a, formId, {
      label: "참여",
      type: "multi_choice",
      sort: 20,
      options: ["예배", "심방"],
    });

    const [asg] = await withTenant(a, (tx) =>
      tx
        .insert(formAssignment)
        .values({ churchId: a, formId, memberId })
        .returning(),
    );
    expect(asg!.status).toBe("pending");

    await submitResponse(a, {
      formId,
      assignmentId: asg!.assignmentId,
      memberId,
      answers: [
        { fieldId: q1.fieldId, value: "심방 5회" },
        { fieldId: q2.fieldId, value: JSON.stringify(["예배", "심방"]) },
      ],
    });

    // 배정 status 갱신
    const [after] = await withTenant(a, (tx) =>
      tx
        .select()
        .from(formAssignment)
        .where(
          and(
            eq(formAssignment.churchId, a),
            eq(formAssignment.assignmentId, asg!.assignmentId),
          ),
        ),
    );
    expect(after!.status).toBe("submitted");

    // 수집
    const responses = await listResponses(a, formId);
    expect(responses).toHaveLength(1);
    expect(responses[0]!.memberName).toBe("제출자");

    const detail = await getResponseDetail(a, responses[0]!.responseId);
    expect(detail!.answers).toHaveLength(2);
    expect(detail!.answers.find((x) => x.fieldId === q1.fieldId)!.value).toBe("심방 5회");

    // 격리
    expect(await listResponses(b, formId)).toHaveLength(0);
  });

  it("익명 제출(member/assignment 없음) 저장 + 빈 답변 제외", async () => {
    const a = await createChurch();
    created.push(a);
    const { formId } = await createForm(a, { title: "익명설문", anonymous: true });
    const q1 = await addField(a, formId, { label: "의견", type: "short_text" });
    const q2 = await addField(a, formId, { label: "선택", type: "short_text" });

    await submitResponse(a, {
      formId,
      answers: [
        { fieldId: q1.fieldId, value: "좋아요" },
        { fieldId: q2.fieldId, value: "" }, // 빈 답변 → 저장 안 됨
      ],
    });

    const responses = await listResponses(a, formId);
    expect(responses).toHaveLength(1);
    expect(responses[0]!.memberName).toBeNull(); // 익명
    const detail = await getResponseDetail(a, responses[0]!.responseId);
    expect(detail!.answers).toHaveLength(1); // 빈 답변 제외
  });

  it("getPublicForm 은 발행된 폼만 반환한다", async () => {
    const a = await createChurch();
    created.push(a);
    const { formId } = await createForm(a, { title: "공개설문", anonymous: true });
    await addField(a, formId, { label: "Q", type: "short_text" });

    expect(await getPublicForm(a, formId)).toBeNull(); // draft → null

    await setFormStatus(a, formId, "published");
    const pf = await getPublicForm(a, formId);
    expect(pf).not.toBeNull();
    expect(pf!.fields).toHaveLength(1);
  });
});
