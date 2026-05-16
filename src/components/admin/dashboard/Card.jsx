// src/components/admin/dashboard/Card.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { T, ACCENT, FONT_BODY as FONT, FONT_TITLE } from '../../../context/adminTokens';
import { Empty, GhostBtn } from './DashboardPrimitives';

// ── Section Card / Panel ───────────────────────────────────────────────────────
export const Card = ({ title, subtitle, action, children, style, noPad, tabs, activeTab, onTabChange }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1, duration: 0.25 }}
    style={{
      background: T.surface, borderRadius: 16,
      border: `1px solid ${T.border}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      ...style,
    }}
  >
    {/* Header */}
    {(title || action) && (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: tabs ? 'none' : `1px solid ${T.border}`,
        gap: 10, flexShrink: 0,
      }}>
        <div>
          <span style={{
            fontFamily: FONT_TITLE, fontSize: 13.5, fontWeight: 700,
            color: T.text, letterSpacing: '-0.01em', display: 'block',
          }}>
            {title}
          </span>
          {subtitle && (
            <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>{subtitle}</span>
          )}
        </div>
        {action && !tabs && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
    )}

    {/* Tab bar */}
    {tabs && (
      <div style={{
        display: 'flex', gap: 0, padding: '0 20px',
        borderBottom: `1px solid ${T.border}`, flexShrink: 0,
        overflowX: 'auto',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              fontFamily: FONT, fontSize: 13,
              fontWeight: activeTab === tab.key ? 700 : 400,
              color: activeTab === tab.key ? ACCENT : T.textMuted,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '11px 18px',
              borderBottom: `2.5px solid ${activeTab === tab.key ? ACCENT : 'transparent'}`,
              marginBottom: -1, transition: 'all 0.14s',
              display: 'flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
            {tab.count != null && (
              <span style={{
                fontSize: 10, fontWeight: 700, fontFamily: FONT,
                background: activeTab === tab.key ? T.accentLight : T.bg,
                color: activeTab === tab.key ? ACCENT : T.textMuted,
                padding: '1px 6px', borderRadius: 99,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    )}

    {/* Body */}
    <div style={noPad ? { flex: 1 } : { padding: '16px 20px', flex: 1 }}>
      {children}
    </div>
  </motion.div>
);

// ── Paginated List ─────────────────────────────────────────────────────────────
export const Paginated = ({ items, pageSize = 6, renderItem }) => {
  const [page, setPage] = useState(0);
  if (!items?.length) return <Empty />;
  const totalPages = Math.ceil(items.length / pageSize);
  const slice = items.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div>
      {slice.map(renderItem)}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, paddingTop: 12,
        }}>
          <GhostBtn onClick={() => setPage(p => Math.max(0, p - 1))}>‹</GhostBtn>
          <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, minWidth: 60, textAlign: 'center' }}>
            {page + 1} / {totalPages}
          </span>
          <GhostBtn onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>›</GhostBtn>
        </div>
      )}
    </div>
  );
};