import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/roles";
import { listAccessLogs } from "@/lib/compliance/access-log";
import { listConsents } from "@/lib/compliance/consent";
import { PageHeader, PageTitle } from "@/lib/ui/page";
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

// 개인정보 컴플라이언스(접근로그·동의) — 관리자 전용 (스펙 §5).
export default async function CompliancePage() {
  const user = await requireUser();
  if (!hasPermission(user.roles, PERMISSIONS.CHURCH_MANAGE)) redirect("/forbidden");

  const [logs, consents] = await Promise.all([
    listAccessLogs(user.church_id, 50),
    listConsents(user.church_id, 50),
  ]);

  return (
    <section className="flex max-w-3xl flex-col gap-8">
      <PageHeader>
        <PageTitle>개인정보 컴플라이언스</PageTitle>
      </PageHeader>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">접근 기록 (민감정보)</h2>
        {logs.length === 0 ? (
          <EmptyState title="접근 기록이 없습니다" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>활동</TableHead>
                  <TableHead>대상</TableHead>
                  <TableHead>시각</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.logId}>
                    <TableCell>{l.action}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {l.targetType}/{l.targetId?.slice(0, 8)}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {new Date(l.createdAt).toISOString().slice(0, 19).replace("T", " ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">동의 기록</h2>
        {consents.length === 0 ? (
          <EmptyState title="동의 기록이 없습니다" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>대상</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>출처</TableHead>
                  <TableHead>동의 여부</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consents.map((c) => (
                  <TableRow key={c.consentId}>
                    <TableCell>
                      {c.subjectName ?? c.memberId?.slice(0, 8) ?? "—"}
                    </TableCell>
                    <TableCell>{c.consentType}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.source ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge tone={c.agreed ? "success" : "muted"}>
                        {c.agreed ? "동의" : "거부"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/members">
          <ArrowLeft />
          목록으로
        </Link>
      </Button>
    </section>
  );
}
