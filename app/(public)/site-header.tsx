import Link from "next/link";

type NavItem = { href: string; label: string };

// 공개 교회 사이트 헤더 (발행 페이지/게시판 메뉴).
export function SiteHeader({
  churchName,
  pages,
  boards,
}: {
  churchName: string;
  pages: { slug: string; title: string }[];
  boards: { slug: string; name: string }[];
}) {
  const nav: NavItem[] = [
    ...pages.map((p) => ({ href: `/p/${p.slug}`, label: p.title })),
    ...boards.map((b) => ({ href: `/b/${b.slug}`, label: b.name })),
  ];
  return (
    <header className="border-b border-black/10 dark:border-white/15">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-6 py-4">
        <Link href="/" className="text-lg font-bold">{churchName}</Link>
        <nav className="flex flex-wrap gap-3 text-sm">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-gray-600 hover:underline dark:text-gray-300">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
