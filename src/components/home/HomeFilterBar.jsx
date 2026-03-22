// src/pages/home/HomeFilterBar.jsx
// ─── Thanh lọc phim nằm ngay dưới Banner ──────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, ChevronDown, Star, X, Search } from 'lucide-react';
import { C, FONT_BODY } from '../../context/homeTokens';

// ── Dữ liệu lọc ───────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'rating',      label: 'Rating cao nhất' },
  { value: 'releasedate', label: 'Mới nhất' },
  { value: 'title',       label: 'Tên A → Z' },
];

const YEAR_OPTIONS = Array.from({ length: 15 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { value: String(y), label: String(y) };
});

// ── FilterDropdown ─────────────────────────────────────────────────────────────
const FilterDropdown = ({ label, value, onChange, options, icon: Icon }) => {
  const [open, setOpen]   = useState(false);
  const [pos,  setPos]    = useState({ top: 0, left: 0, width: 0 });
  const triggerRef        = useRef(null);
  const menuRef           = useRef(null);
  const selected          = options.find(o => o.value === value);
  const active            = Boolean(value);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX, width: Math.max(r.width, 190) });
    }
    setOpen(v => !v);
  };

  // Click outside
  useEffect(() => {
    const h = e => {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Close on scroll
  useEffect(() => {
    if (!open) return;
    const h = () => setOpen(false);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
          background: active ? C.accentSoft : C.surfaceHigh,
          border: `1px solid ${active ? C.accentGlow : C.borderMid}`,
          color: active ? C.accent : C.textSub,
          fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600,
          whiteSpace: 'nowrap', transition: 'all 0.15s',
        }}
      >
        {Icon && <Icon size={13} style={{ flexShrink: 0, opacity: 0.8 }} />}
        <span>{selected?.label || label}</span>
        <ChevronDown size={12} style={{
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.18s', flexShrink: 0, marginLeft: 2,
        }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            style={{
              position: 'fixed', top: pos.top, left: pos.left,
              minWidth: pos.width, maxHeight: 300, overflowY: 'auto',
              background: '#0c0c0c',
              border: `1px solid ${C.borderBright}`,
              borderRadius: 10, zIndex: 9999,
              boxShadow: '0 24px 64px rgba(0,0,0,0.95)',
            }}
          >
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              style={{
                width: '100%', padding: '10px 14px',
                background: !value ? C.accentSoft : 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                fontFamily: FONT_BODY, fontSize: 12,
                color: !value ? C.accent : C.textSub, fontWeight: !value ? 700 : 500,
              }}
            >
              {label} (tất cả)
            </button>
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  width: '100%', padding: '10px 14px',
                  background: value === opt.value ? C.accentSoft : 'none',
                  border: 'none', borderTop: `1px solid ${C.border}`,
                  cursor: 'pointer', textAlign: 'left',
                  fontFamily: FONT_BODY, fontSize: 12,
                  color: value === opt.value ? C.accent : C.text,
                  fontWeight: value === opt.value ? 700 : 400,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (value !== opt.value) e.currentTarget.style.background = C.surfaceHigh; }}
                onMouseLeave={e => { e.currentTarget.style.background = value === opt.value ? C.accentSoft : 'none'; }}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ── RatingSlider ───────────────────────────────────────────────────────────────
const RatingSlider = ({ value, onChange }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '9px 14px', borderRadius: 9,
    background: value > 0 ? C.accentSoft : C.surfaceHigh,
    border: `1px solid ${value > 0 ? C.accentGlow : C.borderMid}`,
  }}>
    <Star size={12} style={{ color: C.gold, fill: C.gold, flexShrink: 0 }} />
    <input
      type="range" min="0" max="9" step="0.5" value={value}
      onChange={e => onChange(+e.target.value)}
      style={{ width: 72, accentColor: C.gold, cursor: 'pointer' }}
    />
    <span style={{
      fontFamily: FONT_BODY, fontSize: 12, minWidth: 32,
      color: value > 0 ? C.gold : C.textDim, fontWeight: 700,
    }}>
      {value > 0 ? `≥ ${value}` : 'All'}
    </span>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// HomeFilterBar
// ══════════════════════════════════════════════════════════════════════════════
/**
 * @prop {Array}    genres
 * @prop {string}   searchQuery
 * @prop {function} onSearchChange
 * @prop {string}   selectedGenre
 * @prop {function} onGenreChange
 * @prop {string}   selectedYear
 * @prop {function} onYearChange
 * @prop {string}   sortBy
 * @prop {function} onSortChange
 * @prop {number}   minRating
 * @prop {function} onRatingChange
 */
export default function HomeFilterBar({
  genres = [],
  searchQuery, onSearchChange,
  selectedGenre, onGenreChange,
  selectedYear,  onYearChange,
  sortBy,        onSortChange,
  minRating,     onRatingChange,
}) {
  const genreOptions = genres.map(g => ({ value: g.id, label: g.name }));
  const isMobile = useIsMobile();

  const activeFilters = [
    selectedGenre && { key: 'genre', label: genres.find(g => g.id === selectedGenre)?.name, onRemove: () => onGenreChange(null) },
    selectedYear  && { key: 'year',  label: selectedYear, onRemove: () => onYearChange(null) },
    minRating > 0 && { key: 'rating', label: `≥ ${minRating} ★`, onRemove: () => onRatingChange(0) },
  ].filter(Boolean);

  const hasFilters = activeFilters.length > 0;

  return (
    <div style={{
      padding: isMobile ? '12px 0' : '16px 0',
      background: C.bg,
      borderBottom: `1px solid ${C.border}`,
      position: 'sticky', top: 0, zIndex: 40,
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ padding: isMobile ? '0 12px' : '0 16px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Row 1 — search + filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            flex: '1 1 220px', minWidth: 180, maxWidth: 320,
            padding: '9px 14px', borderRadius: 9,
            background: C.surfaceHigh, border: `1px solid ${C.borderMid}`,
          }}>
            <Search size={14} color={C.textDim} style={{ flexShrink: 0 }} />
            <input
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Tìm phim..."
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontFamily: FONT_BODY, fontSize: 13, color: C.text,
                '::placeholder': { color: C.textDim },
              }}
            />
            {searchQuery && (
              <button onClick={() => onSearchChange('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, padding: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: C.border, flexShrink: 0 }} />

          {/* Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SlidersHorizontal size={13} color={C.textDim} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Lọc
            </span>
          </div>

          {/* Dropdowns */}
          <FilterDropdown
            label="Thể loại"
            value={selectedGenre}
            onChange={onGenreChange}
            options={genreOptions}
          />
          <FilterDropdown
            label="Năm"
            value={selectedYear}
            onChange={onYearChange}
            options={YEAR_OPTIONS}
          />
          <FilterDropdown
            label="Sắp xếp"
            value={sortBy}
            onChange={v => onSortChange(v || 'rating')}
            options={SORT_OPTIONS}
          />

          <RatingSlider value={minRating} onChange={onRatingChange} />

          {/* Clear all */}
          <AnimatePresence>
            {hasFilters && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => { onGenreChange(null); onYearChange(null); onRatingChange(0); onSearchChange(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '9px 13px', borderRadius: 9,
                  border: `1px solid rgba(229,24,30,0.25)`,
                  background: 'none', cursor: 'pointer',
                  color: C.accent, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600,
                }}
              >
                <X size={12} /> Xóa lọc
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Row 2 — active filter chips */}
        <AnimatePresence>
          {hasFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 10 }}>
                {activeFilters.map(f => (
                  <div key={f.key} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px 3px 12px', borderRadius: 20,
                    background: C.accentSoft, border: `1px solid ${C.accentGlow}`,
                  }}>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.accent, fontWeight: 600 }}>
                      {f.label}
                    </span>
                    <button
                      onClick={f.onRemove}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.accent, padding: 0, display: 'flex' }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}