import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@church/core/rbac/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import { getResponseDetail } from "@/lib/forms/responses";
import { parseOptions } from "@/lib/forms/service";
import { parseFileAnswer } from "@/lib/forms/files";

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
      <div>
        <h1 className="text-2xl font-bold">응답 상세</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {detail.response.memberId ? "교인 제출" : "익명"} ·{" "}
          {detail.response.submittedAt
            ? new Date(detail.response.submittedAt).toLocaleString("ko-KR")
            : ""}
        </p>
      </div>

      <dl className="flex flex-col gap-3 text-sm">
        {detail.answers.map((a) => (
          <div key={a.answerId} className="border-b border-border pb-2">
            <dt className="font-medium">{a.label}</dt>
            <dd className="mt-1 text-muted-foreground"><AnswerValue type={a.type} value={a.value} /></dd>
          </div>
        ))}
        {detail.answers.length === 0 && (
          <p className="text-muted-foreground">답변이 없습니다.</p>
        )}
      </dl>

      <Link href={`/forms/${formId}/responses`} className="text-sm underline">← 응답 목록</Link>
    </section>
  );
}
