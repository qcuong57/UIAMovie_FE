// src/pages/admin/AdminRevenue.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Trang quản lý doanh thu — kết nối với PaymentController.cs admin endpoints:
//   GET /api/payments/admin/revenue/summary
//   GET /api/payments/admin/revenue/chart
//   GET /api/payments/admin/revenue/by-plan
//   GET /api/payments/admin/orders
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import paymentService from '../../services/paymentService';
import { T, FONT_BODY as FONT, FONT_TITLE } from '../../context/adminTokens';
import { fmtVnd, fmtDate, fmtDateTime, STATUS_META, MONTHS_VI, PLAN_COLORS } from '../../helper/format';

// ══════════════════════════════════════════════════════════════════════════════
// Design tokens (local overrides on top of adminTokens)
// ══════════════════════════════════════════════════════════════════════════════
const ACCENT   = '#1C5F3A';
const ACCENT2  = '#7C3AED';
const ACCENT3  = '#0891B2';
const CHART_COLORS = [ACCENT, ACCENT2, ACCENT3, '#D97706'];

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  button, input, select, textarea { font-family: 'Nunito', sans-serif; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shimmer {
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
`;

// ══════════════════════════════════════════════════════════════════════════════
// Micro Components
// ══════════════════════════════════════════════════════════════════════════════

const Spin = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
    <div style={{
      width: 24, height: 24, borderRadius: '50%',
      border: `2.5px solid ${T.accentLight}`, borderTopColor: ACCENT,
      animation: 'spin 0.7s linear infinite',
    }} />
  </div>
);

const Empty = ({ text = 'Chưa có dữ liệu', icon = '📊' }) => (
  <div style={{ padding: '48px 0', textAlign: 'center' }}>
    <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
    <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>{text}</p>
  </div>
);

const Divider = ({ style }) => (
  <div style={{ height: 1, background: T.border, ...style }} />
);

// ── Skeleton loader ────────────────────────────────────────────────────────────
const Skeleton = ({ h = 18, w = '100%', r = 8, style }) => (
  <div style={{
    height: h, width: w, borderRadius: r,
    background: 'linear-gradient(90deg, #f0f0ed 25%, #e8e8e3 50%, #f0f0ed 75%)',
    backgroundSize: '400px 100%',
    animation: 'shimmer 1.4s ease-in-out infinite',
    ...style,
  }} />
);

// ── Ghost Button ───────────────────────────────────────────────────────────────
const GhostBtn = ({ onClick, children, active }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: FONT, fontSize: 12.5, fontWeight: active ? 600 : 500,
        color: active ? '#fff' : hov ? T.text : T.textSub,
        background: active ? ACCENT : hov ? T.surfaceHov : T.surface,
        border: `1px solid ${active ? ACCENT : hov ? T.borderMed : T.border}`,
        borderRadius: 8, padding: '6px 14px',
        cursor: 'pointer', outline: 'none',
        transition: 'all 0.13s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
};

// ── Select ─────────────────────────────────────────────────────────────────────
const Select = ({ value, onChange, options, placeholder }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      fontFamily: FONT, fontSize: 12.5, color: T.text,
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: '6px 10px',
      cursor: 'pointer', outline: 'none',
      transition: 'border-color 0.13s',
    }}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

// ── Tab ────────────────────────────────────────────────────────────────────────
const Tab = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    style={{
      fontFamily: FONT, fontSize: 13, fontWeight: active ? 700 : 400,
      color: active ? ACCENT : T.textMuted,
      background: 'none', border: 'none', cursor: 'pointer',
      padding: '11px 18px',
      borderBottom: `2.5px solid ${active ? ACCENT : 'transparent'}`,
      marginBottom: -1, transition: 'all 0.14s',
      display: 'flex', alignItems: 'center', gap: 6,
    }}
  >
    {children}
    {count != null && (
      <span style={{
        fontSize: 10, fontWeight: 700, fontFamily: FONT,
        background: active ? T.accentLight : T.bg,
        color: active ? ACCENT : T.textMuted,
        padding: '1px 6px', borderRadius: 99,
      }}>
        {count}
      </span>
    )}
  </button>
);

// ── Section Card ───────────────────────────────────────────────────────────────
const Card = ({ title, subtitle, action, children, style, noPad }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1, duration: 0.25 }}
    style={{
      background: T.surface, borderRadius: 16,
      border: `1px solid ${T.border}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      overflow: 'hidden', ...style,
    }}
  >
    {(title || action) && (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: `1px solid ${T.border}`,
        gap: 10,
      }}>
        <div>
          <span style={{
            fontFamily: FONT_TITLE, fontSize: 13.5, fontWeight: 700,
            color: T.text, letterSpacing: '-0.01em', display: 'block',
          }}>
            {title}
          </span>
          {subtitle && (
            <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>
              {subtitle}
            </span>
          )}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
    )}
    <div style={noPad ? {} : { padding: '18px 20px' }}>{children}</div>
  </motion.div>
);

