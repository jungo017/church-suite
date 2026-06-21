import Link from "next/link";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { listAccounts } from "@/lib/finance/accounts";
import { listMembers } from "@/lib/members/service";
import { createVoucherAction } from "@/lib/finance/actions";
import {
  ACCOUNT_TYPE_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type AccountType,
} from "@/lib/finance/constants";

const input =
  "rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent";
const label = "flex flex-col gap-1 text-sm";

export default async function NewVoucherPage() {
  const user = await requirePermission(PERMISSIONS.FINANCE_WRITE);
  const [accounts, members] = await Promise.all([
    listAccounts(user.church_id, { activeOnly: true }),
    listMembers(user.church_id, { status: "active" }),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-bold">전표 등록</h1>

      {accounts.length === 0 ? (
        <p className="text-sm text-amber-600">
          먼저 <Link href="/finance/accounts" className="underline">계정과목</Link>을 등록하세요.
        </p>
      ) : (
        <form action={createVoucherAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className={label}>
              일자 *
              <input name="voucherDate" type="date" required defaultValue={today} className={input} />
            </label>
            <label className={label}>
              구분
              <select name="type" defaultValue="income" className={input}>
                <option value="income">수입</option>
                <option value="expense">지출</option>
              </select>
            </label>
          </div>

          <label className={label}>
            계정과목 *
            <select name="accountId" required defaultValue="" className={input}>
              <option value="" disabled>선택…</option>
              {accounts.map((a) => (
                <option key={a.accountId} value={a.accountId}>
                  [{ACCOUNT_TYPE_LABELS[a.type as AccountType] ?? a.type}] {a.code} {a.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className={label}>
              금액(원) *
              <input name="amount" type="number" min="1" step="1" required className={input} />
            </label>
            <label className={label}>
              결제수단
              <select name="method" defaultValue="" className={input}>
                <option value="">(선택)</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
                ))}
              </select>
            </label>
          </div>

          <label className={label}>
            헌금자 (수입 시, 기부금영수증 연동)
            <select name="memberId" defaultValue="" className={input}>
              <option value="">(없음)</option>
              {members.map((m) => (
                <option key={m.memberId} value={m.memberId}>{m.name}</option>
              ))}
            </select>
          </label>

          <label className={label}>
            적요
            <input name="summary" className={input} />
          </label>
          <label className={label}>
            비고
            <textarea name="note" rows={2} className={input} />
          </label>

          <button type="submit" className="w-fit rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
            등록
          </button>
        </form>
      )}

      <Link href="/finance" className="text-sm underline">← 재정</Link>
    </section>
  );
}
