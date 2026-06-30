import Link from "next/link";
import { requirePermission } from "@church/core/rbac/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import { listMemberships, listOrgRoles } from "@church/module-members/org";
import { listMembers } from "@church/module-members/service";
import { listDepartments } from "@church/core/department";
import { departmentTreeRows } from "@/lib/org/tree";
import {
  assignMembershipAction,
  removeMembershipAction,
} from "@church/module-members/org-actions";
import { PageHeader, PageTitle, PageDescription } from "@/lib/ui/page";
import { FilterBar } from "@/lib/ui/filter-bar";
import { Input, Select, Label } from "@/lib/ui/form";
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

export default async function OrgAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const user = await requirePermission(PERMISSIONS.MEMBERS_WRITE);
  const { year: yearParam } = await searchParams;
  const year = Number(yearParam) || new Date().getFullYear();

  const [memberships, members, departments, roles] = await Promise.all([
    listMemberships(user.church_id, { periodYear: year }),
    listMembers(user.church_id, { status: "active" }),
    listDepartments(user.church_id),
    listOrgRoles(user.church_id),
  ]);
  const departmentRows = departmentTreeRows(departments);
  const membershipsByDepartment = new Map<string, typeof memberships>();
  for (const membership of memberships) {
    const rows = membershipsByDepartment.get(membership.departmentId) ?? [];
    rows.push(membership);
    membershipsByDepartment.set(membership.departmentId, rows);
  }

  return (
    <section className="flex max-w-5xl flex-col gap-6">
      <PageHeader>
        <div>
          <PageTitle>연도별 조직 편성</PageTitle>
          <PageDescription>
            매년 속회/부서 개편을 연도별로 관리합니다. 같은 교인이 여러 조직에 동시 소속될 수 있습니다.
          </PageDescription>
        </div>
      </PageHeader>

      {/* 연도 선택 */}
      <FilterBar method="get">
        <Label htmlFor="year" className="flex-row items-center gap-2">
          대상 연도
          <Input id="year" name="year" type="number" defaultValue={year} className="w-28" />
        </Label>
        <Button type="submit" variant="outline">
          조회
        </Button>
      </FilterBar>

      {/* 편성 추가 */}
      <form
        action={assignMembershipAction}
        className="flex flex-wrap items-end gap-2 rounded-md border border-border p-3"
      >
        <input type="hidden" name="periodYear" value={year} />
        <Label className="text-xs text-muted-foreground">
          교인
          <Select name="memberId" required defaultValue="">
            <option value="" disabled>선택</option>
            {members.map((m) => (
              <option key={m.memberId} value={m.memberId}>{m.name}</option>
            ))}
          </Select>
        </Label>
        <Label className="text-xs text-muted-foreground">
          조직(부서/구역/속)
          <Select name="departmentId" required defaultValue="">
            <option value="" disabled>선택</option>
            {departmentRows.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>{d.label}</option>
            ))}
          </Select>
        </Label>
        <Label className="text-xs text-muted-foreground">
          직책
          <Select name="orgRoleId" defaultValue="">
            <option value="">(없음)</option>
            {roles.map((r) => (
              <option key={r.orgRoleId} value={r.orgRoleId}>
                {r.label}{r.isLeader ? " (리더)" : ""}
              </option>
            ))}
          </Select>
        </Label>
        <Button type="submit">편성 추가</Button>
      </form>

      {departments.length === 0 && (
        <p className="text-sm text-muted-foreground">
          먼저 <Link href="/assets/classification" className="underline">부서/구역</Link>을 등록하세요.
        </p>
      )}

      <div className="rounded-md border border-border p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">조직 트리</h2>
          <span className="text-xs text-muted-foreground">
            {year}년 편성 기준
          </span>
        </div>
        {departmentRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 조직이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2 text-sm">
            {departmentRows.map((dept) => {
              const rows = membershipsByDepartment.get(dept.departmentId) ?? [];
              const leaders = rows.filter((m) => m.isLeader);
              const members = rows.filter((m) => !m.isLeader);
              return (
                <div
                  key={dept.departmentId}
                  className="border-l border-border py-1 pl-3"
                  style={{ marginLeft: `${dept.depth * 20}px` }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{dept.name}</span>
                    <Badge tone="muted">{rows.length}명</Badge>
                  </div>
                  {rows.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 text-xs">
                      {leaders.map((m) => (
                        <Badge key={m.membershipId} tone="info">
                          {m.memberName}
                          {m.orgRoleLabel ? ` · ${m.orgRoleLabel}` : ""}
                        </Badge>
                      ))}
                      {members.map((m) => (
                        <Badge key={m.membershipId} tone="muted">
                          {m.memberName}
                          {m.orgRoleLabel ? ` · ${m.orgRoleLabel}` : ""}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 편성 목록 */}
      {memberships.length === 0 ? (
        <EmptyState
          title={`${year}년 편성 내역이 없습니다`}
          description="위 편성 추가 폼으로 교인을 조직에 배정하세요."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>조직</TableHead>
                <TableHead>교인</TableHead>
                <TableHead>직책</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((m) => (
                <TableRow key={m.membershipId}>
                  <TableCell>{m.departmentName}</TableCell>
                  <TableCell>{m.memberName}</TableCell>
                  <TableCell>
                    {m.orgRoleLabel ?? "—"}
                    {m.isLeader ? (
                      <Badge tone="info" className="ml-1">리더</Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={removeMembershipAction.bind(null, m.membershipId)}>
                      <Button type="submit" variant="destructive" size="sm">
                        삭제
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Link href="/members/org" className="text-sm underline">← 직분 · 직책 관리</Link>
    </section>
  );
}
