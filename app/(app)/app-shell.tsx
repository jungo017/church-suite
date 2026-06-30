"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModuleNav } from "@/lib/ui/app/module-nav";
import { AppSidebar, MobileSubnav } from "@/lib/ui/app/app-sidebar";
import { isActivePath, type NavModule, type SubItem } from "@/lib/ui/app/types";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme-toggle";

// 내비 모델은 lib/ui/app/types 로 이전. layout.tsx 하위호환을 위해 재노출.
export type { NavModule, SubItem };

/**
 * 앱 셸: 상단=시스템 전환(교적/재정/비품/홈페이지), 좌측=현재 시스템의 하위메뉴.
 * 각 시스템이 독립 작업공간처럼 동작. 활성 시스템은 현재 경로(basePath 최장 접두)로 판별.
 * 표현/조립만 담당하고, 권한별 메뉴 필터링은 layout.tsx(SSR)에서 수행한다.
 */
export function AppShell({
  modules,
  personal,
  userName,
  children,
}: {
  modules: NavModule[];
  personal: NavModule;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const all = [...modules, personal];
  const active =
    all
      .filter((m) => isActivePath(pathname, m.basePath))
      .sort((a, b) => b.basePath.length - a.basePath.length)[0] ??
    modules[0] ??
    personal;

  const onPersonal = active?.key === personal.key;

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      {/* 상단: 시스템 전환 */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-4">
        <div className="flex flex-wrap items-center">
          <Link href="/dashboard" className="mr-4 py-3 text-sm font-bold">
            교회 관리
          </Link>
          <ModuleNav modules={modules} activeKey={active?.key} />
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/my"
            aria-current={onPersonal ? "page" : undefined}
            className={cn(
              "flex items-center gap-1 text-sm transition-colors",
              onPersonal
                ? "font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <User className="size-4" />
            내 정보
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {userName}
          </span>
          <LogoutButton />
        </div>
      </header>

      <div className="flex flex-1">
        {/* 좌측: 현재 시스템 하위메뉴(데스크톱) */}
        {active && <AppSidebar module={active} pathname={pathname} />}
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            {/* 모바일 하위메뉴(가로 스크롤) */}
            {active && <MobileSubnav module={active} pathname={pathname} />}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
