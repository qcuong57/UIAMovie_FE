// src/pages/admin/AdminRevenue.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard doanh thu & thanh toán (một trang, không tab).
// Khớp AdminRevenueController (api/payments/admin/...):
//   GET revenue/summary · revenue/chart · revenue/by-plan · orders · revenue/export (.xlsx)
//
// Quy ước của BE:
//   - Ngày/tháng trong thống kê và bộ lọc tính theo GIỜ VN (GMT+7). FE chỉ gửi NGÀY dạng "yyyy-MM-dd"
//     (gồm cả ngày cuối), BE tự đổi mốc sang UTC. Thời gian BE trả về là UTC → hiển thị theo múi giờ VN.
//   - status: pending (còn hạn) | expired (pending quá hạn) | failed | success.
//   - summary.failedOrders CHỈ gồm failed; expiredOrders tách riêng; pendingOrders chỉ gồm pending còn hạn.
//     successRate = success / (success + failed + expired).
//   - Export: không chọn trạng thái thì chỉ xuất đơn success. Đơn success lọc theo ngày THANH TOÁN,
//     các trạng thái khác lọc theo ngày TẠO. Tối đa 50.000 dòng.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import paymentService from '../../services/paymentService';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from './common/Toast';
import {
  T, FONT_BODY as FONT, FONT_TITLE, ACCENT, ACCENT2, ACCENT3, ACCENT4,
} from '../../context/adminTokens';
import { fmtVnd, MONTHS_VI } from '../../helper/format';
import AdminPagination from '../../components/common/AdminPagination';

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;
const POLL_MS = 20_000; // tự làm mới khi còn đơn pending
const PLAN_COLORS = [ACCENT, ACCENT2, ACCENT3, ACCENT4];

const STATUS = {
  success: { label: 'Thành công',     color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
  pending: { label: 'Chờ thanh toán', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  expired: { label: 'Hết hạn',        color: T.textSub, bg: T.bg,      border: T.border },
  failed:  { label: 'Thất bại',       color: T.red,     bg: '#FEF2F2', border: '#FECACA' },
};

const STATUS_FILTERS = [
  { value: '',        label: 'Tất cả' },
  { value: 'success', label: STATUS.success.label },
  { value: 'pending', label: STATUS.pending.label },
  { value: 'expired', label: STATUS.expired.label },
  { value: 'failed',  label: STATUS.failed.label },
];

const PROVIDERS = [
  { value: 'vnpay', label: 'VNPay' },
  { value: 'sepay', label: 'SePay' },
];
const PROVIDER_LABEL = { vnpay: 'VNPay', sepay: 'SePay' };

const PLANS = [
  { value: 'monthly_premium', label: 'Premium Tháng' },
  { value: 'yearly_premium',  label: 'Premium Năm' },
];

const CSS = `
  @keyframes rv-spin { to { transform: rotate(360deg); } }
  @keyframes rv-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
  .rv-split { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 16px; }
  .rv-kpis  { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
  @media (max-width: 960px) { .rv-split { grid-template-columns: minmax(0, 1fr); } }
  .rv-row:hover td { background: ${T.surfaceHov}; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const yFmt = (v) =>
  v >= 1_000_000 ? `${+(v / 1_000_000).toFixed(1)}tr` : v >= 1_000 ? `${Math.round(v / 1_000)}k` : v;

const pad = (n) => String(n).padStart(2, '0');

/** Ngày giờ hiện tại theo VN (GMT+7). Đọc bằng getUTC*() để không phụ thuộc múi giờ trình duyệt. */
const vnNow = () => new Date(Date.now() + 7 * 3600 * 1000);

/** BE trả UTC (có thể thiếu hậu tố Z) → ép hiểu là UTC rồi hiển thị theo giờ VN. */
const HAS_TZ = /(Z|[+-]\d{2}:?\d{2})$/i;
const VN_FMT = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: false,
});
const fmtVnDateTime = (v) => {
  if (!v) return '—';
  const d = new Date(typeof v === 'string' && !HAS_TZ.test(v) ? `${v}Z` : v);
  return Number.isNaN(d.getTime()) ? '—' : VN_FMT.format(d);
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** Khoảng ngày (VN) gửi cho by-plan, trùng với kỳ của biểu đồ. Chỉ gửi ngày, gồm cả ngày cuối. */
const buildRange = (groupBy, year, month) =>
  groupBy === 'day'
    ? {
        from: `${year}-${pad(month)}-01`,
        to: `${year}-${pad(month)}-${pad(new Date(Date.UTC(year, month, 0)).getUTCDate())}`,
      }
    : { from: `${year}-01-01`, to: `${year}-12-31` };

// ── Small components ──────────────────────────────────────────────────────────

const Spinner = ({ size = 22 }) => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2.5px solid ${T.accentLight}`, borderTopColor: ACCENT,
      animation: 'rv-spin 0.7s linear infinite',
    }} />
  </div>
);

