import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenant } from "@church/core/tenant/context";
import { submitOnlineOfferingAction } from "@church/module-site/public-actions";

const input =
  "rounded-md border border-border px-3 py-2 text-sm dark:bg-transparent";

export default async function OfferingPublicPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;
  const tenant = await getTenant();
  if (!tenant) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold">{tenant.name} 온라인 헌금</h1>
      {submitted ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-green-600">헌금이 접수되었습니다. 감사합니다!</p>
          <Link href="/" className="text-sm underline">← 홈으로</Link>
        </div>
      ) : (
        <form action={submitOnlineOfferingAction} className="flex flex-col gap-3">
          <input name="donorName" placeholder="이름" className={input} />
          <input name="donorPhone" placeholder="연락처" className={input} />
          <input name="offeringKind" placeholder="헌금 종류 (예: 십일조, 감사헌금)" className={input} />
          <input name="amount" type="number" min="1" step="1" required placeholder="금액(원) *" className={input} />
          <select name="method" defaultValue="card" className={input}>
            <option value="card">카드</option>
            <option value="transfer">계좌이체</option>
          </select>
          <button className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
            헌금하기
          </button>
          <p className="text-xs text-muted-foreground">※ 결제(PG) 연동은 추후 제공됩니다(테스트 접수).</p>
        </form>
      )}
    </main>
  );
}
