// 모듈 계약 (Module Contract) — 스펙 §1 P-1, 설계: module-platform.md §3.
//
// 각 모듈이 자신을 1급 객체로 "선언"하는 매니페스트. 셸(호스트)은 "설치된 모듈"만
// 이 매니페스트로 합성한다(상단 제품 스위처 + 사이드바 + 라우트 + 권한).
//
// 이 파일은 **순수 타입/데이터** — React·server-only·DB 의존이 없어 서버/클라/테스트 공용.
// (M0a: lib/core 에 시드. pnpm workspace 전환[M0b] 시 packages/core/src 로 그대로 이동.)

import type { Permission } from "@/lib/rbac/roles";

/** 설치 가능한 모듈 키(제품 단위). 대시보드는 코어 합성 화면이라 모듈 아님(§4). */
export type ModuleKey = "members" | "finance" | "assets" | "site" | "forms";

/** 사이드바/하위 네비 항목. section 으로 평면 리스트를 그룹화(DESIGN.md §6). */
export type ModuleNavEntry = {
  href: string;
  label: string;
  /** 정확 경로 매칭(접두 매칭 아님). 목록 루트 등에 사용. */
  exact?: boolean;
  /** 이 항목을 보려면 필요한 권한. 없으면 모듈 진입 권한으로 충분. */
  perm?: Permission;
  /** 사이드바 섹션 헤더(선택). 같은 문자열끼리 묶인다. */
  section?: string;
};

/**
 * 모듈 매니페스트 — 모듈의 자기완결 선언.
 * 통합 seam(공유 Postgres + church_id/RLS + member_id 단일 원본)은 불변이고,
 * 모듈은 자기 화면·권한·소유 스키마·마이그레이션만 선언한다.
 */
export type ModuleManifest = {
  key: ModuleKey;
  /** 제품 스위처 라벨(예: "비품"). */
  title: string;
  /** 활성 모듈 판별 기준 경로(최장 접두 매칭). */
  basePath: string;
  /** 상단 진입 링크(보통 basePath). */
  href: string;
  /** 모듈 진입에 필요한 최소 권한(읽기). */
  permission: Permission;
  /** 사이드바/하위 네비. */
  nav: ModuleNavEntry[];
  /** 이 모듈이 소유하는 Postgres 스키마(예: "assets"). 결정 #2 — module-platform.md §5. */
  ownedSchema: string;
  /** 모듈 마이그레이션 디렉터리(목표 — M4/M5에서 분리. 현재는 공유 `drizzle/`). */
  migrations: string;
  /** 호환 코어 버전(semver range). */
  requiresCore: string;
};
