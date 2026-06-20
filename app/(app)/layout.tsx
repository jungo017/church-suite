import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { LogoutButton } from "./logout-button";

// 인증 대시보드 레이아웃 (스펙 §13: app/(app)). SSR.
// 인증 가드(0.5): 미인증이면 requireUser 가 /login 으로 리다이렉트.
// (역할 기반 세부 가드는 0.6 에서 추가)
const NAV = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/members", label: "교적" },
  { href: "/finance", label: "재정" },
  { href: "/assets", label: "비품" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen flex-1">
      <aside className="flex w-56 shrink-0 flex-col border-r border-black/10 p-4 dark:border-white/15">
        <div className="mb-6 px-2 text-sm font-semibold">교회 관리</div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-black/10 pt-3 dark:border-white/15">
          <span className="px-2 text-xs text-gray-500">{user.name}</span>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
