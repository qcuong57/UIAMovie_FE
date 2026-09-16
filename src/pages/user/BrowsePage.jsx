// src/pages/BrowsePage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, SlidersHorizontal, X, Heart, Film, Tv } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import movieService from '../../services/movieService';
import tvShowService from '../../services/tvShowService';
import genreService from '../../services/genreService';
import MovieCard from '../../components/movie/MovieCard';
import { SkeletonCard, GRID_STYLE } from '../../components/search/SearchUI';
import Pagination from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { C, FONT_DISPLAY, FONT_BODY, GOOGLE_FONTS } from '../../context/homeTokens';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useToast } from '../../components/common/Toast';

const ACCENT = '#e5181e';

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const parseItemsResponse = (res) => {
  if (!res) return { items: [], total: 0 };
  if (Array.isArray(res)) return { items: res, total: res.length };

  if (res?.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
    const inner = res.data;
    if (Array.isArray(inner)) return { items: inner, total: inner.length };
    const items = inner.movies ?? inner.tvShows ?? inner.items ?? inner.results ?? [];
    const total = inner.total ?? inner.totalCount ?? inner.count ?? items.length;
    if (Array.isArray(items)) return { items, total };
  }

  const items = res.movies ?? res.tvShows ?? res.items ?? res.results ?? res.data ?? [];
  const total = res.total ?? res.totalCount ?? res.count ?? (Array.isArray(items) ? items.length : 0);
  if (Array.isArray(items)) return { items, total };

  return { items: [], total: 0 };
};

const normalizeMovie = (m) => ({
  id: m.id,
  title: m.title,
  year: m.releaseDate ? new Date(m.releaseDate).getFullYear() : m.year ?? null,
  rating: m.rating ?? m.imdbRating ?? 0,
  posterUrl: m.posterUrl ?? m.poster ?? null,
  backdropUrl: m.backdropUrl ?? m.backdrop ?? null,
  genres: m.genres ?? [],
  description: m.description ?? '',
  duration: m.duration ?? null,
  releaseDate: m.releaseDate ?? null,
  isTvShow: false,
});

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

const ContentTypeTabs = ({ activeTab, onTabChange, isMobile }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 3,
    border: '1px solid rgba(255,255,255,0.07)',
    width: 'fit-content',
    marginBottom: isMobile ? 16 : 20,
  }}>
    {[
      { key: 'movie', label: 'Phim', Icon: Film },
      { key: 'tvshow', label: 'TV Show', Icon: Tv },
    ].map(({ key, label, Icon }) => {
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
        </motion.button>
      );
    })}
  </div>
);

const Chip = ({ label, onRemove }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px 4px 12px',
      borderRadius: 99,
      background: 'rgba(229,24,30,0.12)',
      border: '1px solid rgba(229,24,30,0.3)',
      fontFamily: FONT_BODY,
      fontSize: 12,
      fontWeight: 600,
      color: ACCENT,
    }}
  >
    {label}
    <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: ACCENT }}>
      <X size={12} />
    </button>
  </motion.div>
);

const YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));

const MOVIE_SORT_OPTIONS = [
  { value: 'rating', label: 'Đánh giá cao nhất' },
  { value: 'releaseDate', label: 'Mới nhất' },
  { value: 'title', label: 'Tên A–Z' },
];

const TVSHOW_SORT_OPTIONS = [
  { value: 'rating', label: 'Đánh giá cao nhất' },
  { value: 'firstairdate', label: 'Mới nhất' },
  { value: 'title', label: 'Tên A–Z' },
];

const FilterGroup = ({ label, children, scrollable }) => (
  <div style={{ marginBottom: 18 }}>
    <p style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, ...(scrollable ? { maxHeight: 180, overflowY: 'auto' } : {}) }}>{children}</div>
  </div>
);

const FilterBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', background: active ? 'rgba(229,24,30,0.15)' : 'transparent', color: active ? ACCENT : 'rgba(255,255,255,0.6)', fontFamily: FONT_BODY, fontSize: 13, fontWeight: active ? 700 : 400, transition: 'all 0.15s' }}>
    {active && <span style={{ marginRight: 6 }}>✓</span>}{children}
  </button>
);

