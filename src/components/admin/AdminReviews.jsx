// src/pages/admin/AdminReviews.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, Star, Search, Film, Tv, Eye, EyeOff, BarChart2, MessageSquare, X, ChevronDown } from 'lucide-react';
import reviewService from '../../services/reviewService';
import movieService  from '../../services/movieService';
import tvShowService from '../../services/tvShowService';
import { usePagination } from '../../hooks/usePagination';
import AdminPagination from '../../components/common/AdminPagination';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../context/adminTokens';

const PAGE_SIZE = 12;

// ── Helpers ───────────────────────────────────────────────────────────────────
const avg = (arr, key) =>
  arr.length ? (arr.reduce((s, r) => s + (r[key] ?? 0), 0) / arr.length).toFixed(1) : '—';

// ── Star rating ───────────────────────────────────────────────────────────────
const StarRow = ({ rating, max = 10 }) => {
  const filled = Math.round((rating / max) * 5);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={11}
          style={{
            fill:  i < filled ? T.gold : 'transparent',
            color: i < filled ? T.gold : T.border,
            transition: 'all 0.1s',
          }}
        />
      ))}
      <span style={{ fontFamily: FONT, fontSize: 12, color: T.gold, fontWeight: 700, marginLeft: 5 }}>
        {Number(rating).toFixed(1)}
      </span>
    </div>
  );
};

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {[160, 80, 260, 80, 36].map((w, i) => (
      <td key={i} style={{ padding: '14px 18px' }}>
        <div style={{
          width: w, height: 13, borderRadius: 6,
          background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
          backgroundSize: '400px 100%',
          animation: 'shimmer 1.4s infinite',
        }} />
      </td>
    ))}
  </tr>
);

// ── Stat chip ─────────────────────────────────────────────────────────────────
const StatChip = ({ icon: Icon, label, value, accent = T.accent }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 16px', borderRadius: 12,
    background: T.surface, border: `1px solid ${T.border}`,
    boxShadow: T.shadow,
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: 9, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: accent + '15',
    }}>
      <Icon size={15} color={accent} />
    </div>
    <div>
      <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, marginBottom: 1 }}>{label}</p>
      <p style={{ fontFamily: FONT_TITLE, fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>
        {value}
      </p>
    </div>
  </div>
);

// ── Tab button ────────────────────────────────────────────────────────────────
const TabBtn = ({ active, onClick, icon: Icon, label, color }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '8px 18px', borderRadius: 10, cursor: 'pointer',
    fontFamily: FONT, fontSize: 13.5, fontWeight: active ? 700 : 500,
    border: active ? `1.5px solid ${color}22` : `1px solid ${T.border}`,
    background: active ? color + '12' : T.surface,
    color: active ? color : T.textSub,
    transition: 'all 0.18s',
    boxShadow: active ? `0 0 0 3px ${color}10` : T.shadow,
  }}>
    <Icon size={14} />
    {label}
  </button>
);

// ── Searchable Dropdown with Poster ───────────────────────────────────────────
const getPosterUrl = (item) =>
  item?.posterUrl ?? item?.posterPath ?? item?.poster ?? item?.thumbnailUrl ?? item?.imageUrl ?? null;

