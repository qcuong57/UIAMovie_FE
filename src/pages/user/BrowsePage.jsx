// src/pages/BrowsePage.jsx
// ─── Trang duyệt phim — fix: fetch đúng endpoint + parse response robust ──────

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, SlidersHorizontal, X, Heart, Loader, Star as StarIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import movieService from '../../services/movieService';
import genreService from '../../services/genreService';
import MovieCard    from '../../components/movie/MovieCard';
import { SkeletonCard, GRID_STYLE } from '../../components/search/SearchUI';
import Pagination   from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { C, FONT_DISPLAY, FONT_BODY, GOOGLE_FONTS } from '../../context/homeTokens';
import { useIsMobile } from '../../hooks/useIsMobile';

const PAGE_SIZE = 24;
const ACCENT    = '#e5181e';

// ── Helpers ───────────────────────────────────────────────────────────────────
// Xử lý mọi response shape từ axiosInstance:
//   A) mảng thẳng              → [ {...} ]
//   B) { movies: [], total }   → sau interceptor unwrap response.data
//   C) { data: { movies:[] } } → response đầy đủ chưa unwrap
const parseMoviesResponse = (res) => {
  if (!res) return { movies: [], total: 0 };
  if (Array.isArray(res)) return { movies: res, total: res.length };

  // Case C: { data: { movies, total } }
  if (res?.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
    const inner = res.data;
    if (Array.isArray(inner)) return { movies: inner, total: inner.length };
    const movies = inner.movies ?? inner.items ?? inner.results ?? [];
    const total  = inner.total  ?? inner.totalCount ?? inner.count ?? movies.length;
    if (Array.isArray(movies)) return { movies, total };
  }

  // Case B: { movies, total }
  const movies = res.movies ?? res.items ?? res.results ?? res.data ?? [];
  const total  = res.total  ?? res.totalCount ?? res.count ?? (Array.isArray(movies) ? movies.length : 0);
  if (Array.isArray(movies)) return { movies, total };

  return { movies: [], total: 0 };
};

const normalizeMovie = (m) => ({
  id:          m.id,
  title:       m.title,
  year:        m.releaseDate ? new Date(m.releaseDate).getFullYear() : m.year ?? null,
  rating:      m.rating ?? m.imdbRating ?? 0,
  posterUrl:   m.posterUrl   ?? m.poster   ?? null,
  backdropUrl: m.backdropUrl ?? m.backdrop ?? null,
  genres:      m.genres      ?? [],
  description: m.description ?? '',
  duration:    m.duration    ?? null,
  releaseDate: m.releaseDate ?? null,
});

// ── Chips ─────────────────────────────────────────────────────────────────────
const Chip = ({ label, onRemove }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 12px', borderRadius: 99, background: 'rgba(229,24,30,0.12)', border: '1px solid rgba(229,24,30,0.3)', fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: ACCENT }}
  >
    {label}
    <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: ACCENT }}>
      <X size={12} />
    </button>
  </motion.div>
);

// ── Filter Sidebar ────────────────────────────────────────────────────────────
const YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));
const SORT_OPTIONS = [
  { value: 'rating',      label: 'Đánh giá cao nhất' },
  { value: 'releaseDate', label: 'Mới nhất'           },
  { value: 'title',       label: 'Tên A–Z'            },
];

const FilterGroup = ({ label, children, scrollable }) => (
  <div style={{ marginBottom: 22 }}>
    <p style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>{label}</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, ...(scrollable ? { maxHeight: 220, overflowY: 'auto' } : {}) }}>{children}</div>
  </div>
);

const FilterBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', background: active ? 'rgba(229,24,30,0.14)' : 'transparent', color: active ? ACCENT : 'rgba(255,255,255,0.5)', fontFamily: FONT_BODY, fontSize: 13, fontWeight: active ? 700 : 400, transition: 'all 0.15s' }}>
    {active && <span style={{ marginRight: 6 }}>✓</span>}{children}
  </button>
);

const Divider = () => <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 22 }} />;