// ── KPI Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, subColor, featured, delta, index, icon, note, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.055, duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
    style={{
      background: featured
        ? `linear-gradient(135deg, ${ACCENT} 0%, #145232 100%)`
        : T.surface,
      borderRadius: 16,
      padding: '20px 22px',
      border: `1px solid ${featured ? 'transparent' : T.border}`,
      boxShadow: featured
        ? `0 8px 32px rgba(28,95,58,0.22), 0 1px 0 rgba(255,255,255,0.08) inset`
        : '0 1px 4px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: 14,
      minHeight: 118,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* BG decoration for featured */}
    {featured && (
      <div style={{
        position: 'absolute', right: -20, top: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        pointerEvents: 'none',
      }} />
    )}

    {/* Label + delta */}
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {icon && (
          <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
        )}
        <p style={{
          fontFamily: FONT, fontSize: 11, fontWeight: 700,
          color: featured ? 'rgba(255,255,255,0.6)' : T.textMuted,
          letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0,
        }}>
          {label}
        </p>
      </div>
      {delta != null && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 3,
          padding: '2px 7px', borderRadius: 99, flexShrink: 0,
          background: delta >= 0
            ? featured ? 'rgba(255,255,255,0.15)' : '#F0FDF4'
            : featured ? 'rgba(239,68,68,0.2)' : '#FEF2F2',
        }}>
          <span style={{
            fontSize: 10.5, fontWeight: 700, fontFamily: FONT,
            color: delta >= 0
              ? featured ? 'rgba(255,255,255,0.9)' : '#16A34A'
              : featured ? '#FCA5A5' : '#DC2626',
          }}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
          </span>
        </div>
      )}
    </div>

    {/* Value + sub */}
    <div>
      {loading ? (
        <Skeleton h={28} w="70%" r={6} style={{ marginBottom: 6 }} />
      ) : (
        <p style={{
          fontFamily: FONT_TITLE, fontSize: 24, fontWeight: 800,
          color: featured ? '#fff' : T.text,
          lineHeight: 1, letterSpacing: '-0.03em', margin: '0 0 5px 0',
        }}>
          {value ?? '—'}
        </p>
      )}
      {sub && !loading && (
        <p style={{
          fontFamily: FONT, fontSize: 11,
          color: subColor ?? (featured ? 'rgba(255,255,255,0.5)' : T.textMuted),
          margin: 0,
        }}>
          {sub}
        </p>
      )}
    </div>
  </motion.div>
);

