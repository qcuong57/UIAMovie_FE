// src/pages/SearchPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, Tv, Film, Heart } from "lucide-react";

import movieService from "../../services/movieService";
import tvShowService from "../../services/tvShowService";
import BackButton from "../../components/common/BackButton";
import Pagination from "../../components/common/Pagination";

import { C, FONT_DISPLAY, FONT_BODY } from "../../context/homeTokens";
import { useIsMobile } from "../../hooks/useIsMobile";
import MovieCard from "../../components/movie/MovieCard";
import { SkeletonCard, NoResults } from "../../components/search/SearchUI";
import { useToast } from "../../components/common/Toast";

const ACCENT = '#e5181e';

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const movieGrid = (isMobile) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(7, 1fr)",
  gap: isMobile ? 10 : 12,
});

const toMovies = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.movies)) return res.movies;
  if (Array.isArray(res?.tvShows)) return res.tvShows;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  return [];
};

const normalizeTvShow = (s) => ({
  id: s.id,
  title: s.title ?? s.name,
  year: s.firstAirDate ? new Date(s.firstAirDate).getFullYear() : s.year ?? null,
  rating: s.rating ?? s.imdbRating ?? 0,
  posterUrl: s.posterUrl ?? s.poster ?? null,
  backdropUrl: s.backdropUrl ?? s.backdrop ?? null,
  genres: s.genres ?? [],
  description: s.description ?? '',
  releaseDate: s.firstAirDate ?? null,
  isTvShow: true,
});

const normalizeMovie = (m) => ({
  ...m,
  year: m.year ?? (m.releaseDate ? new Date(m.releaseDate).getFullYear() : null),
  isTvShow: false,
});

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

const ContentTypeTabs = ({ activeTab, onTabChange, movieCount, tvCount, loading, isMobile }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginBottom: isMobile ? 18 : 24,
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 3,
    width: 'fit-content',
    border: '1px solid rgba(255,255,255,0.07)'
  }}>
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
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: isMobile ? '6px 14px' : '8px 18px',
            borderRadius: 7,
            border: 'none',
            cursor: 'pointer',
            background: active ? ACCENT : 'transparent',
            color: active ? 'white' : 'rgba(255,255,255,0.5)',
            fontFamily: FONT_BODY,
            fontSize: isMobile ? 12 : 13,
            fontWeight: active ? 700 : 500,
            transition: 'all 0.18s',
          }}
        >
          <Icon size={isMobile ? 13 : 14} strokeWidth={active ? 2.5 : 2} />
          {label}
          {!loading && count != null && (
            <span style={{
              padding: '1px 6px',
              borderRadius: 99,
              fontSize: 10,
              fontWeight: 700,
              background: active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              color: active ? 'white' : 'rgba(255,255,255,0.4)',
            }}>
              {count}
            </span>
          )}
        </motion.button>
      );
    })}
  </div>
);

