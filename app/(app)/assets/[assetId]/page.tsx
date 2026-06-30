import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@church/core/auth/session";
import { hasPermission, PERMISSIONS } from "@church/core/rbac/roles";
import { getAsset } from "@/lib/assets/service";
import { listRepairs } from "@/lib/assets/repairs";
import {
  deleteAssetAction,
  addRepairAction,
  deleteRepairAction,
} from "@/lib/assets/actions";
import {
  ASSET_TYPE_LABELS,
  ASSET_STATUS_LABELS,
  type AssetType,
  type AssetStatus,
} from "@/lib/assets/constants";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-border py-2">
      <span className="w-28 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{value ?? "—"}</span>
    </div>
  );
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
  const user = await requireUser();
  if (!hasPermission(user.roles, PERMISSIONS.ASSETS_READ)) redirect("/forbidden");
  const a = await getAsset(user.church_id, assetId);
  if (!a) notFound();
  const canWrite = hasPermission(user.roles, PERMISSIONS.ASSETS_WRITE);
  const repairs = await listRepairs(user.church_id, assetId);
  const inputCls =
    "rounded-md border border-border px-2 py-1 text-sm dark:bg-transparent";

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{a.name}</h1>
        {canWrite && (
          <div className="flex gap-2">
            <Link
              href={`/assets/${a.assetId}/edit`}
              className="rounded-md border border-border px-3 py-1.5 text-sm"
            >
              편집
            </Link>
            <form action={deleteAssetAction.bind(null, a.assetId)}>
              <button className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-destructive">
                삭제
              </button>
            </form>
          </div>
        )}
      </div>
      <div>
        <Row label="종류" value={ASSET_TYPE_LABELS[a.assetType as AssetType] ?? a.assetType} />
        <Row label="상태" value={ASSET_STATUS_LABELS[a.status as AssetStatus] ?? a.status} />
        <Row label="수량" value={a.quantity} />
        <Row label="자산 태그" value={a.tag} />
        <Row label="취득일" value={a.acquiredAt} />
        <Row
          label="취득가액"
          value={a.acquiredCost ? `${Number(a.acquiredCost).toLocaleString()}원` : null}
        />
        <Row label="비고" value={a.note} />
      </div>
      <section className="mt-4 flex flex-col gap-3">
        <h2 className="text-lg font-semibold">수리이력</h2>
        {repairs.length === 0 ? (
          <p className="text-sm text-muted-foreground">수리이력이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {repairs.map((r) => (
              <li
                key={r.repairId}
                className="flex items-start justify-between gap-4 border-b border-border pb-2 text-sm"
              >
                <div>
                  <div className="font-medium">{r.description}</div>
                  <div className="text-muted-foreground">
                    {r.repairedAt ?? "날짜미상"}
                    {r.vendor ? ` · ${r.vendor}` : ""}
                    {r.cost ? ` · ${Number(r.cost).toLocaleString()}원` : ""}
                  </div>
                </div>
                {canWrite && (
                  <form action={deleteRepairAction.bind(null, a.assetId, r.repairId)}>
                    <button className="text-xs text-destructive">삭제</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        {canWrite && (
          <form
            action={addRepairAction.bind(null, a.assetId)}
            className="flex flex-wrap items-end gap-2"
          >
            <input name="description" required placeholder="수리 내용" className={inputCls} />
            <input name="repairedAt" type="date" className={inputCls} />
            <input name="vendor" placeholder="업체" className={inputCls} />
            <input name="cost" type="number" step="0.01" min="0" placeholder="비용(원)" className={inputCls} />
            <button className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background">
              이력 추가
            </button>
          </form>
        )}
      </section>

      <Link href="/assets" className="text-sm underline">
        ← 목록으로
      </Link>
    </section>
  );
}
