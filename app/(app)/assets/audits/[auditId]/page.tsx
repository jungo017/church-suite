import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { getAudit, listAuditItems } from "@/lib/assets/audit";
import {
  checkItemAction,
  checkByTagAction,
  closeAuditAction,
} from "@/lib/assets/actions";
import { PageHeader, PageTitle, PageActions } from "@/lib/ui/page";
import { Button } from "@/lib/ui/button";
import { Badge } from "@/lib/ui/badge";
import { Input } from "@/lib/ui/form";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;
  const user = await requirePermission(PERMISSIONS.ASSETS_WRITE);
  const audit = await getAudit(user.church_id, auditId);
  if (!audit) notFound();

  const items = await listAuditItems(user.church_id, auditId);
  const total = items.length;
  const checked = items.filter((i) => i.checked).length;
  const open = audit.status === "open";

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <PageHeader>
        <PageTitle>{audit.name}</PageTitle>
        <PageActions>
          <Badge tone={open ? "success" : "muted"}>
            {open ? "진행중" : "마감"}
          </Badge>
          <span className="text-sm tabular-nums text-muted-foreground">
            {checked}/{total} 확인
          </span>
        </PageActions>
      </PageHeader>

      {open && (
        <div className="flex flex-wrap items-center gap-3">
          <form
            action={checkByTagAction.bind(null, auditId)}
            className="flex gap-2"
          >
            <Input name="tag" placeholder="자산 태그 스캔/입력" />
            <Button type="submit">확인</Button>
          </form>
          <form action={closeAuditAction.bind(null, auditId)}>
            <Button type="submit" variant="outline">
              조사 마감
            </Button>
          </form>
        </div>
      )}

      <ul className="flex flex-col gap-1 text-sm">
        {items.map((i) => (
          <li
            key={i.itemId}
            className="flex items-center justify-between border-b border-border py-1.5"
          >
            <span>
              <span className={i.checked ? "text-success" : "text-muted-foreground"}>
                {i.checked ? "✓" : "○"}
              </span>{" "}
              {i.name}
              {i.tag && <span className="text-muted-foreground"> ({i.tag})</span>}
            </span>
            {open && (
              <form
                action={checkItemAction.bind(null, auditId, i.itemId, !i.checked)}
              >
                <Button type="submit" variant="ghost" size="sm">
                  {i.checked ? "해제" : "확인"}
                </Button>
              </form>
            )}
          </li>
        ))}
      </ul>

      {total > 0 && checked < total && (
        <p className="text-sm text-warning">
          미확인 {total - checked}건
        </p>
      )}

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/assets/audits">
          <ArrowLeft />
          전수조사 목록
        </Link>
      </Button>
    </section>
  );
}
