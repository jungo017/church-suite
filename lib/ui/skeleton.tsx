import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton — 로딩 자리표시 (DESIGNE.md §8.5). loading.tsx 에서 사용.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
