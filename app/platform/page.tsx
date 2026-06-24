import { requirePlatformRole } from "@/lib/platform/guards";
import {
  listPlatformChurches,
  platformSummary,
} from "@/lib/platform/dashboard";
import { PLATFORM_ROLE_LABELS, type PlatformRole } from "@/lib/platform/roles";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

export default async function PlatformDashboardPage() {
  const user = await requirePlatformRole();
  const [summary, churches] = await Promise.all([
    platformSummary(),
    listPlatformChurches(),
  ]);
  const role = user.roles.find((r): r is PlatformRole => r in PLATFORM_ROLE_LABELS);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-8">
      <div>
        <p className="text-sm text-muted-foreground">
          {role ? PLATFORM_ROLE_LABELS[role] : "플랫폼 사용자"} · {user.name}
        </p>
        <h1 className="text-2xl font-bold">전체 시스템 관리</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Stat label="전체 교회" value={`${summary.churches}`} />
        <Stat label="활성 교회" value={`${summary.activeChurches}`} />
        <Stat label="교회 사용자" value={`${summary.users}`} />
        <Stat label="전체 교인" value={`${summary.members}`} />
        <Stat label="전체 비품" value={`${summary.assets}`} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">교회 목록</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2">교회</th>
              <th className="py-2">코드</th>
              <th className="py-2">상태</th>
              <th className="py-2 text-right">사용자</th>
              <th className="py-2 text-right">교인</th>
            </tr>
          </thead>
          <tbody>
            {churches.map((church) => (
              <tr key={church.churchId} className="border-b border-border">
                <td className="py-2 font-medium">{church.name}</td>
                <td className="py-2 font-mono text-xs">{church.code}</td>
                <td className="py-2">{church.status}</td>
                <td className="py-2 text-right">{church.users}</td>
                <td className="py-2 text-right">{church.members}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
