import Link from "next/link";

// 인증 대시보드 레이아웃 (스펙 §13: app/(app)). SSR.
// ⚠️ 인증 가드는 Phase 0.5(JWT)·0.6(RBAC)에서 추가됩니다.
//    현재는 구조용 셸이며 접근 제어가 없습니다.
const NAV = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/members", label: "교적" },
  { href: "/finance", label: "재정" },
  { href: "/assets", label: "비품" },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1">
      <aside className="w-56 shrink-0 border-r border-black/10 p-4 dark:border-white/15">
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
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
