import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NavModule } from "./types";

/**
 * ModuleNav — 상단 시스템(모듈) 전환 탭 (DESIGNE.md §7.1).
 * 활성 모듈은 하단 보더 + 굵은 글씨로 구분한다.
 */
export function ModuleNav({
  modules,
  activeKey,
}: {
  modules: NavModule[];
  activeKey?: string;
}) {
  return (
    <nav className="flex flex-wrap items-center">
      {modules.map((m) => {
        const on = activeKey === m.key;
        return (
          <Link
            key={m.key}
            href={m.href}
            aria-current={on ? "page" : undefined}
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
    </nav>
  );
}
