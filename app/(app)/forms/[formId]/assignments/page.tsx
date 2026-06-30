import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@church/core/rbac/guards";
import { PERMISSIONS, hasPermission } from "@church/core/rbac/roles";
import { getForm } from "@church/module-forms/service";
import {
  assignmentSummary,
  listAssignments,
} from "@church/module-forms/assignments";
import { listMembers } from "@church/module-members/service";
import {
  autoAssignAction,
  assignMembersAction,
  setAssignmentStatusAction,
  removeAssignmentAction,
  remindPendingAction,
} from "@church/module-forms/assignment-actions";
import { PageHeader, PageTitle, PageDescription } from "@/lib/ui/page";
import { Input, Select } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";
import { Badge, type BadgeTone } from "@/lib/ui/badge";
import { EmptyState } from "@/lib/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/lib/ui/table";
import {
  ASSIGNMENT_STATUS_LABELS,
  type AssignmentStatus,
} from "@church/module-forms/constants";

// 배정 상태 → Badge 톤 (색만으로 의미 전달하지 않도록 라벨과 함께 사용, §11).
const STATUS_TONE: Record<string, BadgeTone> = {
  pending: "muted",
  submitted: "success",
  reviewed: "info",
};

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
      <PageHeader>
        <div>
          <PageTitle>{f.title} — 배정/제출현황</PageTitle>
          <PageDescription>
            대상 직책: {f.targetRole ?? "—"}
            {f.periodYear ? ` · ${f.periodYear}년` : ""}
          </PageDescription>
        </div>
      </PageHeader>

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
            <div className="text-2xl font-bold tabular-nums">{n}</div>
            <div className="text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {canWrite && (
        <div className="flex flex-col gap-3 rounded-md border border-border p-3">
          {/* 역할 기반 자동 배정 */}
          <form action={autoAssignAction.bind(null, formId)} className="flex items-center gap-2">
            <Button type="submit" disabled={!canAuto}>역할 기반 자동 배정</Button>
            <span className="text-xs text-muted-foreground">
              {canAuto
                ? `그 해(${f.periodYear}) '${f.targetRole}' 직책 보유자에게 배정`
                : "폼에 대상 직책코드·연도를 설정하면 활성화됩니다."}
            </span>
          </form>
          {/* 수동 배정 */}
          <form action={assignMembersAction.bind(null, formId)} className="flex items-start gap-2">
            <Select name="memberIds" multiple size={4} className="flex-1">
              {members.map((m) => (
                <option key={m.memberId} value={m.memberId}>{m.name}</option>
              ))}
            </Select>
            <Button type="submit" variant="outline">수동 배정</Button>
          </form>
          {/* 미제출 독려(잡) */}
          <form action={remindPendingAction.bind(null, formId)} className="flex items-center gap-2">
            <Input name="message" placeholder="독려 메시지(선택)" className="flex-1" />
            <Button type="submit" variant="outline" disabled={summary.pending === 0}>
              미제출 {summary.pending}명 독려
            </Button>
          </form>
        </div>
      )}

      {/* 배정 목록 */}
      {assignments.length === 0 ? (
        <EmptyState
          title="배정된 대상이 없습니다"
          description="자동 배정 또는 수동 배정으로 대상을 추가하면 제출 현황을 추적할 수 있습니다."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>교인</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => (
                <TableRow key={a.assignmentId}>
                  <TableCell>{a.memberName}</TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[a.status] ?? "muted"}>
                      {ASSIGNMENT_STATUS_LABELS[a.status as AssignmentStatus] ?? a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canWrite && (
                      <span className="flex justify-end gap-2">
                        {a.status === "submitted" && (
                          <form action={setAssignmentStatusAction.bind(null, formId, a.assignmentId)}>
                            <input type="hidden" name="status" value="reviewed" />
                            <Button type="submit" variant="ghost" size="sm">검토완료</Button>
                          </form>
                        )}
                        <form action={removeAssignmentAction.bind(null, formId, a.assignmentId)}>
                          <Button type="submit" variant="destructive" size="sm">삭제</Button>
                        </form>
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex gap-3 text-sm">
        <Link href={`/forms/${formId}`} className="text-muted-foreground hover:underline">← 폼으로</Link>
        <Link href={`/forms/${formId}/responses`} className="text-muted-foreground hover:underline">응답 보기</Link>
      </div>
    </section>
  );
}
