// 소셜 로그인 → 교인 매핑 스캐폴드 테스트 (스펙 §14).
//   - mock OAuth 공급자(자격증명 없이 흐름 검증)
//   - 신원(user_identity) 연결/조회/멱등/교회 격리
//   - 관리자 클레임(A안) 발급→소진→app_user.member_id 바인딩 + member 역할
//   - 클레임 오류(무효/만료/중복/타교회/이미연결)
//   - 소셜 전용 계정(passwordHash null) 비번 로그인 차단
import { describe, it, expect, afterAll } from "vitest";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { withSystem, withTenant } from "@church/core/db/tenant";
import { memberClaim, appUser } from "@church/core/db/schema";
import { seedDefaultRoles } from "@church/core/rbac/seed";
import { getUserRoleNames } from "@church/core/auth/users";
import { getUserMember } from "@church/core/member";
import { getOAuthProvider, type OAuthProfile } from "@church/core/auth/oauth";
import { findUserIdByIdentity, linkIdentity } from "@church/core/auth/identity";
import {
  issueMemberClaim,
  redeemMemberClaim,
  ClaimError,
} from "@church/core/auth/member-claim";
import { loginWithIdentity, login } from "@church/core/auth/session";
import { createMember } from "@church/module-members/service";
import { createChurch, deleteChurches, closeDb, uniqueCode } from "./helpers";

const created: string[] = [];
afterAll(async () => {
  await deleteChurches(created);
  await closeDb();
});

const kakao = (providerUserId: string, extra: Partial<OAuthProfile> = {}): OAuthProfile => ({
  provider: "kakao",
  providerUserId,
  email: null,
  emailVerified: false,
  name: null,
  phone: null,
  ...extra,
});

describe("소셜 로그인 — mock 공급자", () => {
  it("code(JSON)를 정규화 프로필로 교환", async () => {
    const p = getOAuthProvider("kakao");
    expect(p.name).toBe("kakao");
    const prof = await p.exchangeCode({
      code: JSON.stringify({
        providerUserId: "k1",
        email: "a@b.com",
        emailVerified: true,
        name: "김철수",
      }),
      redirectUri: "https://x/cb",
    });
    expect(prof).toMatchObject({
      provider: "kakao",
      providerUserId: "k1",
      email: "a@b.com",
      emailVerified: true,
      name: "김철수",
    });
    expect(p.getAuthorizeUrl({ state: "s1", redirectUri: "https://x/cb" })).toContain("state=s1");
  });

  it("미지원 공급자는 throw", () => {
    expect(() => getOAuthProvider("google")).toThrow();
  });
});

