import Link from "next/link";
import { requirePermission } from "@church/core/rbac/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import { listPrograms } from "@church/module-members/education";
import { createProgramAction } from "@church/module-members/education-actions";
import {
  PROGRAM_STATUS_LABELS,
  type ProgramStatus,
} from "@church/module-members/constants";

const input =
  "rounded-md border border-border px-3 py-2 text-sm dark:bg-transparent";

export default async function EducationPage() {
  const user = await requirePermission(PERMISSIONS.MEMBERS_WRITE);
  const programs = await listPrograms(user.church_id);

  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-bold">교육 관리</h1>

      <form action={createProgramAction} className="flex flex-col gap-2">
        <input name="name" required placeholder="과정명 (예: 새가족반)" className={input} />
        <input name="description" placeholder="설명" className={input} />
        <div className="flex gap-2">
          <input name="startDate" type="date" className={input} />
          <input name="endDate" type="date" className={input} />
          <button className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
            과정 생성
          </button>
        </div>
      </form>

      {programs.length === 0 ? (
        <p className="text-sm text-muted-foreground">교육 과정이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {programs.map((p) => (
            <li
              key={p.programId}
              className="flex items-center justify-between border-b border-border py-2"
            >
              <Link href={`/members/education/${p.programId}`} className="font-medium underline">
                {p.name}
              </Link>
              <span className="text-muted-foreground">
                {PROGRAM_STATUS_LABELS[p.status as ProgramStatus] ?? p.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link href="/members" className="text-sm underline">← 목록으로</Link>
    </section>
  );
}