const Empty = ({ text = 'Chưa có dữ liệu' }) => (
  <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted, textAlign: 'center', padding: '40px 0', margin: 0 }}>
    {text}
  </p>
);

const ErrorBox = ({ text, onRetry }) => (
  <div style={{ textAlign: 'center', padding: '36px 0' }}>
    <p style={{ fontFamily: FONT, fontSize: 13, color: T.red, margin: '0 0 12px' }}>{text}</p>
    <Btn onClick={onRetry}>Thử lại</Btn>
  </div>
);

const Skeleton = ({ h = 24, w = '60%' }) => (
  <div style={{
    height: h, width: w, borderRadius: 6,
    background: 'linear-gradient(90deg, #f0f0ed 25%, #e8e8e3 50%, #f0f0ed 75%)',
    backgroundSize: '400px 100%', animation: 'rv-shimmer 1.4s ease-in-out infinite',
  }} />
);

const Btn = ({ onClick, children, active, disabled, primary }) => {
  const [hov, setHov] = useState(false);
  const on = active || primary;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: FONT, fontSize: 12.5, fontWeight: on ? 700 : 500,
        color: on ? '#fff' : hov ? T.text : T.textSub,
        background: on ? ACCENT : hov ? T.surfaceHov : T.surface,
        border: `1px solid ${on ? ACCENT : hov ? T.borderMed : T.border}`,
        borderRadius: 8, padding: '6px 14px', whiteSpace: 'nowrap',
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1,
        outline: 'none', transition: 'all 0.13s',
      }}
    >
      {children}
    </button>
  );
};

const Select = ({ value, onChange, options, placeholder }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{
      fontFamily: FONT, fontSize: 12.5, color: T.text, background: T.surface,
      border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px',
      cursor: 'pointer', outline: 'none',
    }}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const DateInput = ({ value, onChange, label, min, max }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: FONT, fontSize: 12, color: T.textMuted }}>
    {label}
    <input
      type="date"
      value={value}
      min={min || undefined}
      max={max || undefined}
      onChange={(e) => onChange(e.target.value)}
      style={{
        fontFamily: FONT, fontSize: 12.5, color: T.text, background: T.surface,
        border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', outline: 'none',
      }}
    />
  </label>
);

