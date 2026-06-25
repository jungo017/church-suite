import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/roles";
import { redirect } from "next/navigation";
import { listAccounts } from "@/lib/finance/accounts";
import { createAccountAction } from "@/lib/finance/actions";
import { PageHeader, PageTitle } from "@/lib/ui/page";
import { Input, Select } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";
import { Badge } from "@/lib/ui/badge";
import { EmptyState } from "@/lib/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/lib/ui/table";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  type AccountType,
} from "@/lib/finance/constants";

export default async function AccountsPage() {
  const user = await requireUser();
  if (!hasPermission(user.roles, PERMISSIONS.FINANCE_READ)) redirect("/forbidden");
  const canWrite = hasPermission(user.roles, PERMISSIONS.FINANCE_WRITE);
  const accounts = await listAccounts(user.church_id);

  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <PageHeader>
        <PageTitle>계정과목</PageTitle>
      </PageHeader>

      {canWrite && (
        <form action={createAccountAction} className="flex flex-wrap items-end gap-2">
          <Input name="code" required placeholder="코드 (예: 101)" className="w-28" />
          <Input name="name" required placeholder="과목명 (예: 십일조)" className="flex-1" />
          <Select name="type" defaultValue="income" className="w-auto">
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
            ))}
          </Select>
          <Button type="submit">
            <Plus />
            추가
          </Button>
        </form>
      )}

      {accounts.length === 0 ? (
        <EmptyState
          title="계정과목이 없습니다"
          description="계정과목을 추가하면 전표 등록 시 수입·지출 항목으로 선택할 수 있습니다."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>코드</TableHead>
                <TableHead>과목명</TableHead>
                <TableHead>구분</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((a) => (
                <TableRow key={a.accountId}>
                  <TableCell className="tabular-nums">{a.code}</TableCell>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>
                    <Badge tone={a.type === "income" ? "info" : "muted"}>
                      {ACCOUNT_TYPE_LABELS[a.type as AccountType] ?? a.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge tone={a.active ? "success" : "muted"}>
                      {a.active ? "사용" : "미사용"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Link href="/finance" className="text-sm text-muted-foreground hover:underline">← 재정</Link>
    </section>
  );
}
