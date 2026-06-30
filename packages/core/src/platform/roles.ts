export const PLATFORM_ROLES = {
  SADMIN: "sadmin",
  MAINTENANCE: "maintenance",
} as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[keyof typeof PLATFORM_ROLES];

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  sadmin: "전체 관리자",
  maintenance: "유지보수",
};

export function isPlatformRole(role: string): role is PlatformRole {
  return role === PLATFORM_ROLES.SADMIN || role === PLATFORM_ROLES.MAINTENANCE;
}

export function hasPlatformRole(
  roles: string[],
  allowed: PlatformRole[],
): boolean {
  return allowed.some((role) => roles.includes(role));
}
