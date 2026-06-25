import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/roles";
import { listOnlineOfferings } from "@/lib/site/offering";
import { listAccounts } from "@/lib/finance/accounts";
import { reflectOfferingAction } from "@/lib/site/actions";
import { formatWon } from "@/lib/finance/constants";
import { PageHeader, PageTitle } from "@/lib/ui/page";
import { EmptyState } from "@/lib/ui/empty-state";
import { Button } from "@/lib/ui/button";

const STATUS_LABELS: Record<string, string> = {
  pending: "대기",
  paid: "결제완료",
  reflected: "재정반영됨",
};

export default async function OfferingsAdminPage() {
  const user = await requireUser();
  if (!hasPermission(user.roles, PERMISSIONS.SITE_WRITE)) redirect("/forbidden");

  const [offerings, accounts] = await Promise.all([
    listOnlineOfferings(user.church_id),
    listAccounts(user.church_id, { type: "income", activeOnly: true }),
  ]);

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <PageHeader>
        <PageTitle>온라인 헌금 ({offerings.length})</PageTitle>
      </PageHeader>
      {offerings.length === 0 ? (
        <EmptyState title="접수된 온라인 헌금이 없습니다." />
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {offerings.map((o) => (
            <li key={o.offeringId} className="flex items-center justify-between gap-4 border-b border-border py-2">
              <div>
                <div className="font-medium">
                  {o.donorName ?? "익명"} · {formatWon(o.amount)}
                </div>
                <div className="text-muted-foreground">
                  {o.offeringKind ?? "헌금"} · {STATUS_LABELS[o.status] ?? o.status}
                </div>
              </div>
              {o.status === "paid" && accounts.length > 0 && (
                <form action={reflectOfferingAction.bind(null, o.offeringId)} className="flex shrink-0 gap-1">
                  <select name="accountId" required defaultValue="" className="rounded-md border border-border px-2 py-1 text-xs dark:bg-transparent">
                    <option value="" disabled>계정…</option>
                    {accounts.map((a) => (
                      <option key={a.accountId} value={a.accountId}>{a.code} {a.name}</option>
                    ))}
                  </select>
                  <Button type="submit" variant="outline" size="sm" className="text-info">재정 반영</Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      <Link href="/site" className="text-sm underline">← 홈페이지 관리</Link>
    </section>
  );
}
