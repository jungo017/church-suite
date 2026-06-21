import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { account } from "@/lib/db/schema";

/** 계정과목 서비스 (스펙 §7.3). 테넌트 스코프. */

export type AccountInput = {
  code: string;
  name: string;
  type?: string;
  active?: boolean;
};

export async function listAccounts(
  churchId: string,
  filters: { type?: string; activeOnly?: boolean } = {},
) {
  return withTenant(churchId, (tx) => {
    const conds = [eq(account.churchId, churchId)];
    if (filters.type) conds.push(eq(account.type, filters.type));
    if (filters.activeOnly) conds.push(eq(account.active, true));
    return tx
      .select()
      .from(account)
      .where(and(...conds))
      .orderBy(asc(account.code));
  });
}

export async function getAccount(churchId: string, accountId: string) {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select()
      .from(account)
      .where(and(eq(account.churchId, churchId), eq(account.accountId, accountId)))
      .limit(1),
  );
  return rows[0] ?? null;
}

export async function createAccount(
  churchId: string,
  input: AccountInput,
): Promise<{ accountId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(account)
      .values({
        churchId,
        code: input.code,
        name: input.name,
        type: input.type ?? "income",
        active: input.active ?? true,
      })
      .returning({ accountId: account.accountId });
    return { accountId: rows[0]!.accountId };
  });
}

export async function updateAccount(
  churchId: string,
  accountId: string,
  input: Partial<AccountInput>,
): Promise<void> {
  const set: Record<string, unknown> = {};
  for (const key of ["code", "name", "type", "active"] as const) {
    if (input[key] !== undefined) set[key] = input[key];
  }
  if (Object.keys(set).length === 0) return;
  await withTenant(churchId, (tx) =>
    tx
      .update(account)
      .set(set)
      .where(and(eq(account.churchId, churchId), eq(account.accountId, accountId))),
  );
}
