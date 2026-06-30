import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@church/core/auth/session";
import { hasPermission, PERMISSIONS } from "@church/core/rbac/roles";
import { annualGivingByMember } from "@/lib/finance/receipts";
import { formatWon } from "@/lib/finance/constants";

const ctrl =
  "rounded-md border border-border px-3 py-1.5 text-sm dark:bg-transparent";

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
      <h1 className="text-2xl font-bold">기부금영수증</h1>

      <form className="flex items-end gap-2 text-sm">
        <label className="flex flex-col gap-1">
          연도
          <input name="year" type="number" defaultValue={year} className={ctrl} />
        </label>
        <button className={ctrl}>조회</button>
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{year}년 헌금 내역(헌금자 지정)이 없습니다.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="py-2">교인</th>
              <th className="py-2 text-right">건수</th>
              <th className="py-2 text-right">연간 합계</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.memberId} className="border-b border-border">
                <td className="py-2 font-medium">{r.name}</td>
                <td className="py-2 text-right text-muted-foreground">{r.cnt}건</td>
                <td className="py-2 text-right">{formatWon(r.total)}</td>
                <td className="py-2 text-right">
                  <Link
                    href={`/finance/receipts/${r.memberId}?year=${year}`}
                    className="text-xs underline"
                  >
                    영수증
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Link href="/finance" className="text-sm underline">← 재정</Link>
    </section>
  );
}
