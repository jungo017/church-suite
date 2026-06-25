import Link from "next/link";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS, hasPermission } from "@/lib/rbac/roles";
import { listForms } from "@/lib/forms/service";
import { createFormAction } from "@/lib/forms/actions";
import { PageHeader, PageTitle, PageDescription } from "@/lib/ui/page";
import { Input, Select } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";
import { Badge, type BadgeTone } from "@/lib/ui/badge";
import { EmptyState } from "@/lib/ui/empty-state";
import {
  FORM_CATEGORY_LABELS,
  FORM_STATUS_LABELS,
  type FormCategory,
  type FormStatus,
} from "@/lib/forms/constants";

// 폼 상태 → Badge 톤 (색만으로 의미 전달하지 않도록 라벨과 함께 사용, §11).
const STATUS_TONE: Record<string, BadgeTone> = {
  draft: "muted",
  published: "success",
  closed: "destructive",
};

export default async function FormsPage() {
  const user = await requirePermission(PERMISSIONS.FORMS_READ);
  const canWrite = hasPermission(user.roles, PERMISSIONS.FORMS_WRITE);
  const forms = await listForms(user.church_id);

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <PageHeader>
        <div>
          <PageTitle>설문 · 보고</PageTitle>
          <PageDescription>
            설문/보고서 템플릿을 만들고 문항을 구성해 발행합니다.
          </PageDescription>
        </div>
      </PageHeader>

      {canWrite && (
        <form action={createFormAction} className="flex flex-col gap-2 rounded-md border border-border p-3">
          <Input name="title" required placeholder="제목 (예: 2026 속장보고서)" />
          <div className="flex flex-wrap gap-2">
            <Select name="category" defaultValue="survey" className="w-auto">
              <option value="survey">설문</option>
              <option value="report">보고서</option>
            </Select>
            <Input name="periodYear" type="number" placeholder="대상 연도(보고서)" className="w-40" />
            <label className="flex items-center gap-1 text-sm text-muted-foreground">
              <input type="checkbox" name="anonymous" /> 익명(공개 링크)
            </label>
            <Button type="submit">생성</Button>
          </div>
        </form>
      )}

      {forms.length === 0 ? (
        <EmptyState
          title="아직 폼이 없습니다"
          description="설문 또는 보고서 템플릿을 만들면 문항을 구성하고 발행할 수 있습니다."
        />
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {forms.map((f) => (
            <li
              key={f.formId}
              className="flex items-center justify-between border-b border-border py-2"
            >
              <Link
                href={`/forms/${f.formId}`}
                className="font-medium text-foreground hover:underline"
              >
                {f.title}
              </Link>
              <span className="flex items-center gap-2 text-muted-foreground">
                <span>{FORM_CATEGORY_LABELS[f.category as FormCategory] ?? f.category}</span>
                {f.periodYear ? <span>· {f.periodYear}</span> : null}
                <Badge tone={STATUS_TONE[f.status] ?? "muted"}>
                  {FORM_STATUS_LABELS[f.status as FormStatus] ?? f.status}
                </Badge>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