const Segmented = ({ value, onChange, options }) => (
  <div style={{
    display: 'inline-flex', borderRadius: 8, overflow: 'hidden',
    border: `1px solid ${T.border}`, background: T.surface,
  }}>
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        style={{
          fontFamily: FONT, fontSize: 12.5, fontWeight: value === o.value ? 700 : 500,
          color: value === o.value ? '#fff' : T.textSub,
          background: value === o.value ? ACCENT : 'transparent',
          border: 'none', padding: '7px 14px', cursor: 'pointer', transition: 'all 0.13s',
        }}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const Card = ({ title, subtitle, action, children, noPad, style }) => (
  <section style={{
    background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`,
    boxShadow: T.shadow, overflow: 'hidden', minWidth: 0, ...style,
  }}>
    {(title || action) && (
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap', padding: '14px 20px', borderBottom: `1px solid ${T.border}`,
      }}>
        <div>
          <h3 style={{ fontFamily: FONT_TITLE, fontSize: 13.5, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em' }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: '2px 0 0' }}>{subtitle}</p>
          )}
        </div>
        {action}
      </header>
    )}
    <div style={noPad ? undefined : { padding: '18px 20px' }}>{children}</div>
  </section>
);

const StatCard = ({ label, value, sub, subColor, delta, featured, loading, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04, duration: 0.22 }}
    style={{
      background: featured ? `linear-gradient(135deg, ${ACCENT} 0%, #145232 100%)` : T.surface,
      border: `1px solid ${featured ? 'transparent' : T.border}`,
      borderRadius: 16, padding: '18px 20px', boxShadow: featured ? '0 8px 28px rgba(28,95,58,0.22)' : T.shadow,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, minHeight: 112,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
      <span style={{
        fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
        color: featured ? 'rgba(255,255,255,0.65)' : T.textMuted,
      }}>
        {label}
      </span>
      {delta != null && (
        <span style={{
          fontFamily: FONT, fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, flexShrink: 0,
          color: delta >= 0 ? (featured ? '#fff' : '#15803D') : (featured ? '#FCA5A5' : T.red),
          background: delta >= 0 ? (featured ? 'rgba(255,255,255,0.15)' : '#F0FDF4') : (featured ? 'rgba(239,68,68,0.2)' : '#FEF2F2'),
        }}>
          {delta >= 0 ? '+' : '-'}{Math.abs(delta)}%
        </span>
      )}
    </div>
    <div>
      {loading ? <Skeleton h={26} w="65%" /> : (
        <p style={{
          fontFamily: FONT_TITLE, fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em',
          lineHeight: 1.1, margin: '0 0 4px', color: featured ? '#fff' : T.text,
        }}>
          {value ?? '—'}
        </p>
      )}
      {!loading && sub && (
        <p style={{ fontFamily: FONT, fontSize: 11.5, margin: 0, color: subColor ?? (featured ? 'rgba(255,255,255,0.6)' : T.textMuted) }}>
          {sub}
        </p>
      )}
    </div>
  </motion.div>
);

const StatusBadge = ({ status }) => {
  const m = STATUS[status] ?? { label: status || '—', color: T.textSub, bg: T.bg, border: T.border };
  return (
    <span style={{
      fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: m.color, background: m.bg,
      border: `1px solid ${m.border}`, padding: '2px 9px', borderRadius: 99, whiteSpace: 'nowrap',
    }}>
      {m.label}
    </span>
  );
};

const ChartTooltip = ({ active, payload, label, metric }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div style={{ background: T.text, borderRadius: 10, padding: '8px 12px', boxShadow: T.shadowLg, fontFamily: FONT }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: '0 0 3px', fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 13, color: '#fff', fontWeight: 700, margin: 0 }}>
        {metric === 'revenue' ? fmtVnd(v) : `${v} đơn`}
      </p>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminRevenue() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const report = useCallback((e, fallback) => {
    console.error(e);
    toastRef.current?.error?.(getApiErrorMessage(e, fallback));
  }, []);

  const now = vnNow(); // mặc định kỳ biểu đồ theo giờ VN, khớp mặc định của BE
  const curYear = now.getUTCFullYear();
  const YEARS = Array.from({ length: 5 }, (_, i) => curYear - i);

  // Summary
  const [summary, setSummary] = useState(null);
  const [sumLoading, setSumLoading] = useState(true);
  const [sumError, setSumError] = useState(false);

  // Chart + by-plan (chung một kỳ)
  const [groupBy, setGroupBy] = useState('month');
  const [year, setYear] = useState(curYear);
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [metric, setMetric] = useState('revenue');
  const [chart, setChart] = useState(null);
  const [byPlan, setByPlan] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  // Orders
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [ordLoading, setOrdLoading] = useState(true);
  const [ordError, setOrdError] = useState(false);
  const [fStatus, setFStatus] = useState('');
  const [fPlan, setFPlan] = useState('');
  const [fProvider, setFProvider] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [fSearch, setFSearch] = useState('');
  const [dateFrom, setDateFrom] = useState(''); // yyyy-MM-dd, ngày VN, lọc theo ngày tạo
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const ordersRef = useRef(null);

  // ── Summary ────────────────────────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    try {
      setSummary(await paymentService.adminGetRevenueSummary());
      setSumError(false);
    } catch (e) {
      setSumError(true);
      report(e, 'Không tải được tổng quan doanh thu');
    } finally {
      setSumLoading(false);
    }
  }, [report]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  // ── Chart + by-plan (bỏ qua kết quả của request cũ khi đổi kỳ nhanh) ─────────
  const chartReq = useRef(0);
  useEffect(() => {
    const id = ++chartReq.current;
    setChartLoading(true);
    (async () => {
      try {
        const params = groupBy === 'day' ? { groupBy, year, month } : { groupBy, year };
        const [c, p] = await Promise.all([
          paymentService.adminGetRevenueChart(params),
          paymentService.adminGetRevenueByPlan(buildRange(groupBy, year, month)),
        ]);
        if (id !== chartReq.current) return;
        setChart(c);
        setByPlan(Array.isArray(p) ? p : []);
        setChartError(false);
      } catch (e) {
        if (id !== chartReq.current) return;
        setChartError(true);
        report(e, 'Không tải được biểu đồ doanh thu');
      } finally {
        if (id === chartReq.current) setChartLoading(false);
      }
    })();
  }, [groupBy, year, month, reloadTick, report]);

  // ── Orders ─────────────────────────────────────────────────────────────────
  const ordReq = useRef(0);
  const loadOrders = useCallback(async (silent = false) => {
    const id = ++ordReq.current;
    if (!silent) setOrdLoading(true);
    try {
      const res = await paymentService.adminGetOrders({
        page,
        pageSize: PAGE_SIZE,
        ...(fStatus && { status: fStatus }),
        ...(fPlan && { planId: fPlan }),
        ...(fProvider && { provider: fProvider }),
        ...(fSearch && { search: fSearch }),
        ...(dateFrom && { from: dateFrom }),
        ...(dateTo && { to: dateTo }),
      });
      if (id !== ordReq.current) return;
      setOrders(res?.items ?? []);
      setTotal(res?.totalCount ?? 0);
      setOrdError(false);
    } catch (e) {
      if (id !== ordReq.current) return;
      setOrdError(true);
      if (!silent) report(e, 'Không tải được danh sách đơn hàng');
    } finally {
      if (id === ordReq.current && !silent) setOrdLoading(false);
    }
  }, [page, fStatus, fPlan, fProvider, fSearch, dateFrom, dateTo, report]);

  const loadOrdersRef = useRef(loadOrders);
  loadOrdersRef.current = loadOrders;
  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Tìm kiếm có debounce, không cần bấm Enter
  useEffect(() => {
    const t = setTimeout(() => {
      const v = searchInput.trim();
      setFSearch((prev) => {
        if (prev !== v) setPage(1);
        return v;
      });
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Còn đơn pending thì tự làm mới đều đặn (IPN có thể tới sau redirect vài giây)
  const pending = summary?.pendingOrders ?? 0;
  useEffect(() => {
    if (!pending) return undefined;
    const t = setInterval(() => {
      if (document.hidden) return;
      loadSummary();
      loadOrdersRef.current(true);
    }, POLL_MS);
    return () => clearInterval(t);
  }, [pending, loadSummary]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const refreshAll = () => {
    loadSummary();
    loadOrders();
    setReloadTick((t) => t + 1);
  };

  const setFilter = (setter) => (v) => { setter(v); setPage(1); };

  const showStatus = (status) => {
    setFilter(setFStatus)(status);
    ordersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetFilters = () => {
    setFStatus(''); setFPlan(''); setFProvider(''); setSearchInput(''); setFSearch('');
    setDateFrom(''); setDateTo(''); setPage(1);
  };
  const hasFilter = !!(fStatus || fPlan || fProvider || fSearch || dateFrom || dateTo);

  // Giữ from <= to (BE trả 400 nếu ngược)
  const onDateFrom = (v) => { setDateFrom(v); if (v && dateTo && v > dateTo) setDateTo(v); setPage(1); };
  const onDateTo = (v) => { setDateTo(v); if (v && dateFrom && v < dateFrom) setDateFrom(v); setPage(1); };

  // Xuất Excel theo bộ lọc hiện tại (trừ ô tìm kiếm — BE export không hỗ trợ search)
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { blob, filename } = await paymentService.adminExportRevenue({
        from: dateFrom, to: dateTo, status: fStatus, provider: fProvider, planId: fPlan,
      });
      downloadBlob(blob, filename);
      toastRef.current?.success?.('Đã xuất báo cáo Excel');
    } catch (e) {
      report(e, 'Không thể xuất báo cáo');
    } finally {
      setExporting(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const chartData = (chart?.dataPoints ?? []).map((d) => ({
    label: groupBy === 'month' ? MONTHS_VI[parseInt(d.label.split('-')[1], 10) - 1] : d.label.split('-')[2],
    revenue: d.revenue,
    orders: d.orders,
  }));
  const periodLabel = groupBy === 'month' ? `Năm ${year}` : `${MONTHS_VI[month - 1]}/${year}`;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const maxPlanRevenue = Math.max(1, ...byPlan.map((p) => p.revenue));

  // Tổng số đơn giảm (vd. polling) khiến trang hiện tại vượt quá → lùi về trang cuối
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  return (
    <div style={{ padding: '28px 28px 80px', maxWidth: 1400, fontFamily: FONT }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <p style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 3px' }}>
            Quản lý tài chính
          </p>
          <h2 style={{ fontFamily: FONT_TITLE, fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: T.text, margin: 0 }}>
            Doanh thu và thanh toán
          </h2>
        </div>
        <Btn onClick={refreshAll}>Làm mới</Btn>
      </div>

      {/* Cảnh báo đơn đang chờ */}
      {pending > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
          background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 16px', marginBottom: 14,
        }}>
          <p style={{ fontFamily: FONT, fontSize: 13, color: '#92400E', margin: 0 }}>
            <strong>{pending}</strong> đơn đang chờ cổng thanh toán xác nhận. Trang tự làm mới mỗi {POLL_MS / 1000} giây.
          </p>
          <Btn onClick={() => showStatus('pending')}>Xem đơn chờ</Btn>
        </div>
      )}

      {/* KPI */}
      {sumError && !summary ? (
        <Card><ErrorBox text="Không tải được tổng quan." onRetry={loadSummary} /></Card>
      ) : (
        <div className="rv-kpis" style={{ marginBottom: 16 }}>
          <StatCard index={0} featured label="Tổng doanh thu" loading={sumLoading}
            value={fmtVnd(summary?.totalRevenue)}
            sub={summary && `${summary.successOrders} giao dịch · TB ${fmtVnd(summary.averageOrderValue)}/đơn`} />
          <StatCard index={1} label="Hôm nay" loading={sumLoading}
            value={fmtVnd(summary?.todayRevenue)}
            sub={summary && `${summary.todayOrders} đơn thành công`} />
          <StatCard index={2} label="Doanh thu tháng này" loading={sumLoading}
            value={fmtVnd(summary?.currentMonthRevenue)}
            delta={summary?.monthOverMonthGrowth}
            sub={summary && `${summary.currentMonthOrders} đơn · Tháng trước: ${fmtVnd(summary.lastMonthRevenue)}`} />
          <StatCard index={3} label="Premium đang hoạt động" loading={sumLoading}
            value={summary?.activePremiumUsers}
            sub={summary && `${summary.expiringIn7Days} sắp hết hạn trong 7 ngày`}
            subColor={summary?.expiringIn7Days > 0 ? T.gold : undefined} />
          <StatCard index={4} label="Đơn chờ thanh toán" loading={sumLoading}
            value={summary?.pendingOrders}
            sub="Chưa quá 15 phút"
            subColor={summary?.pendingOrders > 0 ? T.gold : undefined} />
          <StatCard index={5} label="Tỉ lệ thành công" loading={sumLoading}
            value={summary && `${summary.successRate}%`}
            sub={summary && `${summary.failedOrders} thất bại · ${summary.expiredOrders} hết hạn / ${summary.totalOrders} đơn`}
            subColor={summary && (summary.failedOrders + summary.expiredOrders) > 0 ? T.red : undefined} />
        </div>
      )}

      {/* Biểu đồ + theo gói */}
      <div className="rv-split" style={{ marginBottom: 16 }}>
        <Card
          title="Doanh thu theo thời gian"
          subtitle={periodLabel}
          action={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <Segmented value={metric} onChange={setMetric}
                options={[{ value: 'revenue', label: 'Doanh thu' }, { value: 'orders', label: 'Số đơn' }]} />
              <Segmented value={groupBy} onChange={setGroupBy}
                options={[{ value: 'month', label: 'Tháng' }, { value: 'day', label: 'Ngày' }]} />
              <Select value={year} onChange={(v) => setYear(+v)}
                options={YEARS.map((y) => ({ value: y, label: String(y) }))} />
              {groupBy === 'day' && (
                <Select value={month} onChange={(v) => setMonth(+v)}
                  options={MONTHS_VI.map((m, i) => ({ value: i + 1, label: m }))} />
              )}
            </div>
          }
        >
          {chartLoading ? <Spinner /> : chartError ? (
            <ErrorBox text="Không tải được biểu đồ." onRetry={() => setReloadTick((t) => t + 1)} />
          ) : chartData.length === 0 ? <Empty /> : (
            <>
              <div style={{ display: 'flex', gap: 28, marginBottom: 14 }}>
                <div>
                  <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, margin: '0 0 2px' }}>Tổng doanh thu kỳ này</p>
                  <p style={{ fontFamily: FONT_TITLE, fontSize: 18, fontWeight: 800, color: ACCENT, margin: 0, letterSpacing: '-0.02em' }}>
                    {fmtVnd(chart?.totalRevenue)}
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, margin: '0 0 2px' }}>Số đơn thành công</p>
                  <p style={{ fontFamily: FONT_TITLE, fontSize: 18, fontWeight: 800, color: T.text, margin: 0 }}>
                    {chart?.totalOrders ?? 0}
                  </p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontFamily: FONT, fontSize: 11, fill: T.textMuted }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={metric === 'revenue' ? yFmt : undefined}
                    allowDecimals={false}
                    tick={{ fontFamily: FONT, fontSize: 10.5, fill: T.textMuted }}
                    axisLine={false} tickLine={false} width={48}
                  />
                  <Tooltip content={<ChartTooltip metric={metric} />} cursor={{ fill: T.accentLight }} />
                  <Bar dataKey={metric} fill={metric === 'revenue' ? ACCENT : ACCENT2} radius={[5, 5, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </Card>

        <Card title="Doanh thu theo gói" subtitle={periodLabel}>
          {chartLoading ? <Spinner /> : byPlan.length === 0 ? <Empty text="Chưa có đơn thành công trong kỳ" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {byPlan.map((p, i) => (
                <div key={p.planId ?? i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.text }}>{p.planName}</span>
                    <span style={{ fontFamily: FONT_TITLE, fontSize: 13, fontWeight: 800, color: T.text }}>{fmtVnd(p.revenue)}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: T.bg, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${(p.revenue / maxPlanRevenue) * 100}%`,
                      background: PLAN_COLORS[i % PLAN_COLORS.length], borderRadius: 99, transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: '5px 0 0' }}>
                    {p.orders} đơn, chiếm {p.revenueShare}% doanh thu
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Đơn hàng */}
      <div ref={ordersRef} style={{ scrollMarginTop: 16 }}>
        <Card
          title="Đơn hàng"
          subtitle={`${total.toLocaleString('vi-VN')} đơn${hasFilter ? ' khớp bộ lọc' : ''} · giờ Việt Nam (GMT+7)`}
          noPad
          action={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {hasFilter && <Btn onClick={resetFilters}>Xóa bộ lọc</Btn>}
              <Btn primary disabled={exporting} onClick={handleExport}>
                {exporting ? 'Đang xuất…' : 'Xuất Excel'}
              </Btn>
            </div>
          }
        >
          {/* Bộ lọc */}
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUS_FILTERS.map((s) => (
                <Btn key={s.value} active={fStatus === s.value} onClick={() => setFilter(setFStatus)(s.value)}>
                  {s.label}
                </Btn>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo mã đơn hoặc email"
                style={{
                  flex: '1 1 240px', minWidth: 200, fontFamily: FONT, fontSize: 12.5, color: T.text,
                  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
                  padding: '7px 12px', outline: 'none',
                }}
                onFocus={(e) => { e.target.style.borderColor = T.borderFocus; }}
                onBlur={(e) => { e.target.style.borderColor = T.border; }}
              />
              <Select value={fPlan} onChange={setFilter(setFPlan)} placeholder="Tất cả gói" options={PLANS} />
              <Select value={fProvider} onChange={setFilter(setFProvider)} placeholder="Tất cả cổng" options={PROVIDERS} />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <DateInput label="Tạo từ ngày" value={dateFrom} onChange={onDateFrom} max={dateTo} />
              <DateInput label="đến ngày" value={dateTo} onChange={onDateTo} min={dateFrom} />
            </div>
            <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: 0, lineHeight: 1.6 }}>
              Xuất Excel áp dụng bộ lọc trạng thái, gói, cổng và ngày (không áp dụng ô tìm kiếm).
              {!fStatus && ' Chưa chọn trạng thái thì chỉ xuất đơn thành công.'}
              {' '}Đơn thành công lọc theo ngày thanh toán, các trạng thái khác theo ngày tạo.
            </p>
            {(fStatus === 'pending' || fStatus === 'expired') && (
              <p style={{ fontFamily: FONT, fontSize: 12, color: T.textSub, margin: 0, lineHeight: 1.6 }}>
                {fStatus === 'pending'
                  ? 'Đơn chờ sẽ tự chuyển sang thành công khi cổng gửi IPN hợp lệ.'
                  : 'Đơn hết hạn vẫn được xác nhận nếu IPN đến muộn. Nếu khách đã trả tiền mà đơn không đổi trạng thái, hãy đối chiếu trong Nhật ký IPN của cổng rồi gửi lại IPN hoặc cấp Premium thủ công.'}
              </p>
            )}
          </div>

          {/* Bảng */}
          {ordLoading ? <Spinner /> : ordError ? (
            <ErrorBox text="Không tải được danh sách đơn hàng." onRetry={() => loadOrders()} />
          ) : orders.length === 0 ? (
            <Empty text={hasFilter ? 'Không có đơn nào khớp bộ lọc' : 'Chưa có đơn hàng nào'} />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 1020, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Mã đơn', 'Khách hàng', 'Gói', 'Số tiền', 'Cổng', 'Trạng thái', 'Tạo lúc', 'Thanh toán lúc'].map((h) => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '10px 14px', fontFamily: FONT, fontSize: 10.5, fontWeight: 800,
                        letterSpacing: '0.07em', textTransform: 'uppercase', color: T.textMuted,
                        borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="rv-row">
                      <Td strong color={ACCENT}>{o.orderCode}</Td>
                      <Td ellipsis title={o.userEmail}>{o.userEmail || '—'}</Td>
                      <Td>{o.planName}</Td>
                      <Td title strong font={FONT_TITLE}>{fmtVnd(o.amount)}</Td>
                      <Td>{PROVIDER_LABEL[o.provider] ?? o.provider}</Td>
                      <Td>
                        <StatusBadge status={o.status} />
                        {o.status === 'failed' && o.failureReason && (
                          <p title={o.failureReason} style={{
                            fontFamily: FONT, fontSize: 11, color: T.textMuted, margin: '4px 0 0',
                            maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {o.failureReason}
                          </p>
                        )}
                      </Td>
                      <Td muted>{fmtVnDateTime(o.createdAt)}</Td>
                      <Td muted>{fmtVnDateTime(o.paidAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!ordLoading && !ordError && (
            <div style={{ borderTop: `1px solid ${T.border}`, padding: '0 18px 16px' }}>
              <AdminPagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                itemLabel="đơn"
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

const Td = ({ children, strong, muted, color, ellipsis, font, title }) => (
  <td
    title={typeof title === 'string' ? title : undefined}
    style={{
      padding: '11px 14px', borderBottom: `1px solid ${T.border}`, verticalAlign: 'middle',
      fontFamily: font ?? FONT, fontSize: muted ? 11.5 : 12.5,
      fontWeight: strong ? 700 : 500,
      color: color ?? (muted ? T.textMuted : T.text),
      whiteSpace: 'nowrap', background: T.surface, transition: 'background 0.1s',
      ...(ellipsis ? { maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' } : null),
    }}
  >
    {children}
  </td>
);