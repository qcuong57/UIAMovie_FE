// src/pages/user/Searchpage.jsx
// Làm theo đúng cách của FavoritesPage:
//  • Yêu thích: KHÔNG tự gọi API / giữ state riêng nữa → MovieCard (cả desktop lẫn mobile) tự dùng useFavoriteToggle (cache React Query)
//  • Normalize / bóc response: dùng utils/normalizeMedia + utils/queryHelpers (không viết lại trong trang)
//  • queryKey: queryKeys.search.list(filter) — filter là MỘT object gồm cả page
//  • Loading: LUÔN hiện LoadingScreen khi vào trang (useMinimumLoading) + AnimatePresence để trượt lên
//  • Lỗi: PageError dùng chung
import React, { useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, Tv, Film } from "lucide-react";

import movieService from "../../services/movieService";
import tvShowService from "../../services/tvShowService";
import BackButton from "../../components/common/BackButton";
import Pagination from "../../components/common/Pagination";
import SeoMeta from "../../components/common/SeoMeta";
import PageError from "../../components/common/PageError";
import LoadingScreen from "../../components/ui/LoadingScreen";
import MovieCard from "../../components/movie/MovieCard";
import { SkeletonCard, NoResults, GRID_STYLE } from "../../components/search/SearchUI";

import { C, FONT_DISPLAY, FONT_BODY, GOOGLE_FONTS } from "../../context/homeTokens";
import { useIsMobile } from "../../hooks/common/useIsMobile";
import { useMinimumLoading } from "../../hooks/common/useMinimumLoading";
import { queryKeys, STALE } from "../../config/queryKeys";
import { normalizeMovie, normalizeTvShow, mediaKey } from "../../utils/normalizeMedia";
import { parsePaged } from "../../utils/queryHelpers";

const PAGE_SIZE = 24; // 24 chia hết cho 2/3/4/6 cột → hàng cuối luôn đầy

const movieGrid = (isMobile) =>
  isMobile ? { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 } : GRID_STYLE;

const COUNTRY_LABEL = {
  US: "Âu Mỹ", PL: "Ba Lan", TW: "Đài Loan", KR: "Hàn Quốc",
  HK: "Hồng Kông", JP: "Nhật Bản", PH: "Philippines", TH: "Thái Lan",
  CN: "Trung Quốc", VN: "Việt Nam",
};

const TV_STATUS_LABEL = {
  "Returning Series": "Đang chiếu",
  "Ended": "Đã kết thúc",
  "Canceled": "Đã hủy",
  "In Production": "Đang sản xuất",
};

// ── Gọi API (ngoài component → tham chiếu ổn định) ───────────────────────────
// filter: { type, q, genreIds("1,2"), minRating, originCountry, fromDate, toDate, sortBy, sortDesc, status? }
const commonParams = (f, page) => ({
  page,
  pageSize: PAGE_SIZE,
  search: f.q || undefined,
  genreIds: f.genreIds ? f.genreIds.split(",") : undefined,
  minRating: f.minRating > 0 ? f.minRating : undefined,
  originCountry: f.originCountry || undefined,
  sortDesc: f.sortDesc,
});

const fetchMovies = async (f, page) => {
  const res = await movieService.getMovies({
    ...commonParams(f, page),
    fromReleaseDate: f.fromDate || undefined,
    toReleaseDate: f.toDate || undefined,
    sortBy: f.sortBy,
  });
  const { items, total } = parsePaged(res, ["movies"]);
  return { items: items.map(normalizeMovie), total };
};

const fetchTvShows = async (f, page) => {
  const res = await tvShowService.getTvShows({
    ...commonParams(f, page),
    fromFirstAirDate: f.fromDate || undefined,
    toFirstAirDate: f.toDate || undefined,
    sortBy: f.sortBy === "releaseDate" ? "firstairdate" : f.sortBy,
    status: f.status || undefined,
  });
  const { items, total } = parsePaged(res, ["tvShows"]);
  return { items: items.map(normalizeTvShow), total };
};

