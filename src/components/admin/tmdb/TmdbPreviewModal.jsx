// src/components/admin/TmdbPreviewModal.jsx
// Xem trước dữ liệu TMDB trước khi import (cache theo id: mở lại cùng phim / show là có ngay).

import React, { useEffect } from 'react';
import { Eye, X } from 'lucide-react';
import { useTmdbPreview } from '../../../hooks/admin/useAdminTmdb';
import { T, FONT_BODY as FONT } from '../../../context/adminTokens';
import { Spin, Notice, TONE } from './TmdbImportUi';

const count = (list) => list?.length ?? 0;

function buildChecklist(data, isMovie) {
  const rows = [
    { label: 'Diễn viên (cast)', ok: count(data.cast) > 0, detail: `${count(data.cast)} người` },
    { label: 'Hình ảnh', ok: count(data.images) > 0, detail: `${count(data.images)} ảnh` },
    { label: 'Trailer', ok: !!data.trailerKey, detail: data.trailerKey ? `key: ${data.trailerKey}` : 'Không có' },
    { label: 'Đạo diễn', ok: !!data.director, detail: data.director ?? 'Không có' },
  ];
  if (!isMovie) {
    rows.push(
      { label: 'Seasons', ok: count(data.seasons) > 0, detail: `${count(data.seasons)} season` },
      { label: 'Tổng tập phim', ok: (data.numberOfEpisodes ?? 0) > 0, detail: `${data.numberOfEpisodes ?? 0} tập` },
    );
  }
  return rows;
}

export default function TmdbPreviewModal({ tmdbId, isMovie, onClose }) {
  const { data, isPending, isError, error } = useTmdbPreview(isMovie ? 'movie' : 'tv', tmdbId);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const errorMessage = isError ? (error?.response?.data?.message ?? 'Không thể tải preview') : null;

  return (
    <div
      data-admin-overlay=""
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        data-admin-modal=""
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '80vh', borderRadius: 14, overflow: 'hidden',
          background: T.surface, border: `1px solid ${T.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{
          padding: '14px 16px', borderBottom: `1px solid ${T.border}`, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={15} color={T.accent} />
            <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.text }}>Preview TMDB #{tmdbId}</span>
            <span style={{
              fontFamily: FONT, fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 600,
              background: T.accentLight, color: T.accentText,
            }}>
              {isMovie ? 'Phim' : 'TV Show'}
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {isPending && <div style={{ padding: '32px 0', display: 'flex', justifyContent: 'center' }}><Spin /></div>}

          {errorMessage && <Notice tone="error" style={{ borderRadius: 8 }}>❌ {errorMessage}</Notice>}

          {data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                {data.posterUrl && (
                  <img src={data.posterUrl} alt="" style={{ width: 64, borderRadius: 6, flexShrink: 0, border: `1px solid ${T.border}` }} />
                )}
                <div>
                  <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: T.text, margin: '0 0 4px' }}>
                    {data.title ?? data.name}
                  </p>
                  <p style={{
                    fontFamily: FONT, fontSize: 11, color: T.textMuted, lineHeight: 1.5, margin: 0,
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {data.overview}
                  </p>
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}` }}>
                <p style={{
                  fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: T.textMuted,
                  textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px',
                }}>
                  Dữ liệu sẽ được import
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {buildChecklist(data, isMovie).map(({ label, ok, detail }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11 }}>{ok ? '✅' : '⚠️'}</span>
                      <span style={{ fontFamily: FONT, fontSize: 11.5, color: ok ? T.text : T.textMuted, fontWeight: ok ? 600 : 400 }}>
                        {label}
                      </span>
                      <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, marginLeft: 'auto' }}>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!isMovie && count(data.cast) === 0 && (
                <Notice tone="warn" style={{ borderRadius: 8, background: '#FEF9C3', border: '1px solid #FDE68A', color: TONE.warn }}>
                  ⚠️ <strong>Cast = 0</strong> — bản xem trước TV show chưa có danh sách diễn viên;
                  cast sẽ được fetch riêng khi import.
                </Notice>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}