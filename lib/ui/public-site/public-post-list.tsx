import Link from "next/link";

export type PublicPostItem = {
  href: string;
  title: string;
  meta?: string;
};

/**
 * PublicPostList — 공개 게시판/최근 소식 목록 (DESIGNE.md §10).
 * 제목(링크) + 보조 메타(게시판명·날짜)를 가독성 위주로 표시.
 */
export function PublicPostList({
  items,
  emptyText = "게시된 글이 없습니다.",
}: {
  items: PublicPostItem[];
  emptyText?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <ul className="flex flex-col">
      {items.map((it) => (
        <li key={it.href} className="border-b border-border">
          <Link
            href={it.href}
            className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-primary"
          >
            <span className="font-medium">{it.title}</span>
            {it.meta && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {it.meta}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
