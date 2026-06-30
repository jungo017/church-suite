import "server-only";
import { and, eq } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { userIdentity } from "@church/core/db/schema";
import type { OAuthProfile } from "./oauth";

/**
 * 소셜 신원 ↔ app_user 연결 (스펙 §14). 교회 스코프(RLS).
 * 교인 매핑 seam 은 app_user.member_id — 신원은 "어느 app_user 인가"만 해결한다.
 */

/** (provider, providerUserId) 로 연결된 사용자 id 조회(없으면 null). */
export async function findUserIdByIdentity(
  churchId: string,
  provider: string,
  providerUserId: string,
): Promise<string | null> {
  const rows = await withTenant(churchId, (tx) =>
    tx
      .select({ userId: userIdentity.userId })
      .from(userIdentity)
      .where(
        and(
          eq(userIdentity.churchId, churchId),
          eq(userIdentity.provider, provider),
          eq(userIdentity.providerUserId, providerUserId),
        ),
      )
      .limit(1),
  );
  return rows[0]?.userId ?? null;
}

/**
 * 기존 사용자(예: 비번 계정)에 소셜 신원 연결(멱등).
 * 같은 (church, provider, providerUserId) 가 이미 있으면 무시(onConflictDoNothing).
 * 이미 **다른** 사용자에 연결돼 있으면 unique 위반으로 surface(호출부에서 처리).
 */
export async function linkIdentity(opts: {
  churchId: string;
  userId: string;
  profile: OAuthProfile;
}): Promise<void> {
  await withTenant(opts.churchId, (tx) =>
    tx
      .insert(userIdentity)
      .values({
        churchId: opts.churchId,
        userId: opts.userId,
        provider: opts.profile.provider,
        providerUserId: opts.profile.providerUserId,
        email: opts.profile.email ?? null,
        emailVerified: opts.profile.emailVerified,
      })
      .onConflictDoNothing(),
  );
}