describe("교인 클레임(A안) — 결정적 매핑", () => {
  it("발급→소진: app_user.member_id 바인딩 + member 역할 + 소셜 전용(비번 null)", async () => {
    const a = await createChurch();
    created.push(a);
    await seedDefaultRoles(a);
    const m = await createMember(a, { name: "김철수" });

    const token = await issueMemberClaim(a, m.memberId);
    const { userId } = await redeemMemberClaim({
      churchId: a,
      rawToken: token,
      profile: kakao("k1", { email: "a@b.com", emailVerified: true, name: "K" }),
    });

    // 교인 매핑 seam: app_user.member_id → member
    const me = await getUserMember(a, userId);
    expect(me?.memberId).toBe(m.memberId);
    expect(me?.name).toBe("김철수"); // member 의 이름(프로필 아님)

    // member 역할 부여
    expect(await getUserRoleNames(a, userId)).toContain("member");

    // 소셜 전용 계정: loginId/passwordHash null
    const rows = await withTenant(a, (tx) =>
      tx.select().from(appUser).where(eq(appUser.userId, userId)),
    );
    expect(rows[0]!.passwordHash).toBeNull();
    expect(rows[0]!.loginId).toBeNull();

    // 신원 조회 동작
    expect(await findUserIdByIdentity(a, "kakao", "k1")).toBe(userId);
  });

  it("무효/중복/만료/이미연결 클레임 거부", async () => {
    const a = await createChurch();
    created.push(a);
    await seedDefaultRoles(a);
    const m1 = await createMember(a, { name: "갑" });
    const m2 = await createMember(a, { name: "을" });

    // 무효 토큰
    await expect(
      redeemMemberClaim({ churchId: a, rawToken: "nope", profile: kakao("x1") }),
    ).rejects.toBeInstanceOf(ClaimError);

    // 정상 소진 후 중복 소진 거부
    const t1 = await issueMemberClaim(a, m1.memberId);
    await redeemMemberClaim({ churchId: a, rawToken: t1, profile: kakao("k1") });
    await expect(
      redeemMemberClaim({ churchId: a, rawToken: t1, profile: kakao("k1") }),
    ).rejects.toMatchObject({ code: "already_redeemed" });

    // 이미 연결된 소셜 신원(k1)은 다른 클레임으로도 재연결 거부
    const t2 = await issueMemberClaim(a, m2.memberId);
    await expect(
      redeemMemberClaim({ churchId: a, rawToken: t2, profile: kakao("k1") }),
    ).rejects.toMatchObject({ code: "identity_already_linked" });

    // 만료 클레임 거부(과거 만료로 직접 삽입)
    const raw = randomBytes(16).toString("hex");
    const tokenHash = createHash("sha256").update(raw).digest("hex");
    await withTenant(a, (tx) =>
      tx.insert(memberClaim).values({
        churchId: a,
        memberId: m2.memberId,
        tokenHash,
        expiresAt: new Date(Date.now() - 1000),
      }),
    );
    await expect(
      redeemMemberClaim({ churchId: a, rawToken: raw, profile: kakao("k9") }),
    ).rejects.toMatchObject({ code: "expired_claim" });
  });

  it("클레임은 발급 교회 밖에서 소진 불가(교회 격리)", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    await seedDefaultRoles(a);
    const m = await createMember(a, { name: "갑" });
    const token = await issueMemberClaim(a, m.memberId);

    // 다른 교회(b) 스코프로는 클레임이 보이지 않음 → 무효
    await expect(
      redeemMemberClaim({ churchId: b, rawToken: token, profile: kakao("k1") }),
    ).rejects.toBeInstanceOf(ClaimError);
  });
});

describe("신원 연결/격리 + 로그인 가드", () => {
  it("findUserIdByIdentity 교회 격리 + linkIdentity 멱등", async () => {
    const a = await createChurch();
    const b = await createChurch();
    created.push(a, b);
    await seedDefaultRoles(a);
    const m = await createMember(a, { name: "갑" });
    const token = await issueMemberClaim(a, m.memberId);
    const { userId } = await redeemMemberClaim({
      churchId: a,
      rawToken: token,
      profile: kakao("k1"),
    });

    // 격리: 같은 (provider, providerUserId) 라도 다른 교회에선 미연결
    expect(await findUserIdByIdentity(a, "kakao", "k1")).toBe(userId);
    expect(await findUserIdByIdentity(b, "kakao", "k1")).toBeNull();

    // 멱등: 같은 신원 재연결은 무시(에러 없음, 그대로 동일 사용자)
    await linkIdentity({ churchId: a, userId, profile: kakao("k1") });
    expect(await findUserIdByIdentity(a, "kakao", "k1")).toBe(userId);
  });

  it("미연결 신원 로그인은 identity_not_linked(클레임/접수로 안내)", async () => {
    const a = await createChurch();
    created.push(a);
    const res = await loginWithIdentity({ churchId: a, profile: kakao("unlinked") });
    expect(res).toEqual({ ok: false, error: "identity_not_linked" });
  });

  it("소셜 전용 계정(passwordHash null)은 비번 로그인 차단", async () => {
    const a = await createChurch();
    created.push(a);
    const loginId = uniqueCode("social");
    await withSystem((tx) =>
      tx.insert(appUser).values({
        churchId: a,
        loginId,
        passwordHash: null,
        name: "소셜계정",
      }),
    );
    const res = await login({ churchId: a, loginId, password: "whatever12" });
    expect(res).toEqual({ ok: false, error: "invalid_credentials" });
  });
});
