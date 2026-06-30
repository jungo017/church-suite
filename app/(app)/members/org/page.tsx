import Link from "next/link";
import { requirePermission } from "@church/core/rbac/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import { listPositions, listOrgRoles } from "@church/module-members/org";
import {
  createPositionAction,
  updatePositionAction,
  createOrgRoleAction,
  updateOrgRoleAction,
} from "@church/module-members/org-actions";

const input =
  "rounded-md border border-border px-3 py-2 text-sm dark:bg-transparent";
const btn =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background";

export default async function OrgMastersPage() {
  const user = await requirePermission(PERMISSIONS.MEMBERS_WRITE);
  const [positions, roles] = await Promise.all([
    listPositions(user.church_id, { includeInactive: true }),
    listOrgRoles(user.church_id, { includeInactive: true }),
  ]);

  return (
    <section className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">직분 · 직책 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          직분(교회 전체 신분)과 직책(조직 내 역할)은 교회가 자유롭게 추가·수정할 수 있습니다.
        </p>
      </div>

      {/* ── 직분 마스터 ── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">직분</h2>
        <form action={createPositionAction} className="flex gap-2">
          <input name="label" required placeholder="직분 추가 (예: 권찰)" className={`${input} flex-1`} />
          <button className={btn}>추가</button>
        </form>
        <ul className="flex flex-col gap-1 text-sm">
          {positions.map((p) => (
            <li key={p.positionId} className="border-b border-border py-2">
              <form
                action={updatePositionAction.bind(null, p.positionId)}
                className="flex items-center gap-2"
              >
                <input name="label" defaultValue={p.label} className={`${input} flex-1`} />
                <input
                  name="sort"
                  type="number"
                  defaultValue={p.sort}
                  className={`${input} w-20`}
                  aria-label="정렬"
                />
                <label className="flex items-center gap-1 text-muted-foreground">
                  <input type="checkbox" name="active" defaultChecked={p.active} /> 사용
                </label>
                <button className="rounded-md border border-border px-3 py-2 text-sm">저장</button>
              </form>
            </li>
          ))}
        </ul>
      </div>

      {/* ── 직책 마스터 ── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">조직 직책</h2>
        <p className="text-xs text-muted-foreground">
          “리더” 표시된 직책(속장·부장 등)이 역할 기반 보고서의 일괄 대상 선정 기준이 됩니다.
        </p>
        <form action={createOrgRoleAction} className="flex items-center gap-2">
          <input name="label" required placeholder="직책 추가 (예: 협동총무)" className={`${input} flex-1`} />
          <label className="flex items-center gap-1 text-muted-foreground">
            <input type="checkbox" name="isLeader" /> 리더
          </label>
          <button className={btn}>추가</button>
        </form>
        <ul className="flex flex-col gap-1 text-sm">
          {roles.map((r) => (
            <li key={r.orgRoleId} className="border-b border-border py-2">
              <form
                action={updateOrgRoleAction.bind(null, r.orgRoleId)}
                className="flex items-center gap-2"
              >
                <input name="label" defaultValue={r.label} className={`${input} flex-1`} />
                <input
                  name="sort"
                  type="number"
                  defaultValue={r.sort}
                  className={`${input} w-20`}
                  aria-label="정렬"
                />
                <label className="flex items-center gap-1 text-muted-foreground">
                  <input type="checkbox" name="isLeader" defaultChecked={r.isLeader} /> 리더
                </label>
                <label className="flex items-center gap-1 text-muted-foreground">
                  <input type="checkbox" name="active" defaultChecked={r.active} /> 사용
                </label>
                <button className="rounded-md border border-border px-3 py-2 text-sm">저장</button>
              </form>
            </li>
          ))}
        </ul>
      </div>

      <Link href="/members/org/assignments" className="text-sm underline">
        연도별 조직 편성 →
      </Link>
    </section>
  );
}
