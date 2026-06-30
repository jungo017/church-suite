import { redirect } from "next/navigation";
import { requireUser } from "@church/core/auth/session";
import { hasPermission, PERMISSIONS } from "@church/core/rbac/roles";
import { listVouchersPaged, voucherTotals } from "@/lib/finance/vouchers";
import { pageParams } from "@church/core/db/pagination";
import { Pagination } from "../pagination";
import {
  ACCOUNT_TYPE_LABELS,
  formatWon,
  type AccountType,
} from "@/lib/finance/constants";
import { deleteVoucherAction } from "@/lib/finance/actions";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    from?: string;
    to?: string;
    page?: string;
    size?: string;
  }>;
}) {
  const { type, from, to, page: pageParam, size } = await searchParams;
  const user = await requireUser();
  if (!hasPermission(user.roles, PERMISSIONS.FINANCE_READ)) redirect("/forbidden");
  const canWrite = hasPermission(user.roles, PERMISSIONS.FINANCE_WRITE);

  const filters = { type, from, to };
  const { page, pageSize } = pageParams({ page: pageParam, size });
  // 합계는 전체 필터 기준, 표는 페이지 단위
  const [totals, result] = await Promise.all([
    voucherTotals(user.church_id, filters),
    listVouchersPaged(user.church_id, filters, page, pageSize),
  ]);
  const vouchers = result.items;
  const income = totals.income;
  const expense = totals.expense;

  const ctrl =
    "rounded-md border border-border px-3 py-1.5 text-sm dark:bg-transparent";

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">재정</h1>

      <form className="flex flex-wrap items-end gap-2 text-sm">
        <select name="type" defaultValue={type ?? ""} className={ctrl}>
          <option value="">전체</option>
          <option value="income">수입</option>
          <option value="expense">지출</option>
        </select>
        <input name="from" type="date" defaultValue={from ?? ""} className={ctrl} />
        <input name="to" type="date" defaultValue={to ?? ""} className={ctrl} />
        <button className={ctrl}>조회</button>
      </form>

      <div className="flex gap-6 text-sm">
        <span>수입 합계 <strong className="text-blue-600">{formatWon(income)}</strong></span>
        <span>지출 합계 <strong className="text-destructive">{formatWon(expense)}</strong></span>
        <span>잔액 <strong>{formatWon(income - expense)}</strong></span>
      </div>

      {vouchers.length === 0 ? (
        <p className="py-8 text-sm text-muted-foreground">전표가 없습니다.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="py-2">일자</th>
              <th className="py-2">구분</th>
              <th className="py-2">계정</th>
              <th className="py-2">적요</th>
              <th className="py-2">헌금자</th>
              <th className="py-2 text-right">금액</th>
              {canWrite && <th className="py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.voucherId} className="border-b border-border">
                <td className="py-2">{v.voucherDate}</td>
                <td className="py-2">{ACCOUNT_TYPE_LABELS[v.type as AccountType] ?? v.type}</td>
                <td className="py-2">{v.accountName ?? "—"}</td>
                <td className="py-2">{v.summary ?? "—"}</td>
                <td className="py-2">{v.memberName ?? "—"}</td>
                <td className={`py-2 text-right ${v.type === "income" ? "text-blue-600" : "text-destructive"}`}>
                  {formatWon(v.amount)}
                </td>
                {canWrite && (
                  <td className="py-2 text-right">
                    <form action={deleteVoucherAction.bind(null, v.voucherId)}>
                      <button className="text-xs text-destructive">삭제</button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Pagination
        basePath="/finance"
        page={result.page}
        totalPages={result.totalPages}
        params={{ type, from, to }}
      />
    </section>
  );
}
