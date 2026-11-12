// src/pages/BrowsePage.jsx
// Trạng thái duyệt (tab, thể loại, năm, điểm, sắp xếp, trạng thái TV, trang) nằm HẾT trên URL:
//   Back / reload / chia sẻ link đều giữ đúng bộ lọc. Dữ liệu qua React Query, yêu thích qua MovieCard (useFavoriteToggle).
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, SlidersHorizontal, X, Film, Tv } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import movieService from '../../services/movieService';
import tvShowService from '../../services/tvShowService';
import MovieCard from '../../components/movie/MovieCard';
import { SkeletonCard, GRID_STYLE } from '../../components/search/SearchUI';
import Pagination from '../../components/common/Pagination';
import { C, FONT_DISPLAY, FONT_BODY, GOOGLE_FONTS } from '../../context/homeTokens';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useGenres } from '../../hooks/useHomeQueries';
import { useMinimumLoading } from '../../hooks/useMinimumLoading';
import LoadingScreen from '../../components/ui/LoadingScreen';
import PageError from '../../components/common/PageError';
import { queryKeys, STALE } from '../../config/queryKeys';
import { normalizeMovie, normalizeTvShow, mediaKey } from '../../utils/normalizeMedia';
import { parsePaged } from '../../utils/queryHelpers';

const ACCENT = '#e5181e';
const PAGE_SIZE = 24; // 24 chia hết cho 2/3/4/6 cột → hàng cuối luôn đầy
const DEFAULT_SORT = 'rating';
const EMPTY = [];

// ── Gọi API: hàm thuần ở mức module (không phụ thuộc component) → dùng chung cho query và prefetch ──
// filter = { tab, genreId, country, minRating, year, sort, status, page }
const fetchBrowsePage = async (f) => {
  // Năm → khoảng ngày (BE lọc theo ReleaseDate / FirstAirDate)
  const fromDate = f.year ? `${f.year}-01-01` : undefined;
  const toDate = f.year ? `${f.year}-12-31` : undefined;
  const common = {
    page: f.page,
    pageSize: PAGE_SIZE,
    genreIds: f.genreId ? [f.genreId] : undefined,
    originCountry: f.country || undefined,
    minRating: f.minRating > 0 ? f.minRating : undefined,
    sortDesc: f.sort !== 'title', // "Tên A–Z" sắp tăng dần, còn lại giảm dần
  };

  if (f.tab === 'movie') {
    const res = await movieService.getMovies({
      ...common,
      fromReleaseDate: fromDate,
      toReleaseDate: toDate,
      sortBy: f.sort === 'firstairdate' ? 'releaseDate' : f.sort,
    });
    const { items, total } = parsePaged(res, ['movies', 'results']);
    return { items: items.map(normalizeMovie), total };
  }

  const res = await tvShowService.getTvShows({
    ...common,
    fromFirstAirDate: fromDate,
    toFirstAirDate: toDate,
    status: f.status || undefined,
    sortBy: f.sort === 'releaseDate' ? 'firstairdate' : f.sort,
  });
  const { items, total } = parsePaged(res, ['tvShows', 'results']);
  return { items: items.map(normalizeTvShow), total };
};

const browseQuery = (filter) => ({
  queryKey: queryKeys.browse.list(filter),
  queryFn: () => fetchBrowsePage(filter),
  staleTime: STALE.list,
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
            {genres.map(g => <FilterBtn key={g.id} active={String(selGenre) === String(g.id)} onClick={() => onGenreChange(g.id)}>{g.name}</FilterBtn>)}
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

  // AnimatePresence luôn được mount → khi `show` về false, phần tử mới có thời gian chạy exit
  if (isMobile) {
    return createPortal(
      <AnimatePresence>
        {show && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 99998 }}
          />
        )}
        {show && (
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
        )}
      </AnimatePresence>,
      document.body
    );
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.aside
          key="sidebar"
          initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ width: 256, flexShrink: 0, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 18px', alignSelf: 'flex-start', position: 'sticky', top: 88 }}
        >
          <FilterContent {...props} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

const EmptyState = ({ error, onAction, isTvShow }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    style={{ textAlign: 'center', padding: '80px 0' }}>
    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>{error ? '⚠️' : (isTvShow ? '📺' : '🎬')}</div>
    <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>
      {error || `Không tìm thấy ${isTvShow ? 'TV show' : 'phim'} nào`}
    </p>
    <button onClick={onAction} style={{ padding: '9px 24px', borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600 }}>
      {error ? 'Thử lại' : 'Xóa bộ lọc'}
    </button>
  </motion.div>
);

