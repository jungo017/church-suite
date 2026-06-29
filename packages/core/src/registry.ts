// 모듈 레지스트리 + 가시성 선택 — 스펙 §1 P-1, 설계: module-platform.md §6·§7.
//
// 핵심 규칙: 셸이 노출하는 모듈 = 전체 ∩ installedModules(엔타이틀먼트) ∩ RBAC(권한).
// - installedModules: 교회별 설치 상태(번들/애드온의 출처와 무관한 Set — 결정 #4).
// - RBAC: 사용자 역할 권한.
//
// `visibleModules` 는 **순수 함수**(전역 상태·DB·RBAC 의존 없음) → 단위테스트 용이.
// 권한 검사는 호출부가 주입(DI)한다 → core 가 앱(@/lib/rbac)을 역참조하지 않음.
// 레지스트리(전역 Map)는 모듈 자기등록용 편의 — 임포트 부수효과 없이 명시 등록.

import type { ModuleKey, ModuleManifest, PermissionKey } from "./module-contract";

/** 권한 보유 여부 판정자(호출부에서 RBAC 기반으로 주입). */
export type Can = (perm: PermissionKey) => boolean;

const REGISTRY = new Map<ModuleKey, ModuleManifest>();

/** 모듈 매니페스트 등록(빌드타임 정적 등록). 중복 키는 조용히 덮지 않고 throw. */
export function registerModule(manifest: ModuleManifest): void {
  if (REGISTRY.has(manifest.key)) {
    throw new Error(`module already registered: ${manifest.key}`);
  }
  REGISTRY.set(manifest.key, manifest);
}

/** 등록된 전체 매니페스트(등록 순서). */
export function allModules(): ModuleManifest[] {
  return [...REGISTRY.values()];
}

export function getModule(key: ModuleKey): ModuleManifest | undefined {
  return REGISTRY.get(key);
}

/** 테스트 격리용 — 레지스트리 초기화. */
export function resetRegistry(): void {
  REGISTRY.clear();
}

/**
 * 교회에 설치되고(installed) 사용자가 접근 가능한(can) 모듈만,
 * 권한 통과 네비만 남겨 반환. = 전체 ∩ installedModules ∩ RBAC.
 *
 * 순수 함수: 입력만으로 결정되며 전역 상태/DB/RBAC를 직접 읽지 않는다(can 주입).
 */
export function visibleModules(
  manifests: readonly ModuleManifest[],
  installed: ReadonlySet<ModuleKey>,
  can: Can,
): ModuleManifest[] {
  return manifests
    .filter((m) => installed.has(m.key))
    .filter((m) => can(m.permission))
    .map((m) => ({
      ...m,
      nav: m.nav.filter((n) => !n.perm || can(n.perm)),
    }));
}

/** 레지스트리 기준 편의 래퍼 — 셸에서 사용. */
export function visibleFromRegistry(
  installed: ReadonlySet<ModuleKey>,
  can: Can,
): ModuleManifest[] {
  return visibleModules(allModules(), installed, can);
}
