// src/pages/FavoritesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Play, Trash2, Star, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import movieService from '../services/movieService';
import MovieCard    from '../components/movie/MovieCard';
import BackButton   from '../components/common/BackButton';
import Pagination   from '../components/common/Pagination';
import { usePagination } from '../hooks/usePagination';
import { C, FONT_DISPLAY, FONT_BODY, FONT_BEBAS, GOOGLE_FONTS } from '../context/homeTokens';

// 6 cột giống BrowsePage
const GRID_6 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, 1fr)',
  gap: 12,
};

const PAGE_SIZE = 24; // 4 hàng × 6 cột

// ── Helpers ───────────────────────────────────────────────────────────────────
const normalizeFav = f => ({
  id:       f.id,
  movieId:  f.movieId,
  title:    f.movieTitle || f.title || '',
  posterUrl: f.posterUrl || null,
  rating:   f.rating ? Number(f.rating) : null,
  addedAt:  f.addedAt ? new Date(f.addedAt) : null,
  year:     f.releaseDate ? new Date(f.releaseDate).getFullYear() : f.year || null,
  genres:   f.genres   || [],
  duration: f.duration || null,
});

const favToMovie = f => ({ ...f, id: f.movieId });

const SORT_OPTIONS = [
  { value: 'addedAt', label: 'Mới thêm nhất'    },
  { value: 'rating',  label: 'Đánh giá cao nhất' },
  { value: 'title',   label: 'Tên A–Z'           },
  { value: 'year',    label: 'Năm mới nhất'      },
];

const sortFavs = (arr, by) => [...arr].sort((a, b) => {
  if (by === 'addedAt') return (b.addedAt || 0) - (a.addedAt || 0);
  if (by === 'rating')  return (b.rating  || 0) - (a.rating  || 0);
  if (by === 'title')   return (a.title   || '').localeCompare(b.title || '', 'vi');
  if (by === 'year')    return (b.year    || 0) - (a.year    || 0);
  return 0;
});

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ onBrowse }) => (
  <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '110px 0', gap: 22, textAlign: 'center' }}>
    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
      style={{ width: 88, height: 88, borderRadius: '50%', background: 'radial-gradient(circle,rgba(229,24,30,0.12) 0%,rgba(229,24,30,0.04) 100%)', border: '1px solid rgba(229,24,30,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(229,24,30,0.08)' }}>
      <Heart size={36} color={C.accent} strokeWidth={1.5} />
    </motion.div>
    <div style={{ maxWidth: 320 }}>
      <p style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 10 }}>Danh sách trống</p>
      <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: 'rgba(255,255,255,0.32)', lineHeight: 1.7 }}>
        Thêm phim yêu thích bằng cách bấm biểu tượng trái tim khi xem phim
      </p>
    </div>
    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} onClick={onBrowse}
      style={{ marginTop: 4, padding: '11px 30px', borderRadius: 10, background: C.accent, border: 'none', color: 'white', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700 }}>
      Khám phá phim ngay
    </motion.button>
  </motion.div>
);

