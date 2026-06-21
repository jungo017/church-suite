import Link from "next/link";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { listAudits } from "@/lib/assets/audit";
import { createAuditAction } from "@/lib/assets/actions";

export default async function AuditsPage() {
  const user = await requirePermission(PERMISSIONS.ASSETS_WRITE);
  const audits = await listAudits(user.church_id);

  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-bold">전수조사</h1>

      <form action={createAuditAction} className="flex gap-2">
        <input
          name="name"
          placeholder="조사명 (예: 2026 상반기 전수조사)"
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm dark:bg-transparent"
        />
        <button className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
          새 전수조사 시작
        </button>
      </form>

      {audits.length === 0 ? (
        <p className="text-sm text-muted-foreground">진행한 전수조사가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {audits.map((a) => (
            <li
              key={a.auditId}
              className="flex items-center justify-between border-b border-border py-2"
            >
              <Link href={`/assets/audits/${a.auditId}`} className="font-medium underline">
                {a.name}
              </Link>
              <span className="text-muted-foreground">
                {a.status === "open" ? "진행중" : "마감"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link href="/assets" className="text-sm underline">
        ← 목록으로
      </Link>
    </section>
  );
}
