import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS } from "@/lib/rbac/roles";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme-toggle";

// 인증 대시보드 레이아웃 (스펙 §13: app/(app)). SSR. 색상은 테마 토큰.
const NAV = [
  { href: "/dashboard", label: "대시보드", perm: PERMISSIONS.MEMBERS_READ },
  { href: "/members", label: "교적", perm: PERMISSIONS.MEMBERS_READ },
  { href: "/finance", label: "재정", perm: PERMISSIONS.FINANCE_READ },
  { href: "/assets", label: "비품", perm: PERMISSIONS.ASSETS_READ },
  { href: "/site", label: "홈페이지", perm: PERMISSIONS.SITE_WRITE },
] as const;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const nav = NAV.filter((item) => hasPermission(user.roles, item.perm));
  const linkCls =
    "rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
  return (
    <div className="flex min-h-screen flex-1">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card p-4">
        <div className="mb-6 px-2 text-sm font-semibold">교회 관리</div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={linkCls}>
              {item.label}
            </Link>
          ))}
          <Link href="/my" className={linkCls}>
            내 정보
          </Link>
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3">
          <ThemeToggle />
          <span className="px-2 text-xs text-muted-foreground">{user.name}</span>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
