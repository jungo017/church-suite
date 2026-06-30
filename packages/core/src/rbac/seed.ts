import "server-only";
import { and, eq } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { role, userRole } from "@church/core/db/schema";
import { DEFAULT_ROLES, type RoleName } from "./roles";

/**
 * 교회의 기본 역할을 시드한다(중복 무시). 반환: roleName → roleId 맵.
 * 온보딩(0.8)에서 사용.
 */
export async function seedDefaultRoles(
  churchId: string,
): Promise<Record<string, string>> {
  return withTenant(churchId, async (tx) => {
    for (const r of DEFAULT_ROLES) {
      await tx
        .insert(role)
        .values({ churchId, name: r.name })
        .onConflictDoNothing();
    }
    const all = await tx
      .select({ roleId: role.roleId, name: role.name })
      .from(role);
    return Object.fromEntries(all.map((r) => [r.name, r.roleId]));
  });
}

/** 사용자에게 역할을 부여한다(중복 무시). */
export async function assignRole(
  churchId: string,
  userId: string,
  roleName: RoleName,
): Promise<void> {
  await withTenant(churchId, async (tx) => {
    const r = await tx
      .select({ roleId: role.roleId })
      .from(role)
      .where(and(eq(role.churchId, churchId), eq(role.name, roleName)))
      .limit(1);
    if (!r[0]) throw new Error(`역할이 존재하지 않습니다: ${roleName}`);
    await tx
      .insert(userRole)
      .values({ churchId, userId, roleId: r[0].roleId })
      .onConflictDoNothing();
  });
}
