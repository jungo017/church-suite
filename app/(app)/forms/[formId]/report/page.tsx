import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { getForm, parseOptions } from "@/lib/forms/service";
import {
  fieldDistributions,
  submissionByDepartment,
} from "@/lib/forms/aggregate";
import { PageHeader, PageTitle, PageActions } from "@/lib/ui/page";
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
import { FIELD_TYPE_LABELS } from "@/lib/forms/constants";

function showValue(type: string, value: string): string {
  if (type === "multi_choice") return parseOptions(value).join(" / ") || value;
  return value;
}

export default async function FormReportPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const user = await requirePermission(PERMISSIONS.FORMS_READ);
  const f = await getForm(user.church_id, formId);
  if (!f) notFound();
  const [dists, byDept] = await Promise.all([
    fieldDistributions(user.church_id, formId),
    submissionByDepartment(user.church_id, formId),
  ]);

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <PageHeader>
        <PageTitle>{f.title} — 집계</PageTitle>
        <PageActions>
          <Button asChild variant="outline">
            <a href={`/forms/${formId}/export`}>CSV</a>
          </Button>
          <Button asChild variant="outline">
            <a href={`/forms/${formId}/export?format=xlsx`}>Excel</a>
          </Button>
        </PageActions>
      </PageHeader>

      {/* 속/구역별 제출률 (보고서) */}
      {byDept.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">조직별 제출률</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>조직</TableHead>
                  <TableHead className="text-right">제출</TableHead>
                  <TableHead className="text-right">대상</TableHead>
                  <TableHead className="text-right">제출률</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byDept.map((d) => (
                  <TableRow key={d.departmentId}>
                    <TableCell>{d.departmentName}</TableCell>
                    <TableCell className="text-right tabular-nums">{d.submitted}</TableCell>
                    <TableCell className="text-right tabular-nums">{d.total}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {d.total > 0 ? Math.round((d.submitted / d.total) * 100) : 0}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 문항별 응답 분포 */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">문항별 응답</h2>
        {dists.length === 0 ? (
          <EmptyState
            title="문항이 없습니다"
            description="폼에 문항을 추가하고 응답을 받으면 응답 분포가 집계됩니다."
          />
        ) : (
          dists.map((d) => (
            <div key={d.fieldId} className="flex flex-col gap-1">
              <div className="text-sm font-medium">
                {d.label}{" "}
                <span className="text-xs text-muted-foreground">
                  [{FIELD_TYPE_LABELS[d.type as keyof typeof FIELD_TYPE_LABELS] ?? d.type}] · 응답 {d.answered}
                </span>
              </div>
              {d.values.length === 0 ? (
                <p className="text-xs text-muted-foreground">응답 없음</p>
              ) : (
                <ul className="flex flex-col gap-0.5 text-sm">
                  {d.values.map((v, i) => (
                    <li key={i} className="flex justify-between border-b border-border py-1">
                      <span>{showValue(d.type, v.value)}</span>
                      <span className="text-muted-foreground tabular-nums">{v.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex gap-3 text-sm">
        <Link href={`/forms/${formId}`} className="text-muted-foreground hover:underline">← 폼으로</Link>
        <Link href={`/forms/${formId}/assignments`} className="text-muted-foreground hover:underline">배정/제출현황</Link>
      </div>
    </section>
  );
}