// MobileCard: Fix triệt để không bấm được tim trên mobile
const MobileCard = ({ item, navigate, isFavorited = false, onFavoriteToggle }) => {
  const [imgErr, setImgErr] = React.useState(false);
  const [favLoading, setFavLoading] = React.useState(false);
  const [localFav, setLocalFav] = React.useState(isFavorited);
  const toast = useToast();

  React.useEffect(() => { setLocalFav(isFavorited); }, [isFavorited]);

  const handleFav = async (e) => {
    e.stopPropagation();
    if (favLoading) return;

    if (!getCurrentUser()) {
      toast?.warning?.('Bạn cần đăng nhập để thêm vào Yêu thích');
      return;
    }

    setFavLoading(true);
    const nextState = !localFav;
    setLocalFav(nextState);
    onFavoriteToggle?.(item, nextState);

    try {
      if (!nextState) {
        if (item.isTvShow) {
          await (tvShowService.removeFavorite ? tvShowService.removeFavorite(item.id) : movieService.removeFavorite(item.id));
        } else {
          await movieService.removeFavorite(item.id);
        }
        toast?.info?.(`"${item.title}" đã được bỏ khỏi Yêu thích`);
      } else {
        if (item.isTvShow) {
          await (tvShowService.addFavorite ? tvShowService.addFavorite(item.id) : movieService.addFavorite(item.id));
        } else {
          await movieService.addFavorite(item.id);
        }
        toast?.success?.(`Đã thêm "${item.title}" vào Yêu thích`);
      }
    } catch (err) {
      console.error('[Fav error]:', err);
      setLocalFav(!nextState);
      onFavoriteToggle?.(item, !nextState);
      toast?.error?.('Không thể cập nhật Yêu thích, vui lòng thử lại');
    } finally {
      setFavLoading(false);
    }
  };

  const handleClick = () => {
    if (item.isTvShow) navigate(`/tvshow/${item.id}/info`);
    else navigate(`/movie/${item.id}/info`);
  };

  return (
    <div onClick={handleClick} style={{ cursor: "pointer", position: 'relative' }}>
      <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "2/3", background: "#161616" }}>
        {item.posterUrl && !imgErr ? (
          <img src={item.posterUrl} alt={item.title} onError={() => setImgErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", background: "#161616", fontSize: 24, opacity: 0.3 }}>
            {item.isTvShow ? '📺' : '▶'}
          </div>
        )}

        {item.isTvShow && (
          <div style={{ position: 'absolute', top: 6, right: 6, padding: '2px 6px', borderRadius: 3,
            background: 'rgba(229,24,30,0.85)', backdropFilter: 'blur(4px)' }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 8, fontWeight: 800, color: 'white', letterSpacing: '0.05em' }}>TV</span>
          </div>
        )}

        {item.rating > 0 && (
          <div style={{ position: "absolute", top: 6, left: 6, padding: "2px 7px", borderRadius: 99,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: C.gold }}>
              {item.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Nút tim */}
        <button
          type="button"
          onClick={handleFav}
          disabled={favLoading}
          aria-label="Yêu thích"
          style={{
            position: "absolute",
            bottom: 6,
            right: 6,
            zIndex: 10,
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: localFav ? C.accent : "rgba(0,0,0,0.6)",
            border: `1.5px solid ${localFav ? C.accent : "rgba(255,255,255,0.3)"}`,
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: favLoading ? "not-allowed" : "pointer",
            opacity: favLoading ? 0.7 : 1,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {favLoading ? (
            <span style={{ width: 10, height: 10, border: "2px solid rgba(255,255,255,0.2)",
              borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "block" }} />
          ) : (
            <Heart size={14} fill={localFav ? "white" : "none"} color="white" strokeWidth={2} />
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

const FilterBadge = ({ label }) => (
  <span style={{
    padding: "3px 9px",
    borderRadius: 999,
    background: "rgba(229,24,30,0.12)",
    border: "1px solid rgba(229,24,30,0.3)",
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: 600,
    fontFamily: FONT_BODY,
    whiteSpace: "nowrap",
  }}>
    {label}
  </span>
);

export default function SearchPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const query = searchParams.get("q") || "";
  const genreIds = searchParams.getAll("genreIds");
  const minRating = parseFloat(searchParams.get("minRating")) || 0;
  const originCountry = searchParams.get("originCountry") || "";
  const fromYear = parseInt(searchParams.get("fromYear")) || 0;
  const toYear = parseInt(searchParams.get("toYear")) || 0;
  const status = searchParams.get("status") || "";
  const sortBy = searchParams.get("sortBy") || "rating";
  const sortDesc = searchParams.get("sortDesc") !== "false";
  const page = parseInt(searchParams.get("page")) || 1;
  const pageSize = parseInt(searchParams.get("pageSize")) || 20;
  const tabParam = searchParams.get("tab") || "movie";

  const fromDateStr = fromYear ? `${fromYear}-01-01` : "";
  const toDateStr = toYear ? `${toYear}-12-31` : "";

  const [activeTab, setActiveTab] = useState(tabParam);
  const [movies, setMovies] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [movieTotal, setMovieTotal] = useState(0);
  const [tvTotal, setTvTotal] = useState(0);
  const [loadingMovie, setLoadingMovie] = useState(false);
  const [loadingTv, setLoadingTv] = useState(false);
  const [favIds, setFavIds] = useState(new Set());

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
    if (tab === "movie") next.delete("status");
    navigate(`/search?${next}`, { replace: true });
  };

  const activeFilters = [
    ...(genreIds.length ? [`${genreIds.length} thể loại`] : []),
    ...(minRating > 0 ? [`IMDb ${minRating}+`] : []),
    ...(originCountry ? [COUNTRY_LABEL[originCountry] ?? originCountry] : []),
    ...(fromYear || toYear ? [fromYear && toYear && fromYear !== toYear ? `${fromYear} – ${toYear}` : `${fromYear || toYear}`] : []),
    ...(status ? [TV_STATUS_LABEL[status] ?? status] : []),
    ...(sortBy !== "rating" ? [sortBy === "releaseDate" || sortBy === "firstairdate" ? "Mới nhất" : "Tên A-Z"] : []),
  ];

  const filterKey = [query, genreIds.join(","), minRating, originCountry, fromYear, toYear, status, sortBy, sortDesc].join("|");
  const prevFilterKey = React.useRef(filterKey);
  useEffect(() => {
    if (prevFilterKey.current !== filterKey && page !== 1) {
      const next = new URLSearchParams(searchParams);
      next.set("page", 1);
      navigate(`/search?${next}`, { replace: true });
    }
    prevFilterKey.current = filterKey;
  }, [filterKey]);

  const fetchMovies = useCallback(async () => {
    setLoadingMovie(true);
    try {
      const raw = await movieService.getMovies({
        page,
        pageSize,
        search: query.trim() || undefined,
        genreIds: genreIds.length ? genreIds : undefined,
        minRating: minRating > 0 ? minRating : undefined,
        originCountry: originCountry || undefined,
        fromReleaseDate: fromDateStr || undefined,
        toReleaseDate: toDateStr || undefined,
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

  const fetchTvShows = useCallback(async () => {
    setLoadingTv(true);
    try {
      const raw = await tvShowService.getTvShows({
        page,
        pageSize,
        search: query.trim() || undefined,
        genreIds: genreIds.length ? genreIds : undefined,
        minRating: minRating > 0 ? minRating : undefined,
        originCountry: originCountry || undefined,
        fromFirstAirDate: fromDateStr || undefined,
        toFirstAirDate: toDateStr || undefined,
        sortBy: sortBy === 'releaseDate' ? 'firstairdate' : sortBy,
        sortDesc,
        status: status || undefined,
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

  useEffect(() => {
    const extractIds = (res, idField) => {
      const raw = Array.isArray(res) ? res : res?.data ? (Array.isArray(res.data) ? res.data : res.data?.items ?? res.data?.movies ?? res.data?.tvShows ?? []) : res?.items ?? res?.movies ?? res?.tvShows ?? [];
      return raw.map(f => String(f[idField] ?? f.movie?.id ?? f.tvShow?.id ?? f.id ?? '')).filter(Boolean);
    };

    Promise.allSettled([
      movieService.getFavorites(),
      tvShowService.getFavorites?.() ?? Promise.resolve([]),
    ]).then(([movieRes, tvRes]) => {
      const ids = new Set();
      if (movieRes.status === 'fulfilled') extractIds(movieRes.value, 'movieId').forEach(id => ids.add(id));
      if (tvRes.status === 'fulfilled') extractIds(tvRes.value, 'tvShowId').forEach(id => ids.add(id));
      setFavIds(ids);
    }).catch(() => {});
  }, []);

  const hasFilter = activeFilters.length > 0;
  const subtitle = !loading && (query || hasFilter)
    ? `${totalCount || allItems.length} ${activeTab === 'tvshow' ? 'TV show' : 'phim'}${query ? ` cho "${query}"` : ""}${hasFilter ? ` · ${activeFilters.length} bộ lọc` : ""}`
    : null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, paddingTop: 68 }}>
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: isMobile ? "16px 14px 80px" : "36px 32px 100px" }}>
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
              <p style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.textDim, marginTop: 4 }}>
                {subtitle}
              </p>
            )}
          </div>
        </motion.div>

        <ContentTypeTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          movieCount={movieTotal}
          tvCount={tvTotal}
          loading={loadingMovie || loadingTv}
          isMobile={isMobile}
        />

        {hasFilter && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 18 }}>
            <SlidersHorizontal size={13} style={{ color: "rgba(229,24,30,0.7)", flexShrink: 0 }} />
            {activeFilters.map((label) => <FilterBadge key={label} label={label} />)}
          </div>
        )}

        {!query && !hasFilter && !loading && allItems.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: C.textSub, marginBottom: 6 }}>
              Dùng thanh tìm kiếm hoặc bộ lọc trên thanh điều hướng
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.textDim }}>
              Nhập từ khoá hoặc bấm biểu tượng bộ lọc ở thanh trên cùng để duyệt phim
            </p>
          </div>
        )}

        {loading && allItems.length === 0 && (
          <div style={movieGrid(isMobile)}>
            {Array.from({ length: isMobile ? 6 : 14 }).map((_, i) => (
              <div key={i}><SkeletonCard /></div>
            ))}
          </div>
        )}

        {!loading && allItems.length === 0 && (query || hasFilter) && (
          <NoResults query={query} />
        )}

        {allItems.length > 0 && (
          <>
            <div style={movieGrid(isMobile)}>
              {allItems.map((item) => (
                <div key={item.id}>
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
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              itemLabel={activeTab === 'tvshow' ? 'TV show' : 'phim'}
            />
          </>
        )}
      </div>
    </div>
  );
}