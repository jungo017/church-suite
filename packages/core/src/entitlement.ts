// 엔타이틀먼트 가격 정책 레이어 (스펙 §1 P-1) — module-platform.md §7.
//
// "교회별 설치 = installedModules: Set<ModuleKey>" 의 **출처**를 한곳에 모은다.
// 설계 원칙: 코드는 항상 Set 기반(애드온-ready)으로 작성하고, 번들↔애드온은
// *이 가격 정책 레이어에서만* 결정한다(아키텍처/가드/네비는 Set 만 본다).
//
// 이 파일은 **순수 데이터/함수** — DB·앱 의존 없음. 교회의 활성 구독→플랜명 해석은
// 앱(lib/billing)이 하고, "플랜명 → 모듈 집합" 매핑만 여기(core)가 소유한다.

import type { ModuleKey } from "./module-contract";

/** 전체 모듈 키 — 런타임 목록(타입 ModuleKey 와 동기 유지). */
export const MODULE_KEYS: readonly ModuleKey[] = [
  "members",
  "finance",
  "assets",
  "site",
  "forms",
];

/** 기본 플랜명 — 미구독/미지정 플랜의 폴백(잠금 방지). */
export const DEFAULT_PLAN = "free";

/**
 * 플랜명 → 설치 모듈 집합 (번들/티어).
 *
 * **현재 결정(출시 전): 모든 티어 = 전체 모듈**(현행 동작 유지). 티어 분리/애드온은
 * 이 맵만 바꾸면 됨 — 나머지 코드는 Set 기반이라 재설계 불필요(module-platform.md §13).
 * 예) 티어 분리 시: free→[members], standard→[members,finance,assets], pro→전체.
 */
const PLAN_MODULES: Record<string, readonly ModuleKey[]> = {
  free: MODULE_KEYS,
  standard: MODULE_KEYS,
  pro: MODULE_KEYS,
};

/**
 * 플랜명으로 설치 모듈 집합을 해석한다(순수 함수).
 * 미지정/미지원 플랜명은 기본 플랜으로 폴백한다.
 */
export function modulesForPlan(planName: string): ReadonlySet<ModuleKey> {
  const keys = PLAN_MODULES[planName] ?? PLAN_MODULES[DEFAULT_PLAN];
  return new Set(keys);
}
