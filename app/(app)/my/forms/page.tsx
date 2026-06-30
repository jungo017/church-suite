import Link from "next/link";
import { requireUser } from "@church/core/auth/session";
import { getUserMember } from "@church/core/member";
import { listMyAssignments } from "@church/module-forms/my";
import {
  ASSIGNMENT_STATUS_LABELS,
  FORM_CATEGORY_LABELS,
  type AssignmentStatus,
  type FormCategory,
} from "@church/module-forms/constants";

export default async function MyFormsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;
  const user = await requireUser();
  const me = await getUserMember(user.church_id, user.sub);

  if (!me) {
    return (
      <section className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">설문 · 보고</h1>
        <p className="text-sm text-muted-foreground">연결된 교인 정보가 없습니다.</p>
      </section>
    );
  }

  const assignments = await listMyAssignments(user.church_id, me.memberId);

  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-bold">설문 · 보고</h1>
      {submitted && <p className="text-sm text-green-600">제출이 완료되었습니다. 감사합니다!</p>}

      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">배정된 설문·보고가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {assignments.map((a) => {
            const done = a.assignmentStatus !== "pending";
            const canFill = a.formStatus === "published" && !done;
            return (
              <li
                key={a.assignmentId}
                className="flex items-center justify-between border-b border-border py-2"
              >
                <span>
                  <Link href={`/my/forms/${a.assignmentId}`} className="font-medium underline">
                    {a.title}
                  </Link>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {FORM_CATEGORY_LABELS[a.category as FormCategory] ?? a.category}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {canFill ? (
                    <span className="text-primary">작성 필요</span>
                  ) : (
                    ASSIGNMENT_STATUS_LABELS[a.assignmentStatus as AssignmentStatus] ??
                    a.assignmentStatus
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/my" className="text-sm underline">← 내 정보</Link>
    </section>
  );
}