// ── Status Badge ───────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const m = STATUS_META[status?.toLowerCase()] ?? {
    label: status, color: T.textSub, bg: T.bg, border: T.border,
  };
  return (
    <span style={{
      fontFamily: FONT, fontSize: 10.5, fontWeight: 700,
      color: m.color, background: m.bg, border: `1px solid ${m.border}`,
      padding: '2px 9px', borderRadius: 99, whiteSpace: 'nowrap',
      letterSpacing: '0.02em',
    }}>
      {m.label}
    </span>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PAGINATION — Light Theme (standalone, no dark override hack)
// ══════════════════════════════════════════════════════════════════════════════
function AdminPagination({ page, totalPages, total, pageSize, onPageChange, itemLabel = 'đơn hàng' }) {
  const [jumpVal, setJumpVal] = useState('');
  const [jumpOpen, setJumpOpen] = useState(false);
  const jumpRef = useRef(null);

  if (!totalPages || totalPages <= 1) return null;

  const from = total ? Math.min((page - 1) * pageSize + 1, total) : null;
  const to   = total ? Math.min(page * pageSize, total) : null;

  // Build page number list
  const pageNums = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const left  = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    const arr = [1];
    if (left > 2) arr.push('…L');
    for (let i = left; i <= right; i++) arr.push(i);
    if (right < totalPages - 1) arr.push('…R');
    arr.push(totalPages);
    return arr;
  })();

  const commitJump = () => {
    const n = parseInt(jumpVal, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) onPageChange(n);
    setJumpVal(''); setJumpOpen(false);
  };

  const BtnPg = ({ children, active, disabled, onClick }) => {
    const [hov, setHov] = useState(false);
    return (
      <button
        onClick={disabled ? undefined : onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        disabled={disabled}
        style={{
          width: 34, height: 34, minWidth: 34,
          borderRadius: 8,
          border: active
            ? `1.5px solid ${ACCENT}`
            : `1px solid ${hov && !disabled ? T.borderMed : T.border}`,
          background: active
            ? ACCENT
            : hov && !disabled ? T.surfaceHov : T.surface,
          color: active
            ? '#fff'
            : disabled ? T.textMuted : hov ? T.text : T.textSub,
          fontFamily: FONT, fontSize: 13,
          fontWeight: active ? 700 : 500,
          cursor: disabled ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.13s',
          opacity: disabled ? 0.4 : 1,
          flexShrink: 0,
          outline: 'none',
        }}
      >
        {children}
      </button>
    );
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      padding: '20px 0 6px',
    }}>
      {/* Info row */}
      {from !== null && (
        <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted }}>
          Đang hiển thị{' '}
          <span style={{ color: T.text, fontWeight: 700 }}>{from}–{to}</span>
          {' '}trong tổng số{' '}
          <span style={{ color: T.text, fontWeight: 700 }}>{total?.toLocaleString()}</span>
          {' '}{itemLabel}
        </p>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Prev */}
        <BtnPg disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          ‹
        </BtnPg>

        <div style={{ width: 4 }} />

        {/* Page numbers */}
        {pageNums.map((p, i) => {
          if (typeof p === 'string' && p.startsWith('…')) {
            return (
              <span key={p} style={{
                width: 34, height: 34, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: T.textMuted, fontSize: 13,
                letterSpacing: 2, flexShrink: 0,
              }}>···</span>
            );
          }
          return (
            <BtnPg key={p} active={p === page} onClick={() => onPageChange(p)}>
              {p}
            </BtnPg>
          );
        })}

        <div style={{ width: 4 }} />

        {/* Next */}
        <BtnPg disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          ›
        </BtnPg>

        {/* Jump to page */}
        {totalPages > 8 && (
          <div style={{ position: 'relative', marginLeft: 8 }}>
            <GhostBtn onClick={() => { setJumpOpen(v => !v); setTimeout(() => jumpRef.current?.focus(), 60); }}>
              Đến trang
            </GhostBtn>
            <AnimatePresence>
              {jumpOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                    transform: 'translateX(-50%)',
                    background: T.surface,
                    border: `1px solid ${T.borderMed}`,
                    borderRadius: 12, padding: '10px 12px',
                    display: 'flex', alignItems: 'center', gap: 8,
                    zIndex: 99, whiteSpace: 'nowrap',
                    boxShadow: T.shadowMd,
                  }}
                >
                  <input
                    ref={jumpRef}
                    type="number" min={1} max={totalPages}
                    value={jumpVal}
                    onChange={e => setJumpVal(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitJump();
                      if (e.key === 'Escape') setJumpOpen(false);
                    }}
                    placeholder="1"
                    style={{
                      width: 50, height: 30, padding: '0 8px', borderRadius: 7,
                      border: `1px solid ${T.borderMed}`, background: T.bg,
                      color: T.text, fontFamily: FONT, fontSize: 13,
                      outline: 'none', textAlign: 'center',
                    }}
                  />
                  <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted }}>/ {totalPages}</span>
                  <button
                    onClick={commitJump}
                    style={{
                      height: 30, padding: '0 12px', borderRadius: 7,
                      background: ACCENT, border: 'none', cursor: 'pointer',
                      color: '#fff', fontFamily: FONT, fontSize: 12.5, fontWeight: 700,
                    }}
                  >
                    OK
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Chart: Custom Tooltip
// ══════════════════════════════════════════════════════════════════════════════
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.text, borderRadius: 10, padding: '10px 14px',
      boxShadow: T.shadowLg, border: 'none',
      fontFamily: FONT, minWidth: 140,
    }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em' }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{p.name}</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>
            {p.dataKey === 'revenue' ? fmtVnd(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminRevenue() {
  const [tab, setTab] = useState('overview');

  // Summary
  const [summary,    setSummary]  = useState(null);
  const [sumLoading, setSumLoad]  = useState(true);

  // Chart
  const [chartData,  setChartData]  = useState(null);
  const [byPlan,     setByPlan]     = useState([]);
  const [chartLoad,  setChartLoad]  = useState(false);
  const [groupBy,    setGroupBy]    = useState('month');
  const [chartYear,  setChartYear]  = useState(new Date().getFullYear());
  const [chartMonth, setChartMonth] = useState(new Date().getMonth() + 1);

  // Orders
  const [orders,     setOrders]    = useState([]);
  const [ordTotal,   setOrdTotal]  = useState(0);
  const [ordPage,    setOrdPage]   = useState(1);
  const [ordLoad,    setOrdLoad]   = useState(false);
  const [fStatus,    setFStatus]   = useState('');
  const [fPlan,      setFPlan]     = useState('');
  const [fSearch,    setFSearch]   = useState('');
  const [fSearchTmp, setFSearchTmp]= useState('');
  const PAGE_SIZE = 15;

  const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Load summary
  useEffect(() => {
    (async () => {
      setSumLoad(true);
      try { setSummary(await paymentService.adminGetRevenueSummary()); }
      catch (e) { console.error(e); }
      finally { setSumLoad(false); }
    })();
  }, []);

  // Load chart
  const loadChart = useCallback(async () => {
    setChartLoad(true);
    try {
      const params = groupBy === 'day'
        ? { groupBy: 'day', year: chartYear, month: chartMonth }
        : { groupBy: 'month', year: chartYear };
      const [chart, plans] = await Promise.all([
        paymentService.adminGetRevenueChart(params),
        paymentService.adminGetRevenueByPlan(),
      ]);
      setChartData(chart);
      setByPlan(plans);
    } catch (e) { console.error(e); }
    finally { setChartLoad(false); }
  }, [groupBy, chartYear, chartMonth]);

  useEffect(() => {
    if (tab === 'chart' || tab === 'overview') loadChart();
  }, [tab, loadChart]);

  // Load orders
  const loadOrders = useCallback(async () => {
    setOrdLoad(true);
    try {
      const res = await paymentService.adminGetOrders({
        page: ordPage, pageSize: PAGE_SIZE,
        ...(fStatus && { status: fStatus }),
        ...(fPlan   && { planId: fPlan }),
        ...(fSearch && { search: fSearch }),
      });
      setOrders(res?.items ?? []);
      setOrdTotal(res?.totalCount ?? 0);
    } catch (e) { console.error(e); }
    finally { setOrdLoad(false); }
  }, [ordPage, fStatus, fPlan, fSearch]);

  useEffect(() => {
    if (tab === 'orders') loadOrders();
  }, [tab, loadOrders]);

  const totalPages = Math.ceil(ordTotal / PAGE_SIZE);

  // Prepare chart data for Recharts
  const rechartsData = (chartData?.dataPoints ?? []).map(d => ({
    label: groupBy === 'month'
      ? MONTHS_VI[parseInt(d.label.split('-')[1]) - 1]
      : d.label.split('-')[2],
    revenue: d.revenue,
    orders:  d.orders,
  }));

  // Pie data for byPlan
  const pieData = byPlan.map(p => ({
    name:   p.planName,
    value:  p.revenue,
    share:  p.revenueShare,
    orders: p.orders,
    planId: p.planId,
  }));

  const COL = '150px 1fr 130px 120px 110px 130px 130px';
  const COL_HEADERS = ['Mã đơn', 'Email', 'Gói', 'Số tiền', 'Trạng thái', 'Tạo lúc', 'Thanh toán'];

  // Y axis tick formatter
  const yFmt = (v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : v;

  return (
    <div style={{ padding: '28px 28px 80px', maxWidth: 1400, fontFamily: FONT }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24 }}
      >
        <p style={{
          fontFamily: FONT, fontSize: 11.5, color: T.textMuted,
          marginBottom: 3, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
        }}>
          Quản lý tài chính
        </p>
        <h2 style={{
          fontFamily: FONT_TITLE, fontSize: 24, fontWeight: 800,
          color: T.text, letterSpacing: '-0.03em', margin: 0,
        }}>
          Doanh thu &amp; Thanh toán
        </h2>
      </motion.div>

      {/* ── Tab bar ── */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${T.border}`,
        marginBottom: 22,
        background: T.surface,
        borderRadius: '14px 14px 0 0',
        padding: '0 8px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <Tab active={tab === 'overview'} onClick={() => setTab('overview')}>Tổng quan</Tab>
        <Tab active={tab === 'chart'}    onClick={() => setTab('chart')}>Biểu đồ chi tiết</Tab>
        <Tab active={tab === 'orders'}   onClick={() => setTab('orders')} count={ordTotal || undefined}>
          Đơn hàng
        </Tab>
      </div>

      <AnimatePresence mode="wait">

        {/* ══════════ TAB: OVERVIEW ══════════ */}
        {tab === 'overview' && (
          <motion.div key="overview"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.16 }}
          >
            {/* Row 1 — 4 KPI (featured + 3) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
              <StatCard index={0} featured icon="💰"
                label="Tổng doanh thu"
                value={fmtVnd(summary?.totalRevenue)}
                sub={summary ? `${summary.successOrders} giao dịch thành công` : ''}
                loading={sumLoading}
              />
              <StatCard index={1} icon="📅"
                label="Doanh thu tháng này"
                value={fmtVnd(summary?.currentMonthRevenue)}
                sub={summary ? `Tháng trước: ${fmtVnd(summary.lastMonthRevenue)}` : ''}
                delta={summary?.monthOverMonthGrowth}
                loading={sumLoading}
              />
              <StatCard index={2} icon="👑"
                label="Premium đang hoạt động"
                value={summary?.activePremiumUsers}
                sub={summary ? `${summary.expiringIn7Days} sắp hết hạn (7 ngày)` : ''}
                subColor={summary?.expiringIn7Days > 0 ? T.gold : undefined}
                loading={sumLoading}
              />
              <StatCard index={3} icon="✅"
                label="Tỉ lệ thành công"
                value={summary ? `${summary.successRate}%` : null}
                sub={summary ? `Tổng ${summary.totalOrders} đơn · ${summary.pendingOrders} chờ` : ''}
                loading={sumLoading}
              />
            </div>

            {/* Row 2 — 3 KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 22 }}>
              <StatCard index={4} icon="📦"
                label="Tổng đơn hàng"
                value={summary?.totalOrders}
                sub={summary ? `Tháng này: ${summary.currentMonthOrders} đơn` : ''}
                loading={sumLoading}
              />
              <StatCard index={5} icon="⚠️"
                label="Đơn thất bại / hết hạn"
                value={summary?.failedOrders}
                sub="Cần kiểm tra"
                subColor={summary?.failedOrders > 0 ? T.red : undefined}
                loading={sumLoading}
              />
              <StatCard index={6} icon="⏳"
                label="Đơn đang chờ"
                value={summary?.pendingOrders}
                sub="Chưa xác nhận thanh toán"
                loading={sumLoading}
              />
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: 16 }}>

              {/* Area chart */}
              <Card
                title={`Doanh thu theo tháng — ${chartYear}`}
                subtitle="Doanh thu (₫) theo từng tháng trong năm"
                action={
                  <Select
                    value={chartYear}
                    onChange={v => setChartYear(+v)}
                    options={YEARS.map(y => ({ value: y, label: String(y) }))}
                  />
                }
              >
                {chartLoad ? <Spin /> : rechartsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={rechartsData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={ACCENT} stopOpacity={0.18} />
                          <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontFamily: FONT, fontSize: 11, fill: T.textMuted }}
                        axisLine={false} tickLine={false}
                      />
                      <YAxis
                        tickFormatter={yFmt}
                        tick={{ fontFamily: FONT, fontSize: 10, fill: T.textMuted }}
                        axisLine={false} tickLine={false} width={46}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: T.border, strokeWidth: 1 }} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Doanh thu"
                        stroke={ACCENT}
                        strokeWidth={2.5}
                        fill="url(#gradRev)"
                        dot={{ r: 3.5, fill: ACCENT, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: ACCENT, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <Empty />}
              </Card>

              {/* Pie chart + legend */}
              <Card title="Phân bổ theo gói" subtitle="Theo doanh thu">
                {chartLoad ? <Spin /> : pieData.length > 0 ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                      <PieChart width={150} height={150}>
                        <Pie
                          data={pieData} cx={75} cy={75}
                          innerRadius={44} outerRadius={70}
                          paddingAngle={2} dataKey="value"
                          strokeWidth={0}
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v) => [fmtVnd(v), 'Doanh thu']}
                          contentStyle={{
                            fontFamily: FONT, background: T.text,
                            border: 'none', borderRadius: 8, fontSize: 12,
                            color: '#fff',
                          }}
                        />
                      </PieChart>
                    </div>
                    {pieData.map((p, i) => (
                      <div key={p.planId ?? i}>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', padding: '9px 0',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{
                              width: 9, height: 9, borderRadius: 3, flexShrink: 0,
                              background: CHART_COLORS[i % CHART_COLORS.length],
                            }} />
                            <div>
                              <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: T.text, margin: 0 }}>
                                {p.name}
                              </p>
                              <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, margin: 0 }}>
                                {p.orders} đơn · {p.share}%
                              </p>
                            </div>
                          </div>
                          <span style={{ fontFamily: FONT_TITLE, fontSize: 12, fontWeight: 700, color: T.text }}>
                            {fmtVnd(p.value)}
                          </span>
                        </div>
                        {i < pieData.length - 1 && <Divider />}
                      </div>
                    ))}
                  </>
                ) : <Empty />}
              </Card>
            </div>
          </motion.div>
        )}

        {/* ══════════ TAB: CHART ══════════ */}
        {tab === 'chart' && (
          <motion.div key="chart"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.16 }}
          >
            {/* Controls bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 18, flexWrap: 'wrap',
            }}>
              {/* Toggle */}
              <div style={{
                display: 'flex', borderRadius: 9, overflow: 'hidden',
                border: `1px solid ${T.border}`, background: T.surface,
              }}>
                {[{ key: 'month', label: 'Theo tháng' }, { key: 'day', label: 'Theo ngày' }].map(opt => (
                  <button key={opt.key} onClick={() => setGroupBy(opt.key)}
                    style={{
                      fontFamily: FONT, fontSize: 12.5,
                      fontWeight: groupBy === opt.key ? 700 : 400,
                      color: groupBy === opt.key ? '#fff' : T.textSub,
                      background: groupBy === opt.key ? ACCENT : 'transparent',
                      border: 'none', cursor: 'pointer', padding: '7px 16px',
                      transition: 'all 0.13s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <Select
                value={chartYear}
                onChange={v => setChartYear(+v)}
                options={YEARS.map(y => ({ value: y, label: String(y) }))}
              />

              {groupBy === 'day' && (
                <Select
                  value={chartMonth}
                  onChange={v => setChartMonth(+v)}
                  options={MONTHS_VI.map((m, i) => ({ value: i + 1, label: m }))}
                />
              )}

              <GhostBtn onClick={loadChart}>↻ Làm mới</GhostBtn>

              {/* Summary inline */}
              {chartData && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 24, alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, margin: '0 0 2px' }}>
                      Tổng doanh thu
                    </p>
                    <p style={{ fontFamily: FONT_TITLE, fontSize: 16, fontWeight: 800, color: ACCENT, margin: 0, letterSpacing: '-0.02em' }}>
                      {fmtVnd(chartData.totalRevenue)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, margin: '0 0 2px' }}>
                      Tổng đơn
                    </p>
                    <p style={{ fontFamily: FONT_TITLE, fontSize: 16, fontWeight: 800, color: T.text, margin: 0 }}>
                      {chartData.totalOrders}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Area + Bar chart side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Card
                title={groupBy === 'month' ? `Doanh thu — ${chartYear}` : `Doanh thu — ${MONTHS_VI[chartMonth - 1]}/${chartYear}`}
                subtitle="Đường xu hướng doanh thu"
              >
                {chartLoad ? <Spin /> : rechartsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={rechartsData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradRev2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={ACCENT} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                      <XAxis dataKey="label" tick={{ fontFamily: FONT, fontSize: 10.5, fill: T.textMuted }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={yFmt} tick={{ fontFamily: FONT, fontSize: 10, fill: T.textMuted }} axisLine={false} tickLine={false} width={46} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone" dataKey="revenue" name="Doanh thu"
                        stroke={ACCENT} strokeWidth={2.5} fill="url(#gradRev2)"
                        dot={{ r: 3.5, fill: ACCENT, strokeWidth: 0 }}
                        activeDot={{ r: 5.5, fill: ACCENT, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <Empty />}
              </Card>

              <Card title="Số đơn hàng" subtitle="Theo từng kỳ">
                {chartLoad ? <Spin /> : rechartsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={rechartsData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                      <XAxis dataKey="label" tick={{ fontFamily: FONT, fontSize: 10.5, fill: T.textMuted }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontFamily: FONT, fontSize: 10, fill: T.textMuted }} axisLine={false} tickLine={false} width={36} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: T.accentLight, radius: 6 }} />
                      <Bar dataKey="orders" name="Đơn hàng" fill={ACCENT2} radius={[5, 5, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <Empty />}
              </Card>
            </div>

            {/* By-plan analysis */}
            <Card title="Phân tích theo gói" subtitle="So sánh doanh thu và tỉ lệ phân bổ">
              {chartLoad ? <Spin /> : byPlan.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 32, alignItems: 'center' }}>
                  {/* Pie */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <PieChart width={190} height={190}>
                      <Pie
                        data={pieData} cx={95} cy={95}
                        innerRadius={52} outerRadius={88}
                        paddingAngle={2} dataKey="value" strokeWidth={0}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => [fmtVnd(v), 'Doanh thu']}
                        contentStyle={{
                          fontFamily: FONT, background: T.text,
                          border: 'none', borderRadius: 8, fontSize: 12, color: '#fff',
                        }}
                      />
                    </PieChart>
                  </div>

                  {/* Plan list */}
                  <div>
                    {/* Bar comparison */}
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart
                        data={pieData}
                        layout="vertical"
                        margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                        barSize={16}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
                        <XAxis type="number" tickFormatter={yFmt} tick={{ fontFamily: FONT, fontSize: 10, fill: T.textMuted }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" tick={{ fontFamily: FONT, fontSize: 11.5, fill: T.text, fontWeight: 600 }} axisLine={false} tickLine={false} width={100} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: T.accentLight }} />
                        <Bar dataKey="value" name="Doanh thu" radius={[0, 6, 6, 0]}>
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    <Divider style={{ margin: '12px 0' }} />

                    {/* Detailed rows */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                      {byPlan.map((p, i) => (
                        <div key={p.planId ?? i} style={{
                          background: T.bg, borderRadius: 10, padding: '12px 14px',
                          border: `1px solid ${T.border}`,
                          display: 'flex', alignItems: 'center', gap: 12,
                        }}>
                          <div style={{
                            width: 10, height: 36, borderRadius: 3, flexShrink: 0,
                            background: CHART_COLORS[i % CHART_COLORS.length],
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: T.text, margin: '0 0 2px' }}>
                              {p.planName}
                            </p>
                            <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, margin: 0 }}>
                              {p.orders} đơn · {p.revenueShare}%
                            </p>
                          </div>
                          <p style={{ fontFamily: FONT_TITLE, fontSize: 13.5, fontWeight: 800, color: T.text, margin: 0, flexShrink: 0 }}>
                            {fmtVnd(p.revenue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : <Empty />}
            </Card>
          </motion.div>
        )}

        {/* ══════════ TAB: ORDERS ══════════ */}
        {tab === 'orders' && (
          <motion.div key="orders"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.16 }}
          >
            {/* Filter bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 14, flexWrap: 'wrap',
            }}>
              {/* Search */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 9, padding: '6px 12px',
                flex: '1 1 220px', minWidth: 220,
                transition: 'border-color 0.13s',
              }}
                onFocusCapture={e => e.currentTarget.style.borderColor = T.borderFocus}
                onBlurCapture={e => e.currentTarget.style.borderColor = T.border}
              >
                <span style={{ color: T.textMuted, fontSize: 14, lineHeight: 1 }}>🔍</span>
                <input
                  value={fSearchTmp}
                  onChange={e => setFSearchTmp(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { setFSearch(fSearchTmp); setOrdPage(1); }
                  }}
                  placeholder="Tìm mã đơn hoặc email… (Enter)"
                  style={{
                    border: 'none', outline: 'none', background: 'transparent',
                    fontFamily: FONT, fontSize: 12.5, color: T.text, width: '100%',
                  }}
                />
                {fSearchTmp && (
                  <button
                    onClick={() => { setFSearchTmp(''); setFSearch(''); setOrdPage(1); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, lineHeight: 1, fontSize: 16 }}
                  >×</button>
                )}
              </div>

              <Select
                value={fStatus} onChange={v => { setFStatus(v); setOrdPage(1); }}
                placeholder="Tất cả trạng thái"
                options={[
                  { value: 'success', label: '✅ Thành công' },
                  { value: 'failed',  label: '❌ Thất bại'   },
                  { value: 'pending', label: '⏳ Chờ xử lý'  },
                  { value: 'expired', label: '🕐 Hết hạn'    },
                ]}
              />

              <Select
                value={fPlan} onChange={v => { setFPlan(v); setOrdPage(1); }}
                placeholder="Tất cả gói"
                options={[
                  { value: 'monthly_premium', label: 'Gói tháng' },
                  { value: 'yearly_premium',  label: 'Gói năm'   },
                ]}
              />

              <GhostBtn onClick={() => loadOrders()}>↻ Tải lại</GhostBtn>

              {ordTotal > 0 && (
                <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, marginLeft: 'auto', fontWeight: 600 }}>
                  {ordTotal.toLocaleString()} đơn hàng
                </span>
              )}
            </div>

            {/* Table */}
            <div style={{
              background: T.surface, borderRadius: 16,
              border: `1px solid ${T.border}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: COL,
                padding: '10px 18px', background: T.bg,
                borderBottom: `1px solid ${T.border}`,
              }}>
                {COL_HEADERS.map(h => (
                  <span key={h} style={{
                    fontFamily: FONT, fontSize: 10.5, fontWeight: 800,
                    color: T.textMuted, letterSpacing: '0.07em', textTransform: 'uppercase',
                  }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* Table body */}
              {ordLoad ? <Spin /> : orders.length === 0 ? (
                <Empty text="Không có đơn hàng nào" icon="📋" />
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`page-${ordPage}`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.13 }}
                  >
                    {orders.map((o, i) => (
                      <div
                        key={o.id ?? i}
                        style={{
                          display: 'grid', gridTemplateColumns: COL,
                          padding: '11px 18px',
                          borderBottom: `1px solid ${T.border}`,
                          alignItems: 'center',
                          background: i % 2 === 0 ? T.surface : T.surfaceAlt,
                          transition: 'background 0.1s',
                          cursor: 'default',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = T.accentLight}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? T.surface : T.surfaceAlt}
                      >
                        <span style={{
                          fontFamily: FONT, fontSize: 12, fontWeight: 700, color: ACCENT,
                          letterSpacing: '0.01em',
                        }}>
                          {o.orderCode}
                        </span>
                        <span style={{
                          fontFamily: FONT, fontSize: 12, color: T.textSub,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8,
                        }}>
                          {o.userEmail || '—'}
                        </span>
                        <span style={{ fontFamily: FONT, fontSize: 12, color: T.text, fontWeight: 500 }}>
                          {o.planName}
                        </span>
                        <span style={{ fontFamily: FONT_TITLE, fontSize: 13, fontWeight: 800, color: T.text }}>
                          {fmtVnd(o.amount)}
                        </span>
                        <StatusBadge status={o.status} />
                        <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>
                          {fmtDateTime(o.createdAt)}
                        </span>
                        <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>
                          {fmtDateTime(o.paidAt)}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}

              {/* ── Pagination (light theme, built-in) ── */}
              {totalPages > 1 && (
                <div style={{
                  borderTop: `1px solid ${T.border}`,
                  background: T.bg,
                  padding: '4px 18px 16px',
                }}>
                  <AdminPagination
                    page={ordPage}
                    totalPages={totalPages}
                    total={ordTotal}
                    pageSize={PAGE_SIZE}
                    onPageChange={p => setOrdPage(p)}
                    itemLabel="đơn hàng"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}