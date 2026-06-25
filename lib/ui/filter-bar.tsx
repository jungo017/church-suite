import type { FormHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * FilterBar — 목록 화면의 검색/필터 도구 모음 (DESIGNE.md §8.1).
 * 검색 input → select → date → submit 순으로 배치. submit 은 텍스트 유지.
 * GET form 으로 query param 을 유지한다.
 */
export function FilterBar({
  className,
  ...props
}: FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form
      className={cn("flex flex-wrap items-end gap-2 text-sm", className)}
      {...props}
    />
  );
}
