// 페이지네이션 공통 유틸 (순수). 대량 데이터 목록에 사용.

export const DEFAULT_PAGE_SIZE = 20;

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** searchParams 의 page/size 를 정규화. page>=1, size 1~100. */
export function pageParams(
  input: { page?: string; size?: string },
  defaultSize = DEFAULT_PAGE_SIZE,
): { page: number; pageSize: number; offset: number } {
  const page = Math.max(1, Number(input.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(input.size) || defaultSize));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

/** rows + total 을 Paged 결과로 래핑. */
export function toPaged<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): Paged<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
