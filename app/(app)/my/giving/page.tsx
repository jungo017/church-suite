import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getUserMember, listMyGiving } from "@/lib/members/portal";
import { formatWon } from "@/lib/finance/constants";

// 교인 셀프 포털 — 본인 헌금내역만.
export default async function MyGivingPage() {
  const user = await requireUser();
  const me = await getUserMember(user.church_id, user.sub);

  if (!me) {
    return (
      <section className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">나의 헌금내역</h1>
        <p className="text-sm text-gray-500">연결된 교인 정보가 없습니다.</p>
      </section>
    );
  }

  const giving = await listMyGiving(user.church_id, me.memberId);
  const total = giving.reduce((s, g) => s + Number(g.amount), 0);

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-bold">나의 헌금내역</h1>
      <p className="text-sm text-gray-500">누계 {formatWon(total)}</p>
      {giving.length === 0 ? (
        <p className="text-sm text-gray-500">헌금내역이 없습니다.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 text-gray-500 dark:border-white/15">
            <tr>
              <th className="py-2">일자</th>
              <th className="py-2">항목</th>
              <th className="py-2 text-right">금액</th>
            </tr>
          </thead>
          <tbody>
            {giving.map((g, i) => (
              <tr key={i} className="border-b border-black/5 dark:border-white/10">
                <td className="py-2">{g.voucherDate}</td>
                <td className="py-2">{g.accountName ?? "헌금"}</td>
                <td className="py-2 text-right">{formatWon(g.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Link href="/my" className="text-sm underline">← 내 정보</Link>
    </section>
  );
}
