// 모듈 읽기 계약 레지스트리 (스펙 §1 P-1, AGENTS §4.1-1) — module-platform.md §5.2.
//
// 모듈 간/대시보드(호스트) 통합을 **직접 결합 없이** 매개한다. 호스트/타 모듈은
// 모듈 테이블을 직접 조회하지 않고, 모듈이 등록한 읽기 계약을 호출한다.
// 순수 데이터 구조(전역 Map) — 등록은 서버 합성 시점에 명시적으로.

import type { ModuleKey } from "./module-contract";

/** 읽기 계약: (churchId) => 데이터. 반환 타입은 호출부가 제네릭으로 좁힌다. */
export type ReadContract<T = unknown> = (churchId: string) => Promise<T>;

const CONTRACTS = new Map<string, ReadContract>();
const keyOf = (mod: ModuleKey, name: string) => `${mod}:${name}`;

/** 모듈이 자기 읽기 계약을 등록(같은 키는 덮어씀 — 멱등 등록 허용). */
export function registerReadContract<T>(
  mod: ModuleKey,
  name: string,
  fn: ReadContract<T>,
): void {
  CONTRACTS.set(keyOf(mod, name), fn as ReadContract);
}

/** 등록된 읽기 계약 조회(없으면 undefined — 모듈 미설치/미등록). */
export function getReadContract<T = unknown>(
  mod: ModuleKey,
  name: string,
): ReadContract<T> | undefined {
  return CONTRACTS.get(keyOf(mod, name)) as ReadContract<T> | undefined;
}

/** 테스트 격리용 — 읽기 계약 레지스트리 초기화. */
export function resetReadContracts(): void {
  CONTRACTS.clear();
}
