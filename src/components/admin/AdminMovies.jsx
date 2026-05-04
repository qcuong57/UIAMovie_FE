// src/components/admin/AdminMovies.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, RefreshCw, Download, Star, ChevronUp, ChevronDown,
  AlertCircle, Search, Eye, Pencil, Video,
} from 'lucide-react';
import movieService from '../../services/movieService';
import { Button, Input, Modal, Spinner } from '../ui';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../common/Pagination';
import axiosInstance from '../../config/axios';
import MovieDetailPanel  from './movie/MovieDetailPanel';
import MovieEditModal    from './movie/MovieEditModal';
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
  const [deleteId,    setDeleteId]    = useState(null);
  const [deleting,    setDeleting]    = useState(false);
  const [showPanel,   setShowPanel]   = useState(false);
  const [detailId,    setDetailId]    = useState(null);
  const [editMovie,   setEditMovie]   = useState(null);
  const [uploadMovie, setUploadMovie] = useState(null);

  const pagination = usePagination({ total: filtered.length, pageSize: PAGE_SIZE });
  const pageMovies = pagination.paginate(filtered);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await movieService.getMovies(1, 500);
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

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/movies/${deleteId}`);
      setAllMovies(prev => prev.filter(m => m.id !== deleteId));
      setDeleteId(null);
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
            Phim
            <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 500, color: T.textMuted, letterSpacing: 0 }}>({filtered.length})</span>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={fetchMovies}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 500, color: T.textSub, transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = T.surfaceHov}
            onMouseLeave={e => e.currentTarget.style.background = T.surface}
          >
            <RefreshCw size={14}/> Tải lại
          </button>
          <button
            onClick={() => setShowPanel(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 9, background: T.accent, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#fff', transition: 'background 0.15s' }}
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
          placeholder="Tìm kiếm theo tên phim..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', height: 42, padding: '0 14px 0 42px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, fontFamily: FONT, fontSize: 13.5, color: T.text, outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: T.shadow }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th>Phim</Th>
                <Th sortKey="rating"      sortBy={sortBy} sortDir={sortDir} onSort={handleSort}>Rating</Th>
                <Th sortKey="releaseDate" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}>Năm</Th>
                <Th>Quốc gia</Th>
                <Th>Thể loại</Th>
                <th style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt, width: 148 }}/>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '64px 0', textAlign: 'center' }}><SpinnerLight /></td></tr>
              ) : pageMovies.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '48px 0', textAlign: 'center', fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Không tìm thấy phim</td></tr>
              ) : pageMovies.map((m, i) => (
                <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
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
                        <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{m.title}</p>
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
                  {/* Actions */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {/* Upload */}
                      <ActionBtn color="#16A34A" bg="#F0FDF4" border="rgba(22,163,74,0.2)" title="Upload video" onClick={() => setUploadMovie({ id: m.id, title: m.title })}>
                        <Video size={13}/>
                      </ActionBtn>
                      {/* Detail */}
                      <ActionBtn color={T.textSub} bg={T.surfaceAlt} border={T.border} title="Xem chi tiết" onClick={() => setDetailId(m.id)}>
                        <Eye size={13}/>
                      </ActionBtn>
                      {/* Edit */}
                      <ActionBtn color={T.blue} bg="rgba(37,99,235,0.07)" border="rgba(37,99,235,0.2)" title="Chỉnh sửa" onClick={() => setEditMovie(m)}>
                        <Pencil size={13}/>
                      </ActionBtn>
                      {/* Delete */}
                      <ActionBtn color={T.red} bg="#FEF2F2" border="rgba(220,38,38,0.2)" title="Xóa phim" onClick={() => setDeleteId(m.id)}>
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

      <Pagination {...pagination.props} itemLabel="phim" />

      {/* Delete modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Xác nhận xóa phim" size="sm"
        footer={<><Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>Hủy</Button><Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>Xóa phim</Button></>}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AlertCircle size={18} color={T.red} style={{ flexShrink: 0, marginTop: 1 }}/>
          <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>Bạn chắc chắn muốn xóa phim này? Hành động này không thể hoàn tác.</p>
        </div>
      </Modal>

      {/* Backdrop when panel open */}
      <AnimatePresence>
        {(showPanel || uploadMovie) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setShowPanel(false); setUploadMovie(null); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 199, backdropFilter: 'blur(2px)' }}
          />
        )}
      </AnimatePresence>

      {/* Import panel */}
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

      {/* Video upload panel */}
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

      {/* Detail panel */}
      <AnimatePresence>
        {detailId && (
          <MovieDetailPanel
            movieId={detailId}
            onClose={() => setDetailId(null)}
            onEdit={m => { setDetailId(null); setEditMovie(m); }}
          />
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <MovieEditModal
        movie={editMovie}
        onClose={() => setEditMovie(null)}
        onSaved={updated => setAllMovies(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m))}
      />
    </div>
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