import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { asset } from "@/lib/db/schema";
import { toPaged, type Paged } from "@/lib/db/pagination";

/**
 * 자산 CRUD 서비스 (스펙 §7.1, §16). 모두 테넌트 스코프(withTenant → RLS).
 * churchId 는 인증된 사용자(JWT)에서 전달받는다.
 */

export type AssetInput = {
  name: string;
  assetType?: string;
  status?: string;
  quantity?: number;
  tag?: string | null;
  categoryId?: string | null;
  departmentId?: string | null;
  locationId?: string | null;
  acquiredAt?: string | null; // YYYY-MM-DD
  acquiredCost?: string | null; // numeric as string
  note?: string | null;
};

export type AssetFilters = {
  categoryId?: string;
  departmentId?: string;
  locationId?: string;
  status?: string;
  assetType?: string;
};

export async function listAssets(churchId: string, filters: AssetFilters = {}) {
  return withTenant(churchId, (tx) => {
    const conds = [eq(asset.churchId, churchId)];
    if (filters.categoryId) conds.push(eq(asset.categoryId, filters.categoryId));
    if (filters.departmentId)
      conds.push(eq(asset.departmentId, filters.departmentId));
    if (filters.locationId) conds.push(eq(asset.locationId, filters.locationId));
    if (filters.status) conds.push(eq(asset.status, filters.status));
    if (filters.assetType) conds.push(eq(asset.assetType, filters.assetType));
    return tx
      .select()
      .from(asset)
      .where(and(...conds))
      .orderBy(desc(asset.createdAt));
  });
}

/** 페이지 단위 자산 목록(대량 데이터). */
export async function listAssetsPaged(
  churchId: string,
  filters: AssetFilters,
  page: number,
  pageSize: number,
): Promise<Paged<typeof asset.$inferSelect>> {
  return withTenant(churchId, async (tx) => {
    const conds = [eq(asset.churchId, churchId)];
    if (filters.categoryId) conds.push(eq(asset.categoryId, filters.categoryId));
    if (filters.departmentId)
      conds.push(eq(asset.departmentId, filters.departmentId));
    if (filters.locationId) conds.push(eq(asset.locationId, filters.locationId));
    if (filters.status) conds.push(eq(asset.status, filters.status));
    if (filters.assetType) conds.push(eq(asset.assetType, filters.assetType));
    const where = and(...conds);
    const items = await tx
      .select()
      .from(asset)
      .where(where)
      .orderBy(desc(asset.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    const c = await tx.select({ n: count() }).from(asset).where(where);
    return toPaged(items, Number(c[0]?.n ?? 0), page, pageSize);
  });
}

export async function getAsset(churchId: string, assetId: string) {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select()
      .from(asset)
      .where(and(eq(asset.churchId, churchId), eq(asset.assetId, assetId)))
      .limit(1),
  );
  return rows[0] ?? null;
}

export async function createAsset(
  churchId: string,
  input: AssetInput,
): Promise<{ assetId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(asset)
      .values({
        churchId,
        name: input.name,
        assetType: input.assetType ?? "equipment",
        status: input.status ?? "in_use",
        quantity: input.quantity ?? 1,
        tag: input.tag ?? null,
        categoryId: input.categoryId ?? null,
        departmentId: input.departmentId ?? null,
        locationId: input.locationId ?? null,
        acquiredAt: input.acquiredAt ?? null,
        acquiredCost: input.acquiredCost ?? null,
        note: input.note ?? null,
      })
      .returning({ assetId: asset.assetId });
    return { assetId: rows[0]!.assetId };
  });
}

const UPDATABLE = [
  "name",
  "assetType",
  "status",
  "quantity",
  "tag",
  "categoryId",
  "departmentId",
  "locationId",
  "acquiredAt",
  "acquiredCost",
  "note",
] as const;

export async function updateAsset(
  churchId: string,
  assetId: string,
  input: Partial<AssetInput>,
): Promise<void> {
  const set: Record<string, unknown> = {};
  for (const key of UPDATABLE) {
    if (input[key] !== undefined) set[key] = input[key];
  }
  if (Object.keys(set).length === 0) return;
  await withTenant(churchId, (tx) =>
    tx
      .update(asset)
      .set(set)
      .where(and(eq(asset.churchId, churchId), eq(asset.assetId, assetId))),
  );
}

export async function deleteAsset(
  churchId: string,
  assetId: string,
): Promise<void> {
  await withTenant(churchId, (tx) =>
    tx
      .delete(asset)
      .where(and(eq(asset.churchId, churchId), eq(asset.assetId, assetId))),
  );
}
