// src/components/common/pagination/PaginationBase.jsx
// Lõi phân trang DÙNG CHUNG cho Pagination (người dùng, nền tối) và AdminPagination (nền sáng).
// Hai wrapper chỉ truyền `theme` (CSS variables) + kích thước; toàn bộ hành vi nằm ở đây.
//
// Khác bản cũ:
//   • Hover / active / focus bằng CSS (:hover, :active, :focus-visible) → không còn useState hover trên từng nút,
//     không cần framer-motion (nhẹ hơn, hover không gây re-render).
//   • Một stylesheet duy nhất, chèn một lần vào <head> (theme qua CSS variables, theme là hằng số cấp module).
//   • Dãy trang luôn cùng số ô (xem buildPages) → không giật; admin cũ có số ô thay đổi.
//   • A11y: <nav>, <button type="button" disabled>, aria-label, aria-current, popover role="dialog",
//     đóng bằng Esc / bấm ra ngoài, tôn trọng prefers-reduced-motion.
//   • `isFetching`: dùng với keepPreviousData → mờ nhẹ dòng thông tin trong lúc tải trang mới, không nháy layout.

import React, { useEffect, useInsertionEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { buildPages } from './buildPages';

const CSS = `
.pg{display:flex;flex-direction:column;align-items:center;gap:12px;padding:var(--pg-pad);animation:pg-in .25s ease both}
.pg-info{margin:0;font:400 12.5px var(--pg-font);color:var(--pg-info);text-align:center;transition:opacity .15s}
.pg-info strong{color:var(--pg-info-strong);font-weight:600}
.pg[aria-busy="true"] .pg-info{opacity:.55}
.pg-row{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px;max-width:100%}
.pg-compact .pg-row{gap:8px}
.pg-sep{width:6px;flex-shrink:0}
.pg-btn{min-width:var(--pg-size);height:var(--pg-size);padding:0 6px;border-radius:var(--pg-radius);border:1px solid var(--pg-border);background:var(--pg-bg);color:var(--pg-text);display:inline-flex;align-items:center;justify-content:center;gap:3px;font:500 13.5px var(--pg-font);cursor:pointer;user-select:none;flex-shrink:0;box-shadow:var(--pg-shadow);transition:background .13s,border-color .13s,color .13s,transform .08s}
.pg-btn:hover:not(:disabled){background:var(--pg-bg-hover);border-color:var(--pg-border-hover);color:var(--pg-text-hover)}
.pg-btn:active:not(:disabled){transform:scale(.92)}
.pg-btn:disabled{color:var(--pg-disabled);cursor:default}
.pg-btn:focus-visible{outline:2px solid var(--pg-accent);outline-offset:2px}
.pg-btn[aria-current="page"],.pg-btn[aria-current="page"]:hover:not(:disabled){background:var(--pg-accent-bg);border-color:var(--pg-accent-border);color:var(--pg-accent-text);font-weight:700;box-shadow:var(--pg-accent-shadow)}
.pg-btn.pg-dots{background:none;border-color:transparent;box-shadow:none;color:var(--pg-dots);letter-spacing:1px;font-size:14px}
.pg-btn.pg-dots:hover:not(:disabled){background:none;border-color:transparent;color:var(--pg-text-hover)}
.pg-btn.pg-jump-btn{padding:0 12px;font-weight:600;white-space:nowrap}
.pg-btn.pg-jump-btn[aria-expanded="true"]{background:var(--pg-bg-hover)}
.pg-jump{position:relative;display:flex;align-items:center}
.pg-pop{position:absolute;left:50%;z-index:99;display:flex;align-items:center;gap:8px;padding:10px 12px;white-space:nowrap;border-radius:12px;background:var(--pg-pop-bg);border:1px solid var(--pg-pop-border);box-shadow:var(--pg-pop-shadow);backdrop-filter:blur(20px);animation:pg-pop .15s ease both}
.pg-pop[data-up="true"]{bottom:calc(100% + 8px);--pg-dy:-6px}
.pg-pop[data-up="false"]{top:calc(100% + 8px);--pg-dy:6px}
.pg-input{width:60px;height:calc(var(--pg-size) - 2px);padding:0 8px;border-radius:8px;border:1px solid var(--pg-input-border);background:var(--pg-input-bg);color:var(--pg-input-text);font:400 14px var(--pg-font);text-align:center;outline:none;transition:border-color .15s}
.pg-compact .pg-input{font-size:16px}
.pg-input:focus{border-color:var(--pg-accent-border)}
.pg-of{font:400 13px var(--pg-font);color:var(--pg-info)}
.pg-go{height:calc(var(--pg-size) - 2px);padding:0 16px;border-radius:8px;border:none;background:var(--pg-accent);color:var(--pg-on-accent);font:700 13px var(--pg-font);cursor:pointer;transition:opacity .15s}
.pg-go:hover{opacity:.88}
@keyframes pg-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes pg-pop{from{opacity:0;transform:translateX(-50%) translateY(var(--pg-dy)) scale(.96)}to{opacity:1;transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){.pg,.pg-pop{animation:none}.pg-btn{transition:none}}
`;

// Chèn stylesheet đúng một lần (idempotent, cập nhật được khi HMR)
const ensureStyles = () => {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector('style[data-pagination]');
  if (!el) {
    el = document.createElement('style');
    el.setAttribute('data-pagination', '');
    document.head.appendChild(el);
  }
  if (el.textContent !== CSS) el.textContent = CSS;
};

// ── Nút dùng chung (số trang, « ‹ › », dấu …) ────────────────────────────────
const Btn = ({ label, active, disabled, onClick, className = '', children }) => (
  <button
    type="button"
    className={`pg-btn ${className}`}
    aria-label={label}
    aria-current={active ? 'page' : undefined}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </button>
);

// ── Nhập số trang (popover) ───────────────────────────────────────────────────
function Jump({ page, totalPages, onJump, label, openUp }) {
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
    <div ref={wrapRef} className="pg-jump">
      <button
        type="button"
        className="pg-btn pg-jump-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>

      {open && (
        <div className="pg-pop" role="dialog" aria-label="Đến trang" data-up={openUp ? 'true' : 'false'}>
          <input
            ref={inputRef}
            className="pg-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label={`Số trang, từ 1 đến ${totalPages}`}
            value={val}
            placeholder={String(page)}
            onChange={(e) => setVal(e.target.value.replace(/\D/g, '').slice(0, 5))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') setOpen(false);
            }}
          />
          <span className="pg-of">/ {totalPages}</span>
          <button type="button" className="pg-go" onClick={commit}>Đi</button>
        </div>
      )}
    </div>
  );
}

