"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme-toggle";

export type SubItem = { href: string; label: string; exact?: boolean };
export type NavModule = {
  key: string;
  label: string;
  href: string;
  basePath: string;
  sub: SubItem[];
};

function isActive(pathname: string, base: string, exact?: boolean) {
  if (exact) return pathname === base;
  return pathname === base || pathname.startsWith(base + "/");
}

/**
 * 앱 셸: 상단=시스템 전환(교적/재정/비품/홈페이지), 좌측=현재 시스템의 하위메뉴.
 * 각 시스템이 독립 작업공간처럼 동작. 활성 시스템은 현재 경로(basePath 최장 접두)로 판별.
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
      .filter((m) => isActive(pathname, m.basePath))
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
          {modules.map((m) => {
            const on = active?.key === m.key;
            return (
              <Link
                key={m.key}
                href={m.href}
                className={cn(
                  "border-b-2 px-3 py-3 text-sm transition-colors",
                  on
                    ? "border-primary font-semibold text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {m.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/my"
            className={cn(
              "text-sm transition-colors",
              onPersonal
                ? "font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            내 정보
          </Link>
          <span className="text-xs text-muted-foreground">{userName}</span>
          <LogoutButton />
        </div>
      </header>

      <div className="flex flex-1">
        {/* 좌측: 현재 시스템 하위메뉴 */}
        {active && active.sub.length > 0 && (
          <aside className="w-52 shrink-0 border-r border-border bg-card p-4">
            <div className="mb-3 px-2 text-xs font-semibold tracking-wide text-muted-foreground">
              {active.label}
            </div>
            <nav className="flex flex-col gap-1">
              {active.sub.map((s) => {
                const on = isActive(pathname, s.href, s.exact);
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className={cn(
                      "rounded-md px-2 py-1.5 text-sm transition-colors",
                      on
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {s.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
