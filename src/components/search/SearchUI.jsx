// src/components/search/SearchUI.jsx
import React from 'react';
import { X } from 'lucide-react';
import { C, FONT_TITLE, FONT_BODY } from './searchConstants';

// ── Grid style dùng chung ───────────────────────────────────────
export const GRID_STYLE = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: 35,
};

// ── Skeleton card ───────────────────────────────────────────────
export const SkeletonCard = () => (
  <div style={{
    borderRadius: 10, overflow: 'hidden',
    background: C.card, border: `1px solid ${C.border}`,
  }}>
    <div style={{
      width: '100%', aspectRatio: '2/3', background: C.surfaceMid,
      backgroundImage: 'linear-gradient(90deg,#181818 25%,#222 50%,#181818 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
    }} />
    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{
        height: 13, borderRadius: 4, width: '80%', background: C.surfaceMid,
        backgroundImage: 'linear-gradient(90deg,#181818 25%,#222 50%,#181818 75%)',
        backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
      }} />
      <div style={{
        height: 10, borderRadius: 4, width: '50%', background: C.surfaceMid,
        backgroundImage: 'linear-gradient(90deg,#181818 25%,#222 50%,#181818 75%)',
        backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
      }} />
    </div>
  </div>
);

// ── Chip ────────────────────────────────────────────────────────
export const Chip = ({ label, onRemove }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '4px 10px 4px 12px', borderRadius: 20,
    background: C.accentSoft, border: `1px solid ${C.accentGlow}`,
  }}>
    <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.accent, fontWeight: 600 }}>
      {label}
    </span>
    <button onClick={onRemove} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: C.accent, display: 'flex', padding: 0,
    }}>
      <X size={12} />
    </button>
  </div>
);

// ── Empty search state ──────────────────────────────────────────
export const EmptySearch = () => (
  <div style={{ textAlign: 'center', padding: '64px 0' }}>
    <div style={{ fontSize: 56, marginBottom: 16 }}>🎬</div>
    <p style={{
      fontFamily: FONT_TITLE, fontSize: 18, fontWeight: 700,
      color: C.textSub, marginBottom: 8,
    }}>
      Tìm kiếm phim yêu thích
    </p>
    <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textDim }}>
      Nhập tên phim, diễn viên hoặc dùng bộ lọc để khám phá
    </p>
  </div>
);

// ── No results ──────────────────────────────────────────────────
export const NoResults = ({ query, isActor = false }) => (
  <div style={{ textAlign: 'center', padding: '64px 0' }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>{isActor ? '🎭' : '🔍'}</div>
    <p style={{
      fontFamily: FONT_TITLE, fontSize: 16, fontWeight: 700,
      color: C.textSub, marginBottom: 8,
    }}>
      Không tìm thấy kết quả
    </p>
    <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim }}>
      {query
        ? `Không có ${isActor ? 'diễn viên' : 'phim'} nào khớp với "${query}"`
        : 'Thử thay đổi bộ lọc'}
    </p>
  </div>
);