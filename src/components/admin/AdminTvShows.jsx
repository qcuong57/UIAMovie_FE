// src/components/admin/AdminTvShows.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, RefreshCw, Download, Star, ChevronUp, ChevronDown,
  AlertCircle, Search, Tv, Eye, Pencil,
} from 'lucide-react';
import tvShowService from '../../services/tvShowService';
import { Button, Modal } from '../ui';
import AdminTmdbSearch from './AdminTmdbSearch';
import TvShowDetailPanel from './tvshow/TvShowDetailPanel';
import TvShowEditModal   from './tvshow/TvShowEditModal';
import { T, FONT_BODY as FONT } from '../../context/adminTokens';

const PAGE_SIZE = 15;
const COUNTRY_FLAG = { KR:'🇰🇷', US:'🇺🇸', JP:'🇯🇵', CN:'🇨🇳', VN:'🇻🇳', FR:'🇫🇷', GB:'🇬🇧', IN:'🇮🇳', TH:'🇹🇭' };

// ── Spinner ───────────────────────────────────────────────────────────────────
const SpinnerLight = () => (
  <>
    <div style={{ width: 26, height: 26, borderRadius: '50%', border: `2.5px solid ${T.accentLight}`, borderTopColor: T.accent, animation: 'spin 0.75s linear infinite', margin: '0 auto' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </>
);

// ── Table header ──────────────────────────────────────────────────────────────
const Th = ({ children, sortKey, sortBy, sortDir, onSort }) => {
  const active = sortBy === sortKey;
  return (
    <th onClick={() => sortKey && onSort?.(sortKey)} style={{
      padding: '11px 16px', textAlign: 'left',
      fontFamily: FONT, fontSize: 11, fontWeight: 700,
      color: active ? T.accentText : T.textMuted,
      letterSpacing: '0.07em', textTransform: 'uppercase',
      cursor: sortKey ? 'pointer' : 'default', whiteSpace: 'nowrap',
      userSelect: 'none', borderBottom: `1px solid ${T.border}`,
      background: T.surfaceAlt,
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

// ── TMDB Card (TV Show) ───────────────────────────────────────────────────────
const TmdbCard = ({ show, onImport, importing, imported, importMsg }) => {
  const [copied, setCopied] = useState(false);
  const year = show.firstAirDate ? new Date(show.firstAirDate).getFullYear() : null;

  const copyId = () => {
    navigator.clipboard.writeText(String(show.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{
      background: imported ? '#EFF6FF' : T.surface,
      border: `1px solid ${imported ? 'rgba(59,130,246,0.25)' : T.border}`,
      borderRadius: 10, overflow: 'hidden',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadow}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Poster */}
        <div style={{ width: 54, flexShrink: 0, background: T.bg }}>
          {show.posterUrl
            ? <img src={show.posterUrl} alt="" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', aspectRatio: '2/3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📺</div>
          }
        </div>
        {/* Info */}
        <div style={{ flex: 1, padding: '10px 12px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
            <p style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: T.text, lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {show.name ?? show.title}
            </p>
            {imported && (
              <span style={{ flexShrink: 0, fontFamily: FONT, fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#DBEAFE', border: '1px solid rgba(59,130,246,0.3)', color: '#1D4ED8' }}>
                ✓ Đã có
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {show.voteAverage > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: T.gold }}>
                <Star size={9} style={{ fill: T.gold, color: T.gold }}/> {show.voteAverage.toFixed(1)}
              </span>
            )}
            {year && <span style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted }}>{year}</span>}
            {show.originCountry?.[0] && (
              <span style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted }}>
                {COUNTRY_FLAG[show.originCountry[0]] ?? '🌐'} {show.originCountry[0]}
              </span>
            )}
            {show.numberOfSeasons > 0 && (
              <span style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted }}>{show.numberOfSeasons} mùa</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={copyId} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
              borderRadius: 5, padding: '3px 8px', cursor: 'pointer',
              fontFamily: FONT, fontSize: 10,
              color: copied ? '#1D4ED8' : T.textMuted, transition: 'color 0.15s',
            }}>
              {copied ? <Check size={9}/> : <Copy size={9}/>} #{show.id}
            </button>
            <button
              disabled={imported || importing}
              onClick={() => !imported && onImport(show.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 12px', borderRadius: 6, cursor: imported ? 'default' : 'pointer',
                background: imported ? T.surfaceAlt : T.accent,
                border: `1px solid ${imported ? T.border : T.accent}`,
                fontFamily: FONT, fontSize: 11, fontWeight: 600,
                color: imported ? T.textMuted : '#fff',
                opacity: importing ? 0.7 : 1, transition: 'all 0.15s',
              }}
            >
              {importing ? <SpinnerLight /> : imported ? <><Check size={10}/>Đã có</> : <><Download size={10}/>Import</>}
            </button>
          </div>
        </div>
      </div>
      {importMsg && (
        <div style={{
          padding: '7px 12px',
          background: importMsg.type === 'success' ? '#EFF6FF' : importMsg.type === 'warn' ? '#FEFCE8' : '#FEF2F2',
          borderTop: `1px solid ${T.border}`,
          fontFamily: FONT, fontSize: 11.5,
          color: importMsg.type === 'success' ? '#1D4ED8' : importMsg.type === 'warn' ? '#D97706' : T.red,
        }}>
          {importMsg.text}
        </div>
      )}
    </div>
  );
};


// ── Pagination controls ───────────────────────────────────────────────────────
const PaginationBar = ({ page, totalPages, total, onPage }) => {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, fontFamily: FONT }}>
      <span style={{ fontSize: 12, color: T.textMuted }}>{total} TV show</span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => onPage(page - 1)} disabled={page <= 1}
          style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: 13, color: page <= 1 ? T.textMuted : T.text, opacity: page <= 1 ? 0.5 : 1 }}>
          ←
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
          return (
            <button key={p} onClick={() => onPage(p)}
              style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${p === page ? T.accent : T.border}`, background: p === page ? T.accentLight : T.surface, cursor: 'pointer', fontSize: 13, fontWeight: p === page ? 700 : 400, color: p === page ? T.accentText : T.text }}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages}
          style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: 13, color: page >= totalPages ? T.textMuted : T.text, opacity: page >= totalPages ? 0.5 : 1 }}>
          →
        </button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminTvShows() {
  const [shows,     setShows]     = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [sortBy,    setSortBy]    = useState('firstairdate');
  const [sortDir,   setSortDir]   = useState('desc');
  const [deleteId,   setDeleteId]  = useState(null);
  const [deleting,   setDeleting]  = useState(false);
  const [showPanel,  setShowPanel] = useState(false);
  const [detailId,   setDetailId]  = useState(null);
  const [editShow,   setEditShow]  = useState(null);
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

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await tvShowService.deleteTvShow(deleteId);
      setDeleteId(null);
      fetchShows(page, search, sortBy, sortDir);
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  };

  return (
    <div style={{ padding: '28px 32px 56px', maxWidth: 1300, fontFamily: FONT }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 3 }}>Quản lý</p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>
            TV Shows
            <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 500, color: T.textMuted, letterSpacing: 0 }}>({total})</span>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => fetchShows(page, search, sortBy, sortDir)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 500, color: T.textSub }}
            onMouseEnter={e => e.currentTarget.style.background = T.surfaceHov}
            onMouseLeave={e => e.currentTarget.style.background = T.surface}
          >
            <RefreshCw size={14}/> Tải lại
          </button>
          <button onClick={() => setShowPanel(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 9, background: T.accent, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#fff' }}
            onMouseEnter={e => e.currentTarget.style.background = T.accentText}
            onMouseLeave={e => e.currentTarget.style.background = T.accent}
          >
            <Download size={14}/> Import TMDB
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={15} color={T.textMuted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          placeholder="Tìm kiếm theo tên TV show..."
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          style={{ width: '100%', height: 42, padding: '0 14px 0 42px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, fontFamily: FONT, fontSize: 13.5, color: T.text, outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: T.shadow }}>
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
                <th style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt, width: 120 }}/>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '64px 0', textAlign: 'center' }}><SpinnerLight /></td></tr>
              ) : shows.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '48px 0', textAlign: 'center', fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Không tìm thấy TV show</td></tr>
              ) : shows.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceHov}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 46, borderRadius: 6, overflow: 'hidden', background: T.bg, flexShrink: 0, border: `1px solid ${T.border}` }}>
                        {s.posterUrl && <img src={s.posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{s.title}</p>
                        <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, marginTop: 2 }}>
                          {s.status ?? ''}
                          {s.tmdbId ? ` · TMDB #${s.tmdbId}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {s.rating ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={11} style={{ fill: T.gold, color: T.gold }}/>
                        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.gold }}>{Number(s.rating).toFixed(1)}</span>
                      </div>
                    ) : <span style={{ color: T.textMuted, fontSize: 13 }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: FONT, fontSize: 13, color: T.textSub }}>{s.year ?? '—'}</td>
                  <td style={{ padding: '12px 16px', fontFamily: FONT, fontSize: 12.5 }}>
                    {s.originCountry
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.textSub }}>{COUNTRY_FLAG[s.originCountry] ?? '🌐'} {s.originCountry}</span>
                      : <span style={{ color: T.textMuted }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: FONT, fontSize: 13, color: T.textSub }}>
                    {s.numberOfSeasons != null
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Tv size={12} color={T.textMuted}/> {s.numberOfSeasons}</span>
                      : <span style={{ color: T.textMuted }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {s.genres?.slice(0, 2).map(g => (
                        <span key={g} style={{ fontFamily: FONT, fontSize: 11, color: T.textSub, padding: '2px 8px', borderRadius: 5, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{g}</span>
                      ))}
                      {(s.genres?.length ?? 0) > 2 && <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>+{s.genres.length - 2}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <ActionBtn color={T.textSub} bg={T.surfaceAlt} border={T.border} title="Xem chi tiết" onClick={() => setDetailId(s.id)}>
                        <Eye size={13}/>
                      </ActionBtn>
                      <ActionBtn color={T.blue} bg="rgba(37,99,235,0.07)" border="rgba(37,99,235,0.2)" title="Chỉnh sửa" onClick={() => setEditShow(s)}>
                        <Pencil size={13}/>
                      </ActionBtn>
                      <ActionBtn color={T.red} bg="#FEF2F2" border="rgba(220,38,38,0.2)" title="Xóa" onClick={() => setDeleteId(s.id)}>
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

      <PaginationBar page={page} totalPages={totalPages} total={total} onPage={handlePage} />

      {/* Delete modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Xác nhận xóa TV show" size="sm"
        footer={<><Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>Hủy</Button><Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>Xóa</Button></>}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertCircle size={18} color={T.red} style={{ flexShrink: 0, marginTop: 1 }}/>
          <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>Bạn chắc chắn muốn xóa TV show này? Hành động này không thể hoàn tác.</p>
        </div>
      </Modal>

      {/* Backdrop */}
      <AnimatePresence>
        {showPanel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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