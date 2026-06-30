import "server-only";
import { sql } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";

/**
 * 재정 보고서 — 기간 집계 (스펙 §7.3, §4: 복잡 집계는 raw SQL).
 * RLS(withTenant) 스코프 안에서 실행되므로 account/voucher 는 해당 교회로 한정된다.
 */

export type AccountSummaryRow = {
  type: string;
  code: string;
  name: string;
  total: string; // numeric as string
  cnt: number;
};

export async function accountSummary(
  churchId: string,
  from: string,
  to: string,
): Promise<AccountSummaryRow[]> {
  return withTenant(churchId, async (tx) => {
    const res = await tx.execute(sql`
      select
        a.type as type,
        a.code as code,
        a.name as name,
        coalesce(sum(v.amount), 0)::text as total,
        count(v.voucher_id)::int as cnt
      from account a
      left join voucher v
        on v.account_id = a.account_id
       and v.voucher_date >= ${from}
       and v.voucher_date <= ${to}
      group by a.account_id, a.type, a.code, a.name
      having count(v.voucher_id) > 0
      order by a.type, a.code
    `);
    return res as unknown as AccountSummaryRow[];
  });
}

export type MonthlyRow = { ym: string; type: string; total: string };

export async function monthlyTotals(
  churchId: string,
  year: number,
): Promise<MonthlyRow[]> {
  return withTenant(churchId, async (tx) => {
    const res = await tx.execute(sql`
      select
        to_char(voucher_date, 'YYYY-MM') as ym,
        type,
        sum(amount)::text as total
      from voucher
      where extract(year from voucher_date) = ${year}
      group by 1, 2
      order by 1, 2
    `);
    return res as unknown as MonthlyRow[];
  });
}
