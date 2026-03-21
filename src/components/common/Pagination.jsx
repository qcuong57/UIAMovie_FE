// src/components/common/Pagination.jsx
// ─── Component phân trang dùng chung — dark cinema aesthetic ─────────────────
//
// Nhận props từ usePagination().props hoặc truyền trực tiếp:
//
//   <Pagination
//     page={3}
//     totalPages={12}
//     total={280}
//     pageSize={24}
//     onPageChange={(p) => handlePageChange(p)}
//   />
//
//   hoặc spread thẳng:
//   <Pagination {...pagination.props} />

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { C, FONT_BODY, FONT_DISPLAY } from '../../context/homeTokens';

const ACCENT    = '#e5181e';
const BTN_SIZE  = 36;

// ── Một nút trang ─────────────────────────────────────────────────────────────
const PageButton = React.memo(({ children, active, disabled, onClick, isIcon, wide }) => {
  const [hov, setHov] = useState(false);

  const bg = active
    ? `rgba(229,24,30,0.14)`
    : hov && !disabled
      ? 'rgba(255,255,255,0.07)'
      : 'transparent';

  const border = active
    ? `1px solid rgba(229,24,30,0.5)`
    : `1px solid ${hov && !disabled ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)'}`;

  const color = active
    ? ACCENT
    : disabled
      ? 'rgba(255,255,255,0.18)'
      : hov
        ? 'rgba(255,255,255,0.85)'
        : 'rgba(255,255,255,0.45)';

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.88 } : undefined}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width:  wide ? 'auto' : BTN_SIZE,
        minWidth: BTN_SIZE,
        height: BTN_SIZE,
        padding: wide ? '0 10px' : 0,
        borderRadius: 8,
        border,
        background: bg,
        color,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
        fontFamily: FONT_BODY,
        fontSize: active ? 13 : 13,
        fontWeight: active ? 700 : 500,
        transition: 'background 0.14s, border-color 0.14s, color 0.14s',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {children}
    </motion.button>
  );
});

// ── Dấu ... ───────────────────────────────────────────────────────────────────
const Dots = ({ onJump }) => {
  const [hov, setHov] = useState(false);
  return (
    <motion.span
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onJump}
      style={{
        width: BTN_SIZE, height: BTN_SIZE,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hov ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
        fontFamily: FONT_BODY, fontSize: 14,
        cursor: onJump ? 'pointer' : 'default',
        letterSpacing: 1,
        transition: 'color 0.15s',
        flexShrink: 0,
      }}
    >
      ···
    </motion.span>
  );
};

// ── Jump-to-page input ────────────────────────────────────────────────────────
const JumpInput = ({ totalPages, onJump }) => {
  const [val, setVal]   = useState('');
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
        whileTap={{ scale: 0.9 }}
        onClick={() => { setOpen(v => !v); setTimeout(() => ref.current?.focus(), 50); }}
        style={{
          height: BTN_SIZE, padding: '0 10px',
          borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
          background: open ? 'rgba(255,255,255,0.07)' : 'transparent',
          color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
          fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600,
          letterSpacing: '0.06em', transition: 'all 0.15s',
          flexShrink: 0,
        }}
      >
        Đến trang
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="jump"
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(14,14,14,0.97)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 6,
              zIndex: 99, backdropFilter: 'blur(20px)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
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
                borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                color: 'white', fontFamily: FONT_BODY, fontSize: 13,
                outline: 'none', textAlign: 'center',
              }}
            />
            <span style={{
              fontFamily: FONT_BODY, fontSize: 11,
              color: 'rgba(255,255,255,0.25)',
            }}>
              / {totalPages}
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={commit}
              style={{
                height: 30, padding: '0 10px', borderRadius: 6,
                background: ACCENT, border: 'none', cursor: 'pointer',
                color: 'white', fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700,
              }}
            >
              OK
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
/**
 * Pagination component
 *
 * @prop {number}   page          — Trang hiện tại (1-indexed)
 * @prop {number}   totalPages    — Tổng số trang
 * @prop {number}   [total]       — Tổng số items (để hiện "1–24 / 280 phim")
 * @prop {number}   [pageSize]    — Số items mỗi trang
 * @prop {Function} onPageChange  — (page: number) => void
 * @prop {Array}    [pageNumbers] — Dãy số trang (từ usePagination, optional)
 * @prop {boolean}  [showJump]    — Hiện nút "Đến trang" (default: true nếu > 10 trang)
 * @prop {boolean}  [showInfo]    — Hiện dòng "Hiển thị X–Y / Z phim" (default: true)
 * @prop {string}   [itemLabel]   — Tên loại item (default: "phim")
 */
export default function Pagination({
  page,
  totalPages,
  total,
  pageSize = 24,
  onPageChange,
  pageNumbers: externalPageNumbers,
  showJump,
  showInfo = true,
  itemLabel = 'phim',
}) {
  if (!totalPages || totalPages <= 1) return null;

  // Tính pageNumbers nếu không được truyền
  const pageNumbers = externalPageNumbers ?? (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const left  = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    const pages = [1];
    if (left > 2) pages.push('DOTS_LEFT');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('DOTS_RIGHT');
    pages.push(totalPages);
    return pages;
  })();

  const autoShowJump = showJump ?? totalPages > 10;

  const from = total ? Math.min((page - 1) * pageSize + 1, total) : null;
  const to   = total ? Math.min(page * pageSize, total) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 14,
        padding: '40px 0 20px',
      }}
    >
      {/* Info row */}
      {showInfo && from !== null && (
        <p style={{
          fontFamily: FONT_BODY, fontSize: 11,
          color: 'rgba(255,255,255,0.28)',
          letterSpacing: '0.04em',
        }}>
          Đang hiển thị{' '}
          <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
            {from}–{to}
          </span>
          {' '}trong tổng số{' '}
          <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
            {total.toLocaleString()}
          </span>
          {' '}{itemLabel}
        </p>
      )}

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

        {/* First page */}
        {totalPages > 7 && (
          <PageButton
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            isIcon
          >
            <ChevronsLeft size={14} strokeWidth={2} />
          </PageButton>
        )}

        {/* Prev */}
        <PageButton disabled={page <= 1} onClick={() => onPageChange(page - 1)} isIcon>
          <ChevronLeft size={15} strokeWidth={2} />
        </PageButton>

        {/* Gap */}
        <div style={{ width: 6 }} />

        {/* Page numbers */}
        {pageNumbers.map((p, i) => {
          if (p === 'DOTS_LEFT')  return <Dots key="dl" />;
          if (p === 'DOTS_RIGHT') return <Dots key="dr" />;
          return (
            <PageButton
              key={p}
              active={p === page}
              onClick={() => onPageChange(p)}
            >
              {p}
            </PageButton>
          );
        })}

        {/* Gap */}
        <div style={{ width: 6 }} />

        {/* Next */}
        <PageButton disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} isIcon>
          <ChevronRight size={15} strokeWidth={2} />
        </PageButton>

        {/* Last page */}
        {totalPages > 7 && (
          <PageButton
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            isIcon
          >
            <ChevronsRight size={14} strokeWidth={2} />
          </PageButton>
        )}

        {/* Jump to page */}
        {autoShowJump && (
          <>
            <div style={{ width: 10 }} />
            <JumpInput totalPages={totalPages} onJump={onPageChange} />
          </>
        )}
      </div>
    </motion.div>
  );
}