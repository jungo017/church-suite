import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { listAccounts } from "@/lib/finance/accounts";
import { listMembers } from "@/lib/members/service";
import { createVoucherAction } from "@/lib/finance/actions";
import { PageHeader, PageTitle } from "@/lib/ui/page";
import { Field, FieldLabel, Input, Select, Textarea } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";
import {
  ACCOUNT_TYPE_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type AccountType,
} from "@/lib/finance/constants";

export default async function NewVoucherPage() {
  const user = await requirePermission(PERMISSIONS.FINANCE_WRITE);
  const [accounts, members] = await Promise.all([
    listAccounts(user.church_id, { activeOnly: true }),
    listMembers(user.church_id, { status: "active" }),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="flex max-w-xl flex-col gap-6">
      <PageHeader>
        <PageTitle>전표 등록</PageTitle>
      </PageHeader>

      {accounts.length === 0 ? (
        <p className="text-sm text-warning">
          먼저 <Link href="/finance/accounts" className="underline">계정과목</Link>을 등록하세요.
        </p>
      ) : (
        <form action={createVoucherAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="voucherDate" required>일자</FieldLabel>
              <Input id="voucherDate" name="voucherDate" type="date" required defaultValue={today} />
            </Field>
            <Field>
              <FieldLabel htmlFor="type">구분</FieldLabel>
              <Select id="type" name="type" defaultValue="income">
                <option value="income">수입</option>
                <option value="expense">지출</option>
              </Select>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="accountId" required>계정과목</FieldLabel>
            <Select id="accountId" name="accountId" required defaultValue="">
              <option value="" disabled>선택…</option>
              {accounts.map((a) => (
                <option key={a.accountId} value={a.accountId}>
                  [{ACCOUNT_TYPE_LABELS[a.type as AccountType] ?? a.type}] {a.code} {a.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="amount" required>금액(원)</FieldLabel>
              <Input id="amount" name="amount" type="number" inputMode="numeric" min="1" step="1" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="method">결제수단</FieldLabel>
              <Select id="method" name="method" defaultValue="">
                <option value="">(선택)</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="memberId">헌금자 (수입 시, 기부금영수증 연동)</FieldLabel>
            <Select id="memberId" name="memberId" defaultValue="">
              <option value="">(없음)</option>
              {members.map((m) => (
                <option key={m.memberId} value={m.memberId}>{m.name}</option>
              ))}
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="summary">적요</FieldLabel>
            <Input id="summary" name="summary" />
          </Field>
          <Field>
            <FieldLabel htmlFor="note">비고</FieldLabel>
            <Textarea id="note" name="note" rows={2} />
          </Field>

          <Button type="submit" className="w-fit">
            등록
          </Button>
        </form>
      )}

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/finance">
          <ArrowLeft />
          재정
        </Link>
      </Button>
    </section>
  );
}
