import Link from "next/link";

/** 목록 페이지네이션(필터 쿼리 보존). totalPages<=1 이면 렌더 안 함. */
export function Pagination({
  basePath,
  page,
  totalPages,
  params = {},
}: {
  basePath: string;
  page: number;
  totalPages: number;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };
  const linkCls =
    "rounded-md border border-border px-3 py-1.5";
  const disabledCls = "rounded-md px-3 py-1.5 opacity-40";

  return (
    <div className="flex items-center justify-center gap-3 py-2 text-sm">
      {page > 1 ? (
        <Link href={href(page - 1)} className={linkCls}>← 이전</Link>
      ) : (
        <span className={disabledCls}>← 이전</span>
      )}
      <span className="text-muted-foreground">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={href(page + 1)} className={linkCls}>다음 →</Link>
      ) : (
        <span className={disabledCls}>다음 →</span>
      )}
    </div>
  );
}
