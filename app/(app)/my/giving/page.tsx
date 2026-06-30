import Link from "next/link";
import { requireUser } from "@church/core/auth/session";
import { getUserMember } from "@church/core/member";
import { listMyGiving } from "@church/module-members/portal";
import { formatWon } from "@church/module-finance/constants";
import { PageHeader, PageTitle } from "@/lib/ui/page";
import { EmptyState } from "@/lib/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/lib/ui/table";

// 교인 셀프 포털 — 본인 헌금내역만.
export default async function MyGivingPage() {
  const user = await requireUser();
  const me = await getUserMember(user.church_id, user.sub);

  if (!me) {
    return (
      <section className="flex flex-col gap-3">
        <PageHeader>
          <PageTitle>나의 헌금내역</PageTitle>
        </PageHeader>
        <p className="text-sm text-muted-foreground">연결된 교인 정보가 없습니다.</p>
      </section>
    );
  }

  const giving = await listMyGiving(user.church_id, me.memberId);
  const total = giving.reduce((s, g) => s + Number(g.amount), 0);

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <PageHeader>
        <PageTitle>나의 헌금내역</PageTitle>
      </PageHeader>
      <p className="text-sm text-muted-foreground">누계 {formatWon(total)}</p>
      {giving.length === 0 ? (
        <EmptyState
          title="헌금내역이 없습니다"
          description="등록된 본인 헌금내역이 아직 없습니다."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>일자</TableHead>
                <TableHead>항목</TableHead>
                <TableHead className="text-right tabular-nums">금액</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {giving.map((g, i) => (
                <TableRow key={i}>
                  <TableCell className="tabular-nums">{g.voucherDate}</TableCell>
                  <TableCell>{g.accountName ?? "헌금"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatWon(g.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Link href="/my" className="text-sm underline">← 내 정보</Link>
    </section>
  );
}