// Nội dung filter — dùng chung cho sidebar desktop và bottom sheet mobile
const FilterContent = ({ genres, selGenre, onGenreChange, selYear, onYearChange, sortBy, onSortChange, minRating, onRatingChange, onClearAll, filterCount, lockedGenreId, onClose }) => (
  <>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
      <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: 'white' }}>Bộ lọc</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {filterCount > 0 && <button onClick={onClearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 11, color: ACCENT, fontWeight: 600 }}>Xóa tất cả</button>}
        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}><X size={18} /></button>}
      </div>
    </div>
    <FilterGroup label="Sắp xếp">
      {SORT_OPTIONS.map(o => <FilterBtn key={o.value} active={sortBy === o.value} onClick={() => onSortChange(o.value)}>{o.label}</FilterBtn>)}
    </FilterGroup>
    <Divider />
    {!lockedGenreId && (
      <>
        <FilterGroup label="Thể loại" scrollable>
          <FilterBtn active={!selGenre} onClick={() => onGenreChange(null)}>Tất cả</FilterBtn>
          {genres.map(g => <FilterBtn key={g.id} active={selGenre === g.id} onClick={() => onGenreChange(g.id)}>{g.name}</FilterBtn>)}
        </FilterGroup>
        <Divider />
      </>
    )}
    <FilterGroup label="Năm phát hành">
      <select value={selYear || ''} onChange={e => onYearChange(e.target.value || null)}
        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: selYear ? 'white' : 'rgba(255,255,255,0.3)', fontFamily: FONT_BODY, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
        <option value="">Tất cả năm</option>
        {YEARS.map(y => <option key={y} value={y} style={{ background: '#111' }}>{y}</option>)}
      </select>
    </FilterGroup>
    <Divider />
    <FilterGroup label={<>Điểm tối thiểu{minRating > 0 && <span style={{ color: ACCENT, marginLeft: 6 }}>≥ {minRating}</span>}</>}>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {[0, 5, 6, 7, 8, 9].map(r => (
          <button key={r} onClick={() => onRatingChange(r)} style={{ padding: '5px 10px', borderRadius: 99, border: 'none', cursor: 'pointer', background: minRating === r ? 'rgba(229,24,30,0.18)' : 'rgba(255,255,255,0.06)', color: minRating === r ? ACCENT : 'rgba(255,255,255,0.4)', fontFamily: FONT_BODY, fontSize: 12, fontWeight: minRating === r ? 700 : 400, transition: 'all 0.15s' }}>
            {r === 0 ? 'Tất cả' : `${r}+`}
          </button>
        ))}
      </div>
    </FilterGroup>
  </>
);

const FilterSidebar = ({ show, isMobile, onClose, ...props }) => (
  <AnimatePresence>
    {show && (
      isMobile ? (
        <>
          <motion.div key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 9998 }}
          />
          <motion.div key="sheet"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, background: '#111', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px 20px 0 0', padding: '20px 20px 44px', maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 20px' }} />
            <FilterContent {...props} onClose={onClose} />
          </motion.div>
        </>
      ) : (
        <motion.aside key="sidebar"
          initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ width: 256, flexShrink: 0, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 18px', alignSelf: 'flex-start', position: 'sticky', top: 88 }}
        >
          <FilterContent {...props} />
        </motion.aside>
      )
    )}
  </AnimatePresence>
);

