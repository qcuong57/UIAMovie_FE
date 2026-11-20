// src/pages/BrowsePage.jsx
// Trạng thái duyệt (tab, thể loại cố định, quốc gia, trang) nằm trên URL: Back / reload / chia sẻ link đều giữ đúng.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Film, Tv } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import movieService from '../../services/movieService';
import tvShowService from '../../services/tvShowService';
import MovieCard from '../../components/movie/MovieCard';
import { SkeletonCard, GRID_STYLE } from '../../components/search/SearchUI';
import Pagination from '../../components/common/Pagination';
import { C, FONT_DISPLAY, FONT_BODY, GOOGLE_FONTS } from '../../context/homeTokens';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { useMinimumLoading } from '../../hooks/common/useMinimumLoading';
import LoadingScreen from '../../components/ui/LoadingScreen';
import PageError from '../../components/common/PageError';
import { queryKeys, STALE } from '../../config/queryKeys';
import { normalizeMovie, normalizeTvShow, mediaKey } from '../../utils/normalizeMedia';
import { parsePaged } from '../../utils/queryHelpers';

const ACCENT = '#e5181e';
const PAGE_SIZE = 24; // 24 chia hết cho 2/3/4/6 cột → hàng cuối luôn đầy
const EMPTY = [];

// filter = { tab, genreId, country, page }
const fetchBrowsePage = async (f) => {
  const common = {
    page: f.page,
    pageSize: PAGE_SIZE,
    genreIds: f.genreId ? [f.genreId] : undefined,
    originCountry: f.country || undefined,
    sortBy: 'rating',
    sortDesc: true,
  };

  if (f.tab === 'movie') {
    const res = await movieService.getMovies(common);
    const { items, total } = parsePaged(res, ['movies', 'results']);
    return { items: items.map(normalizeMovie), total };
  }

  const res = await tvShowService.getTvShows(common);
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


const EmptyState = ({ error, onAction, isTvShow }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    style={{ textAlign: 'center', padding: '80px 0' }}>
    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>{error ? '⚠️' : (isTvShow ? '📺' : '🎬')}</div>
    <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>
      {error || `Không tìm thấy ${isTvShow ? 'TV show' : 'phim'} nào`}
    </p>
    {error && (
      <button onClick={onAction} style={{ padding: '9px 24px', borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600 }}>
      Thử lại
    </button>
    )}
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

  // ── Trạng thái đọc từ URL ──
  const lockedGenreId = searchParams.get('genre') || null; // thể loại cố định (đi từ link thể loại, kèm ?name=)
  const genreName = searchParams.get('name') || '';
  const country = searchParams.get('country') || null;
  const activeTab = searchParams.get('tab') === 'tvshow' ? 'tvshow' : 'movie';
  const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);

  // Cập nhật URL: giá trị rỗng thì xoá khỏi URL; mọi thay đổi (trừ khi đang đổi chính page) đều về trang 1.
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
    update({ tab: tab === 'movie' ? null : tab }, { replace: false });
  };

  // ── Dữ liệu ──
  const filter = useMemo(() => ({
    tab: activeTab,
    genreId: lockedGenreId,
    country,
    page,
  }), [activeTab, lockedGenreId, country, page]);

  const { data, isLoading, isPlaceholderData, isError, refetch } = useQuery({
    ...browseQuery(filter),
    // Đổi trang: giữ kết quả cũ (làm mờ) thay vì xoá trắng; đổi tab phim ↔ TV show thì bỏ
    placeholderData: (prev, prevQuery) => (prevQuery?.queryKey?.[2]?.tab === activeTab ? prev : undefined),
  });

  const items = data?.items ?? EMPTY;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const loading = isLoading;

  // Vào trang luôn hiện LoadingScreen (tối thiểu ~1.1s), xong thì trượt lên. Chỉ áp dụng cho lần vào đầu.
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

  // Đang ở trang vượt quá số trang hiện có → kéo về trang cuối hợp lệ
  useEffect(() => {
    if (!isLoading && !isPlaceholderData && total > 0 && page > totalPages) setPage(totalPages);
  }, [isLoading, isPlaceholderData, total, page, totalPages, setPage]);

  const handlePageChange = useCallback((p) => {
    setPage(p, false); // push history: Back quay lại trang trước
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }, [setPage]);

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
        </motion.div>

        <ContentTypeTabs activeTab={activeTab} onTabChange={handleTabChange} isMobile={isMobile} />

        <div style={{ width: '100%' }}>
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
              <EmptyState key={`empty-${activeTab}`} error={fetchError} onAction={refetch} isTvShow={activeTab === 'tvshow'} />
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
      </div>
    </div>
    )}
    </>
  );
}