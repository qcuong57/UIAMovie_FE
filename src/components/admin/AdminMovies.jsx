// src/components/admin/AdminMovies.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, RefreshCw, Download, Star, ChevronUp, ChevronDown,
  AlertCircle, Search, Eye, Pencil, Video, Crown,
} from 'lucide-react';
import movieService from '../../services/movieService';
import { Input } from '../ui';
import { usePagination } from '../../hooks/usePagination';
import AdminPagination from '../common/AdminPagination';
import MovieDetailPanel  from './movie/MovieDetailPanel';
import MovieEditModal    from './movie/MovieEditModal';
import MovieDeleteModal  from './movie/MovieDeleteModal';
import VideoUploadPanel  from './movie/VideoUploadPanel';
import AdminTmdbSearch   from './AdminTmdbSearch';
import { T, FONT_BODY as FONT, FONT_TITLE } from '../../context/adminTokens';

const PAGE_SIZE = 15;
const COUNTRY_FLAG = { KR:'🇰🇷', US:'🇺🇸', JP:'🇯🇵', CN:'🇨🇳', VN:'🇻🇳', FR:'🇫🇷', GB:'🇬🇧', IN:'🇮🇳', TH:'🇹🇭' };

// ── Spinner light ─────────────────────────────────────────────────────────────
const SpinnerLight = () => (
  <>
    <div style={{ width: 26, height: 26, borderRadius: '50%', border: `2.5px solid ${T.accentLight}`, borderTopColor: T.accent, animation: 'spin 0.75s linear infinite', margin: '0 auto' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </>
);

// ── Premium badge ─────────────────────────────────────────────────────────────
const PremiumBadge = () => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '2px 7px', borderRadius: 5,
    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    fontSize: 10, fontWeight: 700, color: '#fff',
    fontFamily: FONT, letterSpacing: '0.04em', whiteSpace: 'nowrap',
    boxShadow: '0 1px 4px rgba(245,158,11,0.35)',
  }}>
    <Crown size={9} style={{ flexShrink: 0 }} /> PRO
  </span>
);

