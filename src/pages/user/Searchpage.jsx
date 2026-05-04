// src/pages/SearchPage.jsx
// ── Chỉ đọc params từ URL (do Navbar / NavbarFilterModal truyền vào).
// ── KHÔNG có SearchBar / FilterPanel / SearchTabs riêng trên trang này.
// ── Hỗ trợ cả Movie lẫn TV Show với tab toggle.

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, Tv, Film } from "lucide-react";

import movieService from "../../services/movieService";
import tvShowService from "../../services/tvShowService";
import BackButton from "../../components/common/BackButton";
import Pagination from "../../components/common/Pagination";

import { C, FONT_DISPLAY, FONT_BODY } from "../../context/homeTokens";
import { useIsMobile } from "../../hooks/useIsMobile";
import MovieCard from "../../components/movie/MovieCard";
import { SkeletonCard, NoResults } from "../../components/search/SearchUI";

const ACCENT = '#e5181e';

// ── Grids ────────────────────────────────────────────────────────────────────
const movieGrid = (isMobile) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(7, 1fr)",
  gap: isMobile ? 10 : 12,
});

// ── Normalize API response ───────────────────────────────────────────────────
const toMovies = (res) => {
  if (Array.isArray(res))              return res;
  if (Array.isArray(res?.items))       return res.items;
  if (Array.isArray(res?.movies))      return res.movies;
  if (Array.isArray(res?.tvShows))     return res.tvShows;
  if (Array.isArray(res?.data))        return res.data;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  return [];
};

// Normalize TV Show sang shape giống Movie để dùng chung card
const normalizeTvShow = (s) => ({
  id:          s.id,
  title:       s.title ?? s.name,
  year:        s.firstAirDate ? new Date(s.firstAirDate).getFullYear() : s.year ?? null,
  rating:      s.rating ?? s.imdbRating ?? 0,
  posterUrl:   s.posterUrl ?? s.poster ?? null,
  backdropUrl: s.backdropUrl ?? s.backdrop ?? null,
  genres:      s.genres ?? [],
  description: s.description ?? '',
  releaseDate: s.firstAirDate ?? null,
  isTvShow:    true,
});

const normalizeMovie = (m) => ({
  ...m,
  year: m.year ?? (m.releaseDate ? new Date(m.releaseDate).getFullYear() : null),
  isTvShow: false,
});

// ── Country code → label map ──────────────────────────────────────────────────
const COUNTRY_LABEL = {
  US: "Âu Mỹ", PL: "Ba Lan", TW: "Đài Loan", KR: "Hàn Quốc",
  HK: "Hồng Kông", JP: "Nhật Bản", PH: "Philippines", TH: "Thái Lan",
  CN: "Trung Quốc", VN: "Việt Nam",
};

const TV_STATUS_LABEL = {
  "Returning Series": "Đang chiếu",
  "Ended":            "Đã kết thúc",
  "Canceled":         "Đã hủy",
  "In Production":    "Đang sản xuất",
};

// ── ContentTypeTabs ───────────────────────────────────────────────────────────
const ContentTypeTabs = ({ activeTab, onTabChange, movieCount, tvCount, loading }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 24,
    background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, width: 'fit-content',
    border: '1px solid rgba(255,255,255,0.07)' }}>
    {[
      { key: 'movie', label: 'Phim', icon: Film, count: movieCount },
      { key: 'tvshow', label: 'TV Show', icon: Tv, count: tvCount },
    ].map(({ key, label, icon: Icon, count }) => {
      const active = activeTab === key;
      return (
        <motion.button
          key={key}
          onClick={() => onTabChange(key)}
          whileTap={{ scale: 0.97 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px',
            borderRadius: 7, border: 'none', cursor: 'pointer',
            background: active ? ACCENT : 'transparent',
            color: active ? 'white' : 'rgba(255,255,255,0.4)',
            fontFamily: FONT_BODY, fontSize: 13, fontWeight: active ? 700 : 500,
            transition: 'all 0.18s',
          }}
        >
          <Icon size={14} strokeWidth={active ? 2.5 : 2} />
          {label}
          {!loading && count != null && (
            <span style={{
              padding: '1px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700,
              background: active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              color: active ? 'white' : 'rgba(255,255,255,0.35)',
            }}>
              {count}
            </span>
          )}
        </motion.button>
      );
    })}
  </div>
);

