import Link from "next/link";
import { requirePermission } from "@church/core/rbac/guards";
import { PERMISSIONS } from "@church/core/rbac/roles";
import { listAssetsPaged } from "@/lib/assets/service";
import { pageParams } from "@church/core/db/pagination";
import { Pagination } from "../pagination";
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
      className={`rounded-md px-2 py-1 ${active ? "bg-primary text-primary-foreground" : "border border-border"}`}
    >
      {children}
    </Link>
  );
}

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; size?: string }>;
}) {
  const { status, page: pageParam, size } = await searchParams;
  const user = await requirePermission(PERMISSIONS.ASSETS_READ);
  const { page, pageSize } = pageParams({ page: pageParam, size });
  const result = await listAssetsPaged(
    user.church_id,
    status ? { status } : {},
    page,
    pageSize,
  );
  const assets = result.items;

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">비품 (자산)</h1>

      <div className="flex gap-2 text-sm">
        <FilterLink current={status}>전체</FilterLink>
        {ASSET_STATUSES.map((s) => (
          <FilterLink key={s} status={s} current={status}>
            {ASSET_STATUS_LABELS[s]}
          </FilterLink>
        ))}
      </div>

      {assets.length === 0 ? (
        <p className="py-8 text-sm text-muted-foreground">등록된 자산이 없습니다.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
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
                className="border-b border-border hover:bg-muted"
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

      <Pagination
        basePath="/assets"
        page={result.page}
        totalPages={result.totalPages}
        params={{ status }}
      />
    </section>
  );
}
