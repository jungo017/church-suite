import Link from "next/link";
import { Search } from "lucide-react";
import { redirect } from "next/navigation";
import { requireUser } from "@church/core/auth/session";
import { hasPermission, PERMISSIONS } from "@church/core/rbac/roles";
import { annualGivingByMember } from "@church/module-finance/receipts";
import { formatWon } from "@church/module-finance/constants";
import { PageHeader, PageTitle } from "@/lib/ui/page";
import { FilterBar } from "@/lib/ui/filter-bar";
import { Input, Label } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";
import { EmptyState } from "@/lib/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/lib/ui/table";

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const user = await requireUser();
  if (!hasPermission(user.roles, PERMISSIONS.FINANCE_READ)) redirect("/forbidden");

  const year = Number(yearParam) || new Date().getFullYear();
  const rows = await annualGivingByMember(user.church_id, year);

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <PageHeader>
        <PageTitle>기부금영수증</PageTitle>
      </PageHeader>

      <FilterBar>
        <Label>
          연도
          <Input name="year" type="number" defaultValue={year} className="w-auto" />
        </Label>
        <Button type="submit" variant="outline">
          <Search />
          조회
        </Button>
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState
          title="헌금 내역이 없습니다"
          description={`${year}년 헌금 내역(헌금자 지정)이 없습니다. 전표에 헌금자를 지정하면 영수증을 발급할 수 있습니다.`}
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>교인</TableHead>
                <TableHead className="text-right tabular-nums">건수</TableHead>
                <TableHead className="text-right tabular-nums">연간 합계</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.memberId}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{r.cnt}건</TableCell>
                  <TableCell className="text-right tabular-nums">{formatWon(r.total)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/finance/receipts/${r.memberId}?year=${year}`}>
                        영수증
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Link href="/finance" className="text-sm text-muted-foreground hover:underline">← 재정</Link>
    </section>
  );
}
