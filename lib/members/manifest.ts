// 교적(members) 모듈 매니페스트 (스펙 §1 P-1). 셸은 레지스트리에서 이 선언으로 네비를 합성(M2).
import { PERMISSIONS } from "@church/core/rbac/roles";
import type { ModuleManifest } from "@church/core";

export const membersManifest: ModuleManifest = {
  key: "members",
  title: "교적",
  basePath: "/members",
  href: "/members",
  permission: PERMISSIONS.MEMBERS_READ,
  nav: [
    { href: "/members", label: "교인 명단", exact: true },
    { href: "/members/stats", label: "통계" },
    { href: "/members/attendance", label: "출석", perm: PERMISSIONS.MEMBERS_WRITE },
    { href: "/members/kiosk", label: "키오스크", perm: PERMISSIONS.MEMBERS_WRITE },
    { href: "/members/labels", label: "QR 라벨", perm: PERMISSIONS.MEMBERS_WRITE },
    { href: "/members/education", label: "교육", perm: PERMISSIONS.MEMBERS_WRITE },
    { href: "/members/org", label: "직분/직책", perm: PERMISSIONS.MEMBERS_WRITE },
    { href: "/members/org/assignments", label: "조직 편성", perm: PERMISSIONS.MEMBERS_WRITE },
    { href: "/members/families", label: "가족 관리", perm: PERMISSIONS.MEMBERS_WRITE },
    { href: "/members/notify", label: "문자/알림", perm: PERMISSIONS.MEMBERS_WRITE },
    { href: "/members/compliance", label: "컴플라이언스", perm: PERMISSIONS.CHURCH_MANAGE },
    { href: "/members/new", label: "+ 교인 등록", perm: PERMISSIONS.MEMBERS_WRITE },
  ],
  ownedSchema: "members",
  migrations: "drizzle",
  requiresCore: "^0.1.0",
};
