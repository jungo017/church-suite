import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenant } from "@/lib/tenant/context";
import { submitNewFamilyAction } from "@/lib/site/public-actions";

const input =
  "rounded-md border border-border px-3 py-2 text-sm dark:bg-transparent";

export default async function NewFamilyPublicPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const { submitted, error } = await searchParams;
  const tenant = await getTenant();
  if (!tenant) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold">{tenant.name} 새가족 등록</h1>
      {submitted ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-green-600">
            신청이 접수되었습니다. 확인 후 연락드리겠습니다. 감사합니다!
          </p>
          <Link href="/" className="text-sm underline">← 홈으로</Link>
        </div>
      ) : (
        <form action={submitNewFamilyAction} className="flex flex-col gap-3">
          {error && (
            <p className="text-sm text-destructive">
              이름과 개인정보 수집·이용 동의는 필수입니다.
            </p>
          )}
          <input name="name" required placeholder="이름 *" className={input} />
          <input name="phone" placeholder="연락처" className={input} />
          <input name="email" type="email" placeholder="이메일" className={input} />
          <input name="address" placeholder="주소" className={input} />
          <textarea name="message" rows={3} placeholder="남기실 말씀" className={input} />
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" name="consent" required />
            개인정보 수집·이용에 동의합니다. (이름·연락처 등 — 새가족 관리 목적)
          </label>
          <button className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
            등록 신청
          </button>
        </form>
      )}
    </main>
  );
}
