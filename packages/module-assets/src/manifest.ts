// 비품(자산) 모듈 매니페스트 — P-1 파일럿(결정 #3, module-platform.md §10 M1 선행 선언).
//
// 현재 셸(app/(app)/layout.tsx 의 assets 정의)과 **동일한 네비**를 계약 형태로 선언한다.
// 셸 재배선(레지스트리 기반 합성)은 M2, 코어/스키마 물리 추출은 M0b/M4 — 여기서는 계약 적합성 검증용 선언.

import { PERMISSIONS } from "@church/core/rbac/roles";
import type { ModuleManifest } from "@church/core";

export const assetsManifest: ModuleManifest = {
  key: "assets",
  title: "비품",
  basePath: "/assets",
  href: "/assets",
  permission: PERMISSIONS.ASSETS_READ,
  nav: [
    { href: "/assets", label: "자산 목록", exact: true },
    { href: "/assets/classification", label: "분류 관리", perm: PERMISSIONS.ASSETS_WRITE },
    { href: "/assets/audits", label: "전수조사", perm: PERMISSIONS.ASSETS_WRITE },
    { href: "/assets/labels", label: "QR 라벨" },
    { href: "/assets/new", label: "+ 자산 등록", perm: PERMISSIONS.ASSETS_WRITE },
  ],
  ownedSchema: "assets", // 결정 #2: 모듈 Postgres 스키마(현재는 public, M5에서 이전)
  migrations: "drizzle", // 목표: 모듈별 분리(M4). 현재는 공유 drizzle/
  requiresCore: "^0.1.0",
};
