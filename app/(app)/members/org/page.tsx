import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/roles";
import { listPositions, listOrgRoles } from "@/lib/members/org";
import {
  createPositionAction,
  updatePositionAction,
  createOrgRoleAction,
  updateOrgRoleAction,
} from "@/lib/members/org-actions";
import { PageHeader, PageTitle, PageDescription } from "@/lib/ui/page";
import { Input } from "@/lib/ui/form";
import { Button } from "@/lib/ui/button";
import { EmptyState } from "@/lib/ui/empty-state";

export default async function OrgMastersPage() {
  const user = await requirePermission(PERMISSIONS.MEMBERS_WRITE);
  const [positions, roles] = await Promise.all([
    listPositions(user.church_id, { includeInactive: true }),
    listOrgRoles(user.church_id, { includeInactive: true }),
  ]);

  return (
    <section className="flex max-w-3xl flex-col gap-8">
      <PageHeader>
        <div>
          <PageTitle>직분 · 직책 관리</PageTitle>
          <PageDescription>
            직분(교회 전체 신분)과 직책(조직 내 역할)은 교회가 자유롭게 추가·수정할 수 있습니다.
          </PageDescription>
        </div>
      </PageHeader>

      {/* ── 직분 마스터 ── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">직분</h2>
        <form action={createPositionAction} className="flex gap-2">
          <Input name="label" required placeholder="직분 추가 (예: 권찰)" className="flex-1" />
          <Button type="submit">
            <Plus />
            추가
          </Button>
        </form>
        {positions.length === 0 ? (
          <EmptyState
            title="등록된 직분이 없습니다"
            description="위 양식에서 첫 직분을 추가하세요."
          />
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {positions.map((p) => (
              <li key={p.positionId} className="border-b border-border py-2">
                <form
                  action={updatePositionAction.bind(null, p.positionId)}
                  className="flex items-center gap-2"
                >
                  <Input name="label" defaultValue={p.label} className="flex-1" />
                  <Input
                    name="sort"
                    type="number"
                    defaultValue={p.sort}
                    className="w-20"
                    aria-label="정렬"
                  />
                  <label className="flex items-center gap-1 text-muted-foreground">
                    <input type="checkbox" name="active" defaultChecked={p.active} /> 사용
                  </label>
                  <Button type="submit" variant="outline">저장</Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── 직책 마스터 ── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">조직 직책</h2>
        <p className="text-xs text-muted-foreground">
          “리더” 표시된 직책(속장·부장 등)이 역할 기반 보고서의 일괄 대상 선정 기준이 됩니다.
        </p>
        <form action={createOrgRoleAction} className="flex items-center gap-2">
          <Input name="label" required placeholder="직책 추가 (예: 협동총무)" className="flex-1" />
          <label className="flex items-center gap-1 text-muted-foreground">
            <input type="checkbox" name="isLeader" /> 리더
          </label>
          <Button type="submit">
            <Plus />
            추가
          </Button>
        </form>
        {roles.length === 0 ? (
          <EmptyState
            title="등록된 직책이 없습니다"
            description="위 양식에서 첫 조직 직책을 추가하세요."
          />
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {roles.map((r) => (
              <li key={r.orgRoleId} className="border-b border-border py-2">
                <form
                  action={updateOrgRoleAction.bind(null, r.orgRoleId)}
                  className="flex items-center gap-2"
                >
                  <Input name="label" defaultValue={r.label} className="flex-1" />
                  <Input
                    name="sort"
                    type="number"
                    defaultValue={r.sort}
                    className="w-20"
                    aria-label="정렬"
                  />
                  <label className="flex items-center gap-1 text-muted-foreground">
                    <input type="checkbox" name="isLeader" defaultChecked={r.isLeader} /> 리더
                  </label>
                  <label className="flex items-center gap-1 text-muted-foreground">
                    <input type="checkbox" name="active" defaultChecked={r.active} /> 사용
                  </label>
                  <Button type="submit" variant="outline">저장</Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/members/org/assignments">
          연도별 조직 편성
          <ArrowRight />
        </Link>
      </Button>
    </section>
  );
}
