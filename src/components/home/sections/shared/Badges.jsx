// src/components/home/sections/shared/Badges.jsx
// Điểm đánh giá và nhãn PREMIUM dùng chung.
import React from 'react';
import { Star, Crown } from 'lucide-react';
import { FONT_BODY } from '../../../../context/homeTokens';

export function Rating({ value, size = 11 }) {
  if (!(Number(value) > 0)) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#f5c518', fontWeight: 700 }}>
      <Star size={size} fill="#f5c518" /> {Number(value).toFixed(1)}
    </span>
  );
}

export function PremiumTag({ style }) {
  return (
    <span
      style={{
        position: 'absolute', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px',
        borderRadius: 6, background: 'linear-gradient(135deg,#f5c518,#e08a00)', color: '#1a1200',
        fontFamily: FONT_BODY, fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', ...style,
      }}
    >
      <Crown size={10} /> PREMIUM
    </span>
  );
}
