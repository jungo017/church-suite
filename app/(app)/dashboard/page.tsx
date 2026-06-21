import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/roles";
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
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function DashboardPage() {
  const user = await requireUser();
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
      <h1 className="text-2xl font-bold">대시보드</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card title="재적 교인" value={`${counts.activeMembers}명`} href="/members" />
        <Card title="전체 교인" value={`${counts.members}명`} href="/members" />
        <Card title="자산" value={`${counts.assets}건`} href="/assets" />
        {canFinance && (
          <>
            <Card title={`${year} 수입`} value={formatWon(income)} href="/finance/report" />
            <Card title={`${year} 지출`} value={formatWon(expense)} href="/finance/report" />
            <Card title={`${year} 잔액`} value={formatWon(income - expense)} href="/finance" />
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">최근 출석</h2>
        {trend.length === 0 ? (
          <p className="text-sm text-gray-500">출석 데이터가 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {trend.map((t, i) => (
              <li key={i} className="flex justify-between border-b border-black/5 py-1 dark:border-white/10">
                <span>
                  {t.date} · {SERVICE_TYPE_LABELS[t.serviceType as ServiceType] ?? t.serviceType}
                </span>
                <span className="font-medium">{t.present}명</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
