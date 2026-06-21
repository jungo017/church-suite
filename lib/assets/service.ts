import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { asset } from "@/lib/db/schema";

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