const Divider = () => <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 18 }} />;

const TV_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'Returning Series', label: 'Đang chiếu' },
  { value: 'Ended', label: 'Đã kết thúc' },
  { value: 'Canceled', label: 'Đã hủy' },
];

const FilterContent = ({ genres, selGenre, onGenreChange, selYear, onYearChange, sortBy, onSortChange, minRating, onRatingChange, onClearAll, filterCount, lockedGenreId, onClose, activeTab, tvStatus, onTvStatusChange }) => {
  const sortOptions = activeTab === 'tvshow' ? TVSHOW_SORT_OPTIONS : MOVIE_SORT_OPTIONS;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: 'white' }}>Bộ lọc</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {filterCount > 0 && <button onClick={onClearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 12, color: ACCENT, fontWeight: 600 }}>Đặt lại</button>}
          {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex' }}><X size={18} /></button>}
        </div>
      </div>
      <FilterGroup label="Sắp xếp">
        {sortOptions.map(o => <FilterBtn key={o.value} active={sortBy === o.value} onClick={() => onSortChange(o.value)}>{o.label}</FilterBtn>)}
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
      {activeTab === 'tvshow' && (
        <>
          <FilterGroup label="Trạng thái">
            {TV_STATUS_OPTIONS.map(o => <FilterBtn key={o.value} active={tvStatus === o.value} onClick={() => onTvStatusChange(o.value)}>{o.label}</FilterBtn>)}
          </FilterGroup>
          <Divider />
        </>
      )}
      <FilterGroup label="Năm">
        <select value={selYear || ''} onChange={e => onYearChange(e.target.value || null)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: selYear ? 'white' : 'rgba(255,255,255,0.4)', fontFamily: FONT_BODY, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
          <option value="">Tất cả năm</option>
          {YEARS.map(y => <option key={y} value={y} style={{ background: '#181818' }}>{y}</option>)}
        </select>
      </FilterGroup>
      <Divider />
      <FilterGroup label={<>Điểm tối thiểu{minRating > 0 && <span style={{ color: ACCENT, marginLeft: 6 }}>≥ {minRating}</span>}</>}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[0, 5, 6, 7, 8, 9].map(r => (
            <button key={r} onClick={() => onRatingChange(r)} style={{ padding: '5px 10px', borderRadius: 99, border: 'none', cursor: 'pointer', background: minRating === r ? 'rgba(229,24,30,0.18)' : 'rgba(255,255,255,0.06)', color: minRating === r ? ACCENT : 'rgba(255,255,255,0.5)', fontFamily: FONT_BODY, fontSize: 12, fontWeight: minRating === r ? 700 : 400, transition: 'all 0.15s' }}>
              {r === 0 ? 'Tất cả' : `${r}+`}
            </button>
          ))}
        </div>
      </FilterGroup>
    </>
  );
};

const FilterSidebar = ({ show, isMobile, onClose, ...props }) => {
  useEffect(() => {
    if (show && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [show, isMobile]);

  if (!show) return null;

  if (isMobile) {
    return createPortal(
      <AnimatePresence>
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 99998 }}
        />
        <motion.div
          key="sheet"
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 99999,
            background: '#121212',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '20px 20px 0 0',
            padding: '16px 18px 36px',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)', margin: '0 auto 16px' }} />
          <FilterContent {...props} onClose={onClose} />
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  }

  return (
    <motion.aside
      key="sidebar"
      initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ width: 256, flexShrink: 0, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 18px', alignSelf: 'flex-start', position: 'sticky', top: 88 }}
    >
      <FilterContent {...props} />
    </motion.aside>
  );
};

const EmptyState = ({ error, onAction, isTvShow }) => (
  <div style={{ textAlign: 'center', padding: '80px 0' }}>
    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>{error ? '⚠️' : (isTvShow ? '📺' : '🎬')}</div>
    <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>
      {error || `Không tìm thấy ${isTvShow ? 'TV show' : 'phim'} nào`}
    </p>
    <button onClick={onAction} style={{ padding: '9px 24px', borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600 }}>
      {error ? 'Thử lại' : 'Xóa bộ lọc'}
    </button>
  </div>
);

