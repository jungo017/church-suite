import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { voucher, account, member } from "@church/core/db/schema";

/**
 * 기부금영수증 (스펙 §7.3). 교인별 연간 헌금(수입 전표, member 연동) 합산.
 * (국세청 전자제출 연동은 스펙 §14 — 추후. 여기서는 출력용 집계/문서.)
 */

export type AnnualGivingRow = {
  memberId: string;
  name: string;
  total: string;
  cnt: number;
};

export async function annualGivingByMember(
  churchId: string,
  year: number,
): Promise<AnnualGivingRow[]> {
  return withTenant(churchId, async (tx) => {
    const res = await tx.execute(sql`
      select
        m.member_id as "memberId",
        m.name as name,
        sum(v.amount)::text as total,
        count(*)::int as cnt
      from voucher v
      join member m on m.member_id = v.member_id
      where v.type = 'income'
        and extract(year from v.voucher_date) = ${year}
      group by m.member_id, m.name
      order by sum(v.amount) desc
    `);
    return res as unknown as AnnualGivingRow[];
  });
}

export type GivingItem = {
  voucherDate: string;
  accountName: string | null;
  amount: string;
};

export async function memberAnnualGiving(
  churchId: string,
  memberId: string,
  year: number,
): Promise<{
  member: { name: string; birth: string | null; address: string | null } | null;
  total: number;
  items: GivingItem[];
}> {
  return withTenant(churchId, async (tx) => {
    const m = await tx
      .select({ name: member.name, birth: member.birth, address: member.address })
      .from(member)
      .where(and(eq(member.churchId, churchId), eq(member.memberId, memberId)))
      .limit(1);

    const items = (await tx
      .select({
        voucherDate: voucher.voucherDate,
        accountName: account.name,
        amount: voucher.amount,
      })
      .from(voucher)
      .leftJoin(account, eq(voucher.accountId, account.accountId))
      .where(
        and(
          eq(voucher.churchId, churchId),
          eq(voucher.memberId, memberId),
          eq(voucher.type, "income"),
          sql`extract(year from ${voucher.voucherDate}) = ${year}`,
        ),
      )
      .orderBy(asc(voucher.voucherDate))) as GivingItem[];

    const total = items.reduce((s, it) => s + Number(it.amount), 0);
    return { member: m[0] ?? null, total, items };
  });
}
