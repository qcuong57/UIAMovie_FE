// src/hooks/usePagination.js
// ─── Hook phân trang dùng chung toàn dự án ────────────────────────────────────
//
// Hỗ trợ 2 chế độ:
//   1. Server-side  — totalItems truyền từ API, tự navigate page → trigger fetch
//   2. Client-side  — truyền array data, hook tự slice theo trang
//
// Usage — server-side:
//   const pg = usePagination({ total: 200, pageSize: 24 });
//   useEffect(() => fetchMovies(pg.page), [pg.page]);
//   <Pagination {...pg.props} />
//
// Usage — client-side (array):
//   const pg = usePagination({ total: movies.length, pageSize: 24 });
//   const pageMovies = pg.paginate(movies);
//   <Pagination {...pg.props} />

import { useState, useMemo, useCallback, useEffect } from 'react';

/**
 * @param {Object}  opts
 * @param {number}  opts.total        — Tổng số item (bắt buộc)
 * @param {number}  [opts.pageSize]   — Số item mỗi trang (default: 24)
 * @param {number}  [opts.initialPage]— Trang khởi đầu   (default: 1)
 * @param {number}  [opts.siblingCount]—Số trang lân cận (default: 1)
 * @param {Function}[opts.onPageChange]— Callback khi đổi trang (optional)
 */
export function usePagination({
  total = 0,
  pageSize = 24,
  initialPage = 1,
  siblingCount = 1,
  onPageChange,
} = {}) {
  const [page, setPageRaw] = useState(initialPage);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );

  // Clamp về trang hợp lệ khi total thay đổi
  const safePage = Math.min(Math.max(1, page), totalPages);

  const goTo = useCallback(
    (p) => {
      const clamped = Math.min(Math.max(1, p), totalPages);
      setPageRaw(clamped);
      onPageChange?.(clamped);
    },
    [totalPages, onPageChange],
  );

  // Khi total đổi (filter mới), reset về trang 1
  useEffect(() => {
    setPageRaw(1);
  }, [total, pageSize]);

  const next = useCallback(() => goTo(safePage + 1), [goTo, safePage]);
  const prev = useCallback(() => goTo(safePage - 1), [goTo, safePage]);

  const canNext = safePage < totalPages;
  const canPrev = safePage > 1;

  // ── Dãy số trang để render: [1, '...', 4, 5, 6, '...', 20] ─────────────────
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const left  = Math.max(2, safePage - siblingCount);
    const right = Math.min(totalPages - 1, safePage + siblingCount);

    const pages = [1];
    if (left > 2)            pages.push('DOTS_LEFT');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('DOTS_RIGHT');
    pages.push(totalPages);
    return pages;
  }, [totalPages, safePage, siblingCount]);

  // ── Client-side slice ────────────────────────────────────────────────────────
  const paginate = useCallback(
    (arr = []) => {
      const start = (safePage - 1) * pageSize;
      return arr.slice(start, start + pageSize);
    },
    [safePage, pageSize],
  );

  // ── Info text ────────────────────────────────────────────────────────────────
  const info = useMemo(() => {
    if (total === 0) return null;
    const from = Math.min((safePage - 1) * pageSize + 1, total);
    const to   = Math.min(safePage * pageSize, total);
    return { from, to, total };
  }, [safePage, pageSize, total]);

  // ── Props bundle dễ spread vào <Pagination /> ───────────────────────────────
  const props = {
    page:       safePage,
    totalPages,
    total,
    pageSize,
    onPageChange: goTo,
    pageNumbers,
    canNext,
    canPrev,
    info,
  };

  return {
    // State
    page:       safePage,
    totalPages,
    canNext,
    canPrev,
    pageNumbers,
    info,

    // Actions
    goTo,
    next,
    prev,
    setPage: goTo,

    // Helpers
    paginate,
    offset: (safePage - 1) * pageSize,

    // Spread vào <Pagination />
    props,
  };
}

export default usePagination;