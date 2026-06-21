import "server-only";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { voucher, account, member } from "@/lib/db/schema";

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
