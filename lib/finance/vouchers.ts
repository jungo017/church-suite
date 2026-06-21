import "server-only";
import { and, count, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { voucher, account, member } from "@/lib/db/schema";
import { toPaged, type Paged } from "@/lib/db/pagination";

/** 전표 서비스 (스펙 §7.3, 단식). 테넌트 스코프. 금액 numeric. */

export type VoucherInput = {
  voucherDate: string;
  type: string; // income | expense
  accountId: string;
  memberId?: string | null;
  amount: string; // numeric as string
  method?: string | null;
  summary?: string | null;
  note?: string | null;
};

export type VoucherFilters = {
  type?: string;
  accountId?: string;
  memberId?: string;
  from?: string;
  to?: string;
};

export async function listVouchers(
  churchId: string,
  filters: VoucherFilters = {},
) {
  return withTenant(churchId, (tx) => {
    const conds = [eq(voucher.churchId, churchId)];
    if (filters.type) conds.push(eq(voucher.type, filters.type));
    if (filters.accountId) conds.push(eq(voucher.accountId, filters.accountId));
    if (filters.memberId) conds.push(eq(voucher.memberId, filters.memberId));
    if (filters.from) conds.push(gte(voucher.voucherDate, filters.from));
    if (filters.to) conds.push(lte(voucher.voucherDate, filters.to));
    return tx
      .select({
        voucherId: voucher.voucherId,
        voucherDate: voucher.voucherDate,
        type: voucher.type,
        amount: voucher.amount,
        method: voucher.method,
        summary: voucher.summary,
        accountName: account.name,
        accountCode: account.code,
        memberName: member.name,
      })
      .from(voucher)
      .leftJoin(account, eq(voucher.accountId, account.accountId))
      .leftJoin(member, eq(voucher.memberId, member.memberId))
      .where(and(...conds))
      .orderBy(desc(voucher.voucherDate));
  });
}

function voucherConds(churchId: string, filters: VoucherFilters): SQL[] {
  const conds: SQL[] = [eq(voucher.churchId, churchId)];
  if (filters.type) conds.push(eq(voucher.type, filters.type));
  if (filters.accountId) conds.push(eq(voucher.accountId, filters.accountId));
  if (filters.memberId) conds.push(eq(voucher.memberId, filters.memberId));
  if (filters.from) conds.push(gte(voucher.voucherDate, filters.from));
  if (filters.to) conds.push(lte(voucher.voucherDate, filters.to));
  return conds;
}

type VoucherRow = Awaited<ReturnType<typeof listVouchers>>[number];

/** 페이지 단위 전표 목록(대량 데이터). */
export async function listVouchersPaged(
  churchId: string,
  filters: VoucherFilters,
  page: number,
  pageSize: number,
): Promise<Paged<VoucherRow>> {
  return withTenant(churchId, async (tx) => {
    const where = and(...voucherConds(churchId, filters));
    const items = await tx
      .select({
        voucherId: voucher.voucherId,
        voucherDate: voucher.voucherDate,
        type: voucher.type,
        amount: voucher.amount,
        method: voucher.method,
        summary: voucher.summary,
        accountName: account.name,
        accountCode: account.code,
        memberName: member.name,
      })
      .from(voucher)
      .leftJoin(account, eq(voucher.accountId, account.accountId))
      .leftJoin(member, eq(voucher.memberId, member.memberId))
      .where(where)
      .orderBy(desc(voucher.voucherDate))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    const c = await tx.select({ n: count() }).from(voucher).where(where);
    return toPaged(items, Number(c[0]?.n ?? 0), page, pageSize);
  });
}

/** 필터 전체에 대한 수입/지출 합계(페이지와 무관). */
export async function voucherTotals(
  churchId: string,
  filters: VoucherFilters = {},
): Promise<{ income: number; expense: number }> {
  return withTenant(churchId, async (tx) => {
    const where = and(...voucherConds(churchId, filters));
    const rows = await tx
      .select({
        income: sql<string>`coalesce(sum(${voucher.amount}) filter (where ${voucher.type} = 'income'), 0)::text`,
        expense: sql<string>`coalesce(sum(${voucher.amount}) filter (where ${voucher.type} = 'expense'), 0)::text`,
      })
      .from(voucher)
      .where(where);
    return {
      income: Number(rows[0]?.income ?? 0),
      expense: Number(rows[0]?.expense ?? 0),
    };
  });
}

export async function getVoucher(churchId: string, voucherId: string) {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select()
      .from(voucher)
      .where(and(eq(voucher.churchId, churchId), eq(voucher.voucherId, voucherId)))
      .limit(1),
  );
  return rows[0] ?? null;
}

export async function createVoucher(
  churchId: string,
  input: VoucherInput,
): Promise<{ voucherId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(voucher)
      .values({
        churchId,
        voucherDate: input.voucherDate,
        type: input.type,
        accountId: input.accountId,
        memberId: input.memberId ?? null,
        amount: input.amount,
        method: input.method ?? null,
        summary: input.summary ?? null,
        note: input.note ?? null,
      })
      .returning({ voucherId: voucher.voucherId });
    return { voucherId: rows[0]!.voucherId };
  });
}

export async function deleteVoucher(
  churchId: string,
  voucherId: string,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .delete(voucher)
      .where(and(eq(voucher.churchId, churchId), eq(voucher.voucherId, voucherId))),
  );
}
