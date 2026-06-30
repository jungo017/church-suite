import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 공개 사이트 페이지 제목 (DESIGNE.md §10). 내부 앱보다 크게. */
export function PublicPageTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn("text-2xl font-bold tracking-tight md:text-3xl", className)}
      {...props}
    />
  );
}

/** 공개 사이트 섹션 — 제목 + 콘텐츠를 넉넉한 간격으로. */
export function PublicSection({
  title,
  children,
  className,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mt-10", className)}>
      {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}
