/** 내부 앱 내비게이션 모델 (DESIGNE.md §6, §7.1). */
export type SubItem = { href: string; label: string; exact?: boolean };
export type NavModule = {
  key: string;
  label: string;
  href: string;
  basePath: string;
  sub: SubItem[];
};

/** 경로 활성 판별 — exact 면 정확히 일치, 아니면 접두 일치. */
export function isActivePath(pathname: string, base: string, exact?: boolean) {
  if (exact) return pathname === base;
  return pathname === base || pathname.startsWith(base + "/");
}
