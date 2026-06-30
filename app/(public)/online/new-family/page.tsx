import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenant } from "@church/core/tenant/context";
import { submitNewFamilyAction } from "@church/module-site/public-actions";
import { Button } from "@/lib/ui/button";
import { PublicContainer } from "@/lib/ui/public-site/public-container";
import { PublicPageTitle } from "@/lib/ui/public-site/public-section";
import { Field, FieldLabel, Input, Textarea } from "@/lib/ui/form";

export default async function NewFamilyPublicPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const { submitted, error } = await searchParams;
  const tenant = await getTenant();
  if (!tenant) notFound();

  return (
    <PublicContainer className="flex min-h-screen max-w-md flex-col justify-center gap-6">
      <PublicPageTitle>{tenant.name} 새가족 등록</PublicPageTitle>
      {submitted ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-success">
            신청이 접수되었습니다. 확인 후 연락드리겠습니다. 감사합니다!
          </p>
          <Link href="/" className="text-sm underline">← 홈으로</Link>
        </div>
      ) : (
        <form action={submitNewFamilyAction} className="flex flex-col gap-4">
          {error && (
            <p className="text-sm text-destructive">
              이름과 개인정보 수집·이용 동의는 필수입니다.
            </p>
          )}
          <Field>
            <FieldLabel htmlFor="nf-name" required>이름</FieldLabel>
            <Input id="nf-name" name="name" required placeholder="이름" />
          </Field>
          <Field>
            <FieldLabel htmlFor="nf-phone">연락처</FieldLabel>
            <Input id="nf-phone" name="phone" placeholder="연락처" />
          </Field>
          <Field>
            <FieldLabel htmlFor="nf-email">이메일</FieldLabel>
            <Input id="nf-email" name="email" type="email" placeholder="이메일" />
          </Field>
          <Field>
            <FieldLabel htmlFor="nf-address">주소</FieldLabel>
            <Input id="nf-address" name="address" placeholder="주소" />
          </Field>
          <Field>
            <FieldLabel htmlFor="nf-message">남기실 말씀</FieldLabel>
            <Textarea id="nf-message" name="message" rows={3} placeholder="남기실 말씀" />
          </Field>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" name="consent" required />
            개인정보 수집·이용에 동의합니다. (이름·연락처 등 — 새가족 관리 목적)
          </label>
          <Button type="submit" size="lg">등록 신청</Button>
        </form>
      )}
    </PublicContainer>
  );
}
