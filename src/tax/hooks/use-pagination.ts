import { useEffect, useMemo, useState } from "react";

export const DEFAULT_PAGE_SIZE = 20;

export interface Pagination<T> {
  /** 0-based current page (clamped to the last page) */
  page: number;
  pages: number;
  total: number;
  /** 1-based index of the first / last item on this page (0 when empty) */
  from: number;
  to: number;
  items: T[];
  setPage: (page: number) => void;
}

/**
 * Client-side pagination. Jumps back to the first page whenever `resetKey`
 * changes (new search, filter or sort).
 */
export function usePagination<T>(
  all: readonly T[],
  pageSize: number = DEFAULT_PAGE_SIZE,
  resetKey?: unknown,
): Pagination<T> {
  const [page, setPage] = useState(0);
  useEffect(() => {
    void resetKey;
    setPage(0);
  }, [resetKey]);

  const pages = Math.max(1, Math.ceil(all.length / pageSize));
  const current = Math.min(page, pages - 1);
  const items = useMemo(
    () => all.slice(current * pageSize, (current + 1) * pageSize),
    [all, current, pageSize],
  );
  return {
    page: current,
    pages,
    total: all.length,
    from: all.length === 0 ? 0 : current * pageSize + 1,
    to: Math.min((current + 1) * pageSize, all.length),
    items,
    setPage,
  };
}
