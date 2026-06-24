import "server-only";
import { and, eq } from "drizzle-orm";
import { withSystem } from "@/lib/db/tenant";
import { platformUser } from "@/lib/db/schema";
import { normalizeLoginId } from "@/lib/auth/login-id";
import { hashPassword } from "@/lib/auth/password";
import {
  isPlatformRole,
  PLATFORM_ROLES,
  type PlatformRole,
} from "./roles";

export type PlatformUser = {
  platformUserId: string;
  loginId: string;
  name: string;
  role: PlatformRole;
  status: string;
  passwordHash: string;
};

export async function createPlatformUser(opts: {
  loginId: string;
  password: string;
  name: string;
  role?: PlatformRole;
}): Promise<{ platformUserId: string }> {
  const loginId = normalizeLoginId(opts.loginId);
  if (!loginId) throw new Error("invalid_login_id");
  const role = opts.role ?? PLATFORM_ROLES.SADMIN;
  const passwordHash = await hashPassword(opts.password);
  return withSystem(async (tx) => {
    const rows = await tx
      .insert(platformUser)
      .values({
        loginId,
        passwordHash,
        name: opts.name,
        role,
      })
      .returning({ platformUserId: platformUser.platformUserId });
    return { platformUserId: rows[0]!.platformUserId };
  });
}

export async function findPlatformUserByLogin(
  loginId: string,
): Promise<PlatformUser | null> {
  const normalizedLoginId = normalizeLoginId(loginId);
  const rows = await withSystem((tx) =>
    tx
      .select({
        platformUserId: platformUser.platformUserId,
        loginId: platformUser.loginId,
        name: platformUser.name,
        role: platformUser.role,
        status: platformUser.status,
        passwordHash: platformUser.passwordHash,
      })
      .from(platformUser)
      .where(
        and(
          eq(platformUser.loginId, normalizedLoginId),
          eq(platformUser.status, "active"),
        ),
      )
      .limit(1),
  );
  const row = rows[0];
  if (!row || !isPlatformRole(row.role)) return null;
  return { ...row, role: row.role };
}
