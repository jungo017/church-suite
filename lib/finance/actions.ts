"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { createAccount, updateAccount } from "./accounts";
import { isAccountType } from "./constants";

/** 재정 서버 액션 — 계정과목. finance:write 가드. */
async function requireWrite() {
  const res = await checkPermission(PERMISSIONS.FINANCE_WRITE);
  if (!res.ok) redirect(res.error === "unauthenticated" ? "/login" : "/forbidden");
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
