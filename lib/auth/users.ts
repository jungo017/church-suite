import "server-only";
import { and, eq } from "drizzle-orm";
import { withTenant } from "@/lib/db/tenant";
import { appUser, role, userRole } from "@/lib/db/schema";
import { hashPassword } from "./password";

/** 사용자 생성(비밀번호 해시). 테넌트 스코프로 삽입. */
export async function createUser(opts: {
  churchId: string;
  loginId: string;
  password: string;
  name: string;
  memberId?: string | null;
}): Promise<{ userId: string }> {
  const passwordHash = await hashPassword(opts.password);
  return withTenant(opts.churchId, async (tx) => {
    const rows = await tx
      .insert(appUser)
      .values({
        churchId: opts.churchId,
        loginId: opts.loginId,
        passwordHash,
        name: opts.name,
        memberId: opts.memberId ?? null,
      })
      .returning({ userId: appUser.userId });
    return { userId: rows[0]!.userId };
  });
}

export type AuthUser = {
  userId: string;
  churchId: string;
  name: string;
  status: string;
  passwordHash: string;
};

export async function findUserByLogin(
  churchId: string,
  loginId: string,
): Promise<AuthUser | null> {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select({
        userId: appUser.userId,
        churchId: appUser.churchId,
        name: appUser.name,
        status: appUser.status,
        passwordHash: appUser.passwordHash,
      })
      .from(appUser)
      .where(and(eq(appUser.churchId, churchId), eq(appUser.loginId, loginId)))
      .limit(1),
  );
  return rows[0] ?? null;
}

export async function findUserById(
  churchId: string,
  userId: string,
): Promise<Omit<AuthUser, "passwordHash"> | null> {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select({
        userId: appUser.userId,
        churchId: appUser.churchId,
        name: appUser.name,
        status: appUser.status,
      })
      .from(appUser)
      .where(eq(appUser.userId, userId))
      .limit(1),
  );
  return rows[0] ?? null;
}

/** 사용자의 역할명 목록 (RBAC, 0.6). */
export async function getUserRoleNames(
  churchId: string,
  userId: string,
): Promise<string[]> {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select({ name: role.name })
      .from(userRole)
      .innerJoin(role, eq(userRole.roleId, role.roleId))
      .where(eq(userRole.userId, userId)),
  );
  return rows.map((r) => r.name);
}
