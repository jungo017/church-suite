import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/roles";
import { dashboardCounts } from "@/lib/dashboard";
import { attendanceTrend } from "@/lib/members/stats";
import { accountSummary } from "@/lib/finance/report";
import { formatWon } from "@/lib/finance/constants";
import { SERVICE_TYPE_LABELS, type ServiceType } from "@/lib/members/constants";
import { PageHeader, PageTitle } from "@/lib/ui/page";
import { Card, CardContent } from "@/lib/ui/card";
import { EmptyState } from "@/lib/ui/empty-state";

function StatCard({
  title,
  value,
  href,
}: {
  title: string;
  value: string;
  href?: string;
}) {
  const body = (
    <Card className="transition-colors hover:bg-muted">
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function DashboardPage() {
  const user = await requireUser();
  // 관리 권한이 전혀 없는 교인 역할은 셀프 포털로
  const isStaff =
    hasPermission(user.roles, PERMISSIONS.MEMBERS_READ) ||
    hasPermission(user.roles, PERMISSIONS.FINANCE_READ) ||
    hasPermission(user.roles, PERMISSIONS.ASSETS_READ);
  if (!isStaff) redirect("/my");

  const counts = await dashboardCounts(user.church_id);
  const trend = await attendanceTrend(user.church_id, 3);

  const canFinance = hasPermission(user.roles, PERMISSIONS.FINANCE_READ);
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
      <PageHeader>
        <PageTitle>대시보드</PageTitle>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard title="재적 교인" value={`${counts.activeMembers}명`} href="/members" />
        <StatCard title="전체 교인" value={`${counts.members}명`} href="/members" />
        <StatCard title="자산" value={`${counts.assets}건`} href="/assets" />
        {canFinance && (
          <>
            <StatCard title={`${year} 수입`} value={formatWon(income)} href="/finance/report" />
            <StatCard title={`${year} 지출`} value={formatWon(expense)} href="/finance/report" />
            <StatCard title={`${year} 잔액`} value={formatWon(income - expense)} href="/finance" />
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">최근 출석</h2>
        {trend.length === 0 ? (
          <EmptyState
            title="출석 데이터가 없습니다"
            description="출석을 기록하면 최근 추이가 여기에 표시됩니다."
          />
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {trend.map((t, i) => (
              <li key={i} className="flex justify-between border-b border-border py-1">
                <span>
                  {t.date} · {SERVICE_TYPE_LABELS[t.serviceType as ServiceType] ?? t.serviceType}
                </span>
                <span className="font-medium tabular-nums">{t.present}명</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
