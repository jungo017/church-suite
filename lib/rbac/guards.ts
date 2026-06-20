import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import type { AccessClaims } from "@/lib/auth/jwt";
import {
  hasRole,
  hasAnyRole,
  hasPermission,
  type RoleName,
  type Permission,
} from "./roles";

/**
 * RBAC 가드 (스펙 §9). 역할/권한은 액세스 토큰(JWT) 클레임 기준.
 * 역할 변경은 재로그인/리프레시 시 반영(짧은 액세스 TTL).
 */

// ── 페이지/서버 컴포넌트용: 미인증→/login, 권한부족→/forbidden ──
export async function requireRole(role: RoleName): Promise<AccessClaims> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user.roles, role)) redirect("/forbidden");
  return user;
}

export async function requireAnyRole(roles: RoleName[]): Promise<AccessClaims> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasAnyRole(user.roles, roles)) redirect("/forbidden");
  return user;
}

export async function requirePermission(
  perm: Permission,
): Promise<AccessClaims> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user.roles, perm)) redirect("/forbidden");
  return user;
}

// ── API 라우트 핸들러용: 상태코드는 호출부에서 매핑 ──
export type GuardResult =
  | { ok: true; user: AccessClaims }
  | { ok: false; error: "unauthenticated" | "forbidden" };

export async function checkRole(role: RoleName): Promise<GuardResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  if (!hasRole(user.roles, role)) return { ok: false, error: "forbidden" };
  return { ok: true, user };
}

export async function checkPermission(perm: Permission): Promise<GuardResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  if (!hasPermission(user.roles, perm)) return { ok: false, error: "forbidden" };
  return { ok: true, user };
}

/** API 가드 결과를 HTTP 상태로 매핑(401/403). */
export function guardStatus(error: "unauthenticated" | "forbidden"): number {
  return error === "unauthenticated" ? 401 : 403;
}
