import Link from "next/link";
import { cn } from "@/lib/utils";
import { isActivePath, type NavModule } from "./types";

/**
 * AppSidebar — 현재 모듈의 하위 메뉴 (DESIGNE.md §7.1).
 * 데스크톱 좌측 고정 컬럼. 모바일에서는 숨기고 MobileSubnav 로 대체한다(§7.3).
 */
export function AppSidebar({
  module,
  pathname,
}: {
  module: NavModule;
  pathname: string;
}) {
  if (module.sub.length === 0) return null;
  return (
    <aside className="hidden w-52 shrink-0 border-r border-border bg-card p-4 md:block">
      <div className="mb-3 px-2 text-xs font-semibold tracking-wide text-muted-foreground">
        {module.label}
      </div>
      <nav className="flex flex-col gap-1">
        {module.sub.map((s) => {
          const on = isActivePath(pathname, s.href, s.exact);
          return (
            <Link
              key={s.href}
              href={s.href}
              aria-current={on ? "page" : undefined}
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
  );
}

/**
 * MobileSubnav — 모바일 전용 가로 스크롤 하위 메뉴 (DESIGNE.md §7.3).
 * 데스크톱에서는 숨긴다(좌측 AppSidebar 사용).
 */
export function MobileSubnav({
  module,
  pathname,
}: {
  module: NavModule;
  pathname: string;
}) {
  if (module.sub.length === 0) return null;
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 pb-2 md:hidden">
      {module.sub.map((s) => {
        const on = isActivePath(pathname, s.href, s.exact);
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-2.5 py-1.5 text-sm transition-colors",
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
  );
}
