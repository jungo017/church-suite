import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@church/core/rbac/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import { getResponseDetail } from "@church/module-forms/responses";
import { parseOptions } from "@church/module-forms/service";
import { parseFileAnswer } from "@church/module-forms/files";
import { PageHeader, PageTitle, PageDescription } from "@/lib/ui/page";
import { Button } from "@/lib/ui/button";
import { EmptyState } from "@/lib/ui/empty-state";
import { DescriptionList, DescriptionItem } from "@/lib/ui/description-list";

function fileHref(key: string, name: string): string {
  return `/files?key=${encodeURIComponent(key)}&name=${encodeURIComponent(name)}`;
}

/** 답변 표시 — 파일은 다운로드 링크, 다중선택은 합치기. */
function AnswerValue({ type, value }: { type: string; value: string | null }) {
  if (type === "file") {
    const ref = parseFileAnswer(value);
    return ref ? (
      <a href={fileHref(ref.key, ref.name)} className="underline">{ref.name}</a>
    ) : (
      <>—</>
    );
  }
  if (value == null || value === "") return <>—</>;
  if (type === "multi_choice") return <>{parseOptions(value).join(", ") || "—"}</>;
  return <>{value}</>;
}

export default async function ResponseDetailPage({
  params,
}: {
  params: Promise<{ formId: string; responseId: string }>;
}) {
  const { formId, responseId } = await params;
  const user = await requirePermission(PERMISSIONS.FORMS_READ);
  const detail = await getResponseDetail(user.church_id, responseId);
  if (!detail || detail.response.formId !== formId) notFound();

  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <PageHeader>
        <div>
          <PageTitle>응답 상세</PageTitle>
          <PageDescription>
            {detail.response.memberId ? "교인 제출" : "익명"} ·{" "}
            {detail.response.submittedAt
              ? new Date(detail.response.submittedAt).toLocaleString("ko-KR")
              : ""}
          </PageDescription>
        </div>
      </PageHeader>

      {detail.answers.length === 0 ? (
        <EmptyState title="답변이 없습니다" />
      ) : (
        <DescriptionList className="sm:grid-cols-1">
          {detail.answers.map((a) => (
            <DescriptionItem key={a.answerId} label={a.label}>
              <AnswerValue type={a.type} value={a.value} />
            </DescriptionItem>
          ))}
        </DescriptionList>
      )}

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href={`/forms/${formId}/responses`}>
          <ArrowLeft />
          응답 목록
        </Link>
      </Button>
    </section>
  );
}
