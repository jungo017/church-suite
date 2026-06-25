import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Plus, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/roles";
import { listVouchersPaged, voucherTotals } from "@/lib/finance/vouchers";
import { pageParams } from "@/lib/db/pagination";
import { Pagination } from "../pagination";
import { PageHeader, PageTitle, PageActions } from "@/lib/ui/page";
import { FilterBar } from "@/lib/ui/filter-bar";
import { Input, Select } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";
import { Badge } from "@/lib/ui/badge";
import { EmptyState } from "@/lib/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/lib/ui/table";
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
  const filtered = Boolean(type || from || to);

  return (
    <section className="flex flex-col gap-4">
      <PageHeader>
        <PageTitle>재정</PageTitle>
        {canWrite && (
          <PageActions>
            <Button asChild>
              <Link href="/finance/new">
                <Plus />
                전표 등록
              </Link>
            </Button>
          </PageActions>
        )}
      </PageHeader>

      <FilterBar>
        <Select name="type" defaultValue={type ?? ""} className="w-auto">
          <option value="">전체</option>
          <option value="income">수입</option>
          <option value="expense">지출</option>
        </Select>
        <Input name="from" type="date" defaultValue={from ?? ""} className="w-auto" />
        <Input name="to" type="date" defaultValue={to ?? ""} className="w-auto" />
        <Button type="submit" variant="outline">
          <Search />
          조회
        </Button>
        {filtered && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/finance">초기화</Link>
          </Button>
        )}
      </FilterBar>

      {/* 수입/지출/잔액 — 색상만이 아니라 라벨로 의미를 명확히(§9.1) */}
      <div className="flex flex-wrap gap-6 text-sm">
        <span>
          수입 합계{" "}
          <strong className="tabular-nums text-info">{formatWon(income)}</strong>
        </span>
        <span>
          지출 합계{" "}
          <strong className="tabular-nums text-destructive">
            {formatWon(expense)}
          </strong>
        </span>
        <span>
          잔액 <strong className="tabular-nums">{formatWon(income - expense)}</strong>
        </span>
      </div>

      {vouchers.length === 0 ? (
        <EmptyState
          title="전표가 없습니다"
          description={
            filtered
              ? "조회 조건에 맞는 전표가 없습니다."
              : "수입·지출 전표를 등록하면 예결산 보고서와 기부금영수증을 만들 수 있습니다."
          }
          action={
            canWrite && !filtered ? (
              <Button asChild>
                <Link href="/finance/new">
                  <Plus />
                  전표 등록
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>일자</TableHead>
                <TableHead>구분</TableHead>
                <TableHead>계정</TableHead>
                <TableHead>적요</TableHead>
                <TableHead>헌금자</TableHead>
                <TableHead className="text-right">금액</TableHead>
                {canWrite && <TableHead className="text-right">관리</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.map((v) => (
                <TableRow key={v.voucherId}>
                  <TableCell className="tabular-nums">{v.voucherDate}</TableCell>
                  <TableCell>
                    <Badge tone={v.type === "income" ? "info" : "muted"}>
                      {ACCOUNT_TYPE_LABELS[v.type as AccountType] ?? v.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{v.accountName ?? "—"}</TableCell>
                  <TableCell>{v.summary ?? "—"}</TableCell>
                  <TableCell>{v.memberName ?? "—"}</TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${
                      v.type === "income" ? "text-info" : "text-destructive"
                    }`}
                  >
                    {formatWon(v.amount)}
                  </TableCell>
                  {canWrite && (
                    <TableCell className="text-right">
                      <form action={deleteVoucherAction.bind(null, v.voucherId)}>
                        <Button type="submit" variant="destructive" size="sm">
                          <Trash2 />
                          삭제
                        </Button>
                      </form>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