// ── List row (view mode = list) ───────────────────────────────────────────────
const FavRow = ({ fav, onRemove, index }) => {
  const [hovered, setHovered] = useState(false);
  const [imgErr,  setImgErr]  = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div layout
      initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 14, transition: { duration: 0.18 } }}
      transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.28 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/movie/${fav.movieId}/info`)}
      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 14px', borderRadius: 12, cursor: 'pointer', background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent', border: `1px solid ${hovered ? 'rgba(255,255,255,0.07)' : 'transparent'}`, transition: 'all 0.2s' }}
    >
      <span style={{ fontFamily: FONT_BEBAS, fontSize: 24, color: 'rgba(255,255,255,0.14)', width: 30, textAlign: 'right', flexShrink: 0, lineHeight: 1 }}>{index + 1}</span>
      <div style={{ width: 50, height: 75, borderRadius: 7, overflow: 'hidden', flexShrink: 0, background: '#1a1a1a' }}>
        {fav.posterUrl && !imgErr
          ? <img src={fav.posterUrl} alt={fav.title} onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 18 }}>🎬</span></div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fav.title}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {fav.rating && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Star size={11} fill="#facc15" color="#facc15" /><span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: '#facc15' }}>{fav.rating.toFixed(1)}</span></span>}
          {fav.year     && <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.32)' }}>{fav.year}</span>}
          {fav.duration && <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.32)' }}>{fav.duration} phút</span>}
          {fav.genres?.[0] && <span style={{ fontFamily: FONT_BODY, fontSize: 11, padding: '1px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.42)' }}>{fav.genres[0]}</span>}
        </div>
      </div>
      {fav.addedAt && <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.2)', flexShrink: 0, minWidth: 80, textAlign: 'right' }}>{fav.addedAt.toLocaleDateString('vi-VN')}</span>}
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={e => { e.stopPropagation(); navigate(`/movie/${fav.movieId}`); }}
              style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={13} fill="#000" color="#000" style={{ marginLeft: 1 }} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={e => { e.stopPropagation(); onRemove(fav.movieId); }}
              style={{ width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', background: 'rgba(229,24,30,0.1)', border: '1.5px solid rgba(229,24,30,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={13} color={C.accent} strokeWidth={2} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
export default function FavoritesPage() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [sortBy,    setSortBy]    = useState('addedAt');
  const [viewMode,  setViewMode]  = useState('grid');
  const [showSort,  setShowSort]  = useState(false);

  // ── Load data ───────────────────────────────────────────────────────────────
  const loadFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await movieService.getFavorites();
      const raw = Array.isArray(res) ? res : res?.data || res?.favorites || [];
      setFavorites(raw.map(normalizeFav));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadFavorites(); }, []);

  const handleRemove = useCallback(async movieId => {
    setFavorites(prev => prev.filter(f => f.movieId !== movieId));
    try { await movieService.removeFavorite(movieId); }
    catch { loadFavorites(); }
  }, [loadFavorites]);

  // ── Sort toàn bộ, rồi phân trang ───────────────────────────────────────────
  const sorted = sortFavs(favorites, sortBy);

  const pagination = usePagination({ total: sorted.length, pageSize: PAGE_SIZE });

  // Slice trang hiện tại
  const pageItems = pagination.paginate(sorted);

  // Reset về trang 1 khi đổi sort hoặc viewMode
  useEffect(() => { pagination.goTo(1); }, [sortBy]);

  // Scroll lên khi chuyển trang
  useEffect(() => {
    if (pagination.page > 1) window.scrollTo({ top: 100, behavior: 'smooth' });
  }, [pagination.page]);

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000', paddingTop: 68 }}>
      <style>{GOOGLE_FONTS}</style>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 48px' }}>
        <div style={{ height: 36, width: 240, borderRadius: 8, marginBottom: 36, animation: 'shimmer 1.6s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%)' }} />
        <div style={GRID_6}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ aspectRatio: '2/3', borderRadius: 10, animationDelay: `${i * 0.07}s`, animation: 'shimmer 1.6s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 100%)' }} />
          ))}
        </div>
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#000', color: C.text, paddingTop: 68 }}>
      <style>{GOOGLE_FONTS}</style>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 48px 80px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <BackButton />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Heart size={22} fill={C.accent} color={C.accent} />
                <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 900, color: C.text, lineHeight: 1 }}>Yêu Thích</h1>
              </div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.3)', paddingLeft: 32 }}>
                {favorites.length > 0 ? `${favorites.length} phim` : 'Chưa có phim nào'}
              </p>
            </div>
          </div>

          {/* Controls: sort + view toggle */}
          {favorites.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Sort dropdown */}
              <div style={{ position: 'relative' }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowSort(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: `1px solid ${showSort ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.09)'}`, background: showSort ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, transition: 'all 0.18s' }}>
                  <SlidersHorizontal size={13} strokeWidth={2} />
                  {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                </motion.button>
                <AnimatePresence>
                  {showSort && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ duration: 0.14 }}
                      style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 100, minWidth: 190, background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.85)' }}>
                      {SORT_OPTIONS.map(o => (
                        <button key={o.value} onClick={() => { setSortBy(o.value); setShowSort(false); }}
                          style={{ width: '100%', padding: '10px 16px', border: 'none', textAlign: 'left', cursor: 'pointer', background: sortBy === o.value ? 'rgba(229,24,30,0.12)' : 'transparent', color: sortBy === o.value ? C.accent : 'rgba(255,255,255,0.58)', fontFamily: FONT_BODY, fontSize: 13, fontWeight: sortBy === o.value ? 700 : 400 }}
                          onMouseEnter={e => { if (sortBy !== o.value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                          onMouseLeave={e => { if (sortBy !== o.value) e.currentTarget.style.background = 'transparent'; }}>
                          {sortBy === o.value && <span style={{ marginRight: 8 }}>✓</span>}{o.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* View toggle */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, overflow: 'hidden' }}>
                {[{ m: 'grid', icon: <LayoutGrid size={15} /> }, { m: 'list', icon: <List size={15} /> }].map(({ m, icon }) => (
                  <button key={m} onClick={() => setViewMode(m)}
                    style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', background: viewMode === m ? 'rgba(255,255,255,0.11)' : 'transparent', color: viewMode === m ? 'white' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {sorted.length === 0 && <EmptyState key="empty" onBrowse={() => navigate('/browse')} />}

          {/* Grid view */}
          {sorted.length > 0 && viewMode === 'grid' && (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={GRID_6}>
                <AnimatePresence mode="popLayout">
                  {pageItems.map((fav, i) => (
                    <motion.div key={fav.movieId}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: Math.min(i * 0.02, 0.25), duration: 0.25 }}>
                      <MovieCard
                        movie={favToMovie(fav)}
                        isFavorited={true}
                        onFavoriteToggle={(_, isFav) => { if (!isFav) handleRemove(fav.movieId); }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={sorted.length}
                pageSize={PAGE_SIZE}
                onPageChange={pagination.goTo}
                pageNumbers={pagination.pageNumbers}
                itemLabel="phim yêu thích"
              />
            </motion.div>
          )}

          {/* List view — phân trang theo PAGE_SIZE hàng */}
          {sorted.length > 0 && viewMode === 'list' && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 6 }}>
                {[['#', 30], ['', 50], ['Phim', null], ['Ngày thêm', 90], ['', 88]].map(([t, w], i) => (
                  <span key={i} style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', ...(w ? { width: w, flexShrink: 0 } : { flex: 1 }) }}>{t}</span>
                ))}
              </div>
              <AnimatePresence>
                {pageItems.map((fav, i) => (
                  <FavRow key={fav.movieId} fav={fav} index={(pagination.page - 1) * PAGE_SIZE + i} onRemove={handleRemove} />
                ))}
              </AnimatePresence>

              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={sorted.length}
                pageSize={PAGE_SIZE}
                onPageChange={pagination.goTo}
                pageNumbers={pagination.pageNumbers}
                itemLabel="phim yêu thích"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showSort && <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setShowSort(false)} />}
    </div>
  );
}