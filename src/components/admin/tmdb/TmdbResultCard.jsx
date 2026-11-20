// src/components/admin/TmdbResultCard.jsx
// Thẻ 1 phim / TV show trong danh sách kết quả TMDB. Trạng thái import lấy từ `job` (store nền).

import React, { useState } from 'react';
import { Download, Check, Star, Copy, Eye } from 'lucide-react';
import { T, FONT_BODY as FONT } from '../../../context/adminTokens';
import { flagOf } from './TmdbFilterBar';
import { isActive } from '../../../../stores/tmdbImportStore';
import TmdbPreviewModal from './TmdbPreviewModal';
import { Spin, JobProgress, Notice, ResultBadges, TONE, getItemTitle } from './TmdbImportUi';

const yearOf = (date) => (date ? new Date(date).getFullYear() : null);

const metaText = { fontFamily: FONT, fontSize: 10.5, color: T.textMuted };

const smallBtn = {
  display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, cursor: 'pointer',
  background: T.surfaceAlt, border: `1px solid ${T.border}`, fontFamily: FONT, fontSize: 10, color: T.textMuted,
};

export default function TmdbResultCard({ item, isMovie, job, imported, selected, onToggle, onImport }) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const active = isActive(job);
  const title = getItemTitle(item, isMovie);
  const year = yearOf(isMovie ? item.releaseDate : item.firstAirDate);
  const country = Array.isArray(item.originCountry) ? item.originCountry[0] : item.originCountry;
  const rating = item.voteAverage ?? 0;
  const showResult = job?.status === 'done' && job.result;

  const copyId = () => {
    navigator.clipboard.writeText(String(item.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      {showPreview && <TmdbPreviewModal tmdbId={item.id} isMovie={isMovie} onClose={() => setShowPreview(false)} />}

      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${imported ? '#86EFAC' : T.border}` }}>
        <div
          style={{ display: 'flex', background: imported ? '#F0FDF4' : T.surface, transition: 'box-shadow 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = T.shadow; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          {/* Poster + checkbox chọn nhiều */}
          <div style={{ width: 54, flexShrink: 0, background: T.bg, position: 'relative' }}>
            {!imported && !active && (
              <label style={{
                position: 'absolute', top: 4, left: 4, zIndex: 1, display: 'flex', cursor: 'pointer', padding: 3,
                borderRadius: 5, background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              }}>
                <input
                  type="checkbox" checked={selected} onChange={() => onToggle(item.id)} aria-label={`Chọn ${title}`}
                  style={{ width: 14, height: 14, margin: 0, accentColor: T.accent, cursor: 'pointer' }}
                />
              </label>
            )}
            {item.posterUrl
              ? <img src={item.posterUrl} alt="" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', aspectRatio: '2/3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {isMovie ? '🎬' : '📺'}
                </div>}
          </div>

          {/* Thông tin */}
          <div style={{ flex: 1, padding: '10px 12px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
              <p style={{
                margin: 0, fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: T.text, lineHeight: 1.35,
                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>
                {title}
              </p>
              {imported && (
                <span style={{
                  flexShrink: 0, fontFamily: FONT, fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                  background: T.accentLight, border: `1px solid ${T.accent}40`, color: T.accentText,
                }}>
                  ✓ Đã có
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {rating > 0 && (
                <span style={{ ...metaText, display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700, color: TONE.warn }}>
                  <Star size={9} style={{ fill: TONE.warn, color: TONE.warn }} /> {rating.toFixed(1)}
                </span>
              )}
              {year && <span style={metaText}>{year}</span>}
              {country && <span style={metaText}>{/^[A-Za-z]{2}$/.test(country) ? flagOf(country.toUpperCase()) : '🌐'} {country}</span>}
              {!isMovie && item.numberOfSeasons > 0 && (
                <span style={metaText}>{item.numberOfSeasons} mùa • {item.numberOfEpisodes ?? '?'} tập</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <button type="button" onClick={copyId} style={{ ...smallBtn, color: copied ? T.accentText : T.textMuted }}>
                {copied ? <Check size={9} color={T.accent} /> : <Copy size={9} />} #{item.id}
              </button>
              <button type="button" onClick={() => setShowPreview(true)} style={smallBtn}>
                <Eye size={9} /> Xem trước
              </button>
              <button
                type="button" disabled={imported || active} onClick={onImport}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 6,
                  cursor: imported ? 'default' : active ? 'wait' : 'pointer',
                  background: imported ? T.surfaceAlt : T.accent,
                  border: `1px solid ${imported ? T.border : T.accent}`,
                  fontFamily: FONT, fontSize: 11, fontWeight: 600, color: imported ? T.textMuted : '#fff',
                  opacity: active ? 0.75 : 1, transition: 'all 0.15s',
                }}
              >
                {active
                  ? <><Spin color="#fff" size={14} /> {job.status === 'queued' ? 'Đang chờ…' : isMovie ? 'Đang import…' : 'Đang fetch seasons…'}</>
                  : imported
                    ? <><Check size={10} /> Đã có</>
                    : <><Download size={10} /> {job?.status === 'failed' ? 'Thử lại' : 'Import'}</>}
              </button>
            </div>

            {active && <JobProgress job={job} />}
          </div>
        </div>

        {showResult && <ResultBadges result={job.result} kind={job.kind} />}
        {job?.status === 'exists' && (
          <Notice tone="warn" style={{ borderTop: `1px solid ${T.border}` }}>
            {isMovie ? 'Phim đã được import rồi' : 'TV show đã được import rồi'}
          </Notice>
        )}
        {job?.status === 'failed' && (
          <Notice tone="error" style={{ borderTop: `1px solid ${T.border}` }}>{job.error ?? 'Import thất bại'}</Notice>
        )}
      </div>
    </>
  );
}