// Dùng chung cho useQuery và prefetch → hai bên luôn cùng một key
const searchQueryOptions = (filter, page) => ({
  queryKey: queryKeys.search.list({ ...filter, page }),
  queryFn: () => (filter.type === "movie" ? fetchMovies : fetchTvShows)(filter, page),
  staleTime: STALE.list,
  placeholderData: keepPreviousData, // đổi trang / đổi bộ lọc: giữ kết quả cũ (mờ đi) thay vì nháy trống
});

const preloadPosters = (items) =>
  items.forEach((m) => {
    if (m.posterUrl) new Image().src = m.posterUrl;
  });

// ── UI ───────────────────────────────────────────────────────────────────────
const ContentTypeTabs = ({ activeTab, onTabChange, movieCount, tvCount, loading, isMobile }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 4,
    marginBottom: isMobile ? 18 : 24,
    background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3,
    width: "fit-content", border: "1px solid rgba(255,255,255,0.07)",
  }}>
    {[
      { key: "movie", label: "Phim", icon: Film, count: movieCount },
      { key: "tvshow", label: "TV Show", icon: Tv, count: tvCount },
    ].map(({ key, label, icon: Icon, count }) => {
      const active = activeTab === key;
      return (
        <motion.button
          key={key}
          onClick={() => onTabChange(key)}
          whileTap={{ scale: 0.97 }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: isMobile ? "6px 14px" : "8px 18px",
            borderRadius: 7, border: "none", cursor: "pointer",
            background: active ? C.accent : "transparent",
            color: active ? "white" : "rgba(255,255,255,0.5)",
            fontFamily: FONT_BODY, fontSize: isMobile ? 12 : 13,
            fontWeight: active ? 700 : 500, transition: "all 0.18s",
          }}
        >
          <Icon size={isMobile ? 13 : 14} strokeWidth={active ? 2.5 : 2} />
          {label}
          {!loading && count != null && (
            <span style={{
              padding: "1px 6px", borderRadius: 99, fontSize: 10, fontWeight: 700,
              background: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
              color: active ? "white" : "rgba(255,255,255,0.4)",
            }}>
              {count}
            </span>
          )}
        </motion.button>
      );
    })}
  </div>
);

const FilterBadge = ({ label }) => (
  <motion.span
    layout
    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
    style={{
      padding: "3px 9px", borderRadius: 999,
      background: "rgba(229,24,30,0.12)", border: "1px solid rgba(229,24,30,0.3)",
      color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 600,
      fontFamily: FONT_BODY, whiteSpace: "nowrap",
    }}
  >
    {label}
  </motion.span>
);