// ── Table header ──────────────────────────────────────────────────────────────
const Th = ({ children, sortKey, sortBy, sortDir, onSort, width }) => {
  const active = sortBy === sortKey;
  return (
    <th onClick={() => sortKey && onSort?.(sortKey)} style={{
      padding: '11px 16px', textAlign: 'left',
      fontFamily: FONT, fontSize: 11, fontWeight: 700,
      color: active ? T.accentText : T.textMuted,
      letterSpacing: '0.07em', textTransform: 'uppercase',
      cursor: sortKey ? 'pointer' : 'default', whiteSpace: 'nowrap',
      userSelect: 'none', borderBottom: `1px solid ${T.border}`,
      background: T.surfaceAlt, width,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {children}
        {sortKey && active && (sortDir === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}
      </div>
    </th>
  );
};

// ── Ghost Button ──────────────────────────────────────────────────────────────
const GhostBtn = ({ onClick, children, accent }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: FONT, fontSize: 13, fontWeight: accent ? 600 : 500,
        color: accent ? '#fff' : hov ? T.text : T.textSub,
        background: accent ? T.accent : hov ? T.surfaceHov : T.surface,
        border: `1px solid ${accent ? T.accent : hov ? T.borderMed : T.border}`,
        borderRadius: 9, padding: '8px 16px',
        cursor: 'pointer', outline: 'none',
        transition: 'all 0.13s', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
};

// ── Premium toggle switch ─────────────────────────────────────────────────────
function PremiumToggle({ isPremium, loading, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={isPremium ? 'Đang là Premium — bấm để chuyển về Free' : 'Đang là Free — bấm để đặt Premium'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 20,
        border: isPremium ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(0,0,0,0.1)',
        background: isPremium
          ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
          : 'rgba(0,0,0,0.04)',
        cursor: loading ? 'wait' : 'pointer',
        fontFamily: FONT, fontSize: 11.5, fontWeight: 700,
        color: isPremium ? '#92400E' : '#71717A',
        transition: 'all 0.18s',
        opacity: loading ? 0.6 : 1,
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(0.95)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
    >
      {loading
        ? <span style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
        : <Crown size={11} style={{ flexShrink: 0 }} />
      }
      {isPremium ? 'Premium' : 'Free'}
    </button>
  );
}

// ── Action button helper ──────────────────────────────────────────────────────
function ActionBtn({ children, color, bg, border, title, onClick }) {
  return (
    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
      onClick={onClick} title={title}
      style={{ width: 30, height: 30, borderRadius: 7, background: bg, border: `1px solid ${border}`, cursor: 'pointer', color, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'filter 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.93)'}
      onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
    >
      {children}
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminMovies() {
  const [allMovies,   setAllMovies]   = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [sortBy,      setSortBy]      = useState('releaseDate');
  const [sortDir,     setSortDir]     = useState('desc');
  const [deleteMovie, setDeleteMovie] = useState(null);
  const [showPanel,   setShowPanel]   = useState(false);
  const [detailId,    setDetailId]    = useState(null);
  const [editMovie,   setEditMovie]   = useState(null);
  const [uploadMovie, setUploadMovie] = useState(null);
  const [togglingId,  setTogglingId]  = useState(null);

  const pagination = usePagination({ total: filtered.length, pageSize: PAGE_SIZE });
  const pageMovies = pagination.paginate(filtered);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await movieService.getMovies({ page: 1, pageSize: 500 });
      const raw = Array.isArray(res) ? res : res?.items ?? res?.movies ?? res?.data?.items ?? res?.data ?? [];
      setAllMovies(raw.map(m => ({ ...m, year: m.releaseDate ? new Date(m.releaseDate).getFullYear() : m.year })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  useEffect(() => {
    let list = [...allMovies];
    if (search.trim()) list = list.filter(m => m.title?.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => {
      if (sortBy === 'title')       return sortDir === 'asc' ? (a.title||'').localeCompare(b.title||'','vi') : (b.title||'').localeCompare(a.title||'','vi');
      if (sortBy === 'rating')      return sortDir === 'asc' ? (a.rating||0)-(b.rating||0) : (b.rating||0)-(a.rating||0);
      if (sortBy === 'releaseDate') return sortDir === 'asc' ? new Date(a.releaseDate||0)-new Date(b.releaseDate||0) : new Date(b.releaseDate||0)-new Date(a.releaseDate||0);
      return 0;
    });
    setFiltered(list);
  }, [allMovies, search, sortBy, sortDir]);

  const handleSort = (key) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  /**
   * Toggle Premium cho 1 phim.
   * Optimistic update ngay lập tức → rollback nếu API lỗi.
   */
  const handleTogglePremium = async (movie) => {
    if (togglingId) return;
    const next = !movie.isPremium;
    setTogglingId(movie.id);
    setAllMovies(prev => prev.map(m => m.id === movie.id ? { ...m, isPremium: next } : m));
    try {
      await movieService.setPremium(movie.id, next);
    } catch (e) {
      console.error('[AdminMovies] togglePremium failed:', e);
      // Rollback
      setAllMovies(prev => prev.map(m => m.id === movie.id ? { ...m, isPremium: !next } : m));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div style={{ padding: '28px 32px 56px', maxWidth: 1300, fontFamily: FONT }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Quản lý
          </p>
          <h2 style={{ fontFamily: FONT_TITLE, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            Phim
            <span style={{
              fontSize: 13, fontWeight: 600, color: T.textMuted,
              letterSpacing: 0, fontFamily: FONT,
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: '2px 10px',
            }}>
              {filtered.length.toLocaleString()}
            </span>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <GhostBtn onClick={fetchMovies}>
            <RefreshCw size={14}/> Tải lại
          </GhostBtn>
          <GhostBtn onClick={() => setShowPanel(true)} accent>
            <Download size={14}/> Import TMDB
          </GhostBtn>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 10, padding: '0 14px',
        marginBottom: 20, height: 42,
        transition: 'border-color 0.13s',
      }}
        onFocusCapture={e => e.currentTarget.style.borderColor = T.borderFocus}
        onBlurCapture={e => e.currentTarget.style.borderColor = T.border}
      >
        <Search size={15} color={T.textMuted} style={{ flexShrink: 0 }} />
        <input
          placeholder="Tìm kiếm theo tên phim..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: FONT, fontSize: 13.5, color: T.text,
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, lineHeight: 1, fontSize: 18 }}
          >×</button>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th>Phim</Th>
                <Th sortKey="rating"      sortBy={sortBy} sortDir={sortDir} onSort={handleSort}>Rating</Th>
                <Th sortKey="releaseDate" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}>Năm</Th>
                <Th>Quốc gia</Th>
                <Th>Thể loại</Th>
                <Th width={100}>Premium</Th>
                <th style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt, width: 148 }}/>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '64px 0', textAlign: 'center' }}><SpinnerLight /></td></tr>
              ) : pageMovies.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '56px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🎬</div>
                    <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Không tìm thấy phim</p>
                  </td>
                </tr>
              ) : pageMovies.map((m, i) => (
                <motion.tr
                  key={m.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceHov}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Movie */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 46, borderRadius: 6, overflow: 'hidden', background: T.bg, flexShrink: 0, border: `1px solid ${T.border}` }}>
                        {m.posterUrl && <img src={m.posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                            {m.title}
                          </p>
                          {m.isPremium && <PremiumBadge />}
                        </div>
                        {m.tmdbId && <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, marginTop: 2 }}>TMDB #{m.tmdbId}</p>}
                      </div>
                    </div>
                  </td>

                  {/* Rating */}
                  <td style={{ padding: '12px 16px' }}>
                    {m.rating ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={11} style={{ fill: T.gold, color: T.gold }}/>
                        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.gold }}>{Number(m.rating).toFixed(1)}</span>
                      </div>
                    ) : <span style={{ color: T.textMuted, fontSize: 13 }}>—</span>}
                  </td>

                  {/* Year */}
                  <td style={{ padding: '12px 16px', fontFamily: FONT, fontSize: 13, color: T.textSub }}>{m.year ?? '—'}</td>

                  {/* Country */}
                  <td style={{ padding: '12px 16px', fontFamily: FONT, fontSize: 12.5 }}>
                    {m.originCountry
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.textSub }}>{COUNTRY_FLAG[m.originCountry] ?? '🌐'} {m.originCountry}</span>
                      : <span style={{ color: T.textMuted }}>—</span>}
                  </td>

                  {/* Genres */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {m.genres?.slice(0, 2).map(g => (
                        <span key={g} style={{ fontFamily: FONT, fontSize: 11, color: T.textSub, padding: '2px 8px', borderRadius: 5, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{g}</span>
                      ))}
                      {(m.genres?.length ?? 0) > 2 && <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>+{m.genres.length - 2}</span>}
                    </div>
                  </td>

                  {/* Premium toggle */}
                  <td style={{ padding: '12px 16px' }}>
                    <PremiumToggle
                      isPremium={!!m.isPremium}
                      loading={togglingId === m.id}
                      onClick={() => handleTogglePremium(m)}
                    />
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <ActionBtn color="#16A34A" bg="#F0FDF4" border="rgba(22,163,74,0.2)" title="Upload video" onClick={() => setUploadMovie({ id: m.id, title: m.title })}>
                        <Video size={13}/>
                      </ActionBtn>
                      <ActionBtn color={T.textSub} bg={T.surfaceAlt} border={T.border} title="Xem chi tiết" onClick={() => setDetailId(m.id)}>
                        <Eye size={13}/>
                      </ActionBtn>
                      <ActionBtn color={T.blue} bg="rgba(37,99,235,0.07)" border="rgba(37,99,235,0.2)" title="Chỉnh sửa" onClick={() => setEditMovie(m)}>
                        <Pencil size={13}/>
                      </ActionBtn>
                      <ActionBtn color={T.red} bg="#FEF2F2" border="rgba(220,38,38,0.2)" title="Xóa phim" onClick={() => setDeleteMovie(m)}>
                        <Trash2 size={13}/>
                      </ActionBtn>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination {...pagination.props} itemLabel="phim" />

      {/* ── Delete modal ── */}
      <MovieDeleteModal
        movie={deleteMovie}
        onClose={() => setDeleteMovie(null)}
        onDeleted={(id) => setAllMovies(prev => prev.filter(m => m.id !== id))}
      />

      {/* ── Backdrop ── */}
      <AnimatePresence>
        {(showPanel || uploadMovie) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setShowPanel(false); setUploadMovie(null); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 199, backdropFilter: 'blur(2px)' }}
          />
        )}
      </AnimatePresence>

      {/* ── Import panel ── */}
      <AnimatePresence>
        {showPanel && (
          <AdminTmdbSearch
            defaultTab="movie"
            singleTab
            onClose={() => setShowPanel(false)}
            onImported={fetchMovies}
          />
        )}
      </AnimatePresence>

      {/* ── Video upload panel ── */}
      <AnimatePresence>
        {uploadMovie && (
          <VideoUploadPanel
            movieId={uploadMovie.id}
            movieTitle={uploadMovie.title}
            onClose={() => setUploadMovie(null)}
            onUploaded={() => setUploadMovie(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Detail panel ── */}
      <AnimatePresence>
        {detailId && (
          <MovieDetailPanel
            movieId={detailId}
            onClose={() => setDetailId(null)}
            onEdit={m => { setDetailId(null); setEditMovie(m); }}
          />
        )}
      </AnimatePresence>

      {/* ── Edit modal ── */}
      <MovieEditModal
        movie={editMovie}
        onClose={() => setEditMovie(null)}
        onSaved={updated => setAllMovies(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m))}
      />
    </div>
  );
}