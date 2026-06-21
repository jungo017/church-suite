import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { getProgram, listEnrollments } from "@/lib/members/education";
import { listMembers } from "@/lib/members/service";
import {
  enrollAction,
  setEnrollmentStatusAction,
  removeEnrollmentAction,
} from "@/lib/members/education-actions";
import {
  ENROLLMENT_STATUSES,
  ENROLLMENT_STATUS_LABELS,
  PROGRAM_STATUS_LABELS,
  type ProgramStatus,
} from "@/lib/members/constants";

const ctrl =
  "rounded-md border border-border px-2 py-1 text-sm dark:bg-transparent";

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{program.name}</h1>
        <span className="text-sm text-muted-foreground">
          {PROGRAM_STATUS_LABELS[program.status as ProgramStatus] ?? program.status}
        </span>
      </div>
      {program.description && (
        <p className="text-sm text-muted-foreground">{program.description}</p>
      )}

      <form action={enrollAction.bind(null, programId)} className="flex gap-2">
        <select name="memberId" required className={`${ctrl} flex-1`} defaultValue="">
          <option value="" disabled>
            교인 선택…
          </option>
          {candidates.map((m) => (
            <option key={m.memberId} value={m.memberId}>{m.name}</option>
          ))}
        </select>
        <button className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background">
          등록
        </button>
      </form>

      <h2 className="text-lg font-semibold">수강생 ({enrollments.length})</h2>
      {enrollments.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 수강생이 없습니다.</p>
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
                  <select name="status" defaultValue={e.status} className={ctrl}>
                    {ENROLLMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>{ENROLLMENT_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  <button className="text-xs underline">변경</button>
                </form>
                <form action={removeEnrollmentAction.bind(null, programId, e.enrollmentId)}>
                  <button className="text-xs text-destructive">제거</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link href="/members/education" className="text-sm underline">← 교육 과정</Link>
    </section>
  );
}
