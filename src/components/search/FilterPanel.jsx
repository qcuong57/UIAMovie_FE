// src/components/search/FilterPanel.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Star, X, Globe } from 'lucide-react';
import { C, FONT_BODY, SORT_OPTIONS, YEAR_OPTIONS } from './searchConstants';

// ── Danh sách quốc gia phổ biến ────────────────────────────────
export const COUNTRY_OPTIONS = [
  { value: 'US', label: '🇺🇸 Mỹ' },
  { value: 'KR', label: '🇰🇷 Hàn Quốc' },
  { value: 'JP', label: '🇯🇵 Nhật Bản' },
  { value: 'CN', label: '🇨🇳 Trung Quốc' },
  { value: 'VN', label: '🇻🇳 Việt Nam' },
  { value: 'FR', label: '🇫🇷 Pháp' },
  { value: 'GB', label: '🇬🇧 Anh' },
  { value: 'IN', label: '🇮🇳 Ấn Độ' },
  { value: 'TH', label: '🇹🇭 Thái Lan' },
  { value: 'IT', label: '🇮🇹 Ý' },
  { value: 'DE', label: '🇩🇪 Đức' },
  { value: 'ES', label: '🇪🇸 Tây Ban Nha' },
  { value: 'HK', label: '🇭🇰 Hồng Kông' },
  { value: 'TW', label: '🇹🇼 Đài Loan' },
];

// ── FilterSelect — dropdown không bị clip ──────────────────────
// FIX: dùng position:fixed + tính toán tọa độ thay vì position:absolute
// để thoát khỏi bất kỳ overflow:hidden nào của container cha
const FilterSelect = ({ label, value, onChange, options }) => {
  const [open, setOpen]   = useState(false);
  const [pos,  setPos]    = useState({ top: 0, left: 0, width: 0 });
  const triggerRef        = useRef(null);
  const menuRef           = useRef(null);
  const selected          = options.find(o => o.value === value);

  // Tính tọa độ khi mở
  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top:   rect.bottom + window.scrollY + 6,
        left:  rect.left   + window.scrollX,
        width: Math.max(rect.width, 180),
      });
    }
    setOpen(v => !v);
  };

  // Đóng khi click ngoài
  useEffect(() => {
    const h = e => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        menuRef.current    && !menuRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Đóng khi scroll
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
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
          background: value ? C.accentSoft : C.surfaceHigh,
          border: `1px solid ${value ? C.accentGlow : C.border}`,
          color: value ? C.accent : C.textSub,
          fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600,
          whiteSpace: 'nowrap', transition: 'all 0.15s',
        }}
      >
        {selected?.label || label}
        <ChevronDown
          size={13}
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.18s',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Portal-style: render vào body qua fixed positioning */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            style={{
              position: 'fixed',
              top:   pos.top,
              left:  pos.left,
              minWidth: pos.width,
              maxHeight: 280,
              overflowY: 'auto',
              background: '#0d0d0d',
              border: `1px solid ${C.borderBright}`,
              borderRadius: 10,
              zIndex: 99999,   // ← cao hơn mọi thứ
              boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
            }}
          >
            {/* Option "tất cả" */}
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              style={{
                width: '100%', padding: '9px 14px',
                background: !value ? 'rgba(229,24,30,0.08)' : 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                fontFamily: FONT_BODY, fontSize: 12,
                color: !value ? C.accent : C.textSub,
                fontWeight: !value ? 700 : 400,
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.surfaceMid}
              onMouseLeave={e => e.currentTarget.style.background = !value ? 'rgba(229,24,30,0.08)' : 'none'}
            >
              {label} (tất cả)
            </button>

            {options.map((opt, i) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  width: '100%', padding: '9px 14px',
                  background: value === opt.value ? 'rgba(229,24,30,0.08)' : 'none',
                  border: 'none',
                  borderTop: `1px solid ${C.border}`,
                  cursor: 'pointer', textAlign: 'left',
                  fontFamily: FONT_BODY, fontSize: 12,
                  color: value === opt.value ? C.accent : C.text,
                  fontWeight: value === opt.value ? 700 : 400,
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.surfaceMid}
                onMouseLeave={e => e.currentTarget.style.background = value === opt.value ? 'rgba(229,24,30,0.08)' : 'none'}
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

// ── RatingFilter ────────────────────────────────────────────────
const RatingFilter = ({ min, onChange }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 14px', borderRadius: 8,
    background: min > 0 ? C.accentSoft : C.surfaceHigh,
    border: `1px solid ${min > 0 ? C.accentGlow : C.border}`,
  }}>
    <Star size={13} style={{ color: C.gold, fill: C.gold, flexShrink: 0 }} />
    <input
      type="range" min="0" max="10" step="0.5" value={min}
      onChange={e => onChange(+e.target.value)}
      style={{ width: 80, accentColor: C.gold, cursor: 'pointer' }}
    />
    <span style={{
      fontFamily: FONT_BODY, fontSize: 12,
      color: min > 0 ? C.gold : C.textSub,
      fontWeight: 700, minWidth: 30,
    }}>
      {min > 0 ? `${min}+` : 'All'}
    </span>
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
    <button
      onClick={onRemove}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.accent, display: 'flex', padding: 0 }}
    >
      <X size={12} />
    </button>
  </div>
);

// ══════════════════════════════════════════════════════════════════
// FilterPanel — container chính
// FIX: bỏ overflow:hidden khỏi animation wrapper,
// dùng clip-path thay thế để animate mà không clip dropdown
// ══════════════════════════════════════════════════════════════════
export default function FilterPanel({
  show, genres,
  selGenre,   onGenreChange,
  selYear,    onYearChange,
  sortBy,     onSortChange,
  minRating,  onRatingChange,
  selCountry, onCountryChange,
  filterCount, onClearAll,
}) {
  // genres đã được SearchPage normalize thành [{id: name, name: name}]
  const genreOptions = genres.map(g => ({ value: g.id ?? g.name, label: g.name }));

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0  }}
          exit={{    opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          // ↑ KHÔNG dùng height animation + overflow:hidden
          //   vì sẽ clip dropdown con
          style={{ marginBottom: 24 }}
        >
          <div style={{
            padding: '18px 20px',
            background: C.surfaceMid,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
          }}>
            <span style={{
              fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700,
              color: C.textDim, textTransform: 'uppercase',
              letterSpacing: '0.08em', flexShrink: 0,
            }}>
              Lọc theo:
            </span>

            <FilterSelect
              label="Thể loại"
              value={selGenre}
              onChange={onGenreChange}
              options={genreOptions}
            />

            <FilterSelect
              label="Năm"
              value={selYear}
              onChange={onYearChange}
              options={YEAR_OPTIONS}
            />

            <FilterSelect
              label="🌏 Quốc gia"
              value={selCountry}
              onChange={onCountryChange}
              options={COUNTRY_OPTIONS}
            />

            <FilterSelect
              label="Sắp xếp"
              value={sortBy}
              onChange={v => onSortChange(v || 'rating')}
              options={SORT_OPTIONS}
            />

            <RatingFilter min={minRating} onChange={onRatingChange} />

            {filterCount > 0 && (
              <button
                onClick={onClearAll}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '8px 12px', borderRadius: 8,
                  border: `1px solid rgba(229,24,30,0.3)`,
                  background: 'none', cursor: 'pointer', color: C.accent,
                  fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600,
                }}
              >
                <X size={12} /> Xóa lọc
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}