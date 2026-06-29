import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS, type Permission } from "@/lib/rbac/roles";
import { visibleModules, allModules, type ModuleKey } from "@church/core";
import { ensureModulesRegistered } from "@/lib/modules.server";
import { AppShell, type NavModule } from "./app-shell";

// 인증 영역 레이아웃 (스펙 §13: app/(app)). SSR.
// 정보구조: 상위=시스템(모듈), 하위=각 시스템 기능. 각 시스템은 자기 사이드바를 가진 독립 작업공간.
// 모듈 네비는 **레지스트리(매니페스트)에서 합성**한다(M2 — 하드코딩 제거, 스펙 §1 P-1).
// 대시보드·내 정보는 모듈이 아니라 호스트 특수 탭(대시보드=코어 합성 화면, 결정 #5).

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  ensureModulesRegistered();

  const can = (perm: string) => hasPermission(user.roles, perm as Permission);
  // 엔타이틀먼트(M3) 전까지는 등록된 전 모듈을 설치로 간주.
  const installed = new Set<ModuleKey>(allModules().map((m) => m.key));

  const moduleNav: NavModule[] = visibleModules(allModules(), installed, can).map(
    (m) => ({
      key: m.key,
      label: m.title,
      href: m.href,
      basePath: m.basePath,
      sub: m.nav.map(({ href, label, exact }) => ({ href, label, exact })),
    }),
  );

  // 대시보드(호스트)는 선두 탭. 현행과 동일하게 교적 읽기 권한 기준 노출.
  const dashboardNav: NavModule = {
    key: "dashboard",
    label: "대시보드",
    href: "/dashboard",
    basePath: "/dashboard",
    sub: [],
  };
  const modules = can(PERMISSIONS.MEMBERS_READ)
    ? [dashboardNav, ...moduleNav]
    : moduleNav;

  const personal: NavModule = {
    key: "personal",
    label: "내 정보",
    href: "/my",
    basePath: "/my",
    sub: [
      { href: "/my", label: "내 정보", exact: true },
      { href: "/my/forms", label: "설문/보고" },
      { href: "/my/giving", label: "나의 헌금내역" },
    ],
  };

  return (
    <AppShell modules={modules} personal={personal} userName={user.name}>
      {children}
    </AppShell>
  );
}
