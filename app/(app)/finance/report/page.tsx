import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@church/core/auth/session";
import { hasPermission, PERMISSIONS } from "@church/core/rbac/roles";
import { accountSummary } from "@/lib/finance/report";
import { formatWon } from "@/lib/finance/constants";

const ctrl =
  "rounded-md border border-border px-3 py-1.5 text-sm dark:bg-transparent";

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
        <p className="text-sm text-muted-foreground">내역 없음</p>
      ) : (
        <table className="w-full text-left text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} className="border-b border-border">
                <td className="py-1.5">{r.code} {r.name}</td>
                <td className="py-1.5 text-right text-muted-foreground">{r.cnt}건</td>
                <td className="py-1.5 text-right font-medium">{formatWon(r.total)}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-2">합계</td>
              <td></td>
              <td className="py-2 text-right">{formatWon(sum)}</td>
            </tr>
          </tbody>
        </table>
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
      <h1 className="text-2xl font-bold">재정 보고서 (예·결산)</h1>

      <form className="flex flex-wrap items-end gap-2 text-sm">
        <input name="from" type="date" defaultValue={fromDate} className={ctrl} />
        <span className="self-center">~</span>
        <input name="to" type="date" defaultValue={toDate} className={ctrl} />
        <button className={ctrl}>조회</button>
      </form>

      <div className="flex gap-6 text-sm">
        <span>총수입 <strong className="text-blue-600">{formatWon(incomeTotal)}</strong></span>
        <span>총지출 <strong className="text-destructive">{formatWon(expenseTotal)}</strong></span>
        <span>잔액 <strong>{formatWon(incomeTotal - expenseTotal)}</strong></span>
      </div>

      <SummaryTable title="수입" rows={incomeRows} />
      <SummaryTable title="지출" rows={expenseRows} />

      <Link href="/finance" className="text-sm underline">← 재정</Link>
    </section>
  );
}
