import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  ACCESS_TTL_SEC,
  REFRESH_TTL_SEC,
} from "./config";
import { signAccessToken, verifyAccessToken, type AccessClaims } from "./jwt";
import { verifyPassword } from "./password";
import { findUserByLogin, findUserById, getUserRoleNames } from "./users";
import {
  issueRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from "./tokens";

const isProd = process.env.NODE_ENV === "production";

async function setAuthCookies(access: string, refresh: string): Promise<void> {
  const c = await cookies();
  const base = { httpOnly: true, sameSite: "lax" as const, secure: isProd, path: "/" };
  c.set(ACCESS_COOKIE, access, { ...base, maxAge: ACCESS_TTL_SEC });
  c.set(REFRESH_COOKIE, refresh, { ...base, maxAge: REFRESH_TTL_SEC });
}

async function clearAuthCookies(): Promise<void> {
  const c = await cookies();
  c.delete(ACCESS_COOKIE);
  c.delete(REFRESH_COOKIE);
}

async function issueSession(user: {
  userId: string;
  churchId: string;
  name: string;
}): Promise<{ roles: string[] }> {
  const roles = await getUserRoleNames(user.churchId, user.userId);
  const access = await signAccessToken({
    sub: user.userId,
    church_id: user.churchId,
    roles,
    name: user.name,
  });
  const ua = (await headers()).get("user-agent");
  const refresh = await issueRefreshToken({
    churchId: user.churchId,
    userId: user.userId,
    userAgent: ua,
  });
  await setAuthCookies(access, refresh);
  return { roles };
}

export type LoginResult =
  | { ok: true; userId: string; roles: string[] }
  | { ok: false; error: string };

/** 로그인: 자격 검증 후 액세스+리프레시 발급(쿠키 설정). */
export async function login(opts: {
  churchId: string;
  loginId: string;
  password: string;
}): Promise<LoginResult> {
  const user = await findUserByLogin(opts.churchId, opts.loginId);
  if (!user || user.status !== "active") {
    return { ok: false, error: "invalid_credentials" };
  }
  const valid = await verifyPassword(opts.password, user.passwordHash);
  if (!valid) return { ok: false, error: "invalid_credentials" };
  const { roles } = await issueSession(user);
  return { ok: true, userId: user.userId, roles };
}

/** 리프레시: 회전(기존 취소 + 새 발급). 재사용 탐지 시 전체 취소. */
export async function refreshSession(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const c = await cookies();
  const raw = c.get(REFRESH_COOKIE)?.value;
  if (!raw) return { ok: false, error: "no_refresh_token" };

  const rec = await findRefreshToken(raw);
  if (!rec) return { ok: false, error: "invalid_refresh_token" };

  if (rec.revokedAt) {
    // 이미 취소된 토큰 재사용 → 탈취 의심, 전체 취소
    await revokeAllUserTokens(rec.userId);
    await clearAuthCookies();
    return { ok: false, error: "revoked_refresh_token" };
  }
  if (rec.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "expired_refresh_token" };
  }

  const user = await findUserById(rec.churchId, rec.userId);
  if (!user || user.status !== "active") {
    await revokeRefreshToken(rec.tokenId);
    await clearAuthCookies();
    return { ok: false, error: "user_inactive" };
  }

  await revokeRefreshToken(rec.tokenId);
  await issueSession(user);
  return { ok: true };
}

/** 로그아웃: 리프레시 취소 + 쿠키 삭제. */
export async function logout(): Promise<void> {
  const c = await cookies();
  const raw = c.get(REFRESH_COOKIE)?.value;
  if (raw) {
    const rec = await findRefreshToken(raw);
    if (rec && !rec.revokedAt) await revokeRefreshToken(rec.tokenId);
  }
  await clearAuthCookies();
}

/** 현재 사용자(액세스 토큰 검증). 없으면 null. */
export async function getCurrentUser(): Promise<AccessClaims | null> {
  const c = await cookies();
  const token = c.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

/** 서버 컴포넌트/페이지 보호용. 미인증이면 /login 으로 리다이렉트. */
export async function requireUser(): Promise<AccessClaims> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