// ── MobileCard (dùng chung cho movie & tvshow) ────────────────────────────────
const MobileCard = ({ item, navigate, isFavorited = false, onFavoriteToggle }) => {
  const [imgErr, setImgErr]         = React.useState(false);
  const [favLoading, setFavLoading] = React.useState(false);
  const [localFav, setLocalFav]     = React.useState(isFavorited);

  React.useEffect(() => { setLocalFav(isFavorited); }, [isFavorited]);

  const handleFav = async (e) => {
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    try {
      if (localFav) {
        await (item.isTvShow ? tvShowService.removeFavorite?.(item.id) : movieService.removeFavorite(item.id));
        setLocalFav(false);
        onFavoriteToggle?.(item, false);
      } else {
        await (item.isTvShow ? tvShowService.addFavorite?.(item.id) : movieService.addFavorite(item.id));
        setLocalFav(true);
        onFavoriteToggle?.(item, true);
      }
    } catch { /* noop */ } finally { setFavLoading(false); }
  };

  const handleClick = () => {
    if (item.isTvShow) navigate(`/tvshow/${item.id}/info`);
    else navigate(`/movie/${item.id}/info`);
  };

  return (
    <div onClick={handleClick} style={{ cursor: "pointer" }}>
      <div style={{ position: "relative", borderRadius: 3, overflow: "hidden", aspectRatio: "2/3", background: "#161616" }}>
        {item.posterUrl && !imgErr ? (
          <img src={item.posterUrl} alt={item.title} onError={() => setImgErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", background: "#161616", fontSize: 24, opacity: 0.3 }}>
            {item.isTvShow ? '📺' : '▶'}
          </div>
        )}
        {/* TV Show badge */}
        {item.isTvShow && (
          <div style={{ position: 'absolute', top: 6, right: 6, padding: '2px 6px', borderRadius: 3,
            background: 'rgba(229,24,30,0.85)', backdropFilter: 'blur(4px)' }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 8, fontWeight: 800, color: 'white', letterSpacing: '0.05em' }}>TV</span>
          </div>
        )}
        {item.rating > 0 && (
          <div style={{ position: "absolute", top: 6, left: 6, padding: "2px 7px", borderRadius: 2,
            background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: C.gold }}>
              {item.rating.toFixed(1)}
            </span>
          </div>
        )}
        <button onClick={handleFav} disabled={favLoading} style={{
          position: "absolute", bottom: 6, right: 6, width: 28, height: 28, borderRadius: "50%",
          background: localFav ? C.accent : "rgba(0,0,0,0.7)",
          border: `1px solid ${localFav ? C.accent : "rgba(255,255,255,0.15)"}`,
          backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: favLoading ? "not-allowed" : "pointer", transition: "background 0.2s, border-color 0.2s",
        }}>
          {favLoading ? (
            <span style={{ width: 10, height: 10, border: "2px solid rgba(255,255,255,0.2)",
              borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "block" }} />
          ) : (
            <span style={{ fontSize: 11, color: "#fff", lineHeight: 1, fontFamily: FONT_BODY }}>
              {localFav ? "♥" : "♡"}
            </span>
          )}
        </button>
      </div>
      <div style={{ paddingTop: 7 }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: C.text,
          lineHeight: 1.3, marginBottom: 2, display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {item.title}
        </p>
        {item.year && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textDim }}>{item.year}</p>
        )}
      </div>
    </div>
  );
};

// ── ActiveFilterBadge ─────────────────────────────────────────────────────────
const FilterBadge = ({ label }) => (
  <span style={{
    padding: "3px 10px", borderRadius: 999,
    background: "rgba(229,24,30,0.12)", border: "1px solid rgba(229,24,30,0.3)",
    color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
  }}>
    {label}
  </span>
);

