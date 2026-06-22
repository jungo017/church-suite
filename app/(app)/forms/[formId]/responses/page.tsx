import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { getForm } from "@/lib/forms/service";
import { listResponses } from "@/lib/forms/responses";

export default async function FormResponsesPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const user = await requirePermission(PERMISSIONS.FORMS_READ);
  const f = await getForm(user.church_id, formId);
  if (!f) notFound();
  const responses = await listResponses(user.church_id, formId);

  return (
    <section className="flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">{f.title} — 응답</h1>
        <p className="mt-1 text-sm text-muted-foreground">총 {responses.length}건</p>
      </div>

      {responses.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 응답이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {responses.map((r) => (
            <li
              key={r.responseId}
              className="flex items-center justify-between border-b border-border py-2"
            >
              <Link
                href={`/forms/${formId}/responses/${r.responseId}`}
                className="underline"
              >
                {r.memberName ?? "익명"}
              </Link>
              <span className="text-muted-foreground">
                {r.submittedAt ? new Date(r.submittedAt).toLocaleString("ko-KR") : ""}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link href={`/forms/${formId}`} className="text-sm underline">← 폼으로</Link>
    </section>
  );
}
