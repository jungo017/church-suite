import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@church/core/rbac/guards";
import { PERMISSIONS, hasPermission } from "@church/core/rbac/roles";
import { getForm } from "@/lib/forms/service";
import {
  assignmentSummary,
  listAssignments,
} from "@/lib/forms/assignments";
import { listMembers } from "@/lib/members/service";
import {
  autoAssignAction,
  assignMembersAction,
  setAssignmentStatusAction,
  removeAssignmentAction,
  remindPendingAction,
} from "@/lib/forms/assignment-actions";
import {
  ASSIGNMENT_STATUS_LABELS,
  type AssignmentStatus,
} from "@/lib/forms/constants";

const btn =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background";
const input =
  "rounded-md border border-border px-3 py-2 text-sm dark:bg-transparent";

export default async function AssignmentsPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const user = await requirePermission(PERMISSIONS.FORMS_READ);
  const canWrite = hasPermission(user.roles, PERMISSIONS.FORMS_WRITE);
  const f = await getForm(user.church_id, formId);
  if (!f) notFound();

  const [summary, assignments] = await Promise.all([
    assignmentSummary(user.church_id, formId),
    listAssignments(user.church_id, formId),
  ]);
  const members = canWrite
    ? await listMembers(user.church_id, { status: "active" })
    : [];
  const canAuto = !!f.targetRole && f.periodYear != null;

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{f.title} — 배정/제출현황</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          대상 직책: {f.targetRole ?? "—"}
          {f.periodYear ? ` · ${f.periodYear}년` : ""}
        </p>
      </div>

      {/* 제출현황 요약 */}
      <div className="grid grid-cols-4 gap-2 text-center text-sm">
        {(
          [
            ["전체", summary.total],
            ["미제출", summary.pending],
            ["제출", summary.submitted],
            ["검토완료", summary.reviewed],
          ] as const
        ).map(([label, n]) => (
          <div key={label} className="rounded-md border border-border p-3">
            <div className="text-2xl font-bold">{n}</div>
            <div className="text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {canWrite && (
        <div className="flex flex-col gap-3 rounded-md border border-border p-3">
          {/* 역할 기반 자동 배정 */}
          <form action={autoAssignAction.bind(null, formId)} className="flex items-center gap-2">
            <button className={btn} disabled={!canAuto}>역할 기반 자동 배정</button>
            <span className="text-xs text-muted-foreground">
              {canAuto
                ? `그 해(${f.periodYear}) '${f.targetRole}' 직책 보유자에게 배정`
                : "폼에 대상 직책코드·연도를 설정하면 활성화됩니다."}
            </span>
          </form>
          {/* 수동 배정 */}
          <form action={assignMembersAction.bind(null, formId)} className="flex items-start gap-2">
            <select name="memberIds" multiple size={4} className={`${input} flex-1`}>
              {members.map((m) => (
                <option key={m.memberId} value={m.memberId}>{m.name}</option>
              ))}
            </select>
            <button className="rounded-md border border-border px-3 py-2 text-sm">수동 배정</button>
          </form>
          {/* 미제출 독려(잡) */}
          <form action={remindPendingAction.bind(null, formId)} className="flex items-center gap-2">
            <input name="message" placeholder="독려 메시지(선택)" className={`${input} flex-1`} />
            <button
              className="rounded-md border border-border px-3 py-2 text-sm"
              disabled={summary.pending === 0}
            >
              미제출 {summary.pending}명 독려
            </button>
          </form>
        </div>
      )}

      {/* 배정 목록 */}
      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">배정된 대상이 없습니다.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2">교인</th>
              <th className="py-2">상태</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.assignmentId} className="border-b border-border">
                <td className="py-2">{a.memberName}</td>
                <td className="py-2">
                  {ASSIGNMENT_STATUS_LABELS[a.status as AssignmentStatus] ?? a.status}
                </td>
                <td className="py-2 text-right">
                  {canWrite && (
                    <span className="flex justify-end gap-3">
                      {a.status === "submitted" && (
                        <form action={setAssignmentStatusAction.bind(null, formId, a.assignmentId)}>
                          <input type="hidden" name="status" value="reviewed" />
                          <button className="text-xs underline">검토완료</button>
                        </form>
                      )}
                      <form action={removeAssignmentAction.bind(null, formId, a.assignmentId)}>
                        <button className="text-xs text-destructive underline">삭제</button>
                      </form>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex gap-3 text-sm">
        <Link href={`/forms/${formId}`} className="underline">← 폼으로</Link>
        <Link href={`/forms/${formId}/responses`} className="underline">응답 보기</Link>
      </div>
    </section>
  );
}
