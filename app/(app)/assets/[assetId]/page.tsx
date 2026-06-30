import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { requireUser } from "@church/core/auth/session";
import { hasPermission, PERMISSIONS } from "@church/core/rbac/roles";
import { getAsset } from "@church/module-assets/service";
import { listRepairs } from "@church/module-assets/repairs";
import { PageHeader, PageTitle, PageActions } from "@/lib/ui/page";
import { DescriptionList, DescriptionItem } from "@/lib/ui/description-list";
import { Badge, type BadgeTone } from "@/lib/ui/badge";
import { Button } from "@/lib/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/lib/ui/table";
import {
  deleteAssetAction,
  addRepairAction,
  deleteRepairAction,
} from "@church/module-assets/actions";
import {
  ASSET_TYPE_LABELS,
  ASSET_STATUS_LABELS,
  type AssetType,
  type AssetStatus,
} from "@church/module-assets/constants";

// 자산 상태 → Badge 톤 (색만으로 의미 전달하지 않도록 라벨과 함께 사용, §11).
const STATUS_TONE: Record<string, BadgeTone> = {
  in_use: "success",
  in_repair: "warning",
  idle: "muted",
  disposed: "destructive",
};

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
    <section className="flex max-w-2xl flex-col gap-6">
      <PageHeader>
        <PageTitle>{a.name}</PageTitle>
        {canWrite && (
          <PageActions>
            <Button asChild variant="outline">
              <Link href={`/assets/${a.assetId}/edit`}>
                <Pencil />
                편집
              </Link>
            </Button>
            <form action={deleteAssetAction.bind(null, a.assetId)}>
              <Button type="submit" variant="destructive">
                <Trash2 />
                삭제
              </Button>
            </form>
          </PageActions>
        )}
      </PageHeader>

      <DescriptionList>
        <DescriptionItem label="종류">
          {ASSET_TYPE_LABELS[a.assetType as AssetType] ?? a.assetType}
        </DescriptionItem>
        <DescriptionItem label="상태">
          <Badge tone={STATUS_TONE[a.status] ?? "muted"}>
            {ASSET_STATUS_LABELS[a.status as AssetStatus] ?? a.status}
          </Badge>
        </DescriptionItem>
        <DescriptionItem label="수량">{a.quantity}</DescriptionItem>
        <DescriptionItem label="자산 태그">{a.tag}</DescriptionItem>
        <DescriptionItem label="취득일">{a.acquiredAt}</DescriptionItem>
        <DescriptionItem label="취득가액">
          {a.acquiredCost ? `${Number(a.acquiredCost).toLocaleString()}원` : null}
        </DescriptionItem>
        <DescriptionItem label="비고">{a.note}</DescriptionItem>
      </DescriptionList>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">수리이력</h2>
        {repairs.length === 0 ? (
          <p className="text-sm text-muted-foreground">수리이력이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>수리 내용</TableHead>
                  <TableHead>일자</TableHead>
                  <TableHead>업체</TableHead>
                  <TableHead className="text-right">비용</TableHead>
                  {canWrite && <TableHead className="text-right">관리</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {repairs.map((r) => (
                  <TableRow key={r.repairId}>
                    <TableCell className="font-medium">{r.description}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {r.repairedAt ?? "날짜미상"}
                    </TableCell>
                    <TableCell>{r.vendor ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.cost ? `${Number(r.cost).toLocaleString()}원` : "—"}
                    </TableCell>
                    {canWrite && (
                      <TableCell className="text-right">
                        <form action={deleteRepairAction.bind(null, a.assetId, r.repairId)}>
                          <Button type="submit" variant="destructive" size="sm">
                            <Trash2 />
                            삭제
                          </Button>
                        </form>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
            <Button type="submit">이력 추가</Button>
          </form>
        )}
      </section>

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href="/assets">
          <ArrowLeft />
          목록으로
        </Link>
      </Button>
    </section>
  );
}
