import Link from "next/link";
import { Search } from "lucide-react";
import { redirect } from "next/navigation";
import { requireUser } from "@church/core/auth/session";
import { hasPermission, PERMISSIONS } from "@church/core/rbac/roles";
import { accountSummary } from "@church/module-finance/report";
import { formatWon } from "@church/module-finance/constants";
import { PageHeader, PageTitle } from "@/lib/ui/page";
import { FilterBar } from "@/lib/ui/filter-bar";
import { Input } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";
import { EmptyState } from "@/lib/ui/empty-state";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@/lib/ui/table";

function SummaryTable({
  title,
  rows,
}: {
  title: string;
  rows: { code: string; name: string; total: string; cnt: number }[];
}) {
  const sum = rows.reduce((s, r) => s + Number(r.total), 0);
  return (
    <div className="flex flex-col gap-1">
      <h2 className="font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <EmptyState title="내역 없음" description="조회 기간에 해당하는 내역이 없습니다." />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.code}>
                  <TableCell>{r.code} {r.name}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{r.cnt}건</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatWon(r.total)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell>합계</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right tabular-nums">{formatWon(sum)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default async function FinanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const user = await requireUser();
  if (!hasPermission(user.roles, PERMISSIONS.FINANCE_READ)) redirect("/forbidden");

  const year = new Date().getFullYear();
  const fromDate = from ?? `${year}-01-01`;
  const toDate = to ?? `${year}-12-31`;

  const summary = await accountSummary(user.church_id, fromDate, toDate);
  const incomeRows = summary.filter((r) => r.type === "income");
  const expenseRows = summary.filter((r) => r.type === "expense");
  const incomeTotal = incomeRows.reduce((s, r) => s + Number(r.total), 0);
  const expenseTotal = expenseRows.reduce((s, r) => s + Number(r.total), 0);

  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <PageHeader>
        <PageTitle>재정 보고서 (예·결산)</PageTitle>
      </PageHeader>

      <FilterBar>
        <Input name="from" type="date" defaultValue={fromDate} className="w-auto" />
        <span className="self-center">~</span>
        <Input name="to" type="date" defaultValue={toDate} className="w-auto" />
        <Button type="submit" variant="outline">
          <Search />
          조회
        </Button>
      </FilterBar>

      <div className="flex flex-wrap gap-6 text-sm">
        <span>총수입 <strong className="tabular-nums text-info">{formatWon(incomeTotal)}</strong></span>
        <span>총지출 <strong className="tabular-nums text-destructive">{formatWon(expenseTotal)}</strong></span>
        <span>잔액 <strong className="tabular-nums">{formatWon(incomeTotal - expenseTotal)}</strong></span>
      </div>

      <SummaryTable title="수입" rows={incomeRows} />
      <SummaryTable title="지출" rows={expenseRows} />

      <Link href="/finance" className="text-sm text-muted-foreground hover:underline">← 재정</Link>
    </section>
  );
}
