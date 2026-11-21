// src/components/admin/movie/movieAdminParts.jsx
// Phần dùng chung giữa bảng desktop (AdminMovies) và danh sách thẻ mobile (MobileMovieList)
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { T, FONT_BODY as FONT } from '../../../context/adminTokens';

export const COUNTRY_FLAG = { KR:'🇰🇷', US:'🇺🇸', JP:'🇯🇵', CN:'🇨🇳', VN:'🇻🇳', FR:'🇫🇷', GB:'🇬🇧', IN:'🇮🇳', TH:'🇹🇭' };

// ── Spinner light ─────────────────────────────────────────────────────────────
export const SpinnerLight = () => (
  <>
    <div style={{ width: 26, height: 26, borderRadius: '50%', border: `2.5px solid ${T.accentLight}`, borderTopColor: T.accent, animation: 'spin 0.75s linear infinite', margin: '0 auto' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </>
);

// ── Premium badge ─────────────────────────────────────────────────────────────
export const PremiumBadge = () => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '2px 7px', borderRadius: 5,
    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    fontSize: 10, fontWeight: 700, color: '#fff',
    fontFamily: FONT, letterSpacing: '0.04em', whiteSpace: 'nowrap',
    boxShadow: '0 1px 4px rgba(245,158,11,0.35)',
  }}>
    <Crown size={9} style={{ flexShrink: 0 }} /> PRO
  </span>
);

// ── Badge "Sắp chiếu" (phim có ReleaseDate > hôm nay) ────────────────────────
export const UpcomingBadge = () => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '2px 7px', borderRadius: 5,
    background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.35)',
    fontSize: 10, fontWeight: 700, color: '#3B82F6',
    fontFamily: FONT, letterSpacing: '0.04em', whiteSpace: 'nowrap',
  }}>
    SẮP CHIẾU
  </span>
);

export const fmtReleaseDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : null);

// ── Premium toggle switch ─────────────────────────────────────────────────────
export function PremiumToggle({ isPremium, loading, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={isPremium ? 'Đang là Premium — bấm để chuyển về Free' : 'Đang là Free — bấm để đặt Premium'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 20,
        border: isPremium ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(0,0,0,0.1)',
        background: isPremium
          ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
          : 'rgba(0,0,0,0.04)',
        cursor: loading ? 'wait' : 'pointer',
        fontFamily: FONT, fontSize: 11.5, fontWeight: 700,
        color: isPremium ? '#92400E' : '#71717A',
        transition: 'all 0.18s',
        opacity: loading ? 0.6 : 1,
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(0.95)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
    >
      {loading
        ? <span style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
        : <Crown size={11} style={{ flexShrink: 0 }} />
      }
      {isPremium ? 'Premium' : 'Free'}
    </button>
  );
}

// ── Action button helper ──────────────────────────────────────────────────────
export function ActionBtn({ children, color, bg, border, title, onClick }) {
  return (
    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
      onClick={onClick} title={title} aria-label={title} data-icon-btn=""
      style={{ width: 30, height: 30, borderRadius: 7, background: bg, border: `1px solid ${border}`, cursor: 'pointer', color, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'filter 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.93)'}
      onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
    >
      {children}
    </motion.button>
  );
}