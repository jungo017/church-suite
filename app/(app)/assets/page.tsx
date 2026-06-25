import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/rbac/guards";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/roles";
import { listAssetsPaged } from "@/lib/assets/service";
import { pageParams } from "@/lib/db/pagination";
import { cn } from "@/lib/utils";
import { Pagination } from "../pagination";
import { PageHeader, PageTitle, PageActions } from "@/lib/ui/page";
import { Button } from "@/lib/ui/button";
import { Badge, type BadgeTone } from "@/lib/ui/badge";
import { EmptyState } from "@/lib/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/lib/ui/table";
import {
  ASSET_TYPE_LABELS,
  ASSET_STATUS_LABELS,
  ASSET_STATUSES,
  type AssetType,
  type AssetStatus,
} from "@/lib/assets/constants";

// 자산 상태 → Badge 톤.
const ASSET_STATUS_TONE: Record<string, BadgeTone> = {
  in_use: "success",
  in_repair: "warning",
  idle: "muted",
  disposed: "destructive",
};

function FilterChip({
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
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-2.5 py-1 text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
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
  const canWrite = hasPermission(user.roles, PERMISSIONS.ASSETS_WRITE);
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
      <PageHeader>
        <PageTitle>비품 (자산)</PageTitle>
        {canWrite && (
          <PageActions>
            <Button asChild>
              <Link href="/assets/new">
                <Plus />
                자산 등록
              </Link>
            </Button>
          </PageActions>
        )}
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        <FilterChip current={status}>전체</FilterChip>
        {ASSET_STATUSES.map((s) => (
          <FilterChip key={s} status={s} current={status}>
            {ASSET_STATUS_LABELS[s]}
          </FilterChip>
        ))}
      </div>

      {assets.length === 0 ? (
        <EmptyState
          title="등록된 자산이 없습니다"
          description={
            status
              ? "이 상태의 자산이 없습니다."
              : "비품을 등록하면 QR 라벨 출력과 전수조사를 할 수 있습니다."
          }
          action={
            canWrite && !status ? (
              <Button asChild>
                <Link href="/assets/new">
                  <Plus />
                  자산 등록
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>종류</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead>태그</TableHead>
                <TableHead className="text-right">취득가액</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((a) => (
                <TableRow key={a.assetId}>
                  <TableCell>
                    <Link
                      href={`/assets/${a.assetId}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {a.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {ASSET_TYPE_LABELS[a.assetType as AssetType] ?? a.assetType}
                  </TableCell>
                  <TableCell>
                    <Badge tone={ASSET_STATUS_TONE[a.status] ?? "muted"}>
                      {ASSET_STATUS_LABELS[a.status as AssetStatus] ?? a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{a.quantity}</TableCell>
                  <TableCell>{a.tag ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {a.acquiredCost
                      ? `${Number(a.acquiredCost).toLocaleString()}원`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
