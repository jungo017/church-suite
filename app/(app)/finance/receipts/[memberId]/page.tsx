import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@church/core/auth/session";
import { hasPermission, PERMISSIONS } from "@church/core/rbac/roles";
import { getTenant } from "@church/core/tenant/context";
import { memberAnnualGiving } from "@church/module-finance/receipts";
import { formatWon } from "@church/module-finance/constants";
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
        <h1 className="text-2xl font-bold">기부금영수증</h1>
        <div className="flex gap-2">
          <Link href={`/finance/receipts?year=${year}`} className="rounded-md border border-border px-3 py-1.5 text-sm">← 목록</Link>
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
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="py-1.5">일자</th>
                <th className="py-1.5">항목</th>
                <th className="py-1.5 text-right">금액</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((it, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-1.5">{it.voucherDate}</td>
                  <td className="py-1.5">{it.accountName ?? "헌금"}</td>
                  <td className="py-1.5 text-right">{formatWon(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="text-xs text-muted-foreground">
          ※ 본 영수증은 교회 내부 발행용입니다. 국세청 연말정산 간소화 자료 제출은 별도 연동이 필요합니다(스펙 §14).
        </p>
      </article>
    </section>
  );
}
