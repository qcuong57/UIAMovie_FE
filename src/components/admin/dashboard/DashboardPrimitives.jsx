// src/components/admin/dashboard/DashboardPrimitives.jsx
import React, { useState } from 'react';
import { T, ACCENT, FONT_BODY as FONT } from '../../../context/adminTokens';

// ── Loading Spinner ────────────────────────────────────────────────────────────
export const Spin = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
    <div style={{
      width: 24, height: 24, borderRadius: '50%',
      border: `2.5px solid ${T.accentLight}`, borderTopColor: ACCENT,
      animation: 'spin 0.7s linear infinite',
    }} />
  </div>
);

// ── Empty State ────────────────────────────────────────────────────────────────
export const Empty = ({ text = 'Chưa có dữ liệu' }) => (
  <div style={{ padding: '32px 0', textAlign: 'center' }}>
    <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>{text}</p>
  </div>
);

// ── Skeleton Loader ────────────────────────────────────────────────────────────
export const Skeleton = ({ h = 18, w = '100%', r = 8, style: sx }) => (
  <div style={{
    height: h, width: w, borderRadius: r,
    background: 'linear-gradient(90deg, #f0f0ed 25%, #e8e8e3 50%, #f0f0ed 75%)',
    backgroundSize: '400px 100%',
    animation: 'shimmer 1.4s ease-in-out infinite',
    ...sx,
  }} />
);

// ── Ghost Button (filter / pagination) ────────────────────────────────────────
export const GhostBtn = ({ onClick, children, active }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: FONT, fontSize: 12.5, fontWeight: active ? 600 : 500,
        color:      active ? '#fff' : hov ? T.text : T.textSub,
        background: active ? ACCENT : hov ? T.surfaceHov : T.surface,
        border: `1px solid ${active ? ACCENT : hov ? T.borderMed : T.border}`,
        borderRadius: 8, padding: '6px 14px',
        cursor: 'pointer', outline: 'none',
        transition: 'all 0.13s', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
};