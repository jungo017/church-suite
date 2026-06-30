// 홈페이지(site/CMS) 모듈 매니페스트 (스펙 §1 P-1). 진입 권한은 현행과 동일하게 SITE_WRITE.
import { PERMISSIONS } from "@church/core/rbac/roles";
import type { ModuleManifest } from "@church/core";

export const siteManifest: ModuleManifest = {
  key: "site",
  title: "홈페이지",
  basePath: "/site",
  href: "/site",
  permission: PERMISSIONS.SITE_WRITE,
  nav: [
    { href: "/site", label: "개요", exact: true },
    { href: "/site/new-family", label: "새가족 신청" },
    { href: "/site/offerings", label: "온라인 헌금" },
  ],
  ownedSchema: "site",
  migrations: "drizzle",
  requiresCore: "^0.1.0",
};
