import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS, hasPermission } from "@/lib/rbac/roles";
import { getForm, listFields, parseOptions } from "@/lib/forms/service";
import {
  addFieldAction,
  removeFieldAction,
  setFormStatusAction,
  updateFormAction,
} from "@/lib/forms/actions";
import {
  FIELD_TYPES,
  FIELD_TYPE_LABELS,
  FORM_STATUS_LABELS,
  type FormStatus,
} from "@/lib/forms/constants";

const input =
  "rounded-md border border-border px-3 py-2 text-sm dark:bg-transparent";
const btn =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background";

export default async function FormBuilderPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const user = await requirePermission(PERMISSIONS.FORMS_READ);
  const canWrite = hasPermission(user.roles, PERMISSIONS.FORMS_WRITE);
  const f = await getForm(user.church_id, formId);
  if (!f) notFound();
  const fields = await listFields(user.church_id, formId);

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{f.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {f.category === "report" ? "보고서" : "설문"}
            {f.periodYear ? ` · ${f.periodYear}` : ""}
            {f.anonymous ? " · 익명" : ""}
            {" · "}
            {FORM_STATUS_LABELS[f.status as FormStatus] ?? f.status}
          </p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            {f.status === "draft" && (
              <form action={setFormStatusAction.bind(null, formId)}>
                <input type="hidden" name="status" value="published" />
                <button className={btn}>발행</button>
              </form>
            )}
            {f.status === "published" && (
              <form action={setFormStatusAction.bind(null, formId)}>
                <input type="hidden" name="status" value="closed" />
                <button className="rounded-md border border-border px-4 py-2 text-sm">마감</button>
              </form>
            )}
            {f.status === "closed" && (
              <form action={setFormStatusAction.bind(null, formId)}>
                <input type="hidden" name="status" value="published" />
                <button className="rounded-md border border-border px-4 py-2 text-sm">재발행</button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* 메타 편집 */}
      {canWrite && (
        <form action={updateFormAction.bind(null, formId)} className="flex flex-col gap-2 rounded-md border border-border p-3">
          <input name="title" defaultValue={f.title} className={input} />
          <input name="description" defaultValue={f.description ?? ""} placeholder="설명" className={input} />
          <div className="flex flex-wrap items-center gap-2">
            <select name="category" className={input} defaultValue={f.category}>
              <option value="survey">설문</option>
              <option value="report">보고서</option>
            </select>
            <input name="periodYear" type="number" defaultValue={f.periodYear ?? ""} placeholder="연도" className={`${input} w-32`} />
            <input name="targetRole" defaultValue={f.targetRole ?? ""} placeholder="대상 직책코드(예: class_leader)" className={`${input} w-56`} />
            <label className="flex items-center gap-1 text-sm text-muted-foreground">
              <input type="checkbox" name="anonymous" defaultChecked={f.anonymous} /> 익명
            </label>
            <button className="rounded-md border border-border px-3 py-2 text-sm">저장</button>
          </div>
        </form>
      )}

      {/* 문항 목록 */}
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">문항 ({fields.length})</h2>
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">문항이 없습니다.</p>
        ) : (
          <ol className="flex flex-col gap-1 text-sm">
            {fields.map((fld, i) => {
              const opts = parseOptions(fld.options);
              return (
                <li key={fld.fieldId} className="flex items-center justify-between border-b border-border py-2">
                  <span>
                    <span className="text-muted-foreground">{i + 1}.</span> {fld.label}
                    {fld.required ? <span className="ml-1 text-destructive">*</span> : null}
                    <span className="ml-2 text-xs text-muted-foreground">
                      [{FIELD_TYPE_LABELS[fld.type as keyof typeof FIELD_TYPE_LABELS] ?? fld.type}]
                      {opts.length > 0 ? ` ${opts.join(", ")}` : ""}
                    </span>
                  </span>
                  {canWrite && (
                    <form action={removeFieldAction.bind(null, formId, fld.fieldId)}>
                      <button className="text-xs text-destructive underline">삭제</button>
                    </form>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* 문항 추가 */}
      {canWrite && (
        <form action={addFieldAction.bind(null, formId)} className="flex flex-col gap-2 rounded-md border border-border p-3">
          <h3 className="text-sm font-semibold">문항 추가</h3>
          <input name="label" required placeholder="문항 내용" className={input} />
          <div className="flex flex-wrap items-center gap-2">
            <select name="type" className={input} defaultValue="short_text">
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-sm text-muted-foreground">
              <input type="checkbox" name="required" /> 필수
            </label>
            <button className={btn}>추가</button>
          </div>
          <textarea name="options" placeholder="선택형 보기(한 줄에 하나) — 단일/다중선택일 때만" rows={3} className={input} />
        </form>
      )}

      <Link href="/forms" className="text-sm underline">← 목록으로</Link>
    </section>
  );
}
