import Link from "next/link";
import { requirePermission } from "@church/core/rbac/guards";
import { PERMISSIONS, hasPermission } from "@church/core/rbac/roles";
import { listForms } from "@/lib/forms/service";
import { createFormAction } from "@/lib/forms/actions";
import {
  FORM_CATEGORY_LABELS,
  FORM_STATUS_LABELS,
  type FormCategory,
  type FormStatus,
} from "@/lib/forms/constants";

const input =
  "rounded-md border border-border px-3 py-2 text-sm dark:bg-transparent";
const btn =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background";

export default async function FormsPage() {
  const user = await requirePermission(PERMISSIONS.FORMS_READ);
  const canWrite = hasPermission(user.roles, PERMISSIONS.FORMS_WRITE);
  const forms = await listForms(user.church_id);

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">설문 · 보고</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          설문/보고서 템플릿을 만들고 문항을 구성해 발행합니다.
        </p>
      </div>

      {canWrite && (
        <form action={createFormAction} className="flex flex-col gap-2 rounded-md border border-border p-3">
          <input name="title" required placeholder="제목 (예: 2026 속장보고서)" className={input} />
          <div className="flex flex-wrap gap-2">
            <select name="category" className={input} defaultValue="survey">
              <option value="survey">설문</option>
              <option value="report">보고서</option>
            </select>
            <input name="periodYear" type="number" placeholder="대상 연도(보고서)" className={`${input} w-40`} />
            <label className="flex items-center gap-1 text-sm text-muted-foreground">
              <input type="checkbox" name="anonymous" /> 익명(공개 링크)
            </label>
            <button className={btn}>생성</button>
          </div>
        </form>
      )}

      {forms.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 폼이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {forms.map((f) => (
            <li
              key={f.formId}
              className="flex items-center justify-between border-b border-border py-2"
            >
              <Link href={`/forms/${f.formId}`} className="font-medium underline">
                {f.title}
              </Link>
              <span className="flex items-center gap-2 text-muted-foreground">
                <span>{FORM_CATEGORY_LABELS[f.category as FormCategory] ?? f.category}</span>
                {f.periodYear ? <span>· {f.periodYear}</span> : null}
                <span className="rounded bg-muted px-2 py-0.5 text-xs">
                  {FORM_STATUS_LABELS[f.status as FormStatus] ?? f.status}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
