import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenant } from "@/lib/tenant/context";
import { submitOnlineOfferingAction } from "@/lib/site/public-actions";
import { Button } from "@/lib/ui/button";
import { PublicContainer } from "@/lib/ui/public-site/public-container";
import { PublicPageTitle } from "@/lib/ui/public-site/public-section";
import { Field, FieldLabel, Input, Select } from "@/lib/ui/form";

export default async function OfferingPublicPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;
  const tenant = await getTenant();
  if (!tenant) notFound();

  return (
    <PublicContainer className="flex min-h-screen max-w-md flex-col justify-center gap-6">
      <PublicPageTitle>{tenant.name} 온라인 헌금</PublicPageTitle>
      {submitted ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-success">헌금이 접수되었습니다. 감사합니다!</p>
          <Link href="/" className="text-sm underline">← 홈으로</Link>
        </div>
      ) : (
        <form action={submitOnlineOfferingAction} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="of-donorName">이름</FieldLabel>
            <Input id="of-donorName" name="donorName" placeholder="이름" />
          </Field>
          <Field>
            <FieldLabel htmlFor="of-donorPhone">연락처</FieldLabel>
            <Input id="of-donorPhone" name="donorPhone" placeholder="연락처" />
          </Field>
          <Field>
            <FieldLabel htmlFor="of-offeringKind">헌금 종류</FieldLabel>
            <Input
              id="of-offeringKind"
              name="offeringKind"
              placeholder="헌금 종류 (예: 십일조, 감사헌금)"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="of-amount" required>금액(원)</FieldLabel>
            <Input
              id="of-amount"
              name="amount"
              type="number"
              min="1"
              step="1"
              required
              placeholder="금액(원)"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="of-method">결제 방법</FieldLabel>
            <Select id="of-method" name="method" defaultValue="card">
              <option value="card">카드</option>
              <option value="transfer">계좌이체</option>
            </Select>
          </Field>
          <Button type="submit" size="lg">헌금하기</Button>
          <p className="text-xs text-muted-foreground">※ 결제(PG) 연동은 추후 제공됩니다(테스트 접수).</p>
        </form>
      )}
    </PublicContainer>
  );
}
