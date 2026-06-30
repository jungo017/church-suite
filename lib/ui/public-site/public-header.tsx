import Link from "next/link";

type NavItem = { href: string; label: string };

/**
 * PublicHeader — 공개 교회 사이트 헤더 (DESIGNE.md §10).
 * 내부 관리자 UI 와 분리된 톤: 교회명 강조 + 발행 페이지/게시판 메뉴.
 */
export function PublicHeader({
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
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-5">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          {churchName}
        </Link>
        {nav.length > 0 && (
          <nav className="flex flex-wrap gap-4 text-sm">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
