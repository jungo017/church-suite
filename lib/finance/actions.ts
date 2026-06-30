"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPermission } from "@church/core/rbac/guards";
import { requireModuleWrite } from "@/lib/billing/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import { createAccount, updateAccount } from "./accounts";
import { createVoucher, deleteVoucher } from "./vouchers";
import { isAccountType, isPaymentMethod } from "./constants";

/** 재정 서버 액션 — 계정과목. finance:write 가드. */
async function requireWrite() {
  const res = await checkPermission(PERMISSIONS.FINANCE_WRITE);
  if (!res.ok) redirect(res.error === "unauthenticated" ? "/login" : "/forbidden");
  await requireModuleWrite(res.user.church_id, "finance");
  return res.user;
}

function str(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  return v == null || String(v).trim() === "" ? null : String(v).trim();
}

export async function createAccountAction(fd: FormData) {
  const user = await requireWrite();
  const code = str(fd, "code");
  const name = str(fd, "name");
  if (!code || !name) throw new Error("missing_fields");
  const type = str(fd, "type");
  await createAccount(user.church_id, {
    code,
    name,
    type: type && isAccountType(type) ? type : "income",
  });
  revalidatePath("/finance/accounts");
}

export async function updateAccountAction(accountId: string, fd: FormData) {
  const user = await requireWrite();
  const active = str(fd, "active");
  await updateAccount(user.church_id, accountId, {
    active: active === "true",
  });
  revalidatePath("/finance/accounts");
}

// ── 전표 ──
export async function createVoucherAction(fd: FormData) {
  const user = await requireWrite();
  const voucherDate = str(fd, "voucherDate");
  const accountId = str(fd, "accountId");
  const amountRaw = str(fd, "amount");
  if (!voucherDate || !accountId || !amountRaw) throw new Error("missing_fields");
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("invalid_amount");
  const type = str(fd, "type") === "expense" ? "expense" : "income";
  const method = str(fd, "method");
  await createVoucher(user.church_id, {
    voucherDate,
    type,
    accountId,
    memberId: str(fd, "memberId"),
    amount: amountRaw,
    method: method && isPaymentMethod(method) ? method : null,
    summary: str(fd, "summary"),
    note: str(fd, "note"),
  });
  revalidatePath("/finance");
  redirect("/finance");
}

export async function deleteVoucherAction(voucherId: string) {
  const user = await requireWrite();
  await deleteVoucher(user.church_id, voucherId);
  revalidatePath("/finance");
}