// ── Empty / Error ─────────────────────────────────────────────────────────────
const EmptyState = ({ error, onAction }) => (
  <div style={{ textAlign: 'center', padding: '80px 0' }}>
    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>{error ? '⚠️' : '🎬'}</div>
    <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>
      {error || 'Không tìm thấy phim nào'}
    </p>
    <button onClick={onAction} style={{ padding: '9px 24px', borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600 }}>
      {error ? 'Thử lại' : 'Xóa bộ lọc'}
    </button>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════

// ── BrowseMobileCard — card mobile cho BrowsePage có nút tim ─────
const BrowseMobileCard = ({ movie, isFavorited, onFavoriteToggle, navigate }) => {
  const [imgErr, setImgErr] = React.useState(false);
  const [favLoading, setFavLoading] = React.useState(false);
  const [localFav, setLocalFav] = React.useState(isFavorited);

  React.useEffect(() => { setLocalFav(isFavorited); }, [isFavorited]);

  const handleFav = async (e) => {
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    try {
      if (localFav) {
        await movieService.removeFavorite(movie.id);
        setLocalFav(false);
        onFavoriteToggle?.(movie, false);
      } else {
        await movieService.addFavorite(movie.id);
        setLocalFav(true);
        onFavoriteToggle?.(movie, true);
      }
    } catch (err) { console.error(err); }
    finally { setFavLoading(false); }
  };

  return (
    <div onClick={() => navigate(`/movie/${movie.id}/info`)} style={{ cursor: 'pointer' }}>
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '2/3', background: '#181818' }}>
        {movie.posterUrl && !imgErr
          ? <img src={movie.posterUrl} alt={movie.title} onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎬</div>
        }
        {movie.rating > 0 && (
          <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 99, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#f5c518"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10, fontWeight: 700, color: '#f5c518' }}>{movie.rating.toFixed(1)}</span>
          </div>
        )}
        {/* Nút tim */}
        <button
          onClick={handleFav}
          disabled={favLoading}
          style={{ position: 'absolute', bottom: 6, right: 6, width: 30, height: 30, borderRadius: '50%', background: localFav ? '#e5181e' : 'rgba(0,0,0,0.65)', border: `1.5px solid ${localFav ? '#e5181e' : 'rgba(255,255,255,0.3)'}`, backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: favLoading ? 'not-allowed' : 'pointer' }}
        >
          {favLoading
            ? <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
            : <Heart size={13} fill={localFav ? 'white' : 'none'} color="white" strokeWidth={2} />
          }
        </button>
      </div>
      <div style={{ paddingTop: 7, paddingBottom: 4 }}>
        <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 12, fontWeight: 700, color: '#f0f2f8', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 2 }}>{movie.title}</p>
        {movie.year && <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10, color: '#525868' }}>{movie.year}</p>}
      </div>
    </div>
  );
};