// ══════════════════════════════════════════════════════════════════════════════
export default function SearchPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Đọc tất cả params từ URL ────────────────────────────────────────────────
  const query         = searchParams.get("q")              || "";
  const genreIds      = searchParams.getAll("genreIds");
  const minRating     = parseFloat(searchParams.get("minRating")) || 0;
  const originCountry = searchParams.get("originCountry")  || "";
  const fromYear      = parseInt(searchParams.get("fromYear"))  || 0;
  const toYear        = parseInt(searchParams.get("toYear"))    || 0;
  const status        = searchParams.get("status")          || "";
  const sortBy        = searchParams.get("sortBy")          || "rating";
  const sortDesc      = searchParams.get("sortDesc") !== "false";
  const page          = parseInt(searchParams.get("page"))  || 1;
  const pageSize      = parseInt(searchParams.get("pageSize")) || 20;
  const tabParam      = searchParams.get("tab")             || "movie";

  // Build date strings từ fromYear/toYear (chung cho cả movie và tvshow)
  const fromDateStr = fromYear ? `${fromYear}-01-01` : "";
  const toDateStr   = toYear   ? `${toYear}-12-31`   : "";

  const [activeTab,    setActiveTab]    = useState(tabParam);
  const [movies,       setMovies]       = useState([]);
  const [tvShows,      setTvShows]      = useState([]);
  const [movieTotal,   setMovieTotal]   = useState(0);
  const [tvTotal,      setTvTotal]      = useState(0);
  const [loadingMovie, setLoadingMovie] = useState(false);
  const [loadingTv,    setLoadingTv]    = useState(false);
  const [favIds,       setFavIds]       = useState(new Set());

  const loading = activeTab === 'movie' ? loadingMovie : loadingTv;
  const allItems = activeTab === 'movie' ? movies : tvShows;
  const totalCount = activeTab === 'movie' ? movieTotal : tvTotal;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const goToPage = useCallback((newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", newPage);
    navigate(`/search?${next}`, { replace: true });
    window.scrollTo({ top: 100, behavior: "smooth" });
  }, [searchParams, navigate]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    next.set("page", 1);
    // Xóa status khi chuyển sang tab Phim vì status chỉ áp dụng cho TV Show
    if (tab === "movie") next.delete("status");
    navigate(`/search?${next}`, { replace: true });
  };

  // ── Badge labels cho các filter đang active ──────────────────────────────────
  const activeFilters = [
    ...(genreIds.length     ? [`${genreIds.length} thể loại`] : []),
    ...(minRating > 0       ? [`IMDb ${minRating}+`]          : []),
    ...(originCountry       ? [COUNTRY_LABEL[originCountry] ?? originCountry] : []),
    ...(fromYear || toYear  ? [fromYear && toYear && fromYear !== toYear ? `${fromYear} – ${toYear}` : `${fromYear || toYear}`] : []),
    ...(status              ? [TV_STATUS_LABEL[status] ?? status]         : []),
    ...(sortBy !== "rating" ? [sortBy === "releaseDate" || sortBy === "firstairdate" ? "Mới nhất" : "Tên A-Z"] : []),
  ];

  // ── Reset page=1 khi filter thay đổi ────────────────────────────────────────
  const filterKey = [query, genreIds.join(","), minRating, originCountry, fromYear, toYear, status, sortBy, sortDesc].join("|");
  const prevFilterKey = React.useRef(filterKey);
  useEffect(() => {
    if (prevFilterKey.current !== filterKey && page !== 1) {
      const next = new URLSearchParams(searchParams);
      next.set("page", 1);
      navigate(`/search?${next}`, { replace: true });
    }
    prevFilterKey.current = filterKey;
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch Movies ─────────────────────────────────────────────────────────────
  const fetchMovies = useCallback(async () => {
    setLoadingMovie(true);
    try {
      const raw = await movieService.getMovies({
        page,
        pageSize,
        search:          query.trim() || undefined,
        genreIds:        genreIds.length ? genreIds : undefined,
        minRating:       minRating > 0  ? minRating : undefined,
        originCountry:   originCountry  || undefined,
        fromReleaseDate: fromDateStr    || undefined,
        toReleaseDate:   toDateStr      || undefined,
        sortBy,
        sortDesc,
      });
      const items = toMovies(raw);
      const total = raw?.totalCount ?? raw?.data?.totalCount ?? items.length;
      setMovies(items.map(normalizeMovie));
      setMovieTotal(total);
    } catch (e) {
      console.error("[SearchPage] fetchMovies:", e);
      setMovies([]);
      setMovieTotal(0);
    } finally {
      setLoadingMovie(false);
    }
  }, [query, genreIds.join(","), minRating, originCountry, fromYear, toYear, sortBy, sortDesc, page, pageSize]);

  // ── Fetch TV Shows ────────────────────────────────────────────────────────────
  const fetchTvShows = useCallback(async () => {
    setLoadingTv(true);
    try {
      const raw = await tvShowService.getTvShows({
        page,
        pageSize,
        search:           query.trim() || undefined,
        genreIds:         genreIds.length ? genreIds : undefined,
        minRating:        minRating > 0  ? minRating : undefined,
        originCountry:    originCountry  || undefined,
        fromFirstAirDate: fromDateStr    || undefined,
        toFirstAirDate:   toDateStr      || undefined,
        sortBy:           sortBy === 'releaseDate' ? 'firstairdate' : sortBy,
        sortDesc,
        status:           status         || undefined,
      });
      const items = toMovies(raw);
      const total = raw?.totalCount ?? raw?.data?.totalCount ?? items.length;
      setTvShows(items.map(normalizeTvShow));
      setTvTotal(total);
    } catch (e) {
      console.error("[SearchPage] fetchTvShows:", e);
      setTvShows([]);
      setTvTotal(0);
    } finally {
      setLoadingTv(false);
    }
  }, [query, genreIds.join(","), minRating, originCountry, fromYear, toYear, status, sortBy, sortDesc, page, pageSize]);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);
  useEffect(() => { fetchTvShows(); }, [fetchTvShows]);

  // ── Load favorites ────────────────────────────────────────────────────────────
  useEffect(() => {
    const extractIds = (res, idField) => {
      const raw = Array.isArray(res) ? res
        : res?.data ? (Array.isArray(res.data) ? res.data : res.data?.items ?? res.data?.movies ?? res.data?.tvShows ?? [])
        : res?.items ?? res?.movies ?? res?.tvShows ?? [];
      return raw.map(f => String(f[idField] ?? f.movie?.id ?? f.tvShow?.id ?? f.id ?? '')).filter(Boolean);
    };

    Promise.allSettled([
      movieService.getFavorites(),
      tvShowService.getFavorites?.() ?? Promise.resolve([]),
    ]).then(([movieRes, tvRes]) => {
      const ids = new Set();
      if (movieRes.status === 'fulfilled')
        extractIds(movieRes.value, 'movieId').forEach(id => ids.add(id));
      if (tvRes.status === 'fulfilled')
        extractIds(tvRes.value, 'tvShowId').forEach(id => ids.add(id));
      setFavIds(ids);
    }).catch(() => {});
  }, []);

  // ── Tiêu đề hiển thị ────────────────────────────────────────────────────────
  const hasFilter = activeFilters.length > 0;
  const subtitle = !loading && (query || hasFilter)
    ? `${totalCount || allItems.length} ${activeTab === 'tvshow' ? 'TV show' : 'phim'}${query ? ` cho "${query}"` : ""}${hasFilter ? ` · ${activeFilters.length} bộ lọc` : ""}`
    : null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, paddingTop: 68 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,600;0,700;0,800;0,900;1,600;1,700;1,800;1,900&family=Nunito:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: ${C.textDim}; font-family: 'Nunito', sans-serif; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: isMobile ? "24px 16px 80px" : "36px 32px 100px" }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28 }}
        >
          <BackButton />
          <div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: isMobile ? 26 : 32,
              fontWeight: 700, color: C.text, letterSpacing: "0.01em", lineHeight: 1 }}>
              {query ? `Kết quả cho "${query}"` : hasFilter ? "Kết quả lọc" : "Tìm kiếm"}
            </h1>
            <AnimatePresence mode="wait">
              {subtitle && (
                <motion.p
                  key={subtitle}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 400,
                    color: C.textDim, marginTop: 6, letterSpacing: "0.01em" }}
                >
                  {subtitle}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Content Type Tabs ── */}
        <ContentTypeTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          movieCount={movieTotal}
          tvCount={tvTotal}
          loading={loadingMovie || loadingTv}
        />

        {/* ── Active filter badges ── */}
        <AnimatePresence>
          {hasFilter && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 24 }}
            >
              <SlidersHorizontal size={13} style={{ color: "rgba(229,24,30,0.7)", flexShrink: 0 }} />
              {activeFilters.map((label) => <FilterBadge key={label} label={label} />)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Hint khi chưa có gì ── */}
        {!query && !hasFilter && !loading && allItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "100px 0" }}
          >
            <div style={{ width: 40, height: 1, background: C.border, margin: "0 auto 24px" }} />
            <p style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700,
              color: C.textSub, marginBottom: 8 }}>
              Dùng thanh tìm kiếm hoặc bộ lọc trên navbar
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim, fontWeight: 400 }}>
              Nhập từ khoá hoặc chọn bộ lọc ở trên để xem kết quả
            </p>
          </motion.div>
        )}

        {/* ── Skeleton loading ── */}
        {loading && allItems.length === 0 && (
          <div style={movieGrid(isMobile)}>
            {Array.from({ length: isMobile ? 6 : 14 }).map((_, i) => (
              <div key={i} style={isMobile ? {} : { zoom: 0.78 }}><SkeletonCard /></div>
            ))}
          </div>
        )}

        {/* ── Không có kết quả ── */}
        {!loading && allItems.length === 0 && (query || hasFilter) && (
          <NoResults query={query} />
        )}

        {/* ── Danh sách ── */}
        {allItems.length > 0 && (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-p${page}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: loading ? 0.45 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={movieGrid(isMobile)}
              >
                {allItems.map((item) => (
                  <div key={item.id} style={isMobile ? {} : { zoom: 0.78 }}>
                    {isMobile ? (
                      <MobileCard
                        item={item}
                        navigate={navigate}
                        isFavorited={favIds.has(String(item.id))}
                        onFavoriteToggle={(it, isNowFav) => {
                          setFavIds(prev => {
                            const next = new Set(prev);
                            isNowFav ? next.add(String(it.id)) : next.delete(String(it.id));
                            return next;
                          });
                        }}
                      />
                    ) : (
                      <MovieCard
                        movie={item}
                        index={0}
                        onClick={(it) => {
                          if (it.isTvShow) navigate(`/tvshow/${it.id}/info`);
                          else navigate(`/movie/${it.id}/info`);
                        }}
                        isFavorited={favIds.has(String(item.id))}
                        onFavoriteToggle={(it, isNowFav) => {
                          setFavIds(prev => {
                            const next = new Set(prev);
                            isNowFav ? next.add(String(it.id)) : next.delete(String(it.id));
                            return next;
                          });
                        }}
                      />
                    )}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              itemLabel={activeTab === 'tvshow' ? 'TV show' : 'phim'}
            />
          </>
        )}
      </div>

      {/* ── Floating loading indicator ── */}
      <AnimatePresence>
        {loading && allItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.2 }}
            style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
              display: "flex", alignItems: "center", gap: 10, padding: "10px 22px",
              background: "rgba(10,10,10,0.96)", borderRadius: 3, border: `1px solid ${C.border}`,
              backdropFilter: "blur(20px)", zIndex: 9000, boxShadow: "0 8px 32px rgba(0,0,0,0.8)" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%",
              border: "1.5px solid rgba(229,24,30,0.2)", borderTopColor: C.accent,
              animation: "spin 0.7s linear infinite" }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 400,
              color: C.textSub, letterSpacing: "0.02em" }}>Đang tải</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}