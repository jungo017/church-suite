import "server-only";
import { asc, eq } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { department, location, assetCategory } from "@/lib/db/schema";

/**
 * 자산 분류(부서/장소/품목) 조회·생성. 모두 테넌트 스코프.
 */

export async function listDepartments(churchId: string) {
  return withTenant(churchId, (tx) =>
    tx
      .select()
      .from(department)
      .where(eq(department.churchId, churchId))
      .orderBy(asc(department.name)),
  );
}

export async function createDepartment(
  churchId: string,
  name: string,
  parentId: string | null = null,
): Promise<{ departmentId: string }> {
  return withTenant(churchId, async (tx) => {
    const rows = await tx
      .insert(department)
      .values({ churchId, name, parentId })
      .returning({ departmentId: department.departmentId });
    return { departmentId: rows[0]!.departmentId };
  });
}

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
