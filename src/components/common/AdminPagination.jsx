// src/components/common/AdminPagination.jsx
// Phân trang dùng riêng cho admin — token từ adminTokens, KHÔNG dùng homeTokens
//
// Usage giống Pagination:
//   <AdminPagination {...pagination.props} itemLabel="người" />

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { T, FONT_BODY as FONT, FONT_TITLE } from '../../context/adminTokens';

const BTN_SIZE = 34;

// ── Page button ───────────────────────────────────────────────────────────────
const PageButton = React.memo(({ children, active, disabled, onClick, wide }) => {
  const [hov, setHov] = useState(false);

  const bg = active
    ? T.accentLight
    : hov && !disabled
      ? T.surfaceHov
      : T.surface;

  const border = active
    ? `1.5px solid ${T.accent}35`
    : `1px solid ${T.border}`;

  const color = active
    ? T.accentText
    : disabled
      ? T.textMuted
      : hov
        ? T.text
        : T.textSub;

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.9 } : undefined}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width:    wide ? 'auto' : BTN_SIZE,
        minWidth: BTN_SIZE,
        height:   BTN_SIZE,
        padding:  wide ? '0 10px' : 0,
        borderRadius: 9,
        border,
        background: bg,
        color,
        cursor:    disabled ? 'default' : 'pointer',
        display:   'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
        fontFamily: FONT,
        fontSize:  13,
        fontWeight: active ? 700 : 500,
        boxShadow: active ? `0 0 0 3px ${T.accent}10` : T.shadow,
        transition: 'background 0.13s, border-color 0.13s, color 0.13s, box-shadow 0.13s',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {children}
    </motion.button>
  );
});

// ── Dots ──────────────────────────────────────────────────────────────────────
const Dots = () => (
  <span style={{
    width: BTN_SIZE, height: BTN_SIZE,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: T.textMuted, fontFamily: FONT, fontSize: 13,
    letterSpacing: 1, flexShrink: 0, userSelect: 'none',
  }}>
    ···
  </span>
);

// ── Jump-to-page ──────────────────────────────────────────────────────────────
const JumpInput = ({ totalPages, onJump }) => {
  const [val,  setVal]  = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const commit = () => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) onJump(n);
    setVal(''); setOpen(false);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => { setOpen(v => !v); setTimeout(() => ref.current?.focus(), 50); }}
        style={{
          height: BTN_SIZE, padding: '0 12px',
          borderRadius: 9,
          border: `1px solid ${open ? T.accent + '50' : T.border}`,
          background: open ? T.accentLight : T.surface,
          color: open ? T.accentText : T.textMuted,
          cursor: 'pointer',
          fontFamily: FONT, fontSize: 11.5, fontWeight: 600,
          letterSpacing: '0.04em',
          boxShadow: T.shadow,
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
      >
        Đến trang
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="jump"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
              transform: 'translateX(-50%)',
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 7,
              zIndex: 99,
              boxShadow: T.shadowMd,
              whiteSpace: 'nowrap',
            }}
          >
            <input
              ref={ref}
              type="number"
              min={1} max={totalPages}
              value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setOpen(false); }}
              placeholder="1"
              style={{
                width: 52, height: 30, padding: '0 8px',
                borderRadius: 7,
                border: `1px solid ${T.border}`,
                background: T.bg,
                color: T.text, fontFamily: FONT, fontSize: 13,
                outline: 'none', textAlign: 'center',
                transition: 'border-color 0.15s',
              }}
              onFocus={e  => e.target.style.borderColor = T.accent + '80'}
              onBlur={e   => e.target.style.borderColor = T.border}
            />
            <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>
              / {totalPages}
            </span>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={commit}
              style={{
                height: 30, padding: '0 12px', borderRadius: 7,
                background: T.accent, border: 'none', cursor: 'pointer',
                color: 'white', fontFamily: FONT, fontSize: 12, fontWeight: 700,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              OK
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── AdminPagination ───────────────────────────────────────────────────────────
export default function AdminPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  pageNumbers: externalPageNumbers,
  showJump,
  showInfo = true,
  itemLabel = 'mục',
}) {
  if (!totalPages || totalPages <= 1) return null;

  const pageNumbers = externalPageNumbers ?? (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const left  = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    const pages = [1];
    if (left > 2)              pages.push('DOTS_LEFT');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('DOTS_RIGHT');
    pages.push(totalPages);
    return pages;
  })();

  const autoShowJump = showJump ?? totalPages > 10;
  const from = total && pageSize ? Math.min((page - 1) * pageSize + 1, total) : null;
  const to   = total && pageSize ? Math.min(page * pageSize, total) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 10,
        padding: '28px 0 8px',
      }}
    >
      {/* Info */}
      {showInfo && from !== null && (
        <p style={{
          fontFamily: FONT, fontSize: 12,
          color: T.textMuted, letterSpacing: '0.02em',
        }}>
          Hiển thị{' '}
          <span style={{ color: T.textSub, fontWeight: 600 }}>{from}–{to}</span>
          {' '}trong{' '}
          <span style={{ color: T.textSub, fontWeight: 600 }}>{total?.toLocaleString('vi-VN')}</span>
          {' '}{itemLabel}
        </p>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

        {totalPages > 7 && (
          <PageButton disabled={page <= 1} onClick={() => onPageChange(1)}>
            <ChevronsLeft size={13} strokeWidth={2} />
          </PageButton>
        )}

        <PageButton disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft size={14} strokeWidth={2} />
        </PageButton>

        <div style={{ width: 4 }} />

        {pageNumbers.map((p, i) => {
          if (p === 'DOTS_LEFT')  return <Dots key="dl" />;
          if (p === 'DOTS_RIGHT') return <Dots key="dr" />;
          return (
            <PageButton key={p} active={p === page} onClick={() => onPageChange(p)}>
              {p}
            </PageButton>
          );
        })}

        <div style={{ width: 4 }} />

        <PageButton disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight size={14} strokeWidth={2} />
        </PageButton>

        {totalPages > 7 && (
          <PageButton disabled={page >= totalPages} onClick={() => onPageChange(totalPages)}>
            <ChevronsRight size={13} strokeWidth={2} />
          </PageButton>
        )}

        {autoShowJump && (
          <>
            <div style={{ width: 8 }} />
            <JumpInput totalPages={totalPages} onJump={onPageChange} />
          </>
        )}
      </div>
    </motion.div>
  );
}