const SearchableDropdown = ({
  items = [],
  value,
  onChange,
  placeholder = '— Chọn —',
  accentColor = '#6366F1',
  icon: Icon = Film,
}) => {
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState('');
  const [hovered, setHovered]   = useState(null);
  const containerRef            = useRef(null);
  const inputRef                = useRef(null);
  const listRef                 = useRef(null);

  const selected = items.find(i => i.id === value) ?? null;

  const filtered = query.trim()
    ? items.filter(i => (i.title ?? '').toLowerCase().includes(query.toLowerCase()))
    : items;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const handleSelect = (item) => {
    onChange(item?.id ?? '');
    setOpen(false);
    setQuery('');
  };

  const hoveredItem = hovered ? items.find(i => i.id === hovered) : (open ? filtered[0] : selected);
  const posterUrl   = getPosterUrl(hoveredItem);

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: '0 0 300px', zIndex: 50 }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', height: 42,
          padding: '0 14px',
          borderRadius: 11,
          background: T.surface,
          border: `1.5px solid ${open ? accentColor + '70' : T.border}`,
          color: selected ? T.text : T.textMuted,
          fontFamily: FONT, fontSize: 13.5,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: open ? `0 0 0 3px ${accentColor}18` : T.shadow,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          outline: 'none',
          textAlign: 'left',
        }}
      >
        {/* Poster thumbnail in trigger */}
        {selected && getPosterUrl(selected) ? (
          <img
            src={getPosterUrl(selected)}
            alt=""
            style={{ width: 22, height: 30, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <Icon size={14} color={selected ? accentColor : T.textMuted} style={{ flexShrink: 0 }} />
        )}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected?.title ?? placeholder}
        </span>
        {value && (
          <span
            role="button"
            onClick={e => { e.stopPropagation(); handleSelect(null); }}
            style={{ color: T.textMuted, display: 'flex', padding: 2, borderRadius: 4, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = T.text}
            onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
          >
            <X size={12} />
          </span>
        )}
        <ChevronDown
          size={13}
          color={T.textMuted}
          style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: -6,  scale: 0.98 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              width: posterUrl ? 520 : 300,
              maxWidth: 'calc(100vw - 32px)',
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              boxShadow: T.shadowLg,
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            {/* Left: search + list */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {/* Search input */}
              <div style={{
                padding: '10px 10px 8px',
                borderBottom: `1px solid ${T.border}`,
                background: T.surfaceAlt,
              }}>
                <div style={{ position: 'relative' }}>
                  <Search size={13} color={T.textMuted}
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Tìm kiếm..."
                    style={{
                      width: '100%', height: 34, padding: '0 10px 0 32px',
                      borderRadius: 8,
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      fontFamily: FONT, fontSize: 13, color: T.text,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e  => e.target.style.borderColor = accentColor + '70'}
                    onBlur={e   => e.target.style.borderColor = T.border}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted,
                        display: 'flex', padding: 2,
                      }}
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div
                ref={listRef}
                style={{ overflowY: 'auto', maxHeight: 260, padding: '6px 6px' }}
              >
                {filtered.length === 0 ? (
                  <div style={{ padding: '20px 12px', textAlign: 'center', fontFamily: FONT, fontSize: 13, color: T.textMuted }}>
                    Không tìm thấy kết quả
                  </div>
                ) : filtered.map(item => {
                  const poster = getPosterUrl(item);
                  const isSelected = item.id === value;
                  const isHov = hovered === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setHovered(item.id)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 9,
                        padding: '7px 9px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: isSelected
                          ? accentColor + '14'
                          : isHov ? T.surfaceHov : 'transparent',
                        transition: 'background 0.1s',
                        userSelect: 'none',
                      }}
                    >
                      {/* Mini poster */}
                      {poster ? (
                        <img
                          src={poster}
                          alt=""
                          style={{
                            width: 24, height: 34, borderRadius: 4,
                            objectFit: 'cover', flexShrink: 0,
                            border: `1px solid ${T.border}`,
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 24, height: 34, borderRadius: 4, flexShrink: 0,
                          background: accentColor + '18',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1px solid ${T.border}`,
                        }}>
                          <Icon size={11} color={accentColor} />
                        </div>
                      )}
                      <span style={{
                        fontFamily: FONT, fontSize: 13,
                        color: isSelected ? accentColor : T.text,
                        fontWeight: isSelected ? 600 : 400,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        flex: 1,
                      }}>
                        {item.title}
                      </span>
                      {isSelected && (
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer count */}
              {filtered.length > 0 && (
                <div style={{
                  padding: '6px 12px', borderTop: `1px solid ${T.border}`,
                  fontFamily: FONT, fontSize: 11, color: T.textMuted,
                  background: T.surfaceAlt,
                }}>
                  {filtered.length} kết quả{query ? ` cho "${query}"` : ''}
                </div>
              )}
            </div>

            {/* Right: large poster preview */}
            <AnimatePresence mode="wait">
              {posterUrl && (
                <motion.div
                  key={hoveredItem?.id ?? 'none'}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    width: 154, flexShrink: 0,
                    background: T.surfaceAlt,
                    borderLeft: `1px solid ${T.border}`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center',
                    padding: '14px 10px 12px',
                    gap: 10,
                  }}
                >
                  <img
                    src={posterUrl}
                    alt={hoveredItem?.title ?? ''}
                    style={{
                      width: 110, height: 160, objectFit: 'cover',
                      borderRadius: 10,
                      border: `1px solid ${T.border}`,
                      boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
                    }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <p style={{
                    fontFamily: FONT, fontSize: 12, fontWeight: 600,
                    color: T.text, textAlign: 'center', lineHeight: 1.4,
                    margin: 0,
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {hoveredItem?.title}
                  </p>
                  {(hoveredItem?.releaseYear ?? hoveredItem?.year) && (
                    <span style={{
                      fontFamily: FONT, fontSize: 11, color: T.textMuted,
                      background: T.surface, border: `1px solid ${T.border}`,
                      padding: '2px 8px', borderRadius: 20,
                    }}>
                      {hoveredItem.releaseYear ?? hoveredItem.year}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminReviews() {
  const [tab,       setTab]       = useState('movie');   // 'movie' | 'tvshow'
  const [movies,    setMovies]    = useState([]);
  const [tvShows,   setTvShows]   = useState([]);
  const [episodes,  setEpisodes]  = useState([]);        // danh sách tập của tvshow đang chọn
  const [reviews,   setReviews]   = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [loadingEps,    setLoadingEps]    = useState(false);
  const [selId,     setSelId]     = useState('');
  const [selEpId,   setSelEpId]   = useState('');        // '' = show-level, guid = episode cụ thể
  const [search,    setSearch]    = useState('');
  const [deleteId,    setDeleteId]    = useState(null);
  const [deleteReview, setDeleteReview] = useState(null); // full review object for preview
  const [deleting,    setDeleting]    = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [totalRev,  setTotalRev]  = useState(0);

  // ── Catalogue loads ─────────────────────────────────────────────
  useEffect(() => {
    movieService.getMovies(1, 200).then(res => {
      const raw = Array.isArray(res) ? res : res?.items ?? res?.movies ?? res?.data?.items ?? res?.data ?? [];
      setMovies(raw.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '', 'vi')));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    tvShowService.getTvShows(1, 200).then(res => {
      const raw = Array.isArray(res) ? res : res?.items ?? res?.tvShows ?? res?.data?.items ?? res?.data ?? [];
      setTvShows(raw.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '', 'vi')));
    }).catch(console.error);
  }, []);

  // Reset selection when tab switches
  useEffect(() => { setSelId(''); setSelEpId(''); setEpisodes([]); setReviews([]); setTotalRev(0); setSearch(''); }, [tab]);

  // ── Load episodes khi chọn tvshow ──────────────────────────────
  useEffect(() => {
    if (tab !== 'tvshow' || !selId) { setEpisodes([]); setSelEpId(''); return; }
    setLoadingEps(true);
    tvShowService.getEpisodesByTvShow(selId).then(res => {
      // Hỗ trợ nhiều shape trả về từ tvShowService
      const raw = res?.data?.episodes
        ?? res?.data?.items
        ?? res?.data
        ?? (Array.isArray(res) ? res : []);
      // Sắp xếp theo season + episode number nếu có
      const sorted = [...raw].sort((a, b) => {
        if (a.seasonNumber !== b.seasonNumber) return (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0);
        return (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0);
      });
      setEpisodes(sorted);
    }).catch(() => setEpisodes([])).finally(() => setLoadingEps(false));
    setSelEpId('');
  }, [selId, tab]);

  // ── Fetch reviews ───────────────────────────────────────────────
  useEffect(() => {
    if (!selId) { setReviews([]); setTotalRev(0); return; }
    setLoading(true);
    let fetcher;
    if (tab === 'movie') {
      fetcher = reviewService.getMovieReviews(selId, 1, 200);
    } else if (selEpId) {
      fetcher = reviewService.getEpisodeReviews(selEpId, 1, 200);
    } else {
      fetcher = reviewService.getTvShowReviews(selId, 1, 200);
    }

    fetcher.then(res => {
      const data = res?.data;
      const list = data?.reviews ?? data?.items ?? (Array.isArray(data) ? data : []);
      setReviews(list);
      setTotalRev(data?.totalCount ?? list.length);
    }).catch(console.error).finally(() => setLoading(false));
  }, [selId, selEpId, tab]);

  // ── Filtering / pagination ──────────────────────────────────────
  const filtered = reviews.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.reviewText?.toLowerCase().includes(q) || r.userName?.toLowerCase().includes(q);
  });
  const pagination  = usePagination({ total: filtered.length, pageSize: PAGE_SIZE });
  const pageReviews = pagination.paginate(filtered);

  // ── Delete ──────────────────────────────────────────────────────
  const handleDelete = async () => {
    const id = deleteReview?.id ?? deleteId;
    if (!id) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await reviewService.adminDeleteReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
      setTotalRev(prev => prev - 1);
      setDeleteId(null);
      setDeleteReview(null);
    } catch (e) {
      console.error(e);
      setDeleteError(e?.response?.data?.message ?? e?.message ?? 'Xóa thất bại, vui lòng thử lại');
    } finally { setDeleting(false); }
  };

  // ── Derived stats ───────────────────────────────────────────────
  const spoilerCount = reviews.filter(r => r.isSpoiler).length;
  const avgRating    = avg(reviews, 'rating');
  const catalogue    = tab === 'movie' ? movies : tvShows;
  const accentColor  = tab === 'movie' ? T.accent : '#7C3AED';
  const selectedTitle = catalogue.find(c => c.id === selId)?.title ?? '';

  return (
    <div style={{ padding: '28px 32px 64px', maxWidth: 1120, fontFamily: FONT }}>
      <style>{ADMIN_GOOGLE_FONTS}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 3, fontFamily: FONT, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Quản lý
          </p>
          <h2 style={{ fontFamily: FONT_TITLE, fontSize: 23, fontWeight: 700, color: T.text, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
            Đánh giá
            {selId && (
              <span style={{ fontSize: 13.5, fontWeight: 500, color: T.textMuted, letterSpacing: 0, fontFamily: FONT }}>
                · {selectedTitle}
                {selEpId && (() => {
                  const ep = episodes.find(e => e.id === selEpId);
                  if (!ep) return null;
                  const sNum = ep.seasonNumber != null ? `S${ep.seasonNumber}` : '';
                  const eNum = ep.episodeNumber != null ? `E${ep.episodeNumber}` : '';
                  const prefix = sNum && eNum ? ` · ${sNum}${eNum}` : '';
                  return <span style={{ color: '#7C3AED' }}>{prefix}</span>;
                })()}
              </span>
            )}
          </h2>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 8 }}>
          <TabBtn active={tab === 'movie'}  onClick={() => setTab('movie')}  icon={Film} label="Phim"    color={T.accent}   />
          <TabBtn active={tab === 'tvshow'} onClick={() => setTab('tvshow')} icon={Tv}   label="TV Show" color="#7C3AED"    />
        </div>
      </div>

      {/* ── Filters row ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchableDropdown
          items={catalogue}
          value={selId}
          onChange={id => { setSelId(id ?? ''); }}
          placeholder={tab === 'movie' ? '— Chọn phim —' : '— Chọn TV show —'}
          accentColor={accentColor}
          icon={tab === 'movie' ? Film : Tv}
        />

        <AnimatePresence>
          {tab === 'tvshow' && selId && (
            <motion.div key="ep-select"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              style={{ position: 'relative', flex: '0 0 260px' }}>
              <select
                value={selEpId}
                onChange={e => { setSelEpId(e.target.value); setSearch(''); }}
                disabled={loadingEps}
                style={{
                  width: '100%', height: 42, padding: '0 36px 0 14px',
                  borderRadius: 11, background: T.surface, border: `1px solid ${T.border}`,
                  color: selEpId ? T.text : T.textMuted, fontFamily: FONT, fontSize: 13.5,
                  outline: 'none', cursor: loadingEps ? 'wait' : 'pointer', appearance: 'none',
                  boxShadow: T.shadow, transition: 'border-color 0.15s',
                  opacity: loadingEps ? 0.6 : 1,
                }}
                onFocus={e  => e.target.style.borderColor = '#7C3AED80'}
                onBlur={e   => e.target.style.borderColor = T.border}
              >
                <option value="">— Đánh giá cả show —</option>
                {episodes.map(ep => {
                  const sNum = ep.seasonNumber != null ? `S${ep.seasonNumber}` : '';
                  const eNum = ep.episodeNumber != null ? `E${ep.episodeNumber}` : '';
                  const prefix = sNum && eNum ? `${sNum}${eNum} · ` : '';
                  const label = ep.label ?? ep.title ?? ep.name ?? ep.id;
                  return <option key={ep.id} value={ep.id}>{prefix}{label}</option>;
                })}
              </select>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2"
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selId && (
            <motion.div key="search" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={14} color={T.textMuted}
                style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                placeholder="Tìm theo nội dung hoặc tên người dùng…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', height: 42, padding: '0 14px 0 38px',
                  borderRadius: 11, background: T.surface, border: `1px solid ${T.border}`,
                  fontFamily: FONT, fontSize: 13.5, color: T.text, outline: 'none',
                  boxShadow: T.shadow, transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = accentColor + '80'}
                onBlur={e  => e.target.style.borderColor = T.border}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Stats row ── */}
      <AnimatePresence>
        {selId && !loading && reviews.length > 0 && (
          <motion.div key="stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <StatChip icon={MessageSquare} label={selEpId ? 'Đánh giá tập này' : 'Tổng đánh giá'} value={totalRev}        accent={accentColor} />
            <StatChip icon={BarChart2}    label="Đang hiển thị"                                    value={filtered.length} accent={accentColor} />
            <StatChip icon={Star}         label="Điểm trung bình"                                  value={avgRating}       accent={T.gold}      />
            <StatChip icon={EyeOff}       label="Có spoiler"                                        value={spoilerCount}    accent={T.red}       />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state ── */}
      {!selId && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: '96px 0', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: T.surfaceAlt,
            border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px',
          }}>
            {tab === 'movie' ? <Film size={28} color={T.textMuted} /> : <Tv size={28} color={T.textMuted} />}
          </div>
          <p style={{ fontFamily: FONT_TITLE, fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>
            {tab === 'movie' ? 'Chọn một bộ phim' : 'Chọn một TV show'}
          </p>
          <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>
            để xem và quản lý đánh giá của người dùng
          </p>
        </motion.div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.surfaceAlt }}>
                {['Người dùng', 'Đánh giá', 'Nội dung', 'Ngày', ''].map(h => (
                  <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontFamily: FONT, fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Reviews table ── */}
      {!loading && selId && (
        <motion.div key={`table-${tab}-${selId}`}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
          style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <Search size={24} color={T.textMuted} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
              <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Không tìm thấy đánh giá nào</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.surfaceAlt }}>
                  {['Người dùng', 'Đánh giá', 'Nội dung', 'Ngày', ''].map(h => (
                    <th key={h} style={{
                      padding: '12px 18px', textAlign: 'left',
                      fontFamily: FONT, fontSize: 11, fontWeight: 600,
                      color: T.textMuted, letterSpacing: '0.06em',
                      textTransform: 'uppercase', borderBottom: `1px solid ${T.border}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageReviews.map((r, i) => (
                  <motion.tr key={r.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.025 }}
                    style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surfaceHov}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* User */}
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 9,
                          background: accentColor + '18',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <span style={{ fontFamily: FONT_TITLE, fontSize: 12, fontWeight: 700, color: accentColor }}>
                            {(r.userName ?? r.userId ?? '?')[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2 }}>
                            {r.userName ?? r.userId?.slice(0, 8) ?? 'Ẩn danh'}
                          </p>
                          {r.isSpoiler && (
                            <span style={{
                              fontFamily: FONT, fontSize: 10, color: '#D97706',
                              padding: '1px 6px', borderRadius: 4,
                              border: '1px solid #FDE68A', background: '#FEF3C7',
                            }}>
                              Spoiler
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Rating */}
                    <td style={{ padding: '13px 18px' }}>
                      <StarRow rating={r.rating ?? 0} />
                    </td>

                    {/* Review text */}
                    <td style={{ padding: '13px 18px', maxWidth: 340 }}>
                      <p style={{
                        fontFamily: FONT, fontSize: 13, color: T.textSub,
                        lineHeight: 1.55, overflow: 'hidden',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {r.reviewText || <span style={{ color: T.textMuted, fontStyle: 'italic' }}>Không có nội dung</span>}
                      </p>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '13px 18px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </span>
                    </td>

                    {/* Delete */}
                    <td style={{ padding: '13px 18px' }}>
                      <button
                        onClick={() => { setDeleteReview(r); setDeleteId(r.id); setDeleteError(''); }}
                        title="Xóa đánh giá"
                        style={{
                          width: 32, height: 32, borderRadius: 9,
                          background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.16)',
                          cursor: 'pointer', color: T.red,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.transform = 'scale(1.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      )}

      {!loading && selId && filtered.length > PAGE_SIZE && (
        <AdminPagination {...pagination.props} itemLabel="đánh giá" />
      )}

      {/* ── Delete confirm modal ── */}
      <AnimatePresence>
        {!!deleteReview && (
          <>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <motion.div
              key="review-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { if (!deleting) { setDeleteReview(null); setDeleteId(null); setDeleteError(''); } }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 299, backdropFilter: 'blur(3px)' }}
            />
            <motion.div
              key="review-modal"
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1,    y: 0 }}
              exit={{   opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              style={{
                position: 'fixed', inset: 0, margin: 'auto',
                width: 460, height: 'fit-content',
                zIndex: 300,
                background: T.surface,
                borderRadius: 16,
                border: `1px solid ${T.border}`,
                boxShadow: T.shadowLg,
                display: 'flex', flexDirection: 'column',
                fontFamily: FONT, overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3, fontWeight: 600, fontFamily: FONT }}>Đánh giá</p>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em', fontFamily: FONT_TITLE }}>Xác nhận xóa</h2>
                </div>
                <button
                  onClick={() => { if (!deleting) { setDeleteReview(null); setDeleteId(null); setDeleteError(''); } }}
                  disabled={deleting}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: deleting ? 'not-allowed' : 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deleting ? 0.5 : 1 }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Review preview */}
                <div style={{ padding: '12px 14px', borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: accentColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: FONT_TITLE, fontSize: 11, fontWeight: 700, color: accentColor }}>
                          {(deleteReview?.userName ?? deleteReview?.userId ?? '?')[0]?.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.text }}>
                        {deleteReview?.userName ?? deleteReview?.userId?.slice(0, 8) ?? 'Ẩn danh'}
                      </p>
                    </div>
                    <StarRow rating={deleteReview?.rating ?? 0} />
                  </div>
                  {deleteReview?.reviewText && (
                    <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.textSub, lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {deleteReview.reviewText}
                    </p>
                  )}
                  {deleteReview?.isSpoiler && (
                    <span style={{ fontFamily: FONT, fontSize: 10, color: '#D97706', padding: '1px 7px', borderRadius: 4, border: '1px solid #FDE68A', background: '#FEF3C7', alignSelf: 'flex-start' }}>
                      Spoiler
                    </span>
                  )}
                </div>

                {/* Warning */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '11px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)' }}>
                  <AlertTriangle size={15} color={T.red} style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontFamily: FONT, fontSize: 13, color: '#991B1B', lineHeight: 1.6, margin: 0 }}>
                    Hành động này <strong>không thể hoàn tác</strong>. Đánh giá sẽ bị xóa vĩnh viễn.
                  </p>
                </div>

                {/* Error */}
                {deleteError && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.25)', fontFamily: FONT, fontSize: 12.5, color: T.red }}>
                    {deleteError}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: T.surface, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={() => { setDeleteReview(null); setDeleteId(null); setDeleteError(''); }}
                  disabled={deleting}
                  style={{ padding: '8px 16px', borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub, opacity: deleting ? 0.6 : 1 }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    padding: '8px 18px', borderRadius: 8,
                    background: deleting ? 'rgba(220,38,38,0.5)' : '#DC2626',
                    border: '1px solid transparent',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'white',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = '#B91C1C'; }}
                  onMouseLeave={e => { if (!deleting) e.currentTarget.style.background = '#DC2626'; }}
                >
                  {deleting
                    ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Đang xóa...</>
                    : <><Trash2 size={13} /> Xóa đánh giá</>
                  }
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}