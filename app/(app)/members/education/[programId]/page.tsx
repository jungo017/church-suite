import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { getProgram, listEnrollments } from "@/lib/members/education";
import { listMembers } from "@/lib/members/service";
import {
  enrollAction,
  setEnrollmentStatusAction,
  removeEnrollmentAction,
} from "@/lib/members/education-actions";
import { PageHeader, PageTitle, PageActions } from "@/lib/ui/page";
import { Select } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";
import { Badge, type BadgeTone } from "@/lib/ui/badge";
import { EmptyState } from "@/lib/ui/empty-state";
import {
  ENROLLMENT_STATUSES,
  ENROLLMENT_STATUS_LABELS,
  PROGRAM_STATUS_LABELS,
  type ProgramStatus,
} from "@/lib/members/constants";

// 과정 상태 → Badge 톤 (색만으로 의미 전달하지 않도록 라벨과 함께 사용, §11).
const PROGRAM_STATUS_TONE: Record<string, BadgeTone> = {
  open: "success",
  closed: "muted",
};

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const user = await requirePermission(PERMISSIONS.MEMBERS_WRITE);
  const program = await getProgram(user.church_id, programId);
  if (!program) notFound();

  const [enrollments, members] = await Promise.all([
    listEnrollments(user.church_id, programId),
    listMembers(user.church_id, { status: "active" }),
  ]);
  const enrolledIds = new Set(enrollments.map((e) => e.memberId));
  const candidates = members.filter((m) => !enrolledIds.has(m.memberId));

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <PageHeader>
        <PageTitle>{program.name}</PageTitle>
        <PageActions>
          <Badge tone={PROGRAM_STATUS_TONE[program.status] ?? "muted"}>
            {PROGRAM_STATUS_LABELS[program.status as ProgramStatus] ?? program.status}
          </Badge>
        </PageActions>
      </PageHeader>
      {program.description && (
        <p className="text-sm text-muted-foreground">{program.description}</p>
      )}

      <form action={enrollAction.bind(null, programId)} className="flex gap-2">
        <Select name="memberId" required className="flex-1" defaultValue="">
          <option value="" disabled>
            교인 선택…
          </option>
          {candidates.map((m) => (
            <option key={m.memberId} value={m.memberId}>{m.name}</option>
          ))}
        </Select>
        <Button type="submit">등록</Button>
      </form>

      <h2 className="text-lg font-semibold">수강생 ({enrollments.length})</h2>
      {enrollments.length === 0 ? (
        <EmptyState
          title="등록된 수강생이 없습니다"
          description="위 양식에서 교인을 선택해 과정에 등록하세요."
        />
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {enrollments.map((e) => (
            <li
              key={e.enrollmentId}
              className="flex items-center justify-between gap-2 border-b border-border py-1.5"
            >
              <span className="font-medium">{e.name}</span>
              <div className="flex items-center gap-2">
                <form
                  action={setEnrollmentStatusAction.bind(null, programId, e.enrollmentId)}
                  className="flex gap-1"
                >
                  <Select name="status" defaultValue={e.status} className="w-auto">
                    {ENROLLMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>{ENROLLMENT_STATUS_LABELS[s]}</option>
                    ))}
                  </Select>
                  <Button type="submit" variant="outline" size="sm">변경</Button>
                </form>
                <form action={removeEnrollmentAction.bind(null, programId, e.enrollmentId)}>
                  <Button type="submit" variant="destructive" size="sm">제거</Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/members/education">
          <ArrowLeft />
          교육 과정
        </Link>
      </Button>
    </section>
  );
}
