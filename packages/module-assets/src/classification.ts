import "server-only";
import { asc, eq } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { location, assetCategory } from "@church/core/db/schema";

/**
 * 자산 분류(장소/품목) 조회·생성. 모두 테넌트 스코프.
 * 부서/구역(`department`)은 코어 공유 도메인이라 `@church/core/department` 가 소유한다.
 */

export async function listLocations(churchId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(location)
      .where(eq(location.churchId, churchId))
      .orderBy(asc(location.name)),
  );
}

export async function createLocation(
  churchId: string,
  name: string,
  parentId: string | null = null,
): Promise<{ locationId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(location)
      .values({ churchId, name, parentId })
      .returning({ locationId: location.locationId });
    return { locationId: rows[0]!.locationId };
  });
}

export async function listCategories(churchId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(assetCategory)
      .where(eq(assetCategory.churchId, churchId))
      .orderBy(asc(assetCategory.name)),
  );
}

export async function createCategory(
  churchId: string,
  name: string,
  parentId: string | null = null,
): Promise<{ categoryId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(assetCategory)
      .values({ churchId, name, parentId })
      .returning({ categoryId: assetCategory.categoryId });
    return { categoryId: rows[0]!.categoryId };
  });
}
