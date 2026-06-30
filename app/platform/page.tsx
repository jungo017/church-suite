import { requirePlatformRole } from "@church/core/platform/guards";
import {
  listPlatformChurches,
  platformSummary,
} from "@church/core/platform/dashboard";
import { PLATFORM_ROLE_LABELS, type PlatformRole } from "@church/core/platform/roles";
import { PageHeader, PageTitle, PageDescription } from "@/lib/ui/page";
import { Card, CardContent } from "@/lib/ui/card";
import { Badge } from "@/lib/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/lib/ui/table";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
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
      <PageHeader>
        <div>
          <PageTitle>전체 시스템 관리</PageTitle>
          <PageDescription>
            {role ? PLATFORM_ROLE_LABELS[role] : "플랫폼 사용자"} · {user.name}
          </PageDescription>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Stat label="전체 교회" value={`${summary.churches}`} />
        <Stat label="활성 교회" value={`${summary.activeChurches}`} />
        <Stat label="교회 사용자" value={`${summary.users}`} />
        <Stat label="전체 교인" value={`${summary.members}`} />
        <Stat label="전체 비품" value={`${summary.assets}`} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">교회 목록</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>교회</TableHead>
                <TableHead>코드</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">사용자</TableHead>
                <TableHead className="text-right">교인</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {churches.map((church) => (
                <TableRow key={church.churchId}>
                  <TableCell className="font-medium">{church.name}</TableCell>
                  <TableCell className="font-mono text-xs">{church.code}</TableCell>
                  <TableCell>
                    <Badge tone={church.status === "active" ? "success" : "muted"}>
                      {church.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {church.users}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {church.members}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}
