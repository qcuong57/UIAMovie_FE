// src/components/admin/AdminTvShows.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, RefreshCw, Download, Star, ChevronUp, ChevronDown,
  AlertCircle, Search, Tv, Eye, Pencil, Crown,
} from 'lucide-react';
import tvShowService from '../../services/tvShowService';
import AdminTmdbSearch from './AdminTmdbSearch';
import TvShowDetailPanel from './tvshow/TvShowDetailPanel';
import TvShowEditModal   from './tvshow/TvShowEditModal';
import TvShowDeleteModal from './tvshow/TvShowDeleteModal';
import { T, FONT_BODY as FONT, FONT_TITLE } from '../../context/adminTokens';
import AdminPagination from '../common/AdminPagination';

const PAGE_SIZE = 15;
const COUNTRY_FLAG = { KR:'🇰🇷', US:'🇺🇸', JP:'🇯🇵', CN:'🇨🇳', VN:'🇻🇳', FR:'🇫🇷', GB:'🇬🇧', IN:'🇮🇳', TH:'🇹🇭' };

// ── Spinner ───────────────────────────────────────────────────────────────────
const SpinnerLight = () => (
  <>
    <div style={{ width: 26, height: 26, borderRadius: '50%', border: `2.5px solid ${T.accentLight}`, borderTopColor: T.accent, animation: 'spin 0.75s linear infinite', margin: '0 auto' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </>
);

// ── Premium badge (hiển thị inline bên cạnh tên) ─────────────────────────────
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

// ── Premium toggle button ─────────────────────────────────────────────────────
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
        fontFamily: FONT,
        fontSize: 11.5, fontWeight: 700,
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

// ── Action button ─────────────────────────────────────────────────────────────
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

// ── Ghost Button (dùng cho Tải lại / Import — đồng bộ style AdminRevenue) ────
const GhostBtn = ({ onClick, children, active, accent }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: FONT, fontSize: 13, fontWeight: (active || accent) ? 600 : 500,
        color: accent ? '#fff' : hov ? T.text : T.textSub,
        background: accent ? T.accent : hov ? T.surfaceHov : T.surface,
        border: `1px solid ${accent ? T.accent : hov ? T.borderMed : T.border}`,
        borderRadius: 9, padding: '8px 16px',
        cursor: 'pointer', outline: 'none',
        transition: 'all 0.13s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminTvShows() {
  const [shows,      setShows]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [sortBy,     setSortBy]     = useState('firstairdate');
  const [sortDir,    setSortDir]    = useState('desc');
  const [deleteShow,  setDeleteShow]  = useState(null);
  const [showPanel,  setShowPanel]  = useState(false);
  const [detailId,   setDetailId]   = useState(null);
  const [editShow,   setEditShow]   = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const debounceRef = useRef(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchShows = useCallback(async (p, q, sb, sd) => {
    setLoading(true);
    try {
      const res = await tvShowService.getTvShows({
        page:     p,
        pageSize: PAGE_SIZE,
        search:   q,
        sortBy:   sb,
        sortDesc: sd === 'desc',
      });
      const data  = res?.data ?? res;
      const items = Array.isArray(data) ? data : (data?.items ?? []);
      const count = data?.totalCount ?? data?.total ?? items.length;
      setShows(items.map(s => ({
        ...s,
        year: s.firstAirDate ? new Date(s.firstAirDate).getFullYear() : null,
      })));
      setTotal(count);
      setPage(p);
    } catch (e) {
      console.error('[AdminTvShows] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShows(1, '', 'firstairdate', 'desc');
  }, []); // eslint-disable-line

  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchShows(1, val, sortBy, sortDir), 400);
  };

  const handleSort = (key) => {
    const newDir = sortBy === key && sortDir === 'desc' ? 'asc' : 'desc';
    setSortBy(key);
    setSortDir(newDir);
    fetchShows(1, search, key, newDir);
  };

  const handlePage = (p) => fetchShows(p, search, sortBy, sortDir);

  /**
   * Toggle Premium cho 1 TV show.
   * Optimistic update ngay → rollback nếu API lỗi.
   */
  const handleTogglePremium = async (show) => {
    if (togglingId) return;
    const next = !show.isPremium;
    setTogglingId(show.id);
    setShows(prev => prev.map(s => s.id === show.id ? { ...s, isPremium: next } : s));
    try {
      await tvShowService.setPremium(show.id, next);
    } catch (e) {
      console.error('[AdminTvShows] togglePremium failed:', e);
      setShows(prev => prev.map(s => s.id === show.id ? { ...s, isPremium: !next } : s));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div style={{ padding: '28px 32px 56px', maxWidth: 1300, fontFamily: FONT }}>

      {/* ── Header — đồng bộ AdminRevenue ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Quản lý
          </p>
          <h2 style={{ fontFamily: FONT_TITLE, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            TV Shows
            <span style={{
              fontSize: 13, fontWeight: 600, color: T.textMuted,
              letterSpacing: 0, fontFamily: FONT,
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: '2px 10px',
            }}>
              {total.toLocaleString()}
            </span>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <GhostBtn onClick={() => fetchShows(page, search, sortBy, sortDir)}>
            <RefreshCw size={14}/> Tải lại
          </GhostBtn>
          <GhostBtn onClick={() => setShowPanel(true)} accent>
            <Download size={14}/> Import TMDB
          </GhostBtn>
        </div>
      </div>

      {/* ── Search bar — đồng bộ AdminRevenue ── */}
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
          placeholder="Tìm kiếm theo tên TV show..."
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: FONT, fontSize: 13.5, color: T.text,
          }}
        />
        {search && (
          <button
            onClick={() => handleSearchChange('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, lineHeight: 1, fontSize: 18 }}
          >×</button>
        )}
      </div>

      {/* ── Table — đồng bộ AdminRevenue card style ── */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th>TV Show</Th>
                <Th sortKey="rating"       sortBy={sortBy} sortDir={sortDir} onSort={handleSort}>Rating</Th>
                <Th sortKey="firstairdate" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}>Năm</Th>
                <Th>Quốc gia</Th>
                <Th>Seasons</Th>
                <Th>Thể loại</Th>
                {/* Cột Premium — mới thêm */}
                <Th width={100}>Premium</Th>
                <th style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt, width: 110 }}/>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: '64px 0', textAlign: 'center' }}><SpinnerLight /></td></tr>
              ) : shows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '56px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📺</div>
                    <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Không tìm thấy TV show</p>
                  </td>
                </tr>
              ) : shows.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceHov}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* TV Show info */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 46, borderRadius: 6, overflow: 'hidden', background: T.bg, flexShrink: 0, border: `1px solid ${T.border}` }}>
                        {s.posterUrl && <img src={s.posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                            {s.title}
                          </p>
                          {s.isPremium && <PremiumBadge />}
                        </div>
                        <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, marginTop: 2 }}>
                          {s.status ?? ''}
                          {s.tmdbId ? ` · TMDB #${s.tmdbId}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Rating */}
                  <td style={{ padding: '12px 16px' }}>
                    {s.rating ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={11} style={{ fill: T.gold, color: T.gold }}/>
                        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.gold }}>{Number(s.rating).toFixed(1)}</span>
                      </div>
                    ) : <span style={{ color: T.textMuted, fontSize: 13 }}>—</span>}
                  </td>

                  {/* Year */}
                  <td style={{ padding: '12px 16px', fontFamily: FONT, fontSize: 13, color: T.textSub }}>{s.year ?? '—'}</td>

                  {/* Country */}
                  <td style={{ padding: '12px 16px', fontFamily: FONT, fontSize: 12.5 }}>
                    {s.originCountry
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.textSub }}>{COUNTRY_FLAG[s.originCountry] ?? '🌐'} {s.originCountry}</span>
                      : <span style={{ color: T.textMuted }}>—</span>}
                  </td>

                  {/* Seasons */}
                  <td style={{ padding: '12px 16px', fontFamily: FONT, fontSize: 13, color: T.textSub }}>
                    {s.numberOfSeasons != null
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Tv size={12} color={T.textMuted}/> {s.numberOfSeasons}</span>
                      : <span style={{ color: T.textMuted }}>—</span>}
                  </td>

                  {/* Genres */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {s.genres?.slice(0, 2).map(g => (
                        <span key={g} style={{ fontFamily: FONT, fontSize: 11, color: T.textSub, padding: '2px 8px', borderRadius: 5, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{g}</span>
                      ))}
                      {(s.genres?.length ?? 0) > 2 && <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>+{s.genres.length - 2}</span>}
                    </div>
                  </td>

                  {/* Premium toggle — mới thêm */}
                  <td style={{ padding: '12px 16px' }}>
                    <PremiumToggle
                      isPremium={!!s.isPremium}
                      loading={togglingId === s.id}
                      onClick={() => handleTogglePremium(s)}
                    />
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <ActionBtn color={T.textSub} bg={T.surfaceAlt} border={T.border} title="Xem chi tiết" onClick={() => setDetailId(s.id)}>
                        <Eye size={13}/>
                      </ActionBtn>
                      <ActionBtn color={T.blue} bg="rgba(37,99,235,0.07)" border="rgba(37,99,235,0.2)" title="Chỉnh sửa" onClick={() => setEditShow(s)}>
                        <Pencil size={13}/>
                      </ActionBtn>
                      <ActionBtn color={T.red} bg="#FEF2F2" border="rgba(220,38,38,0.2)" title="Xóa" onClick={() => setDeleteShow(s)}>
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

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={handlePage}
        itemLabel="TV show"
      />

      {/* Delete modal */}
      <TvShowDeleteModal
        show={deleteShow}
        onClose={() => setDeleteShow(null)}
        onDeleted={() => fetchShows(page, search, sortBy, sortDir)}
      />

      {/* Backdrop */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPanel(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 199, backdropFilter: 'blur(2px)' }}
          />
        )}
      </AnimatePresence>

      {/* Import panel */}
      <AnimatePresence>
        {showPanel && (
          <AdminTmdbSearch
            defaultTab="tv"
            singleTab
            onClose={() => setShowPanel(false)}
            onImported={() => fetchShows(1, search, sortBy, sortDir)}
          />
        )}
      </AnimatePresence>

      {/* Detail panel */}
      <AnimatePresence>
        {detailId && (
          <TvShowDetailPanel
            showId={detailId}
            onClose={() => setDetailId(null)}
            onEdit={(s) => { setDetailId(null); setEditShow(s); }}
          />
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <TvShowEditModal
        show={editShow}
        onClose={() => setEditShow(null)}
        onSaved={(updated) => {
          setShows(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
          setEditShow(null);
        }}
      />
    </div>
  );
}