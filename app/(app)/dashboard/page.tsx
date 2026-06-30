import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@church/core/auth/session";
import { hasPermission, PERMISSIONS } from "@church/core/rbac/roles";
import { getInstalledModules } from "@/lib/billing/entitlement";
import { dashboardCounts } from "@/lib/dashboard";
import { attendanceTrend } from "@/lib/members/stats";
import { accountSummary } from "@/lib/finance/report";
import { formatWon } from "@/lib/finance/constants";
import { SERVICE_TYPE_LABELS, type ServiceType } from "@/lib/members/constants";

function Card({
  title,
  value,
  href,
}: {
  title: string;
  value: string;
  href?: string;
}) {
  const body = (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function DashboardPage() {
  const user = await requireUser();
  // 카드 노출 = 설치 모듈(엔타이틀먼트) ∩ 읽기 권한(RBAC). 둘 다 통과해야 표시(M3).
  const installed = await getInstalledModules(user.church_id);
  const canMembers =
    installed.has("members") && hasPermission(user.roles, PERMISSIONS.MEMBERS_READ);
  const canAssets =
    installed.has("assets") && hasPermission(user.roles, PERMISSIONS.ASSETS_READ);
  const canFinance =
    installed.has("finance") && hasPermission(user.roles, PERMISSIONS.FINANCE_READ);
  // 표시할 카드가 전혀 없는(설치/권한 모두 없는) 교인 역할은 셀프 포털로
  if (!canMembers && !canAssets && !canFinance) redirect("/my");

  const counts = await dashboardCounts(user.church_id);
  const trend = canMembers ? await attendanceTrend(user.church_id, 3) : [];

  const year = new Date().getFullYear();
  const fin = canFinance
    ? await accountSummary(user.church_id, `${year}-01-01`, `${year}-12-31`)
    : [];
  const income = fin
    .filter((r) => r.type === "income")
    .reduce((s, r) => s + Number(r.total), 0);
  const expense = fin
    .filter((r) => r.type === "expense")
    .reduce((s, r) => s + Number(r.total), 0);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {canMembers && (
          <>
            <Card title="재적 교인" value={`${counts.activeMembers}명`} href="/members" />
            <Card title="전체 교인" value={`${counts.members}명`} href="/members" />
          </>
        )}
        {canAssets && (
          <Card title="자산" value={`${counts.assets}건`} href="/assets" />
        )}
        {canFinance && (
          <>
            <Card title={`${year} 수입`} value={formatWon(income)} href="/finance/report" />
            <Card title={`${year} 지출`} value={formatWon(expense)} href="/finance/report" />
            <Card title={`${year} 잔액`} value={formatWon(income - expense)} href="/finance" />
          </>
        )}
      </div>

      {canMembers && (
      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">최근 출석</h2>
        {trend.length === 0 ? (
          <p className="text-sm text-muted-foreground">출석 데이터가 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {trend.map((t, i) => (
              <li key={i} className="flex justify-between border-b border-border py-1">
                <span>
                  {t.date} · {SERVICE_TYPE_LABELS[t.serviceType as ServiceType] ?? t.serviceType}
                </span>
                <span className="font-medium">{t.present}명</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      )}
    </section>
  );
}
