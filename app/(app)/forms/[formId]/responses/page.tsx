import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { getForm } from "@/lib/forms/service";
import { listResponses } from "@/lib/forms/responses";
import {
  PageHeader,
  PageTitle,
  PageDescription,
} from "@/lib/ui/page";
import { Button } from "@/lib/ui/button";
import { EmptyState } from "@/lib/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/lib/ui/table";

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
      <PageHeader>
        <div>
          <PageTitle>{f.title} — 응답</PageTitle>
          <PageDescription>총 {responses.length}건</PageDescription>
        </div>
      </PageHeader>

      {responses.length === 0 ? (
        <EmptyState
          title="아직 응답이 없습니다"
          description="폼이 발행되고 제출이 들어오면 여기에 표시됩니다."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제출자</TableHead>
                <TableHead className="text-right">제출일시</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map((r) => (
                <TableRow key={r.responseId}>
                  <TableCell>
                    <Link
                      href={`/forms/${formId}/responses/${r.responseId}`}
                      className="underline"
                    >
                      {r.memberName ?? "익명"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleString("ko-KR") : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href={`/forms/${formId}`}>
          <ArrowLeft />
          폼으로
        </Link>
      </Button>
    </section>
  );
}