// ══════════════════════════════════════════════════════════════════════════════
export default function SearchPage() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Mọi trạng thái nằm trên URL (tab cũng vậy → không còn state activeTab lệch với URL) ──
  const query = searchParams.get("q") || "";
  const genreKey = searchParams.getAll("genreIds").join(",");
  const genreCount = genreKey ? genreKey.split(",").length : 0;
  const minRating = parseFloat(searchParams.get("minRating")) || 0;
  const originCountry = searchParams.get("originCountry") || "";
  const fromYear = parseInt(searchParams.get("fromYear")) || 0;
  const toYear = parseInt(searchParams.get("toYear")) || 0;
  const status = searchParams.get("status") || "";
  const sortBy = searchParams.get("sortBy") || "rating";
  const sortDesc = searchParams.get("sortDesc") !== "false";
  const page = parseInt(searchParams.get("page")) || 1;
  const activeTab = searchParams.get("tab") === "tvshow" ? "tvshow" : "movie";

  const searchText = query.trim();
  const fromDate = fromYear ? `${fromYear}-01-01` : "";
  const toDate = toYear ? `${toYear}-12-31` : "";

  // Hai filter object (key ổn định theo giá trị). Phim không có `status` nên đổi status không refetch phim.
  const movieFilter = useMemo(
    () => ({ type: "movie", q: searchText, genreIds: genreKey, minRating, originCountry, fromDate, toDate, sortBy, sortDesc }),
    [searchText, genreKey, minRating, originCountry, fromDate, toDate, sortBy, sortDesc],
  );
  const tvFilter = useMemo(() => ({ ...movieFilter, type: "tvshow", status }), [movieFilter, status]);

  // Tab đang ẩn luôn dùng trang 1 → đổi trang không gọi API thừa cho tab kia (vẫn cần tổng số cho badge)
  const movieQ = useQuery(searchQueryOptions(movieFilter, activeTab === "movie" ? page : 1));
  const tvQ = useQuery(searchQueryOptions(tvFilter, activeTab === "tvshow" ? page : 1));

  const activeQ = activeTab === "movie" ? movieQ : tvQ;
  const activeFilter = activeTab === "movie" ? movieFilter : tvFilter;
  const allItems = activeQ.data?.items ?? [];
  const totalCount = activeQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const movieTotal = movieQ.data?.total ?? 0;
  const tvTotal = tvQ.data?.total ?? 0;
  const loading = activeQ.isFetching;
  const dimmed = activeQ.isPlaceholderData;

  // LUÔN hiện LoadingScreen khi vào trang (giống FavoritesPage). Đổi từ khoá / trang / bộ lọc SAU ĐÓ
  // không full-screen nữa: giữ kết quả cũ (mờ) nhờ keepPreviousData.
  const showLoading = useMinimumLoading(activeQ.isPending);
  const loadFailed = activeQ.isError && !activeQ.data;

  // ── Điều hướng trong URL ────────────────────────────────────────────────────
  const updateParams = useCallback(
    (mutate) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const goToPage = useCallback(
    (p) => {
      updateParams((n) => n.set("page", p));
      window.scrollTo({ top: 100, behavior: "smooth" });
    },
    [updateParams],
  );

  const handleTabChange = (tab) =>
    updateParams((n) => {
      n.set("tab", tab);
      n.set("page", 1);
      if (tab === "movie") n.delete("status");
    });

  // Trang vượt quá tổng số trang (vd. lọc thêm làm ít kết quả đi) → lùi về trang cuối
  useEffect(() => {
    if (!activeQ.isFetching && totalCount > 0 && page > totalPages) goToPage(totalPages);
  }, [activeQ.isFetching, totalCount, page, totalPages, goToPage]);

  // Đổi bộ lọc / từ khoá → về trang 1
  const filterKey = [query, genreKey, minRating, originCountry, fromYear, toYear, status, sortBy, sortDesc].join("|");
  const prevFilterKey = useRef(filterKey);
  useEffect(() => {
    if (prevFilterKey.current !== filterKey && page !== 1) updateParams((n) => n.set("page", 1));
    prevFilterKey.current = filterKey;
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prefetch trang kế tiếp (cùng key với useQuery) + preload poster
  useEffect(() => {
    if (!activeQ.data || activeQ.isPlaceholderData || page >= totalPages) return;
    const opts = searchQueryOptions(activeFilter, page + 1);
    queryClient.prefetchQuery({
      ...opts,
      queryFn: async () => {
        const r = await opts.queryFn();
        preloadPosters(r.items);
        return r;
      },
    });
  }, [activeQ.data, activeQ.isPlaceholderData, page, totalPages, activeFilter, queryClient]);

  // ── Hiển thị ────────────────────────────────────────────────────────────────
  const activeFilters = [
    ...(genreCount ? [`${genreCount} thể loại`] : []),
    ...(minRating > 0 ? [`IMDb ${minRating}+`] : []),
    ...(originCountry ? [COUNTRY_LABEL[originCountry] ?? originCountry] : []),
    ...(fromYear || toYear ? [fromYear && toYear && fromYear !== toYear ? `${fromYear} – ${toYear}` : `${fromYear || toYear}`] : []),
    ...(status ? [TV_STATUS_LABEL[status] ?? status] : []),
    ...(sortBy !== "rating" ? [sortBy === "releaseDate" || sortBy === "firstairdate" ? "Mới nhất" : "Tên A-Z"] : []),
  ];
  const hasFilter = activeFilters.length > 0;
  const subtitle = !loading && (query || hasFilter)
    ? `${totalCount || allItems.length} ${activeTab === "tvshow" ? "TV show" : "phim"}${query ? ` cho "${query}"` : ""}${hasFilter ? ` · ${activeFilters.length} bộ lọc` : ""}`
    : null;

  return (
    <>
      <AnimatePresence>{showLoading && <LoadingScreen key="loading" />}</AnimatePresence>

      {!showLoading && loadFailed && (
        <PageError
          message="Không thể tải kết quả tìm kiếm."
          onRetry={() => activeQ.refetch()}
          retrying={activeQ.isFetching}
        />
      )}

      {!showLoading && !loadFailed && (
        <div style={{ minHeight: "100vh", background: C.bg, color: C.text, paddingTop: 68 }}>
          <SeoMeta title={query ? `Kết quả cho "${query}" - UIAMovie` : "Tìm kiếm - UIAMovie"} noindex />
          <style>{GOOGLE_FONTS}</style>

          <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "16px 14px 60px" : "32px 48px 80px" }}>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}
            >
              <BackButton />
              <div>
                <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: isMobile ? 22 : 32, fontWeight: 700, color: C.text, letterSpacing: "0.01em", lineHeight: 1.1 }}>
                  {query ? `Kết quả cho "${query}"` : hasFilter ? "Kết quả lọc" : "Tìm kiếm"}
                </h1>
                {subtitle && (
                  <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.textDim, marginTop: 4 }}>{subtitle}</p>
                )}
              </div>
            </motion.div>

            <ContentTypeTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              movieCount={movieTotal}
              tvCount={tvTotal}
              loading={movieQ.isFetching || tvQ.isFetching}
              isMobile={isMobile}
            />

            {hasFilter && (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 18 }}>
                <SlidersHorizontal size={13} style={{ color: "rgba(229,24,30,0.7)", flexShrink: 0 }} />
                <AnimatePresence>
                  {activeFilters.map((label) => <FilterBadge key={label} label={label} />)}
                </AnimatePresence>
              </div>
            )}

            {/* Content — giống FavoritesPage: mode="wait" để khối cũ mờ đi rồi khối mới mới vào */}
            <AnimatePresence mode="wait">
              {!query && !hasFilter && !loading && allItems.length === 0 && (
                <motion.div
                  key="hint"
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ textAlign: "center", padding: "80px 0" }}
                >
                  <p style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: C.textSub, marginBottom: 6 }}>
                    Dùng thanh tìm kiếm hoặc bộ lọc trên thanh điều hướng
                  </p>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.textDim }}>
                    Nhập từ khoá hoặc bấm biểu tượng bộ lọc ở thanh trên cùng để duyệt phim
                  </p>
                </motion.div>
              )}

              {loading && allItems.length === 0 && (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={movieGrid(isMobile)}
                >
                  {Array.from({ length: isMobile ? 6 : PAGE_SIZE }).map((_, i) => (
                    <div key={i}><SkeletonCard /></div>
                  ))}
                </motion.div>
              )}

              {!loading && allItems.length === 0 && (query || hasFilter) && (
                <motion.div
                  key={`noresults-${activeTab}`}
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                >
                  <NoResults query={query} />
                </motion.div>
              )}

              {allItems.length > 0 && (
                <motion.div
                  key={`grid-${activeTab}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  <div style={{ ...movieGrid(isMobile), position: "relative", opacity: dimmed ? 0.45 : 1, pointerEvents: dimmed ? "none" : "auto", transition: "opacity 0.2s ease" }}>
                    <AnimatePresence mode="popLayout">
                      {allItems.map((item, i) => (
                        <motion.div
                          key={mediaKey(item)}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: Math.min(i * 0.02, 0.25), duration: 0.25 }}
                        >
                          {/* MovieCard tự lo Yêu thích (useFavoriteToggle), cổng Premium, điều hướng và bản mobile.
                              KHÔNG truyền isFavorited / onFavoriteToggle / onClick. */}
                          <MovieCard movie={item} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={totalCount}
                    pageSize={PAGE_SIZE}
                    onPageChange={goToPage}
                    itemLabel={activeTab === "tvshow" ? "TV show" : "phim"}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
}