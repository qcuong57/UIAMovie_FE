// src/components/common/SeeAllButton.jsx
// ─── Nút "Xem tất cả" dùng chung cho mọi MovieRow / TopRankedRow ──────────────
//
// Truyền props để navigate đến BrowsePage với đúng filter:
//
//   // Tất cả phim, sắp xếp theo rating
//   <SeeAllButton label="Xem tất cả phim" sort="rating" />
//
//   // Lọc theo thể loại
//   <SeeAllButton label="Xem thêm" genreId="abc123" genreName="Hành Động" />
//
//   // Mới nhất
//   <SeeAllButton label="Xem tất cả" sort="releaseDate" />
//
//   // Variant nhỏ (dùng trong header của row)
//   <SeeAllButton label="Tất cả" sort="rating" variant="ghost" />

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FONT_BODY, FONT_DISPLAY } from '../../context/homeTokens';

const ACCENT = '#e5181e';

/**
 * @prop {string}  [label]     — Nhãn nút (default: "Xem tất cả")
 * @prop {string}  [genreId]   — ID thể loại (nếu xem theo genre)
 * @prop {string}  [genreName] — Tên thể loại (để hiển thị trong URL + title)
 * @prop {string}  [sort]      — Sắp xếp: "rating" | "releaseDate" | "title"
 * @prop {'default'|'ghost'|'pill'} [variant] — Kiểu nút (default: "ghost")
 * @prop {Function}[onClick]   — Override navigate nếu cần custom
 */
export default function SeeAllButton({
  label = 'Xem tất cả',
  genreId,
  genreName,
  sort,
  variant = 'ghost',
  onClick,
}) {
  const [hov, setHov] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) { onClick(); return; }

    // Build URL params
    const params = new URLSearchParams();
    if (genreId)   params.set('genre', genreId);
    if (genreName) params.set('name',  genreName);
    if (sort)      params.set('sort',  sort);

    const query = params.toString();
    navigate(`/browse${query ? `?${query}` : ''}`);
  };

  // ── variant: ghost — text link với arrow, dùng trong row header ─────────────
  if (variant === 'ghost') {
    return (
      <motion.button
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 0',
          color: hov ? ACCENT : 'rgba(255,255,255,0.35)',
          fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600,
          letterSpacing: '0.04em',
          transition: 'color 0.15s',
        }}
      >
        {label}
        <motion.span
          animate={{ x: hov ? 2 : 0 }}
          transition={{ duration: 0.15 }}
          style={{ display: 'flex' }}
        >
          <ChevronRight size={13} strokeWidth={2.5} />
        </motion.span>
      </motion.button>
    );
  }

  // ── variant: pill — nút nhỏ có border ───────────────────────────────────────
  if (variant === 'pill') {
    return (
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={handleClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 14px', borderRadius: 99,
          border: `1px solid ${hov ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
          background: hov ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
          color: hov ? 'white' : 'rgba(255,255,255,0.5)',
          cursor: 'pointer', fontFamily: FONT_BODY,
          fontSize: 12, fontWeight: 600,
          transition: 'all 0.15s',
        }}
      >
        {label}
        <ArrowRight size={12} strokeWidth={2.5} />
      </motion.button>
    );
  }

  // ── variant: default — nút đầy đủ có background ─────────────────────────────
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 20px', borderRadius: 10,
        border: `1px solid ${hov ? ACCENT : 'rgba(255,255,255,0.12)'}`,
        background: hov ? `rgba(229,24,30,0.1)` : 'rgba(255,255,255,0.04)',
        color: hov ? ACCENT : 'rgba(255,255,255,0.6)',
        cursor: 'pointer', fontFamily: FONT_BODY,
        fontSize: 13, fontWeight: 600,
        transition: 'all 0.18s',
      }}
    >
      {label}
      <ArrowRight size={14} strokeWidth={2} />
    </motion.button>
  );
}

// ── Helper: tạo URL /browse với params ───────────────────────────────────────
export function buildBrowseUrl({ genreId, genreName, sort } = {}) {
  const p = new URLSearchParams();
  if (genreId)   p.set('genre', genreId);
  if (genreName) p.set('name',  genreName);
  if (sort)      p.set('sort',  sort);
  const q = p.toString();
  return `/browse${q ? `?${q}` : ''}`;
}