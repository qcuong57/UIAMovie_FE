// src/components/search/SearchUI.jsx
import React from 'react';
import { C, FONT_TITLE, FONT_BODY } from '../../context/homeTokens';

export const GRID_STYLE = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: 16,
};

// ── Skeleton — refined shimmer ─────────────────────────────────
export const SkeletonCard = () => (
  <div>
    <style>{`
      @keyframes sk-shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .sk {
        background: #161616;
        background-image: linear-gradient(90deg,#161616 25%,#202020 50%,#161616 75%);
        background-size: 200% 100%;
        animation: sk-shimmer 1.6s infinite;
      }
    `}</style>
    <div className="sk" style={{ borderRadius: 3, aspectRatio: '2/3', width: '100%' }} />
    <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="sk" style={{ height: 11, borderRadius: 2, width: '80%' }} />
      <div className="sk" style={{ height: 9, borderRadius: 2, width: '40%' }} />
    </div>
  </div>
);

// ── Chip ────────────────────────────────────────────────────────
export const Chip = ({ label, onRemove }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 12px 4px 14px', borderRadius: 2,
    background: C.accentSoft, border: `1px solid ${C.accentGlow}`,
  }}>
    <span style={{
      fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600,
      color: C.accent, letterSpacing: '0.01em',
    }}>
      {label}
    </span>
    <button onClick={onRemove} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: C.accent, fontSize: 14, lineHeight: 1, padding: '0 0 1px',
      opacity: 0.7, transition: 'opacity 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
      onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
    >
      ×
    </button>
  </div>
);

// ── Empty state ─────────────────────────────────────────────────
export const EmptySearch = () => (
  <div style={{ textAlign: 'center', padding: '80px 0' }}>
    <div style={{
      width: 48, height: 48, borderRadius: '50%',
      border: `1px solid ${C.border}`,
      margin: '0 auto 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 20, opacity: 0.4 }}>▶</span>
    </div>
    <p style={{
      fontFamily: FONT_TITLE, fontSize: 20, fontWeight: 400,
      color: C.textSub, marginBottom: 10,
    }}>
      Tìm kiếm phim yêu thích
    </p>
    <p style={{
      fontFamily: FONT_BODY, fontSize: 13, color: C.textDim,
      fontWeight: 400, lineHeight: 1.6,
    }}>
      Nhập tên phim, diễn viên hoặc dùng bộ lọc để khám phá
    </p>
  </div>
);

// ── No results ──────────────────────────────────────────────────
export const NoResults = ({ query, isActor = false }) => (
  <div style={{ textAlign: 'center', padding: '80px 0' }}>
    <div style={{
      width: 48, height: 1, background: C.border,
      margin: '0 auto 28px',
    }} />
    <p style={{
      fontFamily: FONT_TITLE, fontSize: 18, fontWeight: 400,
      color: C.textSub, marginBottom: 10,
    }}>
      Không tìm thấy kết quả
    </p>
    <p style={{
      fontFamily: FONT_BODY, fontSize: 13, color: C.textDim, fontWeight: 400,
    }}>
      {query
        ? `Không có ${isActor ? 'diễn viên' : 'phim'} nào khớp với "${query}"`
        : 'Thử thay đổi bộ lọc'}
    </p>
  </div>
);