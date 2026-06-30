import "server-only";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@church/core/auth/session";
import type { ModuleKey } from "@church/core";
import { isModuleInstalled } from "./entitlement";

/**
 * 엔타이틀먼트 가드 (스펙 §1 P-1, M3) — module-platform.md §6·§7.
 *
 * RBAC(권한)와 **직교**: 권한=사용자가 할 수 있는 일, 설치=교회가 보유한 제품.
 * 가드는 둘 다 통과해야 한다. 여기서는 "설치" 축만 본다(권한은 lib/rbac/guards).
 */

/**
 * 페이지/레이아웃 가드: 모듈 미설치 → 404.
 * 미설치 모듈 경로는 그 교회에 "존재하지 않는" 것으로 본다(module-platform.md §6).
 * 서버 액션은 레이아웃을 거치지 않으므로 쓰기 보호는 `requireModuleWrite`로 별도 강제.
 */
export async function requireModule(key: ModuleKey): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await isModuleInstalled(user.church_id, key))) notFound();
}

/**
 * 서버 액션(쓰기) 가드: 모듈 미설치 → /forbidden.
 * 레이아웃 가드를 우회하는 직접 액션 호출까지 차단(심층 방어). churchId 는
 * 권한 가드가 이미 검증한 인증 사용자(JWT)에서 받아 중복 조회를 피한다.
 */
export async function requireModuleWrite(
  churchId: string,
  key: ModuleKey,
): Promise<void> {
  if (!(await isModuleInstalled(churchId, key))) redirect("/forbidden");
}
