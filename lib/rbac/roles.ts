// RBAC 역할·권한 정의 (스펙 §9). 순수 모듈(서버/클라이언트 공용, UI 게이팅에도 사용).
//
// 권한은 우선 "역할 → 권한 집합" 정적 맵으로 코드에 둔다(세밀해지면 PERMISSION 테이블 추가, 스펙 §6.1).
// 사람에 권한을 직접 박지 않는다 — 항상 ROLE 경유.

export const ROLES = {
  ADMIN: "admin",
  STAFF: "staff",
  VIEWER: "viewer",
  MEMBER: "member", // 교인 셀프 포털(온라인교인센터) — 관리 권한 없음
} as const;
export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  MEMBERS_READ: "members:read",
  MEMBERS_WRITE: "members:write",
  FINANCE_READ: "finance:read",
  FINANCE_WRITE: "finance:write",
  ASSETS_READ: "assets:read",
  ASSETS_WRITE: "assets:write",
  SITE_READ: "site:read",
  SITE_WRITE: "site:write", // 홈페이지/CMS·접수 관리
  FORMS_READ: "forms:read",
  FORMS_WRITE: "forms:write", // 설문·보고 템플릿/배정/집계 관리
  CHURCH_MANAGE: "church:manage", // 사용자·역할·교회 설정 관리
} as const;
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  admin: ALL_PERMISSIONS,
  staff: [
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.MEMBERS_WRITE,
    PERMISSIONS.ASSETS_READ,
    PERMISSIONS.ASSETS_WRITE,
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.SITE_READ,
    PERMISSIONS.SITE_WRITE,
    PERMISSIONS.FORMS_READ,
    PERMISSIONS.FORMS_WRITE,
  ],
  viewer: [
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.ASSETS_READ,
    PERMISSIONS.SITE_READ,
    PERMISSIONS.FORMS_READ,
  ],
  // 교인: 관리 권한 없음(셀프 포털에서 본인 데이터만 — 앱 레벨에서 보장)
  member: [],
};

/** 온보딩 시 생성할 기본 역할(스펙 0.6). */
export const DEFAULT_ROLES: { name: RoleName; label: string }[] = [
  { name: ROLES.ADMIN, label: "관리자" },
  { name: ROLES.STAFF, label: "직원" },
  { name: ROLES.VIEWER, label: "열람" },
  { name: ROLES.MEMBER, label: "교인" },
];

export function hasRole(roles: string[], role: RoleName): boolean {
  return roles.includes(role);
}

export function hasAnyRole(roles: string[], required: RoleName[]): boolean {
  return required.some((r) => roles.includes(r));
}

export function permissionsFor(roles: string[]): Set<string> {
  const set = new Set<string>();
  for (const r of roles) {
    const perms = ROLE_PERMISSIONS[r as RoleName];
    if (perms) for (const p of perms) set.add(p);
  }
  return set;
}

export function hasPermission(roles: string[], perm: Permission): boolean {
  return permissionsFor(roles).has(perm);
}
