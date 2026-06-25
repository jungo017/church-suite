import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * PageHeader 계열 (DESIGNE.md §7.2).
 * 모든 주요 페이지 상단에 제목/설명 + 우측 액션을 일관되게 배치한다.
 *   <PageHeader>
 *     <div>
 *       <PageTitle>교적</PageTitle>
 *       <PageDescription>...</PageDescription>
 *     </div>
 *     <PageActions><Button>교인 등록</Button></PageActions>
 *   </PageHeader>
 */
export function PageHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
      {...props}
    />
  );
}

export function PageTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1 className={cn("text-xl font-bold tracking-tight", className)} {...props} />
  );
}

export function PageDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1 text-sm text-muted-foreground", className)} {...props} />
  );
}

export function PageActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props} />
  );
}