export default function BrowsePage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const genreId     = searchParams.get('genre')   || null;
  const genreName   = searchParams.get('name')    || '';
  const urlSort     = searchParams.get('sort')    || 'rating';
  const urlCountry  = searchParams.get('country') || null;

  // ── State ───────────────────────────────────────────────────────────────────
  const [genres,     setGenres]     = useState([]);
  const [allMovies,  setAllMovies]  = useState([]); // toàn bộ sau filter+sort
  const [movies,     setMovies]     = useState([]); // slice của trang hiện tại
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [total,      setTotal]      = useState(0);
  const [showFilter, setShowFilter] = useState(false);

  const [selGenre,   setSelGenre]   = useState(null);
  const [selYear,    setSelYear]    = useState(null);
  const [sortBy,     setSortBy]     = useState(urlSort);
  const [minRating,  setMinRating]  = useState(0);
  const [selCountry, setSelCountry] = useState(null);
  const [favIds,     setFavIds]     = useState(new Set());

  const fetchIdRef = useRef(0);

  // ── Pagination hook ─────────────────────────────────────────────────────────
  const pagination = usePagination({ total, pageSize: PAGE_SIZE });

  // ── Active genre (URL > sidebar filter) ─────────────────────────────────────
  const activeGenreId  = genreId   || selGenre;
  // ── Active country (URL > sidebar filter) ────────────────────────────────────
  const activeCountry  = urlCountry || selCountry;

  // ── Load genres ─────────────────────────────────────────────────────────────
  useEffect(() => {
    genreService.getAllGenres()
      .then(res => {
        const list = Array.isArray(res) ? res
          : res?.genres ?? res?.data ?? parseMoviesResponse(res).movies ?? [];
        setGenres(list);
      })
      .catch(() => {});
  }, []);

  // ── Load favorites ───────────────────────────────────────────────────────────
  useEffect(() => {
    movieService.getFavorites()
      .then(res => {
        const raw = Array.isArray(res) ? res
          : res?.data   ? (Array.isArray(res.data) ? res.data : res.data?.items ?? res.data?.movies ?? [])
          : res?.items  ?? res?.movies ?? [];
        // Ưu tiên movieId (ID phim thật), không dùng id (ID bản ghi favorite)
        const ids = new Set(raw.map(f => String(f.movieId ?? f.movie?.id ?? f.id ?? '')).filter(Boolean));
        setFavIds(ids);
      })
      .catch(() => {});
  }, []);

  // ── Fetch + filter + sort toàn bộ phim ────────────────────────────────────
  const doFetch = useCallback(async () => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    setFetchError(null);

    try {
      let raw = [];

      if (activeGenreId) {
        // Endpoint riêng cho genre: /movies/genre/:id
        const res = await movieService.getMoviesByGenre(activeGenreId);
        const { movies: list } = parseMoviesResponse(res);
        raw = list;
      } else if (activeCountry) {
        // Endpoint riêng cho quốc gia: /movies/country/:code
        const res = await movieService.getMoviesByCountry(activeCountry);
        const { movies: list } = parseMoviesResponse(res);
        raw = list;
      } else {
        const res = await movieService.getMovies(1, 200);
        const { movies: list } = parseMoviesResponse(res);
        raw = list;
      }

      if (id !== fetchIdRef.current) return;

      // Normalize
      raw = raw.map(normalizeMovie);

      // Client filter
      if (minRating > 0) raw = raw.filter(m => (m.rating || 0) >= minRating);
      if (selYear)        raw = raw.filter(m => String(m.year) === String(selYear));
      // Nếu có cả country filter từ sidebar (không phải URL) thì filter thêm
      if (selCountry && !urlCountry) raw = raw.filter(m => m.originCountry === selCountry);

      // Sort
      raw = [...raw].sort((a, b) =>
        sortBy === 'rating'      ? (b.rating || 0) - (a.rating || 0)
        : sortBy === 'releaseDate' ? new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0)
        : sortBy === 'title'       ? (a.title || '').localeCompare(b.title || '', 'vi')
        : 0
      );

      setAllMovies(raw);
      setTotal(raw.length);
    } catch (err) {
      console.error('[BrowsePage] fetch error:', err);
      if (id === fetchIdRef.current) {
        setFetchError('Không thể tải danh sách phim. Vui lòng thử lại.');
        setAllMovies([]);
        setTotal(0);
      }
    } finally {
      if (id === fetchIdRef.current) setLoading(false);
    }
  }, [activeGenreId, activeCountry, minRating, selYear, selCountry, sortBy]);

  useEffect(() => { doFetch(); }, [doFetch]);

  // ── Slice trang hiện tại ────────────────────────────────────────────────────
  useEffect(() => {
    const start = (pagination.page - 1) * PAGE_SIZE;
    setMovies(allMovies.slice(start, start + PAGE_SIZE));
  }, [allMovies, pagination.page]);

  // ── Scroll lên khi chuyển trang ─────────────────────────────────────────────
  useEffect(() => {
    if (pagination.page > 1) window.scrollTo({ top: 120, behavior: 'smooth' });
  }, [pagination.page]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const COUNTRY_LABELS = {
    KR: '🇰🇷 Hàn Quốc', CN: '🇨🇳 Trung Quốc', US: '🇺🇸 Hollywood',
    JP: '🇯🇵 Nhật Bản', VN: '🇻🇳 Việt Nam', FR: '🇫🇷 Pháp',
    GB: '🇬🇧 Anh', IN: '🇮🇳 Ấn Độ', TH: '🇹🇭 Thái Lan',
  };
  const filterCount = [selGenre && !genreId, selYear, minRating > 0, selCountry && !urlCountry].filter(Boolean).length;
  const title = genreId     ? (genreName || 'Thể Loại')
              : activeCountry ? (COUNTRY_LABELS[activeCountry] || `Phim ${activeCountry}`)
              : 'Tất Cả Phim';

  const clearFilters = () => {
    setSelGenre(null); setSelYear(null); setMinRating(0); setSortBy('rating');
    setSelCountry(null); setFetchError(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#000', color: C.text, paddingTop: 68 }}>
      <style>{GOOGLE_FONTS}</style>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '24px 16px 60px' : '32px 48px 80px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <motion.button whileHover={{ scale: 1.08, x: -2 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(-1)}
              style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={16} strokeWidth={2} />
            </motion.button>

            <div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 900, color: C.text, lineHeight: 1 }}>{title}</h1>
              <AnimatePresence mode="wait">
                {!loading && total > 0 && (
                  <motion.p key={total} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                    {total.toLocaleString()} phim
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setShowFilter(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: `1px solid ${showFilter || filterCount > 0 ? ACCENT : 'rgba(255,255,255,0.12)'}`, background: showFilter ? 'rgba(229,24,30,0.1)' : 'rgba(255,255,255,0.04)', color: showFilter || filterCount > 0 ? ACCENT : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, transition: 'all 0.18s' }}>
            <SlidersHorizontal size={15} strokeWidth={2} />
            Bộ lọc
            <AnimatePresence>
              {filterCount > 0 && (
                <motion.span key="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  style={{ width: 18, height: 18, borderRadius: '50%', background: ACCENT, color: 'white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {filterCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>

        {/* Active chips */}
        <AnimatePresence>
          {filterCount > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, overflow: 'hidden' }}>
              {selGenre && !genreId && <Chip label={genres.find(g => g.id === selGenre)?.name || 'Thể loại'} onRemove={() => setSelGenre(null)} />}
              {selYear && <Chip label={selYear} onRemove={() => setSelYear(null)} />}
              {minRating > 0 && <Chip label={`⭐ ${minRating}+`} onRemove={() => setMinRating(0)} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main layout */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0, width: '100%', overflowX: 'hidden' }}>

            {/* Skeleton */}
            {loading && (
              <div style={GRID_STYLE}>
                {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Empty / Error */}
            {!loading && (movies.length === 0 || fetchError) && (
              <EmptyState error={fetchError} onAction={fetchError ? doFetch : clearFilters} />
            )}

            {/* Cards + Pagination */}
            {!loading && movies.length > 0 && (
              <>
                <div style={isMobile
                  ? { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }
                  : GRID_STYLE
                }>
                  <AnimatePresence mode="popLayout">
                    {movies.map((m, i) => (
                      <motion.div key={m.id || i}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ delay: Math.min(i * 0.02, 0.25), duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}>
                        {isMobile ? (
                          <BrowseMobileCard
                            movie={m}
                            isFavorited={favIds.has(String(m.id))}
                            onFavoriteToggle={(movie, isNowFav) => {
                              setFavIds(prev => {
                                const next = new Set(prev);
                                isNowFav ? next.add(String(movie.id)) : next.delete(String(movie.id));
                                return next;
                              });
                            }}
                            navigate={navigate}
                          />
                        ) : (
                          <MovieCard
                            movie={m}
                            isFavorited={favIds.has(String(m.id))}
                            onFavoriteToggle={(movie, isNowFav) => {
                              setFavIds(prev => {
                                const next = new Set(prev);
                                isNowFav ? next.add(String(movie.id)) : next.delete(String(movie.id));
                                return next;
                              });
                            }}
                          />
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  total={total}
                  pageSize={PAGE_SIZE}
                  onPageChange={pagination.goTo}
                  pageNumbers={pagination.pageNumbers}
                />
              </>
            )}
          </div>

          <FilterSidebar
            show={showFilter} genres={genres}
            isMobile={isMobile}
            onClose={() => setShowFilter(false)}
            selGenre={selGenre}   onGenreChange={setSelGenre}
            selYear={selYear}     onYearChange={setSelYear}
            sortBy={sortBy}       onSortChange={setSortBy}
            minRating={minRating} onRatingChange={setMinRating}
            filterCount={filterCount} onClearAll={clearFilters}
            lockedGenreId={genreId}
          />
        </div>
      </div>

      {/* Floating spinner */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 20px', background: 'rgba(16,16,16,0.95)', borderRadius: 40, border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', zIndex: 9000, boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(229,24,30,0.25)', borderTopColor: ACCENT, animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Đang tải…</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}