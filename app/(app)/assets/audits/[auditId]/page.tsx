import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { getAudit, listAuditItems } from "@/lib/assets/audit";
import {
  checkItemAction,
  checkByTagAction,
  closeAuditAction,
} from "@/lib/assets/actions";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;
  const user = await requirePermission(PERMISSIONS.ASSETS_WRITE);
  const audit = await getAudit(user.church_id, auditId);
  if (!audit) notFound();

  const items = await listAuditItems(user.church_id, auditId);
  const total = items.length;
  const checked = items.filter((i) => i.checked).length;
  const open = audit.status === "open";

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{audit.name}</h1>
        <span className="text-sm text-gray-500">
          {open ? "진행중" : "마감"} · {checked}/{total} 확인
        </span>
      </div>

      {open && (
        <div className="flex flex-wrap items-center gap-3">
          <form
            action={checkByTagAction.bind(null, auditId)}
            className="flex gap-2"
          >
            <input
              name="tag"
              placeholder="자산 태그 스캔/입력"
              className="rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/20 dark:bg-transparent"
            />
            <button className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background">
              확인
            </button>
          </form>
          <form action={closeAuditAction.bind(null, auditId)}>
            <button className="rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/20">
              조사 마감
            </button>
          </form>
        </div>
      )}

      <ul className="flex flex-col gap-1 text-sm">
        {items.map((i) => (
          <li
            key={i.itemId}
            className="flex items-center justify-between border-b border-black/5 py-1.5 dark:border-white/10"
          >
            <span>
              <span className={i.checked ? "text-green-600" : "text-gray-400"}>
                {i.checked ? "✓" : "○"}
              </span>{" "}
              {i.name}
              {i.tag && <span className="text-gray-500"> ({i.tag})</span>}
            </span>
            {open && (
              <form
                action={checkItemAction.bind(null, auditId, i.itemId, !i.checked)}
              >
                <button className="text-xs underline">
                  {i.checked ? "해제" : "확인"}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>

      {total > 0 && checked < total && (
        <p className="text-sm text-amber-600">
          미확인 {total - checked}건
        </p>
      )}

      <Link href="/assets/audits" className="text-sm underline">
        ← 전수조사 목록
      </Link>
    </section>
  );
}
