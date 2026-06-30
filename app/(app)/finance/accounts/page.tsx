import Link from "next/link";
import { requireUser } from "@church/core/auth/session";
import { hasPermission, PERMISSIONS } from "@church/core/rbac/roles";
import { redirect } from "next/navigation";
import { listAccounts } from "@church/module-finance/accounts";
import { createAccountAction } from "@church/module-finance/actions";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  type AccountType,
} from "@church/module-finance/constants";

const input =
  "rounded-md border border-border px-3 py-2 text-sm dark:bg-transparent";

export default async function AccountsPage() {
  const user = await requireUser();
  if (!hasPermission(user.roles, PERMISSIONS.FINANCE_READ)) redirect("/forbidden");
  const canWrite = hasPermission(user.roles, PERMISSIONS.FINANCE_WRITE);
  const accounts = await listAccounts(user.church_id);

  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-bold">계정과목</h1>

      {canWrite && (
        <form action={createAccountAction} className="flex flex-wrap items-end gap-2">
          <input name="code" required placeholder="코드 (예: 101)" className={`${input} w-28`} />
          <input name="name" required placeholder="과목명 (예: 십일조)" className={`${input} flex-1`} />
          <select name="type" defaultValue="income" className={input}>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <button className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">추가</button>
        </form>
      )}

      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">계정과목이 없습니다.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="py-2">코드</th>
              <th className="py-2">과목명</th>
              <th className="py-2">구분</th>
              <th className="py-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.accountId} className="border-b border-border">
                <td className="py-2">{a.code}</td>
                <td className="py-2">{a.name}</td>
                <td className="py-2">{ACCOUNT_TYPE_LABELS[a.type as AccountType] ?? a.type}</td>
                <td className="py-2">{a.active ? "사용" : "미사용"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Link href="/finance" className="text-sm underline">← 재정</Link>
    </section>
  );
}
