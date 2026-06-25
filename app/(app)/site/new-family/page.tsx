import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/roles";
import { listNewFamilyReqs } from "@/lib/site/intake";
import {
  approveNewFamilyAction,
  rejectNewFamilyAction,
} from "@/lib/site/actions";
import { PageHeader, PageTitle } from "@/lib/ui/page";
import { EmptyState } from "@/lib/ui/empty-state";
import { Button } from "@/lib/ui/button";

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
      <PageHeader>
        <PageTitle>새가족 신청 ({reqs.length})</PageTitle>
      </PageHeader>
      {reqs.length === 0 ? (
        <EmptyState title="신청이 없습니다." />
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
                    <Button type="submit" variant="outline" size="sm" className="text-success">승인</Button>
                  </form>
                  <form action={rejectNewFamilyAction.bind(null, r.reqId)}>
                    <Button type="submit" variant="destructive" size="sm">거절</Button>
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