// MobileCard: Fix triệt để không bấm được tim trên mobile
const BrowseMobileCard = ({ movie, isFavorited, onFavoriteToggle, navigate }) => {
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
    onFavoriteToggle?.(movie, nextState);

    try {
      if (!nextState) {
        if (movie.isTvShow) {
          await (tvShowService.removeFavorite ? tvShowService.removeFavorite(movie.id) : movieService.removeFavorite(movie.id));
        } else {
          await movieService.removeFavorite(movie.id);
        }
        toast?.info?.(`"${movie.title}" đã được bỏ khỏi Yêu thích`);
      } else {
        if (movie.isTvShow) {
          await (tvShowService.addFavorite ? tvShowService.addFavorite(movie.id) : movieService.addFavorite(movie.id));
        } else {
          await movieService.addFavorite(movie.id);
        }
        toast?.success?.(`Đã thêm "${movie.title}" vào Yêu thích`);
      }
    } catch (err) {
      console.error('[Favorite Error]:', err);
      setLocalFav(!nextState);
      onFavoriteToggle?.(movie, !nextState);
      toast?.error?.('Không thể cập nhật Yêu thích, vui lòng thử lại');
    } finally {
      setFavLoading(false);
    }
  };

  const handleClick = () => {
    if (movie.isTvShow) navigate(`/tvshow/${movie.id}/info`);
    else navigate(`/movie/${movie.id}/info`);
  };

  return (
    <div onClick={handleClick} style={{ cursor: 'pointer', position: 'relative' }}>
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '2/3', background: '#181818' }}>
        {movie.posterUrl && !imgErr
          ? <img src={movie.posterUrl} alt={movie.title} onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{movie.isTvShow ? '📺' : '🎬'}</div>
        }

        {movie.isTvShow && (
          <div style={{ position: 'absolute', top: 6, right: 6, padding: '2px 6px', borderRadius: 3, background: 'rgba(229,24,30,0.85)', backdropFilter: 'blur(4px)' }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 8, fontWeight: 800, color: 'white', letterSpacing: '0.05em' }}>TV</span>
          </div>
        )}

        {movie.rating > 0 && (
          <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 99, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#f5c518"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10, fontWeight: 700, color: '#f5c518' }}>{movie.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Nút tim */}
        <button
          type="button"
          onClick={handleFav}
          disabled={favLoading}
          aria-label="Yêu thích"
          style={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            zIndex: 10,
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: localFav ? '#e5181e' : 'rgba(0,0,0,0.6)',
            border: `1.5px solid ${localFav ? '#e5181e' : 'rgba(255,255,255,0.3)'}`,
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: favLoading ? 'not-allowed' : 'pointer',
            opacity: favLoading ? 0.7 : 1,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {favLoading ? (
            <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
          ) : (
            <Heart size={14} fill={localFav ? 'white' : 'none'} color="white" strokeWidth={2} />
          )}
        </button>
      </div>

      <div style={{ paddingTop: 7, paddingBottom: 4 }}>
        <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 12, fontWeight: 700, color: '#f0f2f8', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 2 }}>{movie.title}</p>
        {movie.year && <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10, color: '#888' }}>{movie.year}</p>}
      </div>
    </div>
  );
};

