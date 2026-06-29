// 설문/보고(forms) 모듈 매니페스트 (스펙 §1 P-1).
import { PERMISSIONS } from "@/lib/rbac/roles";
import type { ModuleManifest } from "@church/core";

export const formsManifest: ModuleManifest = {
  key: "forms",
  title: "설문/보고",
  basePath: "/forms",
  href: "/forms",
  permission: PERMISSIONS.FORMS_READ,
  nav: [{ href: "/forms", label: "폼 목록", exact: true }],
  ownedSchema: "forms",
  migrations: "drizzle",
  requiresCore: "^0.1.0",
};
