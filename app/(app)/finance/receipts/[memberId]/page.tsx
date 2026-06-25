import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/roles";
import { getTenant } from "@/lib/tenant/context";
import { memberAnnualGiving } from "@/lib/finance/receipts";
import { formatWon } from "@/lib/finance/constants";
import { PageTitle } from "@/lib/ui/page";
import { Button } from "@/lib/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/lib/ui/table";
import { PrintButton } from "../print-button";

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { memberId } = await params;
  const { year: yearParam } = await searchParams;
  const user = await requireUser();
  if (!hasPermission(user.roles, PERMISSIONS.FINANCE_READ)) redirect("/forbidden");

  const year = Number(yearParam) || new Date().getFullYear();
  const [data, tenant] = await Promise.all([
    memberAnnualGiving(user.church_id, memberId, year),
    getTenant(),
  ]);
  if (!data.member) notFound();

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <PageTitle>기부금영수증</PageTitle>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/finance/receipts?year=${year}`}>← 목록</Link>
          </Button>
          <PrintButton />
        </div>
      </div>

      <article className="flex flex-col gap-4 rounded-md border border-border p-6">
        <h2 className="text-center text-xl font-bold">기 부 금 영 수 증 ({year})</h2>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">성명</span> {data.member.name}</div>
          <div><span className="text-muted-foreground">생년월일</span> {data.member.birth ?? "—"}</div>
          <div className="col-span-2"><span className="text-muted-foreground">주소</span> {data.member.address ?? "—"}</div>
          <div className="col-span-2"><span className="text-muted-foreground">기부받은 단체</span> {tenant?.name ?? "—"}</div>
          <div className="col-span-2"><span className="text-muted-foreground">기부기간</span> {year}.01.01 ~ {year}.12.31</div>
        </div>

        <div className="text-center text-lg font-semibold">
          합계 금액: {formatWon(data.total)}
        </div>

        {data.items.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>일자</TableHead>
                  <TableHead>항목</TableHead>
                  <TableHead className="text-right tabular-nums">금액</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((it, i) => (
                  <TableRow key={i}>
                    <TableCell className="tabular-nums">{it.voucherDate}</TableCell>
                    <TableCell>{it.accountName ?? "헌금"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatWon(it.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          ※ 본 영수증은 교회 내부 발행용입니다. 국세청 연말정산 간소화 자료 제출은 별도 연동이 필요합니다(스펙 §14).
        </p>
      </article>
    </section>
  );
}
