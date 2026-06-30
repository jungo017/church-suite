import { describe, it, expect, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import {
  form,
  formField,
  formAssignment,
  formResponse,
  formAnswer,
} from "@church/core/db/schema";
import { createMember } from "@church/module-members/service";
import { createChurch, deleteChurches, closeDb } from "./helpers";

// S.1 — 설문 엔진 테이블이 코어와 동일하게 테넌트 격리(RLS)되는지 + 익명/체인 검증.
const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("설문 엔진 RLS 격리 (S.1)", () => {
  it("폼이 현재 교회로 스코프된다", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    await withTenant(a, (tx) =>
      tx.insert(form).values({ churchId: a, title: "A설문" }),
    );
    await withTenant(b, (tx) =>
      tx
        .insert(form)
        .values({ churchId: b, title: "B보고", category: "report" }),
    );

    const aForms = await withTenant(a, (tx) => tx.select().from(form));
    expect(aForms).toHaveLength(1);
    expect(aForms[0]!.title).toBe("A설문");
  });

  it("타교회 church_id 로의 폼 INSERT 는 차단된다", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    await expect(
      withTenant(a, (tx) => tx.insert(form).values({ churchId: b, title: "x" })),
    ).rejects.toThrow();
  });

  it("폼→문항→배정→응답→답변 전체 체인 + 익명 응답, 모두 테넌트 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    const { memberId } = await createMember(a, { name: "응답자" });

    const [f] = await withTenant(a, (tx) =>
      tx
        .insert(form)
        .values({
          churchId: a,
          title: "만족도조사",
          status: "published",
          anonymous: true,
        })
        .returning(),
    );
    const [field] = await withTenant(a, (tx) =>
      tx
        .insert(formField)
        .values({
          churchId: a,
          formId: f!.formId,
          label: "만족하시나요?",
          type: "scale",
        })
        .returning(),
    );

    // 배정 기반 제출
    const [asg] = await withTenant(a, (tx) =>
      tx
        .insert(formAssignment)
        .values({ churchId: a, formId: f!.formId, memberId })
        .returning(),
    );
    const [resp] = await withTenant(a, (tx) =>
      tx
        .insert(formResponse)
        .values({
          churchId: a,
          formId: f!.formId,
          assignmentId: asg!.assignmentId,
          memberId,
        })
        .returning(),
    );
    await withTenant(a, (tx) =>
      tx.insert(formAnswer).values({
        churchId: a,
        responseId: resp!.responseId,
        fieldId: field!.fieldId,
        value: "5",
      }),
    );

    // 익명 응답 2건(member_id·assignment_id null) — 둘 다 허용(nulls distinct)
    await withTenant(a, (tx) =>
      tx.insert(formResponse).values({ churchId: a, formId: f!.formId }),
    );
    await withTenant(a, (tx) =>
      tx.insert(formResponse).values({ churchId: a, formId: f!.formId }),
    );

    const responses = await withTenant(a, (tx) =>
      tx.select().from(formResponse).where(eq(formResponse.formId, f!.formId)),
    );
    expect(responses).toHaveLength(3); // 배정1 + 익명2
    expect(responses.filter((r) => r.memberId === null)).toHaveLength(2);

    // 격리: b 에서 a 의 폼/응답이 보이지 않음
    expect(await withTenant(b, (tx) => tx.select().from(form))).toHaveLength(0);
    expect(
      await withTenant(b, (tx) => tx.select().from(formResponse)),
    ).toHaveLength(0);
  });

  it("배정당 제출은 1회로 제한된다(중복 제출 차단)", async () => {
    const a = await createChurch();
    created.push(a);
    const { memberId } = await createMember(a, { name: "중복자" });
    const [f] = await withTenant(a, (tx) =>
      tx
        .insert(form)
        .values({ churchId: a, title: "보고", category: "report" })
        .returning(),
    );
    const [asg] = await withTenant(a, (tx) =>
      tx
        .insert(formAssignment)
        .values({ churchId: a, formId: f!.formId, memberId })
        .returning(),
    );
    await withTenant(a, (tx) =>
      tx.insert(formResponse).values({
        churchId: a,
        formId: f!.formId,
        assignmentId: asg!.assignmentId,
        memberId,
      }),
    );
    // 같은 배정 재제출 → unique 위반
    await expect(
      withTenant(a, (tx) =>
        tx.insert(formResponse).values({
          churchId: a,
          formId: f!.formId,
          assignmentId: asg!.assignmentId,
          memberId,
        }),
      ),
    ).rejects.toThrow();
  });
});
