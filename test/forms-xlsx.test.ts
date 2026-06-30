import { describe, it, expect, afterAll } from "vitest";
import { createForm, addField } from "@church/module-forms/service";
import { submitResponse } from "@church/module-forms/responses";
import { buildResponseRows } from "@church/module-forms/aggregate";
import { exportResponsesXlsx } from "@church/module-forms/xlsx";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("응답 내보내기 — xlsx (S.5 후속)", () => {
  it("행 구성(헤더+값) + xlsx 시그니처 + 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    const { formId } = await createForm(a, { title: "설문" });
    const q1 = await addField(a, formId, { label: "이름", type: "short_text", sort: 10 });
    const q2 = await addField(a, formId, {
      label: "선택",
      type: "single_choice",
      options: ["A", "B"],
      sort: 20,
    });
    await submitResponse(a, {
      formId,
      answers: [
        { fieldId: q1.fieldId, value: "홍길동" },
        { fieldId: q2.fieldId, value: "A" },
      ],
    });

    const { header, rows } = await buildResponseRows(a, formId);
    expect(header).toEqual(["제출자", "제출시각", "이름", "선택"]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(["익명", expect.any(String), "홍길동", "A"]);

    // xlsx = zip → 'PK' 시그니처
    const buf = await exportResponsesXlsx(a, formId);
    expect(buf.length).toBeGreaterThan(0);
    expect(buf[0]).toBe(0x50); // P
    expect(buf[1]).toBe(0x4b); // K

    // 격리: b 는 행 0
    expect((await buildResponseRows(b, formId)).rows).toHaveLength(0);
  });
});
