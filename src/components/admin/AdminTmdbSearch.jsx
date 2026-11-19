// src/components/admin/AdminTmdbSearch.jsx
// Panel slide-in dùng chung cho AdminMovies & AdminTvShows
// 2 tab: 🎬 Phim | 📺 TV Show — mỗi tab có search theo tên + nhập ID riêng

import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Download, Check, Star, Copy, Film, Tv, X, Hash,
  Users, Image, Layers, PlayCircle, ChevronDown, ChevronUp,
  Eye, AlertCircle, Clock
} from 'lucide-react';
import { useTmdbPreview, useImportTmdb } from '../../hooks/useAdminTmdb';
import { useTmdbDiscover, useTmdbExisting, tmdbKeys } from '../../hooks/useTmdbDiscover';
import TmdbFilterBar, { EMPTY_FILTERS, hasActiveFilters, filtersKey } from './TmdbFilterBar';
import { T, FONT_BODY as FONT } from '../../context/adminTokens';

const COUNTRY_FLAG = { US:'🇺🇸', KR:'🇰🇷', JP:'🇯🇵', CN:'🇨🇳', VN:'🇻🇳', FR:'🇫🇷', GB:'🇬🇧', IN:'🇮🇳', TH:'🇹🇭' };

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spin = ({ color = T.accent, size = 20 }) => (
  <>
    <style>{`@keyframes _spin { to { transform: rotate(360deg); } }`}</style>
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}30`, borderTopColor: color,
      animation: '_spin 0.65s linear infinite', flexShrink: 0
    }} />
  </>
);

// ── Đếm giây đã trôi qua khi đang import ─────────────────────────────────────
function useElapsed(active) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!active) { setSec(0); return; }
    const t0 = Date.now();
    const id = setInterval(() => setSec(Math.floor((Date.now() - t0) / 1000)), 500);
    return () => clearInterval(id);
  }, [active]);
  return sec;
}

const fmtSec = (n) => (n >= 60 ? `${Math.floor(n / 60)}p${String(n % 60).padStart(2, '0')}s` : `${n}s`);

// ── Thanh tiến trình (không xác định) + đồng hồ — cho 1 lần import ───────────
// BE chưa trả tiến độ theo bước nên chỉ hiện thời gian đã chạy + gợi ý, không giả số %.
const ImportProgress = ({ seconds, isMovie }) => {
  const slow = seconds >= (isMovie ? 25 : 60);
  return (
    <div style={{ marginTop: 8 }}>
      <style>{`@keyframes _indet { 0% { left: -40%; } 100% { left: 100%; } }`}</style>
      <div style={{ position: 'relative', height: 4, borderRadius: 4, background: `${T.accent}22`, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, bottom: 0, width: '40%', borderRadius: 4,
          background: T.accent, animation: '_indet 1.1s ease-in-out infinite',
        }}/>
      </div>
      <div style={{
        marginTop: 5, display: 'flex', alignItems: 'center', gap: 5,
        fontFamily: FONT, fontSize: 10.5, color: slow ? '#D97706' : T.textMuted,
      }}>
        <Clock size={10}/>
        <span>
          Đang import… {fmtSec(seconds)}
          {slow
            ? ' — lâu hơn bình thường, vẫn đang chạy, vui lòng không đóng panel'
            : !isMovie ? ' (show nhiều season sẽ lâu hơn)' : ''}
        </span>
      </div>
    </div>
  );
};

// ── Tiến trình import hàng loạt: thanh % thật + thời gian còn lại ước tính ────
const BulkProgress = ({ bulk }) => {
  const elapsed = useElapsed(bulk.running);
  const pct = bulk.total ? Math.round((bulk.done / bulk.total) * 100) : 0;
  const eta = bulk.running && bulk.done > 0
    ? Math.max(0, Math.round((elapsed / bulk.done) * (bulk.total - bulk.done)))
    : null;
  return (
    <div style={{ flexBasis: '100%' }}>
      <div style={{ height: 6, borderRadius: 6, background: `${T.accent}22`, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: bulk.failed > 0 ? '#D97706' : T.accent,
          transition: 'width 0.3s ease',
        }}/>
      </div>
      <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontSize: 10.5, color: T.textMuted }}>
        <span>{bulk.done}/{bulk.total} ({pct}%){bulk.failed > 0 ? ` · ${bulk.failed} lỗi` : ''}</span>
        <span>
          {fmtSec(elapsed)}{eta != null ? ` · còn ~${fmtSec(eta)}` : ''}
        </span>
      </div>
    </div>
  );
};

// ── Import Result Badge ───────────────────────────────────────────────────────
// Hiển thị chi tiết sau khi import thành công: cast, ảnh, seasons, episodes
const ImportResultDetail = ({ result, isMovie }) => {
  if (!result) return null;

  const items = isMovie
    ? [
        { icon: <Users size={10}/>, label: 'Diễn viên', value: result.castCount ?? 0, ok: (result.castCount ?? 0) > 0 },
        { icon: <Image size={10}/>, label: 'Hình ảnh',  value: result.imageCount ?? 0, ok: (result.imageCount ?? 0) > 0 },
        { icon: <PlayCircle size={10}/>, label: 'Trailer',   value: result.trailerCount ?? (result.hasTrailer ? 1 : 0), ok: true },
        { icon: <Users size={10}/>, label: 'Đạo diễn', value: result.hasDirector ? '✓' : '–', ok: result.hasDirector },
      ]
    : [
        { icon: <Users size={10}/>,     label: 'Diễn viên', value: result.castCount    ?? 0, ok: (result.castCount    ?? 0) > 0 },
        { icon: <Image size={10}/>,     label: 'Hình ảnh',  value: result.imageCount   ?? 0, ok: (result.imageCount   ?? 0) > 0 },
        { icon: <Layers size={10}/>,    label: 'Season',    value: result.seasonCount  ?? 0, ok: (result.seasonCount  ?? 0) > 0 },
        { icon: <PlayCircle size={10}/>,label: 'Tập phim',  value: result.episodeCount ?? 0, ok: (result.episodeCount ?? 0) > 0 },
        { icon: <Users size={10}/>,     label: 'Đạo diễn', value: result.hasDirector ? '✓' : '–', ok: result.hasDirector },
      ];

  const hasWarning = items.some(i => !i.ok);

  return (
    <div style={{
      padding: '8px 12px',
      background: hasWarning ? '#FEFCE8' : '#F0FDF4',
      borderTop: `1px solid ${T.border}`,
    }}>
      <p style={{
        fontFamily: FONT, fontSize: 11, fontWeight: 700,
        color: hasWarning ? '#D97706' : T.accentText ?? '#16A34A',
        marginBottom: 6,
      }}>
        ✓ Import thành công {hasWarning ? '(một số dữ liệu thiếu — xem bên dưới)' : '— đầy đủ dữ liệu'}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 5,
            background: item.ok ? (T.accentLight ?? '#DCFCE7') : '#FEF9C3',
            border: `1px solid ${item.ok ? (T.accent + '30') : '#FDE68A'}`,
          }}>
            <span style={{ color: item.ok ? (T.accentText ?? '#16A34A') : '#D97706' }}>{item.icon}</span>
            <span style={{
              fontFamily: FONT, fontSize: 10.5,
              color: item.ok ? (T.accentText ?? '#16A34A') : '#D97706',
              fontWeight: 600,
            }}>
              {item.label}: {item.value}
            </span>
            {!item.ok && (
              <AlertCircle size={9} color="#D97706"/>
            )}
          </div>
        ))}
      </div>
      {hasWarning && (
        <p style={{
          fontFamily: FONT, fontSize: 10.5, color: '#D97706',
          marginTop: 6, lineHeight: 1.5,
        }}>
          ⚠️ Dữ liệu 0 có thể do TMDB API chưa có hoặc ITmdbService chưa fetch đủ.
          Kiểm tra <code style={{ fontSize: 10 }}>GetFullTvShowAsync</code> trong backend.
        </p>
      )}
    </div>
  );
};

// ── Preview Panel ─────────────────────────────────────────────────────────────
// Hiện thị dữ liệu TMDB trước khi import — giúp biết backend trả về gì
const PreviewPanel = ({ tmdbId, isMovie, onClose }) => {
  // Preview cache theo id: mở lại cùng phim / show là có ngay
  const previewQ = useTmdbPreview(isMovie ? 'movie' : 'tv', tmdbId);
  const data    = previewQ.data ?? null;
  const loading = previewQ.isPending;
  const error   = previewQ.isError
    ? (previewQ.error?.response?.data?.message ?? 'Không thể tải preview')
    : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '80vh',
          borderRadius: 14, overflow: 'hidden',
          background: T.surface, border: `1px solid ${T.border}`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 16px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={15} color={T.accent}/>
            <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.text }}>
              Preview TMDB #{tmdbId}
            </span>
            <span style={{
              fontFamily: FONT, fontSize: 10, padding: '2px 7px',
              borderRadius: 4, background: T.accentLight,
              color: T.accentText, fontWeight: 600,
            }}>
              {isMovie ? 'Phim' : 'TV Show'}
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: T.textMuted, display: 'flex',
          }}>
            <X size={16}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {loading && (
            <div style={{ padding: '32px 0', display: 'flex', justifyContent: 'center' }}>
              <Spin color={T.accent}/>
            </div>
          )}
          {error && (
            <div style={{
              padding: 12, borderRadius: 8, background: '#FEF2F2',
              border: '1px solid rgba(220,38,38,0.2)',
              fontFamily: FONT, fontSize: 12, color: T.red ?? '#DC2626',
            }}>
              ❌ {error}
            </div>
          )}
          {data && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Basic info */}
              <div style={{ display: 'flex', gap: 12 }}>
                {data.posterUrl && (
                  <img src={data.posterUrl} alt="" style={{
                    width: 64, borderRadius: 6, flexShrink: 0,
                    border: `1px solid ${T.border}`,
                  }}/>
                )}
                <div>
                  <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                    {data.title ?? data.name}
                  </p>
                  <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {data.overview}
                  </p>
                </div>
              </div>

              {/* Data checklist — what the backend WILL import */}
              <div style={{
                padding: 12, borderRadius: 8,
                background: T.bg, border: `1px solid ${T.border}`,
              }}>
                <p style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Dữ liệu sẽ được import
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    { label: 'Diễn viên (cast)',  ok: (data.cast?.length ?? 0) > 0,    detail: `${data.cast?.length ?? 0} người` },
                    { label: 'Hình ảnh',           ok: (data.images?.length ?? 0) > 0,  detail: `${data.images?.length ?? 0} ảnh` },
                    { label: 'Trailer',             ok: !!data.trailerKey,                detail: data.trailerKey ? `key: ${data.trailerKey}` : 'Không có' },
                    { label: 'Đạo diễn',           ok: !!data.director,                  detail: data.director ?? 'Không có' },
                    ...(!isMovie ? [
                      { label: 'Seasons',          ok: (data.seasons?.length ?? 0) > 0, detail: `${data.seasons?.length ?? 0} season` },
                      { label: 'Tổng tập phim',   ok: (data.numberOfEpisodes ?? 0) > 0, detail: `${data.numberOfEpisodes ?? 0} tập` },
                    ] : []),
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11 }}>{row.ok ? '✅' : '⚠️'}</span>
                      <span style={{ fontFamily: FONT, fontSize: 11.5, color: row.ok ? T.text : T.textMuted, fontWeight: row.ok ? 600 : 400 }}>
                        {row.label}
                      </span>
                      <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, marginLeft: 'auto' }}>
                        {row.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning nếu thiếu cast/images/seasons */}
              {!isMovie && (data.cast?.length ?? 0) === 0 && (
                <div style={{
                  padding: 10, borderRadius: 8, background: '#FEF9C3',
                  border: '1px solid #FDE68A',
                  fontFamily: FONT, fontSize: 11.5, color: '#D97706', lineHeight: 1.6,
                }}>
                  ⚠️ <strong>Cast = 0</strong> — Endpoint <code>/tvshows/tmdb/{'{id}'}</code> đang gọi{' '}
                  <code>GetTvShowAsync</code> (preview), không phải <code>GetFullTvShowAsync</code>.
                  Import thực tế sẽ gọi <code>GetFullTvShowAsync</code> và fetch cast riêng.
                  Hãy import thử và xem kết quả bên dưới.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Result Card ───────────────────────────────────────────────────────────────
const TmdbCard = ({ item, isMovie, onImport, importing, imported, importResult, importMsg, selected, onToggle }) => {
  const [copied, setCopied]         = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const elapsed = useElapsed(importing);

  const accent      = T.accent;
  const accentLight = T.accentLight;
  const accentText  = T.accentText;

  const year    = isMovie
    ? (item.releaseDate  ? new Date(item.releaseDate).getFullYear()  : null)
    : (item.firstAirDate ? new Date(item.firstAirDate).getFullYear() : null);
  const country = Array.isArray(item.originCountry) ? item.originCountry[0] : item.originCountry;
  const title   = isMovie ? item.title : (item.name ?? item.title);
  const rating  = item.voteAverage ?? 0;

  const copyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(item.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Lấy importResult từ response BE (castCount, imageCount, seasonCount, episodeCount)
  const result = importResult ?? null;

  return (
    <>
      {showPreview && (
        <PreviewPanel
          tmdbId={item.id}
          isMovie={isMovie}
          onClose={() => setShowPreview(false)}
        />
      )}

      <div style={{
        borderRadius: 10, overflow: 'hidden',
        border: `1px solid ${imported ? '#86EFAC' : T.border}`,
      }}>
        <div style={{
          background: imported ? '#F0FDF4' : T.surface,
          display: 'flex', transition: 'box-shadow 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadow}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
          {/* Poster */}
          <div style={{ width: 54, flexShrink: 0, background: T.bg, position: 'relative' }}>
            {onToggle && !imported && (
              <label
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute', top: 4, left: 4, zIndex: 1, display: 'flex', cursor: 'pointer',
                  padding: 3, borderRadius: 5, background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                }}
              >
                <input
                  type="checkbox" checked={!!selected} onChange={() => onToggle(item.id)} disabled={importing}
                  aria-label={`Chọn ${title}`}
                  style={{ width: 14, height: 14, margin: 0, accentColor: T.accent, cursor: 'pointer' }}
                />
              </label>
            )}
            {item.posterUrl
              ? <img src={item.posterUrl} alt="" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', aspectRatio: '2/3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {isMovie ? '🎬' : '📺'}
                </div>
            }
          </div>

          {/* Info */}
          <div style={{ flex: 1, padding: '10px 12px', minWidth: 0 }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
              <p style={{
                fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: T.text,
                lineHeight: 1.35, overflow: 'hidden',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>
                {title}
              </p>
              {imported && (
                <span style={{
                  flexShrink: 0, fontFamily: FONT, fontSize: 9.5, fontWeight: 700,
                  padding: '2px 7px', borderRadius: 4,
                  background: accentLight, border: `1px solid ${accent}40`, color: accentText,
                }}>
                  ✓ Đã có
                </span>
              )}
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {rating > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: '#D97706' }}>
                  <Star size={9} style={{ fill: '#D97706', color: '#D97706' }}/> {rating.toFixed(1)}
                </span>
              )}
              {year    && <span style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted }}>{year}</span>}
              {country && <span style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted }}>{COUNTRY_FLAG[country] ?? '🌐'} {country}</span>}
              {!isMovie && item.numberOfSeasons > 0 && (
                <span style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted }}>
                  {item.numberOfSeasons} mùa • {item.numberOfEpisodes ?? '?'} tập
                </span>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={copyId} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: T.surfaceAlt, border: `1px solid ${T.border}`,
                borderRadius: 5, padding: '3px 8px', cursor: 'pointer',
                fontFamily: FONT, fontSize: 10,
                color: copied ? accentText : T.textMuted, transition: 'color 0.15s',
              }}>
                {copied ? <Check size={9} color={accent}/> : <Copy size={9}/>} #{item.id}
              </button>

              {/* Preview button */}
              <button onClick={() => setShowPreview(true)} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: T.surfaceAlt, border: `1px solid ${T.border}`,
                borderRadius: 5, padding: '3px 8px', cursor: 'pointer',
                fontFamily: FONT, fontSize: 10, color: T.textMuted,
              }}>
                <Eye size={9}/> Xem trước
              </button>

              <button
                disabled={imported || importing}
                onClick={() => !imported && onImport(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 12px', borderRadius: 6,
                  cursor: imported ? 'default' : importing ? 'wait' : 'pointer',
                  background: imported ? T.surfaceAlt : accent,
                  border: `1px solid ${imported ? T.border : accent}`,
                  fontFamily: FONT, fontSize: 11, fontWeight: 600,
                  color: imported ? T.textMuted : '#fff',
                  opacity: importing ? 0.75 : 1, transition: 'all 0.15s',
                }}
              >
                {importing
                  ? <><Spin color="#fff" size={14}/> {!isMovie ? 'Đang fetch seasons…' : 'Đang import…'}</>
                  : imported
                    ? <><Check size={10}/> Đã có</>
                    : <><Download size={10}/> Import</>
                }
              </button>
            </div>

            {/* TV show import note — cảnh báo có thể mất lâu */}
            {importing && <ImportProgress seconds={elapsed} isMovie={isMovie} />}
          </div>
        </div>

        {/* Import result detail — castCount, imageCount, seasonCount, episodeCount */}
        {importMsg?.type === 'success' && result && (
          <ImportResultDetail result={result} isMovie={isMovie} />
        )}

        {/* Fallback message khi không có result detail */}
        {importMsg && !(importMsg.type === 'success' && result) && (
          <div style={{
            padding: '7px 12px',
            background: importMsg.type === 'success' ? '#F0FDF4'
              : importMsg.type === 'warn' ? '#FEFCE8' : '#FEF2F2',
            borderTop: `1px solid ${T.border}`,
            fontFamily: FONT, fontSize: 11.5,
            color: importMsg.type === 'success' ? accentText
              : importMsg.type === 'warn' ? '#D97706' : T.red,
          }}>
            {importMsg.text}
          </div>
        )}
      </div>
    </>
  );
};

// ── Tab Content (Search + ID) ─────────────────────────────────────────────────
const TabContent = ({ isMovie, onImported }) => {
  const [subTab,          setSubTab]          = useState('search');
  const [query,           setQuery]           = useState('');
  const [debouncedQuery,  setDebouncedQuery]  = useState('');
  const [filters,         setFilters]         = useState(EMPTY_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState(EMPTY_FILTERS);
  // Con trỏ phân trang: mỗi phần tử là trang TMDB bắt đầu quét; trang sau = nextPage mà server trả về
  const [pageStack,       setPageStack]       = useState([1]);
  const [selected,        setSelected]        = useState({}); // { [tmdbId]: true } — chọn để import hàng loạt
  const [bulk,            setBulk]            = useState(null); // { running, done, failed, total }
  const [importing,       setImporting]       = useState({});
  const [imported,        setImported]        = useState({});
  const [importResult,    setImportResult]    = useState({}); // { [tmdbId]: resultData }
  const [importMsg,       setImportMsg]       = useState({});
  const [manualId,        setManualId]        = useState('');
  const [manualImporting, setManualImporting] = useState(false);
  const [manualMsg,       setManualMsg]       = useState(null);
  const [manualResult,    setManualResult]    = useState(null);
  const manualElapsed = useElapsed(manualImporting);

  const kind = isMovie ? 'movie' : 'tv';
  const importTmdb = useImportTmdb(kind);
  const queryClient = useQueryClient();

  const accent      = T.accent;
  const accentLight = T.accentLight;
  const accentText  = T.accentText;

  // Tìm kiếm có debounce (trước đây gọi API mỗi phím gõ); kết quả cache theo từ khoá + trang.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 350);
    return () => clearTimeout(t);
  }, [filters]);

  const filterActive = hasActiveFilters(debouncedFilters);
  const active       = !!debouncedQuery || filterActive;
  const hasInput     = !!query.trim() || hasActiveFilters(filters);
  const startPage    = pageStack[pageStack.length - 1];
  const discoverQ    = useTmdbDiscover(kind, debouncedQuery, debouncedFilters, startPage, active);
  const results      = active ? (discoverQ.data?.results ?? []) : [];
  const nextPage     = active ? (discoverQ.data?.nextPage ?? null) : null;
  const isFiltered   = !!discoverQ.data?.isFiltered;
  const totalRes     = discoverQ.data?.totalResults ?? 0;
  const notes        = active ? (discoverQ.data?.notes ?? []) : [];
  const pendingInput = query.trim() !== debouncedQuery || filtersKey(filters) !== filtersKey(debouncedFilters);
  const searching    = hasInput && (discoverQ.isFetching || pendingInput);

  // Phim/show đã có trong DB (server) hoặc vừa import trong phiên này
  const existingQ   = useTmdbExisting(kind, results.map(r => r.id));
  const existingSet = useMemo(() => new Set(existingQ.data ?? []), [existingQ.data]);
  const isDone      = (id) => !!imported[id] || existingSet.has(id);

  const resetPaging = () => { setPageStack([1]); setSelected({}); };
  const handleQueryChange = (q) => {
    setQuery(q);
    resetPaging();
  };
  const handleFiltersChange = (f) => {
    setFilters(f);
    resetPaging();
  };

  const doImport = async (tmdbId, { silent = false } = {}) => {
    let ok = false;
    setImporting(p => ({ ...p, [tmdbId]: true }));
    setImportMsg(p => ({ ...p, [tmdbId]: null }));
    setImportResult(p => ({ ...p, [tmdbId]: null }));
    try {
      // Import hàng loạt: lỗi mạng / 5xx tự thử lại 1 lần (nếu lần 1 đã ghi một phần → lần 2 trả 409 → coi như xong)
      let result;
      for (let attempt = 0; ; attempt++) {
        try {
          result = await importTmdb.mutateAsync(tmdbId);
          break;
        } catch (err) {
          const st = err?.response?.status;
          if (silent && attempt < 1 && (!st || st >= 500)) continue;
          throw err;
        }
      }
      setImported(p => ({ ...p, [tmdbId]: true }));
      setImportResult(p => ({ ...p, [tmdbId]: result }));
      setImportMsg(p => ({ ...p, [tmdbId]: { type: 'success', text: '✓ Import thành công' } }));
      console.log(`[AdminTmdbSearch] Import result for ${tmdbId}:`, result);
      ok = true;
      // Hàng loạt: chỉ làm mới 1 lần ở cuối (tránh refetch "đã có" sau từng phim)
      if (!silent) {
        queryClient.invalidateQueries({ queryKey: tmdbKeys.existingAll() });
        onImported?.();
      }
    } catch (e) {
      const status  = e?.response?.status;
      const message = e?.response?.data?.message ?? e?.message;
      if (status === 409) {
        ok = true; // đã có trong DB — coi như xong
        setImported(p => ({ ...p, [tmdbId]: true }));
        setImportMsg(p => ({ ...p, [tmdbId]: { type: 'warn', text: isMovie ? 'Phim đã được import rồi' : 'TV show đã được import rồi' } }));
      } else {
        setImportMsg(p => ({ ...p, [tmdbId]: { type: 'error', text: message ?? 'Import thất bại' } }));
      }
    } finally {
      setImporting(p => ({ ...p, [tmdbId]: false }));
    }
    return ok;
  };

  const doManualImport = async () => {
    const tmdbId = parseInt(manualId.trim());
    if (!tmdbId) return;
    setManualImporting(true);
    setManualMsg(null);
    setManualResult(null);
    try {
      const result = await importTmdb.mutateAsync(tmdbId);
      setManualResult(result);
      setManualMsg({ type: 'success', text: '✓ Import thành công' });
      setManualId('');
      console.log(`[AdminTmdbSearch] Manual import result for ${tmdbId}:`, result);
      // Làm mới trạng thái "Đã có" ở tab tìm theo tên (trước đây import theo ID không invalidate)
      queryClient.invalidateQueries({ queryKey: tmdbKeys.existingAll() });
      onImported?.();
    } catch (e) {
      const status  = e?.response?.status;
      const message = e?.response?.data?.message ?? e?.message;
      if (status === 409) {
        setManualMsg({ type: 'warn', text: isMovie ? 'Phim đã được import trước đó' : 'TV show đã được import trước đó' });
      } else {
        setManualMsg({ type: 'error', text: message ?? 'Import thất bại' });
      }
    } finally { setManualImporting(false); }
  };

  // ── Chọn nhiều + import hàng loạt ──────────────────────────────────────────
  const selectedIds   = Object.keys(selected).filter(k => selected[k]).map(Number);
  const selectableIds = results.filter(r => !isDone(r.id)).map(r => r.id);
  const toggleSelect  = (id) => setSelected(p => ({ ...p, [id]: !p[id] }));
  const selectAllOnPage = () => setSelected(Object.fromEntries(selectableIds.map(id => [id, true])));
  const clearSelection  = () => setSelected({});

  const runBulkImport = async () => {
    if (bulk?.running || selectedIds.length === 0) return;
    const noun = isMovie ? 'phim' : 'TV show';
    const confirmed = window.confirm(
      `Import ${selectedIds.length} ${noun} từ TMDB?\n\nMỗi ${noun} import xong sẽ gửi 1 thông báo “mới ra mắt” tới người dùng.`
    );
    if (!confirmed) return;

    const queue = selectedIds.filter(id => !isDone(id)); // bỏ phim đã có → khỏi tốn 1 request 409
    const total = queue.length;
    if (total === 0) return;
    // Song song để rút ngắn tổng thời gian. TV show nặng hơn (nhiều season/episode) nên ít luồng hơn.
    const concurrency = Math.min(total, isMovie ? 3 : 2);
    const stats = { done: 0, failed: 0 };
    setBulk({ running: true, done: 0, failed: 0, total });

    const worker = async () => {
      while (queue.length > 0) {
        const id = queue.shift();
        const success = await doImport(id, { silent: true });
        if (!success) stats.failed += 1;
        stats.done += 1;
        setBulk({ running: true, done: stats.done, failed: stats.failed, total });
      }
    };
    await Promise.all(Array.from({ length: concurrency }, worker));

    setBulk({ running: false, done: stats.done, failed: stats.failed, total });
    setSelected({});
    queryClient.invalidateQueries({ queryKey: tmdbKeys.existingAll() });
    onImported?.();
  };

  const ghostBtn = {
    padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surfaceAlt ?? T.bg,
    fontFamily: FONT, fontSize: 11, color: T.textSub, cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, flexShrink: 0, paddingLeft: 20 }}>
        {[
          { key: 'search', label: '🔍 Tìm theo tên' },
          { key: 'id',     label: '# Nhập ID' },
        ].map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)} style={{
            padding: '10px 16px', background: 'none', border: 'none',
            borderBottom: `2px solid ${subTab === t.key ? accent : 'transparent'}`,
            cursor: 'pointer', fontFamily: FONT, fontSize: 12.5,
            fontWeight: subTab === t.key ? 700 : 400,
            color: subTab === t.key ? accentText : T.textMuted,
            transition: 'all 0.15s', marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: T.bg }}>

        {/* ── Search sub-tab ── */}
        {subTab === 'search' && (
          <>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <Search size={15} color={T.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                placeholder={isMovie ? 'Tên phim... (VD: Parasite)' : 'Tên TV show... (VD: Squid Game)'}
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                style={{ width: '100%', height: 40, padding: '0 36px 0 38px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, fontFamily: FONT, fontSize: 13.5, color: T.text, outline: 'none', boxSizing: 'border-box' }}
              />
              {query && (
                <button onClick={() => handleQueryChange('')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', padding: 0 }}>
                  <X size={14}/>
                </button>
              )}
            </div>

            <TmdbFilterBar kind={kind} filters={filters} onChange={handleFiltersChange} hasQuery={!!query.trim()} />

            {searching && (
              <div style={{ padding: '32px 0', textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                <Spin color={accent}/>
              </div>
            )}

            {!searching && discoverQ.isError && (
              <div style={{
                padding: 12, borderRadius: 8, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)',
                fontFamily: FONT, fontSize: 12, color: T.red ?? '#DC2626', marginBottom: 10,
              }}>
                ❌ {discoverQ.error?.response?.data?.message ?? 'Không tải được danh sách từ TMDB'}
              </div>
            )}

            {!searching && results.length > 0 && (
              <>
                <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, marginBottom: 8 }}>
                  {isFiltered
                    ? `${results.length} ${isMovie ? 'phim' : 'show'} phù hợp ở trang này`
                    : `${totalRes.toLocaleString()} kết quả`} — trang {pageStack.length}
                </p>
                {notes.map((n, i) => (
                  <p key={i} style={{ fontFamily: FONT, fontSize: 10.5, color: '#D97706', margin: '0 0 6px', lineHeight: 1.5 }}>
                    ⚠️ {n}
                  </p>
                ))}

                {/* Thanh chọn nhiều / import hàng loạt */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                  padding: '8px 10px', margin: '4px 0 10px', borderRadius: 8,
                  background: T.surface, border: `1px solid ${T.border}`,
                }}>
                  <button type="button" onClick={selectAllOnPage} disabled={bulk?.running || selectableIds.length === 0} style={ghostBtn}>
                    Chọn tất cả ({selectableIds.length})
                  </button>
                  {selectedIds.length > 0 && (
                    <button type="button" onClick={clearSelection} disabled={bulk?.running} style={ghostBtn}>Bỏ chọn</button>
                  )}
                  <button
                    type="button" onClick={runBulkImport} disabled={bulk?.running || selectedIds.length === 0}
                    style={{
                      marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 6, border: `1px solid ${accent}`, background: accent,
                      fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: '#fff',
                      cursor: bulk?.running ? 'wait' : selectedIds.length === 0 ? 'default' : 'pointer',
                      opacity: selectedIds.length === 0 && !bulk?.running ? 0.5 : 1,
                    }}
                  >
                    {bulk?.running
                      ? <><Spin color="#fff" size={13}/> Đang import {bulk.done}/{bulk.total}…</>
                      : <><Download size={11}/> Import {selectedIds.length > 0 ? selectedIds.length : ''} đã chọn</>}
                  </button>
                  {bulk?.running && <BulkProgress bulk={bulk} />}
                  {bulk && !bulk.running && (
                    <span style={{ flexBasis: '100%', fontFamily: FONT, fontSize: 11, color: bulk.failed > 0 ? '#D97706' : accentText }}>
                      Xong: {bulk.done - bulk.failed}/{bulk.total} thành công{bulk.failed > 0 ? `, ${bulk.failed} lỗi (xem thẻ bên dưới)` : ''}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {results.map(item => (
                    <TmdbCard
                      key={item.id}
                      item={item}
                      isMovie={isMovie}
                      onImport={doImport}
                      importing={importing[item.id]    ?? false}
                      imported={isDone(item.id)}
                      importResult={importResult[item.id] ?? null}
                      importMsg={importMsg[item.id]    ?? null}
                      selected={!!selected[item.id]}
                      onToggle={bulk?.running ? undefined : toggleSelect}
                    />
                  ))}
                </div>

                {(pageStack.length > 1 || nextPage) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, gap: 8 }}>
                    <button
                      disabled={pageStack.length <= 1 || bulk?.running}
                      onClick={() => { setPageStack(s => s.slice(0, -1)); setSelected({}); }}
                      style={{
                        padding: '7px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface,
                        cursor: pageStack.length <= 1 ? 'default' : 'pointer', fontFamily: FONT, fontSize: 12.5,
                        color: T.textSub, opacity: pageStack.length <= 1 ? 0.5 : 1,
                      }}
                    >
                      ← Trước
                    </button>
                    <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, display: 'flex', alignItems: 'center' }}>
                      Trang {pageStack.length}
                    </span>
                    <button
                      disabled={!nextPage || bulk?.running}
                      onClick={() => { setPageStack(s => [...s, nextPage]); setSelected({}); }}
                      style={{
                        padding: '7px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface,
                        cursor: !nextPage ? 'default' : 'pointer', fontFamily: FONT, fontSize: 12.5,
                        color: T.textSub, opacity: !nextPage ? 0.5 : 1,
                      }}
                    >
                      Sau →
                    </button>
                  </div>
                )}
              </>
            )}
            {!searching && !hasInput && (
              <div style={{ padding: '48px 0', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: accentLight, border: `1px solid ${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  {isMovie ? <Film size={22} color={accent} strokeWidth={1.5}/> : <Tv size={22} color={accent} strokeWidth={1.5}/>}
                </div>
                <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>
                  {isMovie ? 'Nhập tên phim hoặc chọn bộ lọc để duyệt TMDB' : 'Nhập tên TV show hoặc chọn bộ lọc để duyệt TMDB'}
                </p>
              </div>
            )}

            {!searching && hasInput && !discoverQ.isError && results.length === 0 && (
              <div style={{ padding: '48px 0', textAlign: 'center' }}>
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textMuted, marginBottom: 4 }}>Không tìm thấy kết quả</p>
                <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted }}>Thử từ khóa khác, tên tiếng Anh hoặc nới lỏng bộ lọc</p>
              </div>
            )}
          </>
        )}

        {/* ── ID sub-tab ── */}
        {subTab === 'id' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Hướng dẫn */}
            <div style={{ padding: 14, borderRadius: 10, background: T.surface, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Hash size={13} color={T.textMuted} style={{ marginTop: 2, flexShrink: 0 }}/>
                <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, lineHeight: 1.65 }}>
                  Tìm ID tại{' '}
                  <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" style={{ color: accentText }}>themoviedb.org</a>
                  {' '}— URL dạng{' '}
                  <code style={{ color: T.textSub, fontSize: 11, background: T.bg, padding: '1px 5px', borderRadius: 4 }}>
                    {isMovie ? '/movie/496243' : '/tv/1396'}
                  </code>
                </p>
              </div>
            </div>

            {/* Note cho TV show */}
            {!isMovie && (
              <div style={{
                padding: '10px 12px', borderRadius: 8,
                background: '#EFF6FF', border: '1px solid #BFDBFE',
                display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <Clock size={13} color="#3B82F6" style={{ marginTop: 1, flexShrink: 0 }}/>
                <p style={{ fontFamily: FONT, fontSize: 11.5, color: '#1D4ED8', lineHeight: 1.6 }}>
                  TV show import mất nhiều thời gian hơn phim vì backend cần fetch từng season và episodes từ TMDB API.
                  Show nhiều season (như One Piece, Naruto) có thể mất <strong>30–60 giây</strong>.
                </p>
              </div>
            )}

            {/* Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                TMDB {isMovie ? 'Movie' : 'TV Show'} ID
              </label>
              <input
                placeholder={isMovie ? 'VD: 496243' : 'VD: 1396'}
                value={manualId}
                onChange={e => setManualId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doManualImport()}
                style={{ height: 42, padding: '0 14px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, fontFamily: FONT, fontSize: 13.5, color: T.text, outline: 'none' }}
              />
            </div>

            {/* Button */}
            <button
              onClick={doManualImport}
              disabled={manualImporting || !manualId.trim()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '11px 0', borderRadius: 10, border: 'none',
                background: accent, cursor: !manualId.trim() ? 'default' : 'pointer',
                fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: '#fff',
                opacity: !manualId.trim() ? 0.5 : 1, transition: 'all 0.15s',
              }}
            >
              {manualImporting
                ? <><Spin color="#fff"/> {isMovie ? 'Đang import…' : 'Đang fetch seasons & cast…'}</>
                : <><Download size={15}/> Import {isMovie ? 'phim' : 'TV show'} này</>
              }
            </button>

            {manualImporting && <ImportProgress seconds={manualElapsed} isMovie={isMovie} />}

            {/* Result — hiển thị chi tiết sau khi import */}
            {manualMsg && (
              <>
                {manualMsg.type === 'success' && manualResult ? (
                  <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid #86EFAC` }}>
                    <ImportResultDetail result={manualResult} isMovie={isMovie} />
                  </div>
                ) : (
                  <div style={{
                    padding: '10px 14px', borderRadius: 10,
                    background: manualMsg.type === 'success' ? '#F0FDF4' : manualMsg.type === 'warn' ? '#FEFCE8' : '#FEF2F2',
                    border: `1px solid ${manualMsg.type === 'success' ? 'rgba(22,163,74,0.3)' : manualMsg.type === 'warn' ? 'rgba(217,119,6,0.3)' : 'rgba(220,38,38,0.3)'}`,
                    fontFamily: FONT, fontSize: 12.5,
                    color: manualMsg.type === 'success' ? accentText : manualMsg.type === 'warn' ? '#D97706' : T.red,
                  }}>
                    {manualMsg.text}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Panel (exported) ─────────────────────────────────────────────────────
export default function AdminTmdbSearch({ onClose, onImported, defaultTab = 'movie', singleTab = false }) {
  const [mainTab, setMainTab] = useState(defaultTab);

  const tabs = [
    { key: 'movie', label: '🎬 Phim',    accent: T.accent, accentText: T.accentText },
    { key: 'tv',    label: '📺 TV Show', accent: T.accent, accentText: T.accentText },
  ];

  const headerTitle = singleTab
    ? (defaultTab === 'movie' ? 'Import Phim' : 'Import TV Show')
    : 'Import Nội Dung';

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 420, zIndex: 200,
        background: T.surface,
        borderLeft: `1px solid ${T.borderMed ?? T.border}`,
        display: 'flex', flexDirection: 'column',
        boxShadow: T.shadowLg ?? '0 20px 60px rgba(0,0,0,0.15)',
        fontFamily: FONT,
      }}
    >
      {/* ── Header ── */}
      <div style={{ padding: '20px 20px 0', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>TMDB</p>
            <h2 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em' }}>{headerTitle}</h2>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: T.bg, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15}/>
            </button>
          )}
        </div>

        {!singleTab && (
          <div style={{ display: 'flex', gap: 0, marginBottom: -1 }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setMainTab(t.key)} style={{
                padding: '9px 18px', background: 'none', border: 'none',
                borderBottom: `2px solid ${mainTab === t.key ? t.accent : 'transparent'}`,
                cursor: 'pointer', fontFamily: FONT, fontSize: 13,
                fontWeight: mainTab === t.key ? 700 : 500,
                color: mainTab === t.key ? t.accentText : T.textMuted,
                transition: 'all 0.15s',
              }}>{t.label}</button>
            ))}
          </div>
        )}

        {singleTab && (
          <div style={{ marginBottom: 12 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 20,
              background: T.accent,
              fontFamily: FONT, fontSize: 11.5, fontWeight: 700,
              color: '#fff',
              boxShadow: `0 2px 8px ${T.accent}50`,
            }}>
              {defaultTab === 'movie' ? <Film size={12}/> : <Tv size={12}/>}
              {defaultTab === 'movie' ? 'Chỉ import phim' : 'Chỉ import TV show'}
            </span>
          </div>
        )}
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={mainTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <TabContent
              isMovie={singleTab ? defaultTab === 'movie' : mainTab === 'movie'}
              onImported={onImported}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}