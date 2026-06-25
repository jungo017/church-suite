import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS, hasPermission } from "@/lib/rbac/roles";
import { getForm, listFields, parseOptions } from "@/lib/forms/service";
import {
  PageHeader,
  PageTitle,
  PageDescription,
  PageActions,
} from "@/lib/ui/page";
import { Button } from "@/lib/ui/button";
import { Badge, type BadgeTone } from "@/lib/ui/badge";
import { EmptyState } from "@/lib/ui/empty-state";
import { Input, Textarea, Select } from "@/lib/ui/form";
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

// 폼 상태 → Badge 톤 (라벨과 함께 사용, §11).
const STATUS_TONE: Record<string, BadgeTone> = {
  draft: "muted",
  published: "success",
  closed: "destructive",
};

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
      <PageHeader>
        <div>
          <PageTitle>{f.title}</PageTitle>
          <PageDescription>
            {f.category === "report" ? "보고서" : "설문"}
            {f.periodYear ? ` · ${f.periodYear}` : ""}
            {f.anonymous ? " · 익명" : ""}
            {" · "}
            <Badge tone={STATUS_TONE[f.status] ?? "muted"}>
              {FORM_STATUS_LABELS[f.status as FormStatus] ?? f.status}
            </Badge>
          </PageDescription>
        </div>
        {canWrite && (
          <PageActions>
            {f.status === "draft" && (
              <form action={setFormStatusAction.bind(null, formId)}>
                <input type="hidden" name="status" value="published" />
                <Button type="submit">발행</Button>
              </form>
            )}
            {f.status === "published" && (
              <form action={setFormStatusAction.bind(null, formId)}>
                <input type="hidden" name="status" value="closed" />
                <Button type="submit" variant="outline">
                  마감
                </Button>
              </form>
            )}
            {f.status === "closed" && (
              <form action={setFormStatusAction.bind(null, formId)}>
                <input type="hidden" name="status" value="published" />
                <Button type="submit" variant="outline">
                  재발행
                </Button>
              </form>
            )}
          </PageActions>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href={`/forms/${formId}/assignments`} className="underline">배정/제출현황</Link>
        <Link href={`/forms/${formId}/responses`} className="underline">응답 보기</Link>
        <Link href={`/forms/${formId}/report`} className="underline">집계</Link>
        {f.anonymous && f.status === "published" && (
          <span className="text-muted-foreground">
            공개 링크: <code className="rounded bg-muted px-1">/online/forms/{formId}</code>
          </span>
        )}
      </div>

      {/* 메타 편집 */}
      {canWrite && (
        <form action={updateFormAction.bind(null, formId)} className="flex flex-col gap-2 rounded-md border border-border p-3">
          <Input name="title" defaultValue={f.title} />
          <Input name="description" defaultValue={f.description ?? ""} placeholder="설명" />
          <div className="flex flex-wrap items-center gap-2">
            <Select name="category" defaultValue={f.category} className="w-auto">
              <option value="survey">설문</option>
              <option value="report">보고서</option>
            </Select>
            <Input name="periodYear" type="number" defaultValue={f.periodYear ?? ""} placeholder="연도" className="w-32" />
            <Input name="targetRole" defaultValue={f.targetRole ?? ""} placeholder="대상 직책코드(예: class_leader)" className="w-56" />
            <label className="flex items-center gap-1 text-sm text-muted-foreground">
              <input type="checkbox" name="anonymous" defaultChecked={f.anonymous} /> 익명
            </label>
            <Button type="submit" variant="outline">저장</Button>
          </div>
        </form>
      )}

      {/* 문항 목록 */}
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">문항 ({fields.length})</h2>
        {fields.length === 0 ? (
          <EmptyState
            title="문항이 없습니다"
            description="아래에서 문항을 추가해 폼을 구성하세요."
          />
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
                      <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                        삭제
                      </Button>
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
          <Input name="label" required placeholder="문항 내용" />
          <div className="flex flex-wrap items-center gap-2">
            <Select name="type" defaultValue="short_text" className="w-auto">
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
              ))}
            </Select>
            <label className="flex items-center gap-1 text-sm text-muted-foreground">
              <input type="checkbox" name="required" /> 필수
            </label>
            <Button type="submit">추가</Button>
          </div>
          <Textarea name="options" placeholder="선택형 보기(한 줄에 하나) — 단일/다중선택일 때만" rows={3} />
        </form>
      )}

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/forms">
          <ArrowLeft />
          목록으로
        </Link>
      </Button>
    </section>
  );
}