/**
 * Props:
 *   page, totalPages, total, pageSize, onPageChange   – như cũ
 *   pageNumbers  – (tuỳ chọn) dãy ô tự tính, thay cho buildPages (giữ tương thích với usePagination.props)
 *   showJump / showInfo / itemLabel – như cũ
 *   theme        – object CSS variables (--pg-*), NÊN là hằng số cấp module
 *   compact      – true: kiểu mobile "‹ 3 / 12 ›", nút to, không tràn ngang
 *   size, radius, padding – kích thước nút (px), bo góc (px), padding ngoài
 *   isFetching   – đang tải trang mới (dùng cùng placeholderData: keepPreviousData)
 *   siblingCount – số trang kề hai bên trang hiện tại (mặc định 1)
 */
export default function PaginationBase({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  pageNumbers: externalPageNumbers,
  showJump,
  showInfo = true,
  itemLabel = 'mục',
  theme,
  compact = false,
  size = 36,
  radius = 8,
  padding = '28px 0 8px',
  isFetching = false,
  siblingCount = 1,
}) {
  // Hook phải đứng trước mọi early return
  useInsertionEffect(ensureStyles, []);
  const pages = useMemo(
    () => externalPageNumbers ?? buildPages(page, totalPages, siblingCount),
    [externalPageNumbers, page, totalPages, siblingCount],
  );

  if (!totalPages || totalPages <= 1) return null;

  const current = Math.min(Math.max(page || 1, 1), totalPages);
  const go = (p) => {
    const n = Math.min(Math.max(p, 1), totalPages);
    if (n !== current) onPageChange(n);
  };

  const autoShowJump = showJump ?? totalPages > 10;
  const showEnds = totalPages > (compact ? 10 : 7); // « » chỉ khi nhiều trang
  const hasInfo = showInfo && total > 0 && pageSize > 0;
  const from = hasInfo ? Math.min((current - 1) * pageSize + 1, total) : 0;
  const to = hasInfo ? Math.min(current * pageSize, total) : 0;

  const first = showEnds && (
    <Btn label="Trang đầu" disabled={current <= 1} onClick={() => go(1)}><ChevronsLeft size={15} strokeWidth={2} /></Btn>
  );
  const prev = (
    <Btn label="Trang trước" disabled={current <= 1} onClick={() => go(current - 1)}><ChevronLeft size={16} strokeWidth={2} /></Btn>
  );
  const next = (
    <Btn label="Trang sau" disabled={current >= totalPages} onClick={() => go(current + 1)}><ChevronRight size={16} strokeWidth={2} /></Btn>
  );
  const last = showEnds && (
    <Btn label="Trang cuối" disabled={current >= totalPages} onClick={() => go(totalPages)}><ChevronsRight size={15} strokeWidth={2} /></Btn>
  );

  const style = {
    ...theme,
    '--pg-size': `${compact ? Math.max(size, 42) : size}px`, // mobile: vùng chạm tối thiểu 42px
    '--pg-radius': `${radius}px`,
    '--pg-pad': padding,
  };

  return (
    <nav
      className={`pg${compact ? ' pg-compact' : ''}`}
      aria-label="Phân trang"
      aria-busy={isFetching || undefined}
      style={style}
    >
      {hasInfo && (
        <p className="pg-info">
          Hiển thị <strong>{from}–{to}</strong> trong tổng số <strong>{total.toLocaleString('vi-VN')}</strong> {itemLabel}
        </p>
      )}

      {compact ? (
        // Mobile: ‹  3 / 12  ›
        <div className="pg-row">
          {first}
          {prev}
          <Jump
            page={current}
            totalPages={totalPages}
            onJump={go}
            openUp
            label={<>{current} <span style={{ opacity: 0.5, fontWeight: 500 }}>/ {totalPages}</span></>}
          />
          {next}
          {last}
        </div>
      ) : (
        // Desktop: « ‹ 1 … 4 5 6 … 12 › »
        <div className="pg-row">
          {first}
          {prev}
          <span className="pg-sep" />
          {pages.map((p) => {
            if (p === 'DOTS_LEFT')
              return <Btn key="dl" className="pg-dots" label="Lùi 5 trang" onClick={() => go(current - 5)}>···</Btn>;
            if (p === 'DOTS_RIGHT')
              return <Btn key="dr" className="pg-dots" label="Tới 5 trang" onClick={() => go(current + 5)}>···</Btn>;
            return (
              <Btn key={p} label={`Trang ${p}`} active={p === current} onClick={() => go(p)}>{p}</Btn>
            );
          })}
          <span className="pg-sep" />
          {next}
          {last}
          {autoShowJump && (
            <>
              <span className="pg-sep" />
              <Jump page={current} totalPages={totalPages} onJump={go} label="Đến trang" />
            </>
          )}
        </div>
      )}
    </nav>
  );
}