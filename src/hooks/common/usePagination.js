// src/hooks/usePagination.js
// ─── Hook phân trang dùng chung toàn dự án ────────────────────────────────────
//
// 3 cách dùng:
//   1. Client-side (mảng)  — hook tự slice:
//        const pg = usePagination({ total: list.length, pageSize: 15, resetKey: `${search}|${sort}` });
//        const rows = pg.paginate(list);
//        <AdminPagination {...pg.props} />
//
//   2. Server-side + TanStack Query (KHUYÊN DÙNG) — trang là state ngoài, đưa vào query key:
//        const { page, setPage } = usePageParam({ resetKey: filterSig });         // đổi bộ lọc → về trang 1
//        const { data, isFetching } = useAdminUsers({ page, pageSize, ...filters });
//        const pg = usePagination({ total: data?.total ?? 0, pageSize, page, onPageChange: setPage });
//        <AdminPagination {...pg.props} isFetching={isFetching} />
//      KHÔNG fetch trong useEffect([pg.page]) như cách cũ: TanStack tự fetch khi key đổi.
//
//   3. Cách cũ (không truyền resetKey / page) — vẫn chạy như trước: tự về trang 1 khi `total` đổi
//      (trừ lần tải đầu 0 → N, nên initialPage > 1 không còn bị đè). Nên chuyển sang resetKey.
//
// Khác bản cũ:
//   • Không còn useEffect "total đổi → về trang 1": xoá / thêm / bật Premium không còn làm nhảy trang.
//     Trang chỉ về 1 khi `resetKey` đổi (bộ lọc, sắp xếp...) hoặc `pageSize` đổi.
//   • Total co lại (xoá người cuối của trang) → tự kẹp về trang cuối hợp lệ.
//   • pageNumbers dùng buildPages (luôn cùng số ô) → khớp với PaginationBase, thanh phân trang không giật.

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { buildPages } from "../../components/common/pagination/buildPages";

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/**
 * State trang + tự về trang 1 khi `resetKey` đổi.
 * Dùng "điều chỉnh state trong lúc render" (không useEffect → không render dư, không fetch 2 lần), và
 * ghi lại key mới nên gõ "a" rồi xoá đi KHÔNG làm trang cũ "sống lại".
 */
export function usePageParam({ initialPage = 1, resetKey = "" } = {}) {
  const [state, setState] = useState({ key: resetKey, page: initialPage });
  if (state.key !== resetKey) setState({ key: resetKey, page: 1 });
  const page = state.key === resetKey ? state.page : 1;
  const setPage = useCallback(
    (p) => setState({ key: resetKey, page: p }),
    [resetKey],
  );
  return { page, setPage };
}

/**
 * @param {Object}   opts
 * @param {number}   opts.total          — Tổng số item (server: từ API; client: list.length)
 * @param {number}   [opts.pageSize=28]
 * @param {number}   [opts.initialPage=1]
 * @param {number}   [opts.siblingCount=1]
 * @param {Function} [opts.onPageChange] — gọi khi đổi trang (chế độ controlled: BẮT BUỘC, chính là setter)
 * @param {*}        [opts.resetKey]     — đổi giá trị này → về trang 1 (bộ lọc, sắp xếp...)
 * @param {number}   [opts.page]         — truyền vào = chế độ controlled (trang do bên ngoài giữ, vd. usePageParam)
 */
export function usePagination({
  total = 0,
  pageSize = 28,
  initialPage = 1,
  siblingCount = 1,
  onPageChange,
  resetKey,
  page: controlledPage,
} = {}) {
  const isControlled = controlledPage !== undefined;
  const internal = usePageParam({
    initialPage,
    resetKey: `${resetKey ?? ""}|${pageSize}`,
  });
  const rawPage = isControlled ? controlledPage : internal.page;

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );

  // total = 0 nghĩa là CHƯA biết (đang tải) hoặc rỗng → không kẹp chặn trên, để initialPage > 1 không bị đè
  const safePage =
    total > 0 ? clamp(rawPage, 1, totalPages) : Math.max(1, rawPage);

  const goTo = useCallback(
    (p) => {
      const next = total > 0 ? clamp(p, 1, totalPages) : Math.max(1, p);
      if (!isControlled) internal.setPage(next);
      onPageChange?.(next);
    },
    [total, totalPages, isControlled, internal.setPage, onPageChange],
  );

  // Cách cũ (không resetKey, không controlled): total đổi → về trang 1, bỏ qua lần tải đầu 0 → N
  const legacyReset = resetKey === undefined && !isControlled;
  const prevTotal = useRef(total);
  useEffect(() => {
    if (legacyReset && prevTotal.current > 0 && prevTotal.current !== total)
      internal.setPage(1);
    prevTotal.current = total;
  }, [total, legacyReset, internal.setPage]);

  // Total co lại làm trang hiện tại vượt quá cuối → kéo state về trang cuối hợp lệ
  useEffect(() => {
    if (total > 0 && rawPage > totalPages) goTo(totalPages);
  }, [total, totalPages, rawPage, goTo]);

  const next = useCallback(() => goTo(safePage + 1), [goTo, safePage]);
  const prev = useCallback(() => goTo(safePage - 1), [goTo, safePage]);

  const canNext = safePage < totalPages;
  const canPrev = safePage > 1;

  // Dãy trang: cùng thuật toán với PaginationBase (luôn cùng số ô)
  const pageNumbers = useMemo(
    () => buildPages(safePage, totalPages, siblingCount),
    [safePage, totalPages, siblingCount],
  );

  // ── Client-side slice ──────────────────────────────────────────────────────
  const paginate = useCallback(
    (arr = []) => {
      const start = (safePage - 1) * pageSize;
      return arr.slice(start, start + pageSize);
    },
    [safePage, pageSize],
  );

  const info = useMemo(() => {
    if (total === 0) return null;
    const from = Math.min((safePage - 1) * pageSize + 1, total);
    const to = Math.min(safePage * pageSize, total);
    return { from, to, total };
  }, [safePage, pageSize, total]);

  // Bundle để spread vào <Pagination /> / <AdminPagination />
  const props = {
    page: safePage,
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
    page: safePage,
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