const COUNTRY_LABELS = {
  KR: '🇰🇷 Hàn Quốc', CN: '🇨🇳 Trung Quốc', US: '🇺🇸 Hollywood',
  JP: '🇯🇵 Nhật Bản', VN: '🇻🇳 Việt Nam', FR: '🇫🇷 Pháp',
  GB: '🇬🇧 Anh', IN: '🇮🇳 Ấn Độ', TH: '🇹🇭 Thái Lan',
};

export default function BrowsePage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);

  // ── Trạng thái đọc từ URL (nguồn sự thật duy nhất) ──
  const lockedGenreId = searchParams.get('genre') || null; // thể loại cố định (đi từ link thể loại, kèm ?name=)
  const genreName = searchParams.get('name') || '';
  const country = searchParams.get('country') || null;
  const activeTab = searchParams.get('tab') === 'tvshow' ? 'tvshow' : 'movie';
  const selGenre = searchParams.get('g') || null; // thể loại người dùng chọn trong bộ lọc
  const yearParam = searchParams.get('year');
  const selYear = /^\d{4}$/.test(yearParam || '') ? yearParam : null;
  const minRating = Math.max(Number(searchParams.get('rating')) || 0, 0);
  const sortBy = searchParams.get('sort') || DEFAULT_SORT;
  const tvStatus = searchParams.get('status') || '';
  const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);

  // Thể loại: dùng chung cache với trang chủ (không tốn thêm request nếu đã vào trang chủ)
  const { data: genres = EMPTY } = useGenres();

  // Cập nhật URL: giá trị rỗng/mặc định thì xoá khỏi URL; mọi thay đổi (trừ khi đang đổi chính page) đều về trang 1.
  // replace=true cho thay đổi bộ lọc nhỏ để nút Back không phải lùi từng bước.
  const update = useCallback((patch, { replace = true } = {}) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === '' || v === 0) next.delete(k);
        else next.set(k, String(v));
      }
      if (!('page' in patch)) next.delete('page');
      return next;
    }, { replace });
  }, [setSearchParams]);

  const setPage = useCallback((p, replace = true) => update({ page: p <= 1 ? null : p }, { replace }), [update]);

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    // Đổi tab là điều hướng thật → push history để Back quay lại tab trước
    update({ tab: tab === 'movie' ? null : tab, g: null, year: null, rating: null, sort: null, status: null }, { replace: false });
  };
  const clearFilters = () => update({ g: null, year: null, rating: null, sort: null, status: null });

  // ── Dữ liệu ──
  const filter = useMemo(() => ({
    tab: activeTab,
    genreId: lockedGenreId || selGenre,
    country,
    minRating,
    year: selYear,
    sort: sortBy,
    status: activeTab === 'tvshow' ? tvStatus : '',
    page,
  }), [activeTab, lockedGenreId, selGenre, country, minRating, selYear, sortBy, tvStatus, page]);

  const { data, isLoading, isPlaceholderData, isError, refetch } = useQuery({
    ...browseQuery(filter),
    // Đổi trang/bộ lọc: giữ kết quả cũ (làm mờ) thay vì xoá trắng; đổi tab phim ↔ TV show thì bỏ
    placeholderData: (prev, prevQuery) => (prevQuery?.queryKey?.[2]?.tab === activeTab ? prev : undefined),
  });

  const items = data?.items ?? EMPTY;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const loading = isLoading; // chưa có dữ liệu nào để hiển thị

  // Giống FavoritesPage: vào trang luôn hiện LoadingScreen (tối thiểu ~1.1s), xong thì trượt lên.
  // Chỉ áp dụng cho lần vào trang đầu; đổi tab / bộ lọc SAU ĐÓ dùng skeleton + làm mờ như cũ.
  const minLoading = useMinimumLoading(isLoading);
  const [entered, setEntered] = useState(false);
  useEffect(() => { if (!minLoading) setEntered(true); }, [minLoading]);
  const showLoading = minLoading && !entered;
  const loadFailed = isError && !data;
  const fetchError = isError
    ? `Không thể tải danh sách ${activeTab === 'tvshow' ? 'TV show' : 'phim'}. Vui lòng thử lại.`
    : null;

  // Prefetch trang kế tiếp + preload poster → bấm sang là hiện ngay
  useEffect(() => {
    if (!data || isPlaceholderData || page >= totalPages) return;
    const nextFilter = { ...filter, page: page + 1 };
    queryClient.prefetchQuery({
      ...browseQuery(nextFilter),
      queryFn: async () => {
        const r = await fetchBrowsePage(nextFilter);
        r.items.forEach((m) => { if (m.posterUrl) { const img = new Image(); img.src = m.posterUrl; } });
        return r;
      },
    });
  }, [data, isPlaceholderData, page, totalPages, filter, queryClient]);

  // Đang ở trang vượt quá số trang hiện có (vd dữ liệu vừa bị xóa) → kéo về trang cuối hợp lệ
  useEffect(() => {
    if (!isLoading && !isPlaceholderData && total > 0 && page > totalPages) setPage(totalPages);
  }, [isLoading, isPlaceholderData, total, page, totalPages, setPage]);

  const handlePageChange = useCallback((p) => {
    setPage(p, false); // push history: Back quay lại trang trước
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }, [setPage]);

  const filterCount = [selGenre && !lockedGenreId, selYear, minRating > 0, tvStatus && activeTab === 'tvshow'].filter(Boolean).length;

  const title = lockedGenreId ? (genreName || 'Thể Loại')
              : country ? (COUNTRY_LABELS[country] || `${country}`)
              : activeTab === 'tvshow' ? 'Tất Cả TV Show'
              : 'Tất Cả Phim';

  return (
    <>
    <AnimatePresence>{showLoading && <LoadingScreen key="loading" />}</AnimatePresence>

    {!showLoading && loadFailed && (
      <PageError
        message={`Không thể tải danh sách ${activeTab === 'tvshow' ? 'TV show' : 'phim'}.`}
        onRetry={() => refetch()}
        retrying={false}
      />
    )}

    {!showLoading && !loadFailed && (
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
                  {total.toLocaleString('vi-VN')} {activeTab === 'tvshow' ? 'TV show' : 'phim'}
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
            <AnimatePresence>
              {selGenre && !lockedGenreId && <Chip key="g" label={genres.find(g => String(g.id) === selGenre)?.name || 'Thể loại'} onRemove={() => update({ g: null })} />}
              {selYear && <Chip key="year" label={selYear} onRemove={() => update({ year: null })} />}
              {minRating > 0 && <Chip key="rating" label={`⭐ ${minRating}+`} onRemove={() => update({ rating: null })} />}
              {tvStatus && activeTab === 'tvshow' && <Chip key="status" label={TV_STATUS_OPTIONS.find(o => o.value === tvStatus)?.label || tvStatus} onRemove={() => update({ status: null })} />}
            </AnimatePresence>
          </div>
        )}

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {/* Content — giống FavoritesPage: mode="wait" + stagger từng card */}
            <AnimatePresence mode="wait">
              {loading && items.length === 0 && (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={isMobile ? { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 } : GRID_STYLE}
                >
                  {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
                </motion.div>
              )}

              {!loading && (items.length === 0 || fetchError) && (
                <EmptyState key={`empty-${activeTab}`} error={fetchError} onAction={fetchError ? refetch : clearFilters} isTvShow={activeTab === 'tvshow'} />
              )}

              {items.length > 0 && !fetchError && (
                <motion.div
                  key={`grid-${activeTab}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  <div style={{ ...(isMobile ? { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 } : GRID_STYLE), position: 'relative', opacity: isPlaceholderData ? 0.45 : 1, pointerEvents: isPlaceholderData ? 'none' : 'auto', transition: 'opacity 0.2s ease' }}>
                    <AnimatePresence mode="popLayout">
                      {items.map((m, i) => (
                        <motion.div
                          key={mediaKey(m)}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: Math.min(i * 0.02, 0.25), duration: 0.25 }}
                        >
                          {/* MovieCard tự chọn bản mobile/desktop, tự đọc & ghi yêu thích qua cache */}
                          <MovieCard movie={m} cardWidth={isMobile ? '100%' : undefined} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    pageSize={PAGE_SIZE}
                    onPageChange={handlePageChange}
                    itemLabel={activeTab === 'tvshow' ? 'TV show' : 'phim'}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <FilterSidebar
            show={showFilter}
            genres={genres}
            isMobile={isMobile}
            onClose={() => setShowFilter(false)}
            selGenre={selGenre} onGenreChange={(id) => update({ g: id })}
            selYear={selYear} onYearChange={(y) => update({ year: y })}
            sortBy={sortBy} onSortChange={(v) => update({ sort: v === DEFAULT_SORT ? null : v })}
            minRating={minRating} onRatingChange={(r) => update({ rating: r })}
            filterCount={filterCount} onClearAll={clearFilters}
            lockedGenreId={lockedGenreId}
            activeTab={activeTab}
            tvStatus={tvStatus} onTvStatusChange={(v) => update({ status: v })}
          />
        </div>
      </div>
    </div>
    )}
    </>
  );
}