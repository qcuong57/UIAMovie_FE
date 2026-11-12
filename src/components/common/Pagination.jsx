// src/components/common/Pagination.jsx
// ─── Component phân trang dùng chung — dark cinema aesthetic ─────────────────
//
//   <Pagination
//     page={3}
//     totalPages={12}
//     total={280}
//     pageSize={24}
//     onPageChange={(p) => handlePageChange(p)}
//   />
//
// Desktop: « ‹ 1 … 4 5 6 … 12 › »  (+ "Đến trang" khi > 10 trang)
// Mobile : ‹  3 / 12  ›            (bấm "3 / 12" để nhập số trang; vùng chạm 42px)

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { FONT_BODY } from '../../context/homeTokens';
import { useIsMobile } from '../../hooks/useIsMobile';

const ACCENT = '#e5181e';
const BTN_DESKTOP = 36;
const BTN_MOBILE = 42; // vùng chạm đủ lớn cho ngón tay

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/**
 * Luôn trả về cùng số ô (7 khi siblingCount = 1) để thanh phân trang không giật
 * khi chuyển trang: 1 2 3 4 5 … 12 → 1 … 4 5 6 … 12 → 1 … 8 9 10 11 12.
 */
const buildPages = (page, total, sibling = 1) => {
  const slots = sibling * 2 + 5;
  if (total <= slots) return range(1, total);

  const left = Math.max(page - sibling, 1);
  const right = Math.min(page + sibling, total);
  const dotsLeft = left > 2;
  const dotsRight = right < total - 1;
  const edgeCount = 3 + 2 * sibling;

  if (!dotsLeft && dotsRight) return [...range(1, edgeCount), 'DOTS_RIGHT', total];
  if (dotsLeft && !dotsRight) return [1, 'DOTS_LEFT', ...range(total - edgeCount + 1, total)];
  return [1, 'DOTS_LEFT', ...range(left, right), 'DOTS_RIGHT', total];
};

