import { describe, it, expect, afterAll } from "vitest";
import { createForm, addField } from "@church/module-forms/service";
import { collectAnswers, parseFileAnswer } from "@church/module-forms/files";
import { getStorage } from "@church/core/storage";
import { getUsage } from "@church/core/storage/usage";
import { createChurch, deleteChurches, closeDb } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

describe("설문 파일 첨부 (file 문항)", () => {
  it("업로드 → 저장소 라운드트립 + 사용량 증가 + 키 프리픽스", async () => {
    const a = await createChurch();
    created.push(a);
    const { formId } = await createForm(a, { title: "첨부설문" });
    const f = await addField(a, formId, { label: "파일", type: "file" });

    const fd = new FormData();
    fd.append(
      `field_${f.fieldId}`,
      new File([new Uint8Array([10, 20, 30, 40, 50])], "보고서.pdf", {
        type: "application/pdf",
      }),
    );

    const r = await collectAnswers(
      a,
      formId,
      [{ fieldId: f.fieldId, type: "file", required: false }],
      fd,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const ref = parseFileAnswer(r.answers[0]!.value);
    expect(ref).not.toBeNull();
    expect(ref!.name).toBe("보고서.pdf");
    expect(ref!.size).toBe(5);
    expect(ref!.key.startsWith(`church-${a}/forms/${formId}/`)).toBe(true);

    // 저장소 라운드트립(get)
    const bytes = await getStorage().get(ref!.key);
    expect(bytes).not.toBeNull();
    expect(bytes!.length).toBe(5);

    // 사용량 카운터 증가
    const usage = await getUsage(a);
    expect(Number(usage!.bytesUsed)).toBe(5);

    await getStorage().delete(ref!.key); // 정리
  });

  it("필수 파일 미첨부 → required", async () => {
    const a = await createChurch();
    created.push(a);
    const { formId } = await createForm(a, { title: "x" });
    const f = await addField(a, formId, {
      label: "파일",
      type: "file",
      required: true,
    });
    const r = await collectAnswers(
      a,
      formId,
      [{ fieldId: f.fieldId, type: "file", required: true }],
      new FormData(),
    );
    expect(r).toMatchObject({ ok: false, error: "required" });
  });
});