export default function BrowsePage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const genreId = searchParams.get('genre') || null;
  const genreName = searchParams.get('name') || '';
  const urlSort = searchParams.get('sort') || 'rating';
  const urlCountry = searchParams.get('country') || null;
  const tabParam = searchParams.get('tab') || 'movie';

  const [activeTab, setActiveTab] = useState(tabParam);
  const [genres, setGenres] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [total, setTotal] = useState(0);
  const [showFilter, setShowFilter] = useState(false);

  const [selGenre, setSelGenre] = useState(null);
  const [selYear, setSelYear] = useState(null);
  const [sortBy, setSortBy] = useState(urlSort);
  const [minRating, setMinRating] = useState(0);
  const [selCountry, setSelCountry] = useState(null);
  const [tvStatus, setTvStatus] = useState('');
  const [favIds, setFavIds] = useState(new Set());

  const fetchIdRef = useRef(0);
  const pagination = usePagination({ total });

  const activeGenreId = genreId || selGenre;
  const activeCountry = urlCountry || selCountry;

  useEffect(() => {
    genreService.getAllGenres()
      .then(res => {
        const list = Array.isArray(res) ? res : res?.genres ?? res?.data ?? parseItemsResponse(res).items ?? [];
        setGenres(list);
      })
      .catch(() => {});
  }, []);

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelGenre(null);
    setSelYear(null);
    setMinRating(0);
    setTvStatus('');
    setSortBy('rating');
    setFetchError(null);
    pagination.setPage?.(1);
  };

  const doFetch = useCallback(async () => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    setFetchError(null);

    try {
      let raw = [];
      if (activeTab === 'movie') {
        if (activeGenreId) {
          const res = await movieService.getMoviesByGenre(activeGenreId);
          raw = parseItemsResponse(res).items;
        } else if (activeCountry) {
          const res = await movieService.getMoviesByCountry(activeCountry);
          raw = parseItemsResponse(res).items;
        } else {
          const res = await movieService.getMovies(1, 200);
          raw = parseItemsResponse(res).items;
        }
        if (id !== fetchIdRef.current) return;
        raw = raw.map(normalizeMovie);
      } else {
        if (activeGenreId) {
          const res = await tvShowService.getTvShowsByGenre(activeGenreId);
          raw = parseItemsResponse(res).items;
        } else {
          const res = await tvShowService.getTvShows({
            page: 1,
            pageSize: 200,
            originCountry: activeCountry || undefined,
            status: tvStatus || undefined,
            sortBy: sortBy === 'releaseDate' ? 'firstairdate' : sortBy,
            sortDesc: true,
          });
          raw = parseItemsResponse(res).items;
        }
        if (id !== fetchIdRef.current) return;
        raw = raw.map(normalizeTvShow);
      }

      if (minRating > 0) raw = raw.filter(m => (m.rating || 0) >= minRating);
      if (selYear) raw = raw.filter(m => String(m.year) === String(selYear));
      if (selCountry && !urlCountry) raw = raw.filter(m => m.originCountry === selCountry);

      raw = [...raw].sort((a, b) => {
        const sortKey = activeTab === 'tvshow' && sortBy === 'firstairdate' ? 'releaseDate' : sortBy;
        return sortKey === 'rating' ? (b.rating || 0) - (a.rating || 0)
             : sortKey === 'releaseDate' ? new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0)
             : sortKey === 'title' ? (a.title || '').localeCompare(b.title || '', 'vi')
             : 0;
      });

      setAllItems(raw);
      setTotal(raw.length);
    } catch (err) {
      console.error('[BrowsePage] fetch error:', err);
      if (id === fetchIdRef.current) {
        setFetchError(`Không thể tải danh sách ${activeTab === 'tvshow' ? 'TV show' : 'phim'}. Vui lòng thử lại.`);
        setAllItems([]);
        setTotal(0);
      }
    } finally {
      if (id === fetchIdRef.current) setLoading(false);
    }
  }, [activeTab, activeGenreId, activeCountry, minRating, selYear, selCountry, sortBy, tvStatus]);

  useEffect(() => { doFetch(); }, [doFetch]);

  useEffect(() => {
    const start = (pagination.page - 1) * pagination.props.pageSize;
    setItems(allItems.slice(start, start + pagination.props.pageSize));
  }, [allItems, pagination.page, pagination.props.pageSize]);

  useEffect(() => {
    if (pagination.page > 1) window.scrollTo({ top: 120, behavior: 'smooth' });
  }, [pagination.page]);

  const COUNTRY_LABELS = {
    KR: '🇰🇷 Hàn Quốc', CN: '🇨🇳 Trung Quốc', US: '🇺🇸 Hollywood',
    JP: '🇯🇵 Nhật Bản', VN: '🇻🇳 Việt Nam', FR: '🇫🇷 Pháp',
    GB: '🇬🇧 Anh', IN: '🇮🇳 Ấn Độ', TH: '🇹🇭 Thái Lan',
  };

  const filterCount = [selGenre && !genreId, selYear, minRating > 0, selCountry && !urlCountry, tvStatus && activeTab === 'tvshow'].filter(Boolean).length;

  const title = genreId ? (genreName || 'Thể Loại')
              : activeCountry ? (COUNTRY_LABELS[activeCountry] || `${activeCountry}`)
              : activeTab === 'tvshow' ? 'Tất Cả TV Show'
              : 'Tất Cả Phim';

  const clearFilters = () => {
    setSelGenre(null); setSelYear(null); setMinRating(0); setSortBy('rating');
    setSelCountry(null); setFetchError(null); setTvStatus('');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: C.text, paddingTop: 68 }}>
      <style>{GOOGLE_FONTS}</style>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '16px 14px 60px' : '32px 48px 80px' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={() => navigate(-1)}
              style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={16} strokeWidth={2} />
            </motion.button>
            <div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: isMobile ? 22 : 30, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>{title}</h1>
              {!loading && total > 0 && (
                <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  {total.toLocaleString()} {activeTab === 'tvshow' ? 'TV show' : 'phim'}
                </p>
              )}
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowFilter(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: isMobile ? '7px 12px' : '9px 18px', borderRadius: 8, border: `1px solid ${showFilter || filterCount > 0 ? ACCENT : 'rgba(255,255,255,0.12)'}`, background: showFilter ? 'rgba(229,24,30,0.1)' : 'rgba(255,255,255,0.04)', color: showFilter || filterCount > 0 ? ACCENT : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600 }}>
            <SlidersHorizontal size={14} strokeWidth={2} />
            Bộ lọc
            {filterCount > 0 && (
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: ACCENT, color: 'white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {filterCount}
              </span>
            )}
          </motion.button>
        </motion.div>

        <ContentTypeTabs activeTab={activeTab} onTabChange={handleTabChange} isMobile={isMobile} />

        {filterCount > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {selGenre && !genreId && <Chip label={genres.find(g => g.id === selGenre)?.name || 'Thể loại'} onRemove={() => setSelGenre(null)} />}
            {selYear && <Chip label={selYear} onRemove={() => setSelYear(null)} />}
            {minRating > 0 && <Chip label={`⭐ ${minRating}+`} onRemove={() => setMinRating(0)} />}
            {tvStatus && activeTab === 'tvshow' && <Chip label={TV_STATUS_OPTIONS.find(o => o.value === tvStatus)?.label || tvStatus} onRemove={() => setTvStatus('')} />}
          </div>
        )}

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {loading && (
              <div style={isMobile ? { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 } : GRID_STYLE}>
                {Array.from({ length: pagination.props.pageSize }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {!loading && (items.length === 0 || fetchError) && (
              <EmptyState error={fetchError} onAction={fetchError ? doFetch : clearFilters} isTvShow={activeTab === 'tvshow'} />
            )}

            {!loading && items.length > 0 && (
              <>
                <div style={isMobile ? { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 } : GRID_STYLE}>
                  {items.map((m, i) => (
                    <div key={m.id || i}>
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
                          onClick={(movie) => {
                            if (movie.isTvShow) navigate(`/tvshow/${movie.id}/info`);
                            else navigate(`/movie/${movie.id}/info`);
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <Pagination {...pagination.props} />
              </>
            )}
          </div>

          <FilterSidebar
            show={showFilter}
            genres={genres}
            isMobile={isMobile}
            onClose={() => setShowFilter(false)}
            selGenre={selGenre} onGenreChange={setSelGenre}
            selYear={selYear} onYearChange={setSelYear}
            sortBy={sortBy} onSortChange={setSortBy}
            minRating={minRating} onRatingChange={setMinRating}
            filterCount={filterCount} onClearAll={clearFilters}
            lockedGenreId={genreId}
            activeTab={activeTab}
            tvStatus={tvStatus} onTvStatusChange={setTvStatus}
          />
        </div>
      </div>
    </div>
  );
}