import "server-only";
import { randomUUID } from "node:crypto";
import { getStorage, churchPrefix } from "@/lib/storage";
import { reserveUsage } from "@/lib/storage/usage";
import type { AnswerInput } from "./responses";

/**
 * 설문 파일 첨부 (file 문항). 저장은 lib/storage 어댑터 경유(직접 디스크 금지, §10).
 * 파일 답변 value = JSON {key, name, size} — key 로 다운로드, name 으로 표시.
 */

export type FileRef = { key: string; name: string; size: number };

/** 폼 응답에 필요한 최소 문항 형태. */
export type FieldLike = { fieldId: string; type: string; required: boolean };

/** 파일 1건 업로드 — 쿼터 확인 후 저장. 한도 초과 시 null. */
async function storeFormFile(
  churchId: string,
  formId: string,
  file: File,
): Promise<FileRef | null> {
  const bytes = file.size;
  const ok = await reserveUsage(churchId, bytes, 1);
  if (!ok) return null; // 쿼터 초과
  const buf = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^\w.\-가-힣]/g, "_").slice(-100) || "file";
  const key = churchPrefix(churchId, `forms/${formId}/${randomUUID()}-${safeName}`);
  await getStorage().put(key, buf, file.type || undefined);
  return { key, name: file.name, size: bytes };
}

export type CollectResult =
  | { ok: true; answers: AnswerInput[] }
  | { ok: false; error: "required" | "quota" };

/**
 * FormData → 답변 배열. file 문항은 업로드 후 참조(JSON) 저장.
 * 필수 누락은 error="required", 쿼터 초과는 error="quota".
 */
export async function collectAnswers(
  churchId: string,
  formId: string,
  fields: FieldLike[],
  fd: FormData,
): Promise<CollectResult> {
  const answers: AnswerInput[] = [];
  for (const field of fields) {
    const name = `field_${field.fieldId}`;
    if (field.type === "file") {
      const file = fd.get(name);
      if (file instanceof File && file.size > 0) {
        const ref = await storeFormFile(churchId, formId, file);
        if (!ref) return { ok: false, error: "quota" };
        answers.push({ fieldId: field.fieldId, value: JSON.stringify(ref) });
      } else {
        if (field.required) return { ok: false, error: "required" };
        answers.push({ fieldId: field.fieldId, value: null });
      }
    } else if (field.type === "multi_choice") {
      const vals = fd.getAll(name).map(String).filter(Boolean);
      if (field.required && vals.length === 0) {
        return { ok: false, error: "required" };
      }
      answers.push({
        fieldId: field.fieldId,
        value: vals.length > 0 ? JSON.stringify(vals) : null,
      });
    } else {
      const raw = fd.get(name);
      const value = raw == null ? null : String(raw).trim() || null;
      if (field.required && !value) return { ok: false, error: "required" };
      answers.push({ fieldId: field.fieldId, value });
    }
  }
  return { ok: true, answers };
}

/** 파일 답변(JSON) 파싱. 비파일/손상 시 null. */
export function parseFileAnswer(value: string | null): FileRef | null {
  if (!value) return null;
  try {
    const v = JSON.parse(value);
    if (v && typeof v.key === "string" && typeof v.name === "string") {
      return { key: v.key, name: v.name, size: Number(v.size) || 0 };
    }
  } catch {
    /* not a file ref */
  }
  return null;
}
