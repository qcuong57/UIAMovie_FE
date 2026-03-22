// src/components/admin/AdminMovies.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, RefreshCw, Download, Star, ChevronUp, ChevronDown,
  AlertCircle, X, Search, Check, Copy, Hash, Eye, Pencil
} from 'lucide-react';
import movieService from '../../services/movieService';
import { Button, Input, Modal, Spinner } from '../ui';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../common/Pagination';
import axiosInstance from '../../config/axios';
import { C, FONT_DISPLAY, FONT_BODY } from '../../context/homeTokens';
import MovieDetailPanel from './movie/MovieDetailPanel';
import MovieEditModal   from './movie/MovieEditModal';

const PAGE_SIZE = 15;
const COUNTRY_FLAG = { KR:'🇰🇷', US:'🇺🇸', JP:'🇯🇵', CN:'🇨🇳', VN:'🇻🇳', FR:'🇫🇷', GB:'🇬🇧', IN:'🇮🇳', TH:'🇹🇭' };
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Table header ──────────────────────────────────────────────────────────────
const Th = ({ children, sortKey, sortBy, sortDir, onSort }) => {
  const active = sortBy === sortKey;
  return (
    <th onClick={() => sortKey && onSort(sortKey)} style={{
      padding: '12px 16px', textAlign: 'left',
      fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700,
      color: active ? C.accent : 'rgba(255,255,255,0.3)',
      letterSpacing: '0.1em', textTransform: 'uppercase',
      cursor: sortKey ? 'pointer' : 'default', whiteSpace: 'nowrap',
      userSelect: 'none', borderBottom: `1px solid ${C.border}`,
      background: '#080808',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {children}
        {sortKey && active && (sortDir === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}
      </div>
    </th>
  );
};

// ── TMDB result card ──────────────────────────────────────────────────────────
const TmdbCard = ({ movie, onImport, importing, imported, importMsg }) => {
  const [copied, setCopied] = useState(false);
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;

  const copyId = () => {
    navigator.clipboard.writeText(String(movie.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{
      background: imported ? 'rgba(70,211,105,0.04)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${imported ? 'rgba(70,211,105,0.2)' : C.border}`,
      borderRadius: 8, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Poster */}
        <div style={{ width: 54, flexShrink: 0, background: '#111' }}>
          {movie.posterUrl
            ? <img src={movie.posterUrl} alt="" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', aspectRatio: '2/3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎬</div>
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, padding: '10px 12px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: 'white', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {movie.title}
            </p>
            {imported && (
              <span style={{ flexShrink: 0, fontFamily: FONT_BODY, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'rgba(70,211,105,0.12)', border: '1px solid rgba(70,211,105,0.25)', color: '#46d369' }}>
                ✓ Đã có
              </span>
            )}
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {movie.voteAverage > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: '#f5c518' }}>
                <Star size={9} style={{ fill: '#f5c518', color: '#f5c518' }}/> {movie.voteAverage.toFixed(1)}
              </span>
            )}
            {year && <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{year}</span>}
            {movie.originCountry?.[0] && (
              <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                {COUNTRY_FLAG[movie.originCountry[0]] ?? '🌐'} {movie.originCountry[0]}
              </span>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={copyId} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
              borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
              fontFamily: FONT_BODY, fontSize: 10,
              color: copied ? '#46d369' : 'rgba(255,255,255,0.3)',
              transition: 'color 0.15s',
            }}>
              {copied ? <Check size={9}/> : <Copy size={9}/>} #{movie.id}
            </button>

            <Button
              variant={imported ? 'ghost' : 'primary'}
              size="sm"
              loading={importing}
              disabled={imported}
              icon={imported ? <Check size={11}/> : <Download size={11}/>}
              onClick={() => !imported && onImport(movie.id)}
              style={{ fontSize: 11, padding: '3px 10px' }}
            >
              {imported ? 'Đã có' : 'Import'}
            </Button>
          </div>
        </div>
      </div>

      {/* Import message */}
      {importMsg && (
        <div style={{
          padding: '6px 12px',
          background: importMsg.type === 'success' ? 'rgba(70,211,105,0.08)'
                    : importMsg.type === 'warn'    ? 'rgba(245,197,24,0.08)'
                    : 'rgba(229,24,30,0.08)',
          fontFamily: FONT_BODY, fontSize: 11,
          color: importMsg.type === 'success' ? '#46d369'
               : importMsg.type === 'warn'    ? '#f5c518'
               : C.accent,
          borderTop: `1px solid ${C.border}`,
        }}>
          {importMsg.text}
        </div>
      )}
    </div>
  );
};

// ── TMDB Import Panel (slide-in từ phải) ─────────────────────────────────────
const ImportPanel = ({ onClose, onImported }) => {
  const [activeTab,   setActiveTab]   = useState('search'); // 'search' | 'id'
  const [query,       setQuery]       = useState('');
  const [tmdbPage,    setTmdbPage]    = useState(1);
  const [results,     setResults]     = useState([]);
  const [totalPages,  setTotalPages]  = useState(0);
  const [totalRes,    setTotalRes]    = useState(0);
  const [searching,   setSearching]   = useState(false);
  const [importing,   setImporting]   = useState({});
  const [imported,    setImported]    = useState({});
  const [importMsg,   setImportMsg]   = useState({});
  // Manual ID tab
  const [manualId,    setManualId]    = useState('');
  const [manualImporting, setManualImporting] = useState(false);
  const [manualMsg,   setManualMsg]   = useState(null);

  const doSearch = useCallback(async (q, p = 1) => {
    if (!q.trim()) return;
    setSearching(true);
    try {
      const res = await axiosInstance.get(`/movies/tmdb/search?query=${encodeURIComponent(q)}&page=${p}`);
      const data = res?.data ?? res;
      setResults(data?.results ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalRes(data?.totalResults ?? 0);
      setTmdbPage(p);
    } catch (e) { console.error(e); }
    finally { setSearching(false); }
  }, []);

  const handleQueryChange = (q) => {
    setQuery(q);
    if (q.trim()) doSearch(q, 1);
    else { setResults([]); setTotalPages(0); }
  };

  const doImport = async (tmdbId) => {
    setImporting(prev => ({ ...prev, [tmdbId]: true }));
    setImportMsg(prev => ({ ...prev, [tmdbId]: null }));
    try {
      const res = await fetch(`${API_BASE}/movies/tmdb/${tmdbId}/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const data = await res.json();
      if (res.ok) {
        setImported(prev => ({ ...prev, [tmdbId]: true }));
        setImportMsg(prev => ({ ...prev, [tmdbId]: { type: 'success', text: `✓ Import thành công` } }));
        onImported?.();
      } else if (res.status === 409) {
        setImported(prev => ({ ...prev, [tmdbId]: true }));
        setImportMsg(prev => ({ ...prev, [tmdbId]: { type: 'warn', text: 'Phim đã được import rồi' } }));
      } else {
        setImportMsg(prev => ({ ...prev, [tmdbId]: { type: 'error', text: data.message ?? 'Import thất bại' } }));
      }
    } catch {
      setImportMsg(prev => ({ ...prev, [tmdbId]: { type: 'error', text: 'Lỗi kết nối' } }));
    } finally {
      setImporting(prev => ({ ...prev, [tmdbId]: false }));
    }
  };

  const doManualImport = async () => {
    const tmdbId = parseInt(manualId.trim());
    if (!tmdbId) return;
    setManualImporting(true);
    setManualMsg(null);
    try {
      const res = await fetch(`${API_BASE}/movies/tmdb/${tmdbId}/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const data = await res.json();
      if (res.ok) {
        setManualMsg({ type: 'success', text: `✓ Import thành công: ${data.message ?? ''}` });
        setManualId('');
        onImported?.();
      } else if (res.status === 409) {
        setManualMsg({ type: 'warn', text: 'Phim đã được import trước đó' });
      } else {
        setManualMsg({ type: 'error', text: data.message ?? 'Import thất bại' });
      }
    } catch {
      setManualMsg({ type: 'error', text: 'Lỗi kết nối server' });
    } finally {
      setManualImporting(false); }
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 420, zIndex: 200,
        background: '#0a0a0a',
        borderLeft: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.7)',
      }}
    >
      {/* Panel header */}
      <div style={{ padding: '20px 20px 0', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>TMDB</p>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 900, color: 'white', margin: 0 }}>Import Phim</h2>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15}/>
          </motion.button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: -1 }}>
          {[{ key: 'search', label: '🔍 Tìm theo tên' }, { key: 'id', label: '# Nhập ID' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: '9px 16px', background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === t.key ? C.accent : 'transparent'}`,
              cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 12,
              fontWeight: activeTab === t.key ? 700 : 500,
              color: activeTab === t.key ? 'white' : 'rgba(255,255,255,0.35)',
              transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Panel body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

        {/* ── Search tab ── */}
        {activeTab === 'search' && (
          <>
            <Input
              type="search"
              placeholder="Tên phim... (VD: Parasite)"
              value={query}
              onChange={handleQueryChange}
              onSearch={() => doSearch(query, 1)}
              onClear={() => { setQuery(''); setResults([]); }}
              style={{ marginBottom: 16 }}
            />

            {searching && <div style={{ padding: '32px 0', textAlign: 'center' }}><Spinner size="md" color="red"/></div>}

            {!searching && results.length > 0 && (
              <>
                <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
                  {totalRes.toLocaleString()} kết quả — trang {tmdbPage}/{totalPages}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {results.map(m => (
                    <TmdbCard
                      key={m.id}
                      movie={m}
                      onImport={doImport}
                      importing={importing[m.id] ?? false}
                      imported={imported[m.id] ?? false}
                      importMsg={importMsg[m.id] ?? null}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, gap: 8 }}>
                    <Button variant="ghost" size="sm" disabled={tmdbPage <= 1} onClick={() => doSearch(query, tmdbPage - 1)}>← Trước</Button>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>{tmdbPage}/{totalPages}</span>
                    <Button variant="ghost" size="sm" disabled={tmdbPage >= totalPages} onClick={() => doSearch(query, tmdbPage + 1)}>Sau →</Button>
                  </div>
                )}
              </>
            )}

            {!searching && !query && (
              <div style={{ padding: '48px 0', textAlign: 'center' }}>
                <Search size={36} color="rgba(255,255,255,0.06)" style={{ margin: '0 auto 12px' }}/>
                <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Nhập tên phim để tìm kiếm</p>
              </div>
            )}

            {!searching && query && results.length === 0 && (
              <div style={{ padding: '48px 0', textAlign: 'center' }}>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>Không tìm thấy kết quả</p>
              </div>
            )}
          </>
        )}

        {/* ── Manual ID tab ── */}
        {activeTab === 'id' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Hash size={13} color="rgba(255,255,255,0.3)"/>
                <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
                  Tìm TMDB ID tại <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" style={{ color: C.accent }}>themoviedb.org</a> — URL dạng <code style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>/movie/496243</code>
                </p>
              </div>
            </div>

            <Input
              label="TMDB Movie ID"
              placeholder="VD: 496243"
              value={manualId}
              onChange={setManualId}
            />

            <Button variant="primary" size="md" loading={manualImporting} icon={<Download size={15}/>} onClick={doManualImport}>
              Import phim này
            </Button>

            {manualMsg && (
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: manualMsg.type === 'success' ? 'rgba(70,211,105,0.1)'
                          : manualMsg.type === 'warn'    ? 'rgba(245,197,24,0.1)'
                          : 'rgba(229,24,30,0.1)',
                border: `1px solid ${manualMsg.type === 'success' ? 'rgba(70,211,105,0.3)' : manualMsg.type === 'warn' ? 'rgba(245,197,24,0.3)' : 'rgba(229,24,30,0.3)'}`,
                fontFamily: FONT_BODY, fontSize: 12,
                color: manualMsg.type === 'success' ? '#46d369' : manualMsg.type === 'warn' ? '#f5c518' : C.accent,
              }}>
                {manualMsg.text}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminMovies() {
  const [allMovies,  setAllMovies]  = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [sortBy,     setSortBy]     = useState('releaseDate');
  const [sortDir,    setSortDir]    = useState('desc');
  const [deleteId,   setDeleteId]   = useState(null);
  const [deleting,   setDeleting]   = useState(false);
  const [showPanel,  setShowPanel]  = useState(false);
  const [detailId,   setDetailId]   = useState(null);  // xem chi tiết
  const [editMovie,  setEditMovie]  = useState(null);  // sửa phim

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
    <div style={{ padding: '36px 40px 64px', maxWidth: 1300 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Quản lý</p>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 900, color: 'white', margin: 0 }}>Phim ({filtered.length})</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" size="sm" icon={<RefreshCw size={14}/>} onClick={fetchMovies}>Tải lại</Button>
          <Button variant="primary" size="sm" icon={<Download size={14}/>} onClick={() => setShowPanel(true)}>Import TMDB</Button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <Input type="search" placeholder="Tìm kiếm theo tên phim..." value={search} onChange={setSearch} onClear={() => setSearch('')}/>
      </div>

      {/* Table */}
      <div style={{ background: '#0d0d0d', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th>Phim</Th>
                <Th sortKey="rating"      sortBy={sortBy} sortDir={sortDir} onSort={handleSort}>Rating</Th>
                <Th sortKey="releaseDate" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}>Năm</Th>
                <Th>Quốc gia</Th>
                <Th>Thể loại</Th>
                <th style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: '#080808', width: 60 }}/>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '48px 0', textAlign: 'center' }}><Spinner size="md" color="red"/></td></tr>
              ) : pageMovies.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '48px 0', textAlign: 'center', fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>Không tìm thấy phim</td></tr>
              ) : pageMovies.map((m, i) => (
                <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 46, borderRadius: 5, overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 }}>
                        {m.posterUrl && <img src={m.posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{m.title}</p>
                        {m.tmdbId && <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>TMDB #{m.tmdbId}</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {m.rating ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={11} style={{ fill: '#f5c518', color: '#f5c518' }}/>
                        <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: '#f5c518' }}>{Number(m.rating).toFixed(1)}</span>
                      </div>
                    ) : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{m.year ?? '—'}</td>
                  <td style={{ padding: '12px 16px', fontFamily: FONT_BODY, fontSize: 12 }}>
                    {m.originCountry
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.6)' }}>{COUNTRY_FLAG[m.originCountry] ?? '🌐'} {m.originCountry}</span>
                      : <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {m.genres?.slice(0, 2).map(g => (
                        <span key={g} style={{ fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.4)', padding: '2px 7px', borderRadius: 4, border: `1px solid ${C.border}` }}>{g}</span>
                      ))}
                      {(m.genres?.length ?? 0) > 2 && <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>+{m.genres.length - 2}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setDetailId(m.id)} title="Xem chi tiết"
                        style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Eye size={13}/>
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setEditMovie(m)} title="Chỉnh sửa"
                        style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(126,174,232,0.08)', border: `1px solid rgba(126,174,232,0.2)`, cursor: 'pointer', color: '#7eaee8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Pencil size={13}/>
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setDeleteId(m.id)} title="Xóa phim"
                        style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(229,24,30,0.08)', border: `1px solid rgba(229,24,30,0.2)`, cursor: 'pointer', color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={13}/>
                      </motion.button>
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
          <AlertCircle size={18} color={C.accent} style={{ flexShrink: 0, marginTop: 1 }}/>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>Bạn chắc chắn muốn xóa phim này? Hành động này không thể hoàn tác.</p>
        </div>
      </Modal>

      {/* Backdrop khi panel mở */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPanel(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199, backdropFilter: 'blur(2px)' }}
          />
        )}
      </AnimatePresence>

      {/* Import panel */}
      <AnimatePresence>
        {showPanel && (
          <ImportPanel
            onClose={() => setShowPanel(false)}
            onImported={fetchMovies}
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
        onSaved={updated => {
          setAllMovies(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
        }}
      />
    </div>
  );
}