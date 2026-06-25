import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { listAudits } from "@/lib/assets/audit";
import { createAuditAction } from "@/lib/assets/actions";
import { PageHeader, PageTitle, PageDescription } from "@/lib/ui/page";
import { Button } from "@/lib/ui/button";
import { Badge } from "@/lib/ui/badge";
import { EmptyState } from "@/lib/ui/empty-state";
import { Input } from "@/lib/ui/form";

export default async function AuditsPage() {
  const user = await requirePermission(PERMISSIONS.ASSETS_WRITE);
  const audits = await listAudits(user.church_id);

  return (
    <section className="flex max-w-2xl flex-col gap-5">
      <PageHeader>
        <div>
          <PageTitle>전수조사</PageTitle>
          <PageDescription>
            자산 태그를 스캔하며 실물 보유 여부를 확인합니다.
          </PageDescription>
        </div>
      </PageHeader>

      <form action={createAuditAction} className="flex gap-2">
        <Input
          name="name"
          placeholder="조사명 (예: 2026 상반기 전수조사)"
          className="flex-1"
        />
        <Button type="submit">새 전수조사 시작</Button>
      </form>

      {audits.length === 0 ? (
        <EmptyState
          title="진행한 전수조사가 없습니다"
          description="새 전수조사를 시작하면 자산을 하나씩 확인할 수 있습니다."
        />
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {audits.map((a) => (
            <li
              key={a.auditId}
              className="flex items-center justify-between border-b border-border py-2"
            >
              <Link
                href={`/assets/audits/${a.auditId}`}
                className="font-medium text-foreground hover:underline"
              >
                {a.name}
              </Link>
              <Badge tone={a.status === "open" ? "success" : "muted"}>
                {a.status === "open" ? "진행중" : "마감"}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/assets">
          <ArrowLeft />
          목록으로
        </Link>
      </Button>
    </section>
  );
}
