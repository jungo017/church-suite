import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/roles";
import { listAssets } from "@/lib/assets/service";
import {
  ASSET_TYPE_LABELS,
  ASSET_STATUS_LABELS,
  ASSET_STATUSES,
  type AssetType,
  type AssetStatus,
} from "@/lib/assets/constants";

function FilterLink({
  status,
  current,
  children,
}: {
  status?: string;
  current?: string;
  children: React.ReactNode;
}) {
  const active = current === status || (!current && !status);
  return (
    <Link
      href={status ? `/assets?status=${status}` : "/assets"}
      className={`rounded-md px-2 py-1 ${active ? "bg-foreground text-background" : "border border-black/15 dark:border-white/20"}`}
    >
      {children}
    </Link>
  );
}

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const user = await requireUser();
  const assets = await listAssets(user.church_id, status ? { status } : {});
  const canWrite = hasPermission(user.roles, PERMISSIONS.ASSETS_WRITE);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">비품 (자산)</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href="/assets/labels"
            className="rounded-md border border-black/15 px-3 py-1.5 dark:border-white/20"
          >
            QR 라벨
          </Link>
          {canWrite && (
            <>
              <Link
                href="/assets/classification"
                className="rounded-md border border-black/15 px-3 py-1.5 dark:border-white/20"
              >
                분류 관리
              </Link>
              <Link
                href="/assets/new"
                className="rounded-md bg-foreground px-3 py-1.5 font-medium text-background"
              >
                + 자산 등록
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 text-sm">
        <FilterLink current={status}>전체</FilterLink>
        {ASSET_STATUSES.map((s) => (
          <FilterLink key={s} status={s} current={status}>
            {ASSET_STATUS_LABELS[s]}
          </FilterLink>
        ))}
      </div>

      {assets.length === 0 ? (
        <p className="py-8 text-sm text-gray-500">등록된 자산이 없습니다.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 text-gray-500 dark:border-white/15">
            <tr>
              <th className="py-2">이름</th>
              <th className="py-2">종류</th>
              <th className="py-2">상태</th>
              <th className="py-2">수량</th>
              <th className="py-2">태그</th>
              <th className="py-2 text-right">취득가액</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr
                key={a.assetId}
                className="border-b border-black/5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
              >
                <td className="py-2">
                  <Link href={`/assets/${a.assetId}`} className="font-medium underline">
                    {a.name}
                  </Link>
                </td>
                <td className="py-2">{ASSET_TYPE_LABELS[a.assetType as AssetType] ?? a.assetType}</td>
                <td className="py-2">{ASSET_STATUS_LABELS[a.status as AssetStatus] ?? a.status}</td>
                <td className="py-2">{a.quantity}</td>
                <td className="py-2">{a.tag ?? "—"}</td>
                <td className="py-2 text-right">
                  {a.acquiredCost ? `${Number(a.acquiredCost).toLocaleString()}원` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
