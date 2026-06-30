import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@church/core/auth/session";
import { hasPermission, PERMISSIONS } from "@church/core/rbac/roles";
import { listNewFamilyReqs } from "@church/module-site/intake";
import {
  approveNewFamilyAction,
  rejectNewFamilyAction,
} from "@church/module-site/actions";

const STATUS_LABELS: Record<string, string> = {
  pending: "대기",
  approved: "승인(교인전환)",
  rejected: "거절",
};

export default async function NewFamilyAdminPage() {
  const user = await requireUser();
  if (!hasPermission(user.roles, PERMISSIONS.SITE_WRITE)) redirect("/forbidden");
  const reqs = await listNewFamilyReqs(user.church_id);

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">새가족 신청 ({reqs.length})</h1>
      {reqs.length === 0 ? (
        <p className="text-sm text-muted-foreground">신청이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {reqs.map((r) => (
            <li key={r.reqId} className="flex items-start justify-between gap-4 border-b border-border py-2">
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-muted-foreground">
                  {r.phone ?? ""} {r.email ?? ""}
                </div>
                {r.message && <div className="text-muted-foreground">{r.message}</div>}
                <div className="text-xs text-muted-foreground">{STATUS_LABELS[r.status] ?? r.status}</div>
              </div>
              {r.status === "pending" && (
                <div className="flex shrink-0 gap-2">
                  <form action={approveNewFamilyAction.bind(null, r.reqId)}>
                    <button className="rounded-md border border-success/40 px-2 py-1 text-xs text-success">승인</button>
                  </form>
                  <form action={rejectNewFamilyAction.bind(null, r.reqId)}>
                    <button className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive">거절</button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Link href="/site" className="text-sm underline">← 홈페이지 관리</Link>
    </section>
  );
}
