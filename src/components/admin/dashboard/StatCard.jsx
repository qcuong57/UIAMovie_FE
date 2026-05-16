// src/components/admin/dashboard/StatCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { T, ACCENT, FONT_BODY as FONT, FONT_TITLE } from '../../../context/adminTokens';
import { Skeleton } from './DashboardPrimitives';

// ── KPI Stat Card ──────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, featured, accentColor, index, loading, trend }) => {
  const bg = accentColor
    ? `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`
    : featured
      ? `linear-gradient(135deg, ${ACCENT} 0%, #145232 100%)`
      : T.surface;

  const isColored = featured || accentColor;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
      style={{
        background: bg,
        borderRadius: 16, padding: '20px 22px',
        border: `1px solid ${isColored ? 'transparent' : T.border}`,
        boxShadow: isColored
          ? '0 8px 32px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.08) inset'
          : '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        gap: 14, minHeight: 112, position: 'relative', overflow: 'hidden',
      }}
    >
      {isColored && (
        <div style={{
          position: 'absolute', right: -20, top: -20,
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
        }} />
      )}

      <p style={{
        fontFamily: FONT, fontSize: 11, fontWeight: 700,
        color: isColored ? 'rgba(255,255,255,0.6)' : T.textMuted,
        letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0,
      }}>
        {label}
      </p>

      <div>
        {loading ? (
          <Skeleton h={28} w="60%" r={6} style={{ marginBottom: 6 }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <p style={{
              fontFamily: FONT_TITLE, fontSize: 26, fontWeight: 800,
              color: isColored ? '#fff' : T.text,
              lineHeight: 1, letterSpacing: '-0.03em', margin: '0 0 5px 0',
            }}>
              {value ?? '—'}
            </p>
            {trend != null && (
              <span style={{
                fontFamily: FONT, fontSize: 11, fontWeight: 700,
                color: trend >= 0
                  ? (isColored ? '#a7f3d0' : ACCENT)
                  : (isColored ? '#fca5a5' : '#DC2626'),
                marginBottom: 5,
              }}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
          </div>
        )}
        {sub && !loading && (
          <p style={{
            fontFamily: FONT, fontSize: 11,
            color: isColored ? 'rgba(255,255,255,0.5)' : T.textMuted,
            margin: 0,
          }}>
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// ── Section Header / Divider ───────────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, icon }) => (
  <motion.div
    initial={{ opacity: 0, x: -6 }}
    animate={{ opacity: 1, x: 0 }}
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      margin: '28px 0 14px',
      paddingBottom: 12,
      borderBottom: `2px solid ${T.border}`,
    }}
  >
    {icon && (
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: T.accentLight,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16,
      }}>
        {icon}
      </div>
    )}
    <div>
      <h3 style={{
        fontFamily: FONT_TITLE, fontSize: 15, fontWeight: 800,
        color: T.text, letterSpacing: '-0.02em', margin: 0,
      }}>
        {title}
      </h3>
      {subtitle && (
        <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: 0 }}>{subtitle}</p>
      )}
    </div>
  </motion.div>
);