// ── Một nút trang ─────────────────────────────────────────────────────────────
const PageButton = React.memo(({ children, active, disabled, onClick, label, size }) => {
  const [hov, setHov] = useState(false);
  const hovering = hov && !disabled;

  return (
    <motion.button
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      whileTap={!disabled ? { scale: 0.9 } : undefined}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        minWidth: size,
        height: size,
        padding: '0 6px',
        borderRadius: 8,
        border: active
          ? '1px solid rgba(229,24,30,0.5)'
          : `1px solid ${hovering ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'}`,
        background: active ? 'rgba(229,24,30,0.14)' : hovering ? 'rgba(255,255,255,0.07)' : 'transparent',
        color: active ? ACCENT : disabled ? 'rgba(255,255,255,0.2)' : hovering ? '#fff' : 'rgba(255,255,255,0.65)',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: FONT_BODY,
        fontSize: 13.5,
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

// ── Dấu … (bấm để nhảy 5 trang) ───────────────────────────────────────────────
const Dots = ({ onJump, label, size }) => (
  <button
    type="button"
    onClick={onJump}
    aria-label={label}
    style={{
      minWidth: size, height: size, padding: 0,
      background: 'none', border: 'none',
      color: 'rgba(255,255,255,0.35)',
      fontFamily: FONT_BODY, fontSize: 14, letterSpacing: 1,
      cursor: 'pointer', flexShrink: 0,
    }}
  >
    ···
  </button>
);

// ── Nhập số trang (popover) ───────────────────────────────────────────────────
const JumpInput = ({ page, totalPages, onJump, label, size, openUp, minWidth }) => {
  const [val, setVal] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // Mở → focus ô nhập; bấm ra ngoài → đóng
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);

  const commit = () => {
    const n = parseInt(val, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= totalPages && n !== page) onJump(n);
    setVal('');
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          height: size, minWidth, padding: '0 12px',
          borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
          background: open ? 'rgba(255,255,255,0.08)' : 'transparent',
          color: 'rgba(255,255,255,0.75)', cursor: 'pointer',
          fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600,
          transition: 'background 0.15s', flexShrink: 0, whiteSpace: 'nowrap',
        }}
      >
        {label}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="jump"
            role="dialog"
            aria-label="Đến trang"
            initial={{ opacity: 0, y: openUp ? -6 : 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUp ? -6 : 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              ...(openUp ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' }),
              left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(14,14,14,0.97)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12, padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 8,
              zIndex: 99, backdropFilter: 'blur(20px)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
              whiteSpace: 'nowrap',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              aria-label={`Số trang, từ 1 đến ${totalPages}`}
              value={val}
              onChange={(e) => setVal(e.target.value.replace(/\D/g, '').slice(0, 5))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') setOpen(false);
              }}
              placeholder={String(page)}
              style={{
                width: 60, height: 38, padding: '0 8px',
                borderRadius: 8, border: '1px solid rgba(255,255,255,0.16)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff', fontFamily: FONT_BODY, fontSize: 16, // ≥16px: iOS không tự zoom
                outline: 'none', textAlign: 'center',
              }}
            />
            <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
              / {totalPages}
            </span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={commit}
              style={{
                height: 38, padding: '0 16px', borderRadius: 8,
                background: ACCENT, border: 'none', cursor: 'pointer',
                color: '#fff', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700,
              }}
            >
              Đi
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  pageNumbers: externalPageNumbers,
  showJump,
  showInfo = true,
  itemLabel = 'phim',
}) {
  const isMobile = useIsMobile(); // hook phải đứng trước mọi early return
  if (!totalPages || totalPages <= 1) return null;

  const size = isMobile ? BTN_MOBILE : BTN_DESKTOP;
  const pageNumbers = externalPageNumbers ?? buildPages(page, totalPages, 1);
  const autoShowJump = showJump ?? totalPages > 10;
  const showEnds = totalPages > (isMobile ? 10 : 7); // « » chỉ khi nhiều trang

  const from = total ? Math.min((page - 1) * pageSize + 1, total) : null;
  const to = total ? Math.min(page * pageSize, total) : null;

  const go = (p) => onPageChange(Math.min(Math.max(p, 1), totalPages));

  const firstBtn = showEnds && (
    <PageButton size={size} label="Trang đầu" disabled={page <= 1} onClick={() => go(1)}>
      <ChevronsLeft size={15} strokeWidth={2} />
    </PageButton>
  );
  const prevBtn = (
    <PageButton size={size} label="Trang trước" disabled={page <= 1} onClick={() => go(page - 1)}>
      <ChevronLeft size={16} strokeWidth={2} />
    </PageButton>
  );
  const nextBtn = (
    <PageButton size={size} label="Trang sau" disabled={page >= totalPages} onClick={() => go(page + 1)}>
      <ChevronRight size={16} strokeWidth={2} />
    </PageButton>
  );
  const lastBtn = showEnds && (
    <PageButton size={size} label="Trang cuối" disabled={page >= totalPages} onClick={() => go(totalPages)}>
      <ChevronsRight size={15} strokeWidth={2} />
    </PageButton>
  );

  return (
    <motion.nav
      aria-label="Phân trang"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 14,
        padding: isMobile ? '28px 0 16px' : '40px 0 20px',
      }}
    >
      {showInfo && from !== null && (
        <p style={{ margin: 0, fontFamily: FONT_BODY, fontSize: 12.5, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
          Đang hiển thị{' '}
          <strong style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{from}–{to}</strong>
          {' '}trong tổng số{' '}
          <strong style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{total.toLocaleString('vi-VN')}</strong>
          {' '}{itemLabel}
        </p>
      )}

      {isMobile ? (
        // ── Mobile: ‹  3 / 12  › — nút to, không bao giờ tràn ngang ──
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', maxWidth: '100%' }}>
          {firstBtn}
          {prevBtn}
          <JumpInput
            page={page}
            totalPages={totalPages}
            onJump={go}
            size={size}
            minWidth={84}
            openUp
            label={<>{page} <span style={{ opacity: 0.5, fontWeight: 500 }}>/ {totalPages}</span></>}
          />
          {nextBtn}
          {lastBtn}
        </div>
      ) : (
        // ── Desktop: « ‹ 1 … 4 5 6 … 12 › » ──
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          {firstBtn}
          {prevBtn}
          <div style={{ width: 6 }} />

          {pageNumbers.map((p) => {
            if (p === 'DOTS_LEFT')
              return <Dots key="dl" size={size} label="Lùi 5 trang" onJump={() => go(page - 5)} />;
            if (p === 'DOTS_RIGHT')
              return <Dots key="dr" size={size} label="Tới 5 trang" onJump={() => go(page + 5)} />;
            return (
              <PageButton key={p} size={size} label={`Trang ${p}`} active={p === page} onClick={() => go(p)}>
                {p}
              </PageButton>
            );
          })}

          <div style={{ width: 6 }} />
          {nextBtn}
          {lastBtn}

          {autoShowJump && (
            <>
              <div style={{ width: 10 }} />
              <JumpInput page={page} totalPages={totalPages} onJump={go} size={size} label="Đến trang" />
            </>
          )}
        </div>
      )}
    </motion.nav>
  );
}