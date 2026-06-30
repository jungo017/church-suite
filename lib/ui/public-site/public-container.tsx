import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * PublicContainer — 공개 사이트 본문 컨테이너 (DESIGNE.md §10).
 * 콘텐츠 가독성 우선: 좁은 폭 + 넉넉한 세로 여백(모바일 우선).
 */
export function PublicContainer({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-3xl flex-1 px-6 py-10 md:py-14",
        className,
      )}
      {...props}
    />
  );
}

/** 공개 사이트 전체 셸: 화면 높이 + 헤더/본문/푸터 세로 배치. */
export function PublicShell({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex min-h-screen flex-col", className)} {...props} />
  );
}

/** 공개 사이트 푸터 — 교회명 + 저작권. */
export function PublicFooter({ name }: { name: string }) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-3xl px-6 py-6 text-xs text-muted-foreground">
        © {name}
      </div>
    </footer>
  );
}
