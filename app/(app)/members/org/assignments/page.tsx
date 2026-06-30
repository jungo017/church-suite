import Link from "next/link";
import { requirePermission } from "@church/core/rbac/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import { listMemberships, listOrgRoles } from "@/lib/members/org";
import { listMembers } from "@/lib/members/service";
import { listDepartments } from "@/lib/assets/classification";
import { departmentTreeRows } from "@/lib/org/tree";
import {
  assignMembershipAction,
  removeMembershipAction,
} from "@/lib/members/org-actions";

const input =
  "rounded-md border border-border px-3 py-2 text-sm dark:bg-transparent";
const btn =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background";

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
      <div>
        <h1 className="text-2xl font-bold">연도별 조직 편성</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          매년 속회/부서 개편을 연도별로 관리합니다. 같은 교인이 여러 조직에 동시 소속될 수 있습니다.
        </p>
      </div>

      {/* 연도 선택 */}
      <form method="get" className="flex items-center gap-2 text-sm">
        <label htmlFor="year">대상 연도</label>
        <input id="year" name="year" type="number" defaultValue={year} className={`${input} w-28`} />
        <button className="rounded-md border border-border px-3 py-2">조회</button>
      </form>

      {/* 편성 추가 */}
      <form action={assignMembershipAction} className="flex flex-wrap items-end gap-2 rounded-md border border-border p-3">
        <input type="hidden" name="periodYear" value={year} />
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          교인
          <select name="memberId" required className={input} defaultValue="">
            <option value="" disabled>선택</option>
            {members.map((m) => (
              <option key={m.memberId} value={m.memberId}>{m.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          조직(부서/구역/속)
          <select name="departmentId" required className={input} defaultValue="">
            <option value="" disabled>선택</option>
            {departmentRows.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>{d.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          직책
          <select name="orgRoleId" className={input} defaultValue="">
            <option value="">(없음)</option>
            {roles.map((r) => (
              <option key={r.orgRoleId} value={r.orgRoleId}>
                {r.label}{r.isLeader ? " (리더)" : ""}
              </option>
            ))}
          </select>
        </label>
        <button className={btn}>편성 추가</button>
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
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {rows.length}명
                    </span>
                  </div>
                  {rows.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 text-xs">
                      {leaders.map((m) => (
                        <span
                          key={m.membershipId}
                          className="rounded-full border border-primary/30 px-2 py-0.5 text-primary"
                        >
                          {m.memberName}
                          {m.orgRoleLabel ? ` · ${m.orgRoleLabel}` : ""}
                        </span>
                      ))}
                      {members.map((m) => (
                        <span
                          key={m.membershipId}
                          className="rounded-full border border-border px-2 py-0.5 text-muted-foreground"
                        >
                          {m.memberName}
                          {m.orgRoleLabel ? ` · ${m.orgRoleLabel}` : ""}
                        </span>
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
        <p className="text-sm text-muted-foreground">{year}년 편성 내역이 없습니다.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2">조직</th>
              <th className="py-2">교인</th>
              <th className="py-2">직책</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {memberships.map((m) => (
              <tr key={m.membershipId} className="border-b border-border">
                <td className="py-2">{m.departmentName}</td>
                <td className="py-2">{m.memberName}</td>
                <td className="py-2">
                  {m.orgRoleLabel ?? "—"}
                  {m.isLeader ? <span className="ml-1 text-xs text-primary">리더</span> : null}
                </td>
                <td className="py-2 text-right">
                  <form action={removeMembershipAction.bind(null, m.membershipId)}>
                    <button className="text-xs text-destructive underline">삭제</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Link href="/members/org" className="text-sm underline">← 직분 · 직책 관리</Link>
    </section>
  );
}
