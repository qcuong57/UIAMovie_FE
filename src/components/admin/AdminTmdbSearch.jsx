// src/components/admin/AdminTmdbSearch.jsx
import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Check, Star, Calendar, Clock, ExternalLink, Copy } from 'lucide-react';
import { Input, Button, Spinner } from '../ui';
import axiosInstance from '../../config/axios';
import { C, FONT_DISPLAY, FONT_BODY } from '../../context/homeTokens';

const COUNTRY_FLAG = { US:'🇺🇸', KR:'🇰🇷', JP:'🇯🇵', CN:'🇨🇳', VN:'🇻🇳', FR:'🇫🇷', GB:'🇬🇧', IN:'🇮🇳', TH:'🇹🇭' };

const TmdbMovieCard = ({ movie, onImport, importing, imported }) => {
  const [copied, setCopied]   = useState(false);
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;

  const copyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(movie.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#0d0d0d',
        border: `1px solid ${imported ? 'rgba(70,211,105,0.25)' : C.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        gap: 0,
      }}
    >
      {/* Poster */}
      <div style={{ width: 80, flexShrink: 0, background: '#1a1a1a' }}>
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt="" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', aspectRatio: '2/3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎬</div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, padding: '14px 16px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: 'white', lineHeight: 1.3 }}>
              {movie.title}
            </p>
            {imported && (
              <span style={{
                flexShrink: 0, fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700,
                padding: '2px 8px', borderRadius: 4,
                background: 'rgba(70,211,105,0.12)', border: '1px solid rgba(70,211,105,0.3)',
                color: '#46d369', whiteSpace: 'nowrap',
              }}>✓ Đã có</span>
            )}
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            {movie.voteAverage > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={11} style={{ fill: '#f5c518', color: '#f5c518' }} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: '#f5c518' }}>
                  {movie.voteAverage.toFixed(1)}
                </span>
              </div>
            )}
            {year && <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{year}</span>}
            {movie.originCountry?.length > 0 && (
              <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                {COUNTRY_FLAG[movie.originCountry[0]] ?? '🌐'} {movie.originCountry[0]}
              </span>
            )}
          </div>

          {/* Overview */}
          {movie.overview && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {movie.overview}
            </p>
          )}
        </div>

        {/* Bottom: ID + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <button onClick={copyId} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
            borderRadius: 5, padding: '4px 10px', cursor: 'pointer',
            fontFamily: FONT_BODY, fontSize: 11, color: copied ? '#46d369' : 'rgba(255,255,255,0.35)',
            transition: 'all 0.15s',
          }}>
            {copied ? <Check size={11} /> : <Copy size={11} />}
            TMDB #{movie.id}
          </button>

          <Button
            variant={imported ? 'ghost' : 'primary'}
            size="sm"
            loading={importing}
            disabled={imported}
            icon={imported ? <Check size={13} /> : <Download size={13} />}
            onClick={() => !imported && onImport(movie.id)}
          >
            {imported ? 'Đã import' : 'Import'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default function AdminTmdbSearch() {
  const [query,       setQuery]       = useState('');
  const [page,        setPage]        = useState(1);
  const [results,     setResults]     = useState([]);
  const [totalPages,  setTotalPages]  = useState(0);
  const [totalRes,    setTotalRes]    = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [importing,   setImporting]   = useState({}); // { [tmdbId]: bool }
  const [imported,    setImported]    = useState({}); // { [tmdbId]: bool }
  const [importMsg,   setImportMsg]   = useState({}); // { [tmdbId]: string }
  const inputRef = useRef(null);

  const doSearch = useCallback(async (q, p = 1) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/movies/tmdb/search?query=${encodeURIComponent(q)}&page=${p}`);
      const data = res?.data ?? res;
      setResults(data?.results ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalRes(data?.totalResults ?? 0);
      setPage(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const handleSearch = (q) => {
    setQuery(q);
    if (q.trim()) doSearch(q, 1);
    else { setResults([]); setTotalPages(0); }
  };

  const handleImport = async (tmdbId) => {
    setImporting(prev => ({ ...prev, [tmdbId]: true }));
    setImportMsg(prev => ({ ...prev, [tmdbId]: null }));
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/movies/tmdb/${tmdbId}/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const data = await res.json();
      if (res.ok) {
        setImported(prev => ({ ...prev, [tmdbId]: true }));
        setImportMsg(prev => ({ ...prev, [tmdbId]: { type: 'success', text: `✓ ${data.message ?? 'Import thành công'}` } }));
      } else if (res.status === 409) {
        setImported(prev => ({ ...prev, [tmdbId]: true }));
        setImportMsg(prev => ({ ...prev, [tmdbId]: { type: 'warn', text: 'Phim đã được import trước đó' } }));
      } else {
        setImportMsg(prev => ({ ...prev, [tmdbId]: { type: 'error', text: data.message ?? 'Import thất bại' } }));
      }
    } catch {
      setImportMsg(prev => ({ ...prev, [tmdbId]: { type: 'error', text: 'Lỗi kết nối' } }));
    } finally {
      setImporting(prev => ({ ...prev, [tmdbId]: false }));
    }
  };

  return (
    <div style={{ padding: '36px 40px 64px', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>TMDB</p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 900, color: 'white', margin: 0 }}>
          Tìm & Import Phim
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
          Tìm kiếm phim trên TMDB, copy ID hoặc import trực tiếp vào hệ thống
        </p>
      </div>

      {/* Search input */}
      <div style={{ marginBottom: 28 }}>
        <Input
          ref={inputRef}
          type="search"
          placeholder="Tên phim cần tìm... (VD: Parasite, Avengers)"
          value={query}
          onChange={handleSearch}
          onSearch={() => doSearch(query, 1)}
          onClear={() => { setQuery(''); setResults([]); setTotalPages(0); }}
          size="lg"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding: '48px 0', textAlign: 'center' }}><Spinner size="md" color="red" /></div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              {totalRes.toLocaleString()} kết quả — trang {page}/{totalPages}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {results.map(m => (
              <div key={m.id}>
                <TmdbMovieCard
                  movie={m}
                  onImport={handleImport}
                  importing={importing[m.id] ?? false}
                  imported={imported[m.id] ?? false}
                />
                {importMsg[m.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{
                      padding: '8px 14px', marginTop: 4, borderRadius: '0 0 8px 8px',
                      background: importMsg[m.id].type === 'success' ? 'rgba(70,211,105,0.08)'
                                : importMsg[m.id].type === 'warn'    ? 'rgba(245,197,24,0.08)'
                                : 'rgba(229,24,30,0.08)',
                      fontFamily: FONT_BODY, fontSize: 12,
                      color: importMsg[m.id].type === 'success' ? '#46d369'
                           : importMsg[m.id].type === 'warn'    ? '#f5c518'
                           : C.accent,
                    }}
                  >
                    {importMsg[m.id].text}
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => doSearch(query, page - 1)}>← Trang trước</Button>
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                {page} / {totalPages}
              </span>
              <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => doSearch(query, page + 1)}>Trang sau →</Button>
            </div>
          )}
        </>
      )}

      {/* Empty */}
      {!loading && query && results.length === 0 && (
        <div style={{ padding: '64px 0', textAlign: 'center' }}>
          <p style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.2)', marginBottom: 8 }}>
            Không tìm thấy kết quả
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.15)' }}>Thử từ khóa khác hoặc tên tiếng Anh</p>
        </div>
      )}

      {/* Default empty */}
      {!loading && !query && (
        <div style={{ padding: '64px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Search size={48} color="rgba(255,255,255,0.06)" />
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: 'rgba(255,255,255,0.2)' }}>
            Nhập tên phim để tìm kiếm từ TMDB
          </p>
        </div>
      )}
    </div>
  );
}