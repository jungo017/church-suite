import { describe, it, expect, afterAll } from "vitest";
import {
  createForm,
  listForms,
  getForm,
  updateForm,
  setFormStatus,
  addField,
  listFields,
  updateField,
  removeField,
  parseOptions,
} from "@church/module-forms/service";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("폼 빌더 (S.2)", () => {
  it("폼 CRUD + 발행/마감 상태전이 + 테넌트 격리", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);

    const { formId } = await createForm(a, {
      title: "만족도 설문",
      category: "survey",
    });
    expect((await listForms(a)).length).toBe(1);
    expect((await listForms(b)).length).toBe(0); // 격리
    expect((await listForms(a, { category: "report" })).length).toBe(0);

    let f = await getForm(a, formId);
    expect(f!.status).toBe("draft");

    await updateForm(a, formId, { title: "만족도 조사", periodYear: 2026 });
    f = await getForm(a, formId);
    expect(f!.title).toBe("만족도 조사");
    expect(f!.periodYear).toBe(2026);

    await setFormStatus(a, formId, "published");
    expect((await getForm(a, formId))!.status).toBe("published");
    await setFormStatus(a, formId, "closed");
    expect((await getForm(a, formId))!.status).toBe("closed");

    // 격리: b 는 a 의 폼 조회 불가
    expect(await getForm(b, formId)).toBeNull();
  });

  it("문항 추가/정렬/옵션/수정/삭제", async () => {
    const a = await createChurch();
    created.push(a);
    const { formId } = await createForm(a, { title: "설문" });

    await addField(a, formId, { label: "이름", type: "short_text", required: true, sort: 10 });
    const { fieldId } = await addField(a, formId, {
      label: "만족도",
      type: "single_choice",
      sort: 20,
      options: ["만족", "보통", "불만"],
    });

    const fields = await listFields(a, formId);
    expect(fields).toHaveLength(2);
    expect(fields[0]!.label).toBe("이름"); // sort 순
    expect(fields[0]!.required).toBe(true);
    expect(parseOptions(fields[1]!.options)).toEqual(["만족", "보통", "불만"]);

    await updateField(a, fieldId, { label: "전반 만족도", options: ["매우만족", "만족", "불만"] });
    const updated = (await listFields(a, formId)).find((x) => x.fieldId === fieldId)!;
    expect(updated.label).toBe("전반 만족도");
    expect(parseOptions(updated.options)).toEqual(["매우만족", "만족", "불만"]);

    await removeField(a, fieldId);
    expect(await listFields(a, formId)).toHaveLength(1);
  });
});
