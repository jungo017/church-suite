import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { withTenant } from "@church/core/db/tenant";
import { memberClaim, appUser, member, userIdentity } from "@church/core/db/schema";
import { assignRole } from "@church/core/rbac/seed";
import { ROLES } from "@church/core/rbac/roles";
import type { OAuthProfile } from "./oauth";

/**
 * 교인 연동 클레임 (스펙 §14, A안 — 결정적 매핑).
 *
 * 관리자가 특정 `member` 에 대해 1회용 토큰을 발급한다. 교인이 소셜 로그인하며 이 토큰을
 * 제시하면, 소셜 신원이 **그 member_id 로** 바인딩된 새 app_user 에 연결된다(비번 없음).
 * 토큰 원문은 저장하지 않고 sha256 해시만 저장한다(refresh_token 패턴). 교회 스코프.
 */

const CLAIM_TTL_SEC = 7 * 24 * 3600; // 7일

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export class ClaimError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "ClaimError";
  }
}

/** 관리자(members:write 가드는 호출부)가 member 에 대해 연동 클레임 발급 → 원문 토큰 반환. */
export async function issueMemberClaim(
  churchId: string,
  memberId: string,
): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + CLAIM_TTL_SEC * 1000);
  await withTenant(churchId, async (tx) => {
    const m = await tx
      .select({ memberId: member.memberId })
      .from(member)
      .where(and(eq(member.churchId, churchId), eq(member.memberId, memberId)))
      .limit(1);
    if (!m[0]) throw new ClaimError("member_not_found");
    await tx.insert(memberClaim).values({ churchId, memberId, tokenHash, expiresAt });
  });
  return raw;
}

/**
 * 소셜 로그인 콜백에서 클레임 토큰을 사용해 신원을 교인에 바인딩.
 * 비번 없는 app_user 생성 + user_identity 연결 + member 역할 부여 + 클레임 소진.
 * 잘못된/만료/사용된 클레임, 이미 연결된 신원은 ClaimError.
 */
export async function redeemMemberClaim(opts: {
  churchId: string;
  rawToken: string;
  profile: OAuthProfile;
}): Promise<{ userId: string }> {
  const tokenHash = hashToken(opts.rawToken);
  const result = await withTenant(opts.churchId, async (tx) => {
    const claims = await tx
      .select()
      .from(memberClaim)
      .where(
        and(
          eq(memberClaim.churchId, opts.churchId),
          eq(memberClaim.tokenHash, tokenHash),
        ),
      )
      .limit(1);
    const claim = claims[0];
    if (!claim) throw new ClaimError("invalid_claim");
    if (claim.redeemedAt) throw new ClaimError("already_redeemed");
    if (claim.expiresAt.getTime() < Date.now()) throw new ClaimError("expired_claim");

    // 같은 소셜 신원이 이미 이 교회에 연결돼 있으면 거부(중복 바인딩 방지).
    const existing = await tx
      .select({ userId: userIdentity.userId })
      .from(userIdentity)
      .where(
        and(
          eq(userIdentity.churchId, opts.churchId),
          eq(userIdentity.provider, opts.profile.provider),
          eq(userIdentity.providerUserId, opts.profile.providerUserId),
        ),
      )
      .limit(1);
    if (existing[0]) throw new ClaimError("identity_already_linked");

    const m = await tx
      .select({ name: member.name })
      .from(member)
      .where(
        and(eq(member.churchId, opts.churchId), eq(member.memberId, claim.memberId)),
      )
      .limit(1);
    if (!m[0]) throw new ClaimError("member_not_found");

    // 비번 없는 소셜 전용 계정 생성(member_id 로 교인 바인딩).
    const inserted = await tx
      .insert(appUser)
      .values({
        churchId: opts.churchId,
        memberId: claim.memberId,
        loginId: null,
        passwordHash: null,
        name: m[0].name,
        status: "active",
      })
      .returning({ userId: appUser.userId });
    const userId = inserted[0]!.userId;

    await tx.insert(userIdentity).values({
      churchId: opts.churchId,
      userId,
      provider: opts.profile.provider,
      providerUserId: opts.profile.providerUserId,
      email: opts.profile.email ?? null,
      emailVerified: opts.profile.emailVerified,
    });

    await tx
      .update(memberClaim)
      .set({ redeemedAt: new Date(), redeemedUserId: userId })
      .where(eq(memberClaim.claimId, claim.claimId));

    return { userId };
  });

  // 역할 부여는 기존 패턴(createMemberUser)과 동일하게 별도 테넌트 트랜잭션으로.
  await assignRole(opts.churchId, result.userId, ROLES.MEMBER);
  return result;
}
