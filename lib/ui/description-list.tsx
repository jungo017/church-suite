import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * DescriptionList / KeyValueList — 상세 페이지의 키-값 정보 묶음 (DESIGNE.md §8.3).
 * 섹션을 전부 카드로 감싸지 않고, 라벨-값을 반응형 그리드로 정렬한다.
 *   <DescriptionList>
 *     <DescriptionItem label="이름">홍길동</DescriptionItem>
 *     <DescriptionItem label="연락처">010-…</DescriptionItem>
 *   </DescriptionList>
 */
export function DescriptionList({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2",
        className,
      )}
    >
      {children}
    </dl>
  );
}

export function DescriptionItem({
  label,
  children,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children ?? "—"}</dd>
    </div>
  );
}
