// 재정(finance) 모듈 매니페스트 (스펙 §1 P-1).
import { PERMISSIONS } from "@/lib/rbac/roles";
import type { ModuleManifest } from "@church/core";

export const financeManifest: ModuleManifest = {
  key: "finance",
  title: "재정",
  basePath: "/finance",
  href: "/finance",
  permission: PERMISSIONS.FINANCE_READ,
  nav: [
    { href: "/finance", label: "전표", exact: true },
    { href: "/finance/accounts", label: "계정과목" },
    { href: "/finance/report", label: "보고서(예결산)" },
    { href: "/finance/receipts", label: "기부금영수증" },
    { href: "/finance/new", label: "+ 전표 등록", perm: PERMISSIONS.FINANCE_WRITE },
  ],
  ownedSchema: "finance",
  migrations: "drizzle",
  requiresCore: "^0.1.0",
};
