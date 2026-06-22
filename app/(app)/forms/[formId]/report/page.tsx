import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { getForm, parseOptions } from "@/lib/forms/service";
import {
  fieldDistributions,
  submissionByDepartment,
} from "@/lib/forms/aggregate";
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{f.title} — 집계</h1>
        <div className="flex gap-2">
          <a
            href={`/forms/${formId}/export`}
            className="rounded-md border border-border px-3 py-2 text-sm"
          >
            CSV
          </a>
          <a
            href={`/forms/${formId}/export?format=xlsx`}
            className="rounded-md border border-border px-3 py-2 text-sm"
          >
            Excel
          </a>
        </div>
      </div>

      {/* 속/구역별 제출률 (보고서) */}
      {byDept.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">조직별 제출률</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2">조직</th>
                <th className="py-2">제출</th>
                <th className="py-2">대상</th>
                <th className="py-2">제출률</th>
              </tr>
            </thead>
            <tbody>
              {byDept.map((d) => (
                <tr key={d.departmentId} className="border-b border-border">
                  <td className="py-2">{d.departmentName}</td>
                  <td className="py-2">{d.submitted}</td>
                  <td className="py-2">{d.total}</td>
                  <td className="py-2">
                    {d.total > 0 ? Math.round((d.submitted / d.total) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 문항별 응답 분포 */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">문항별 응답</h2>
        {dists.length === 0 ? (
          <p className="text-sm text-muted-foreground">문항이 없습니다.</p>
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
                      <span className="text-muted-foreground">{v.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex gap-3 text-sm">
        <Link href={`/forms/${formId}`} className="underline">← 폼으로</Link>
        <Link href={`/forms/${formId}/assignments`} className="underline">배정/제출현황</Link>
      </div>
    </section>
  );
}
