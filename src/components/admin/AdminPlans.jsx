// src/components/admin/AdminPlans.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Quản lý gói Premium động (một trang, cùng phong cách AdminRevenue).
// Khớp AdminPlanController (api/admin/plans) và PaymentController (admin/grant-subscription,
// admin/subscription/{userId}).
//
// Quy ước của BE:
//   - Không xóa cứng gói, chỉ bật/tắt bán (giữ lịch sử đơn). PlanId không đổi được sau khi tạo.
//   - Sửa gói KHÔNG ảnh hưởng đơn cũ (đơn đã lưu sẵn tên, giá, số ngày).
//   - Giá 0 = gói dùng thử: BE tự đặt isTrial = true và maxPerUser mặc định 1.
//   - Gói trả phí tối thiểu 10.000đ; giá gốc phải lớn hơn giá bán; chỉ một gói được gắn "Phổ biến nhất".
//   - startsAt / endsAt là UTC. Form nhập theo GIỜ VN (GMT+7) rồi đổi sang UTC khi gửi.
//   - allowedEmailDomains là chuỗi phân tách dấu phẩy (vd "edu.vn,hust.edu.vn").
//   - Cấp Premium thủ công: expiredAt BẮT BUỘC và ở tương lai; gói chọn được cả gói đã tắt bán.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import paymentService from '../../services/paymentService';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from './common/Toast';
import {
  T, FONT_BODY as FONT, FONT_TITLE, ACCENT, ACCENT2,
} from '../../context/adminTokens';
import { fmtVnd } from '../../helper/format';

// ── Constants ─────────────────────────────────────────────────────────────────

const PLAN_ID_RE = /^[a-z0-9_]{3,50}$/;
const MIN_PAID = 10_000;
const DURATION_PRESETS = [
  { days: 7, label: '7 ngày' },
  { days: 30, label: '1 tháng' },
  { days: 90, label: '3 tháng' },
  { days: 365, label: '1 năm' },
];
const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'onsale', label: 'Đang bán' },
  { value: 'scheduled', label: 'Chưa mở bán' },
  { value: 'ended', label: 'Hết hạn bán' },
  { value: 'off', label: 'Đã tắt' },
];

const SALE = {
  onsale:    { label: 'Đang bán',     color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
  scheduled: { label: 'Chưa mở bán',  color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  ended:     { label: 'Hết hạn bán',  color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  off:       { label: 'Đã tắt',       color: T.textSub, bg: T.bg,      border: T.border },
};

const CSS = `
  @keyframes pl-spin { to { transform: rotate(360deg); } }
  .pl-kpis  { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }
  .pl-grid  { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; }
  .pl-two   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .pl-form  { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 20px; }
  @media (max-width: 860px) { .pl-form { grid-template-columns: minmax(0, 1fr); } .pl-two { grid-template-columns: 1fr; } }
  .pl-input:focus { border-color: ${T.borderFocus} !important; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0');
const HAS_TZ = /(Z|[+-]\d{2}:?\d{2})$/i;
const parseUtc = (v) => {
  if (!v) return null;
  const d = new Date(typeof v === 'string' && !HAS_TZ.test(v) ? `${v}Z` : v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** UTC từ BE → "yyyy-MM-ddTHH:mm" theo giờ VN (cho <input type=datetime-local>). */
const toVnInput = (v) => {
  const d = parseUtc(v);
  if (!d) return '';
  const x = new Date(d.getTime() + 7 * 3600 * 1000);
  return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}T${pad(x.getUTCHours())}:${pad(x.getUTCMinutes())}`;
};
/** "yyyy-MM-ddTHH:mm" (giờ VN) → ISO UTC, rỗng → null. */
const fromVnInput = (s) => {
  if (!s) return null;
  const d = new Date(`${s}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const VN_FMT = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: false,
});
const fmtVn = (v) => { const d = parseUtc(v); return d ? VN_FMT.format(d) : '—'; };

const saleState = (p, now = Date.now()) => {
  if (!p.isActive) return 'off';
  const s = parseUtc(p.startsAt), e = parseUtc(p.endsAt);
  if (s && s.getTime() > now) return 'scheduled';
  if (e && e.getTime() <= now) return 'ended';
  return 'onsale';
};

const priceText = (p) => {
  if (!p.priceVnd) return 'Miễn phí';
  return fmtVnd(p.priceVnd);
};
const durationText = (d) =>
  d === 30 ? '/tháng' : d === 365 ? '/năm' : `/${d} ngày`;

const EMPTY_FORM = {
  planId: '', name: '', description: '', priceVnd: '', originalPriceVnd: '',
  durationDays: 30, sortOrder: 0, features: [''], isMostPopular: false, isActive: true,
  isTrial: false, maxPerUser: '', allowedEmailDomains: '', startsAt: '', endsAt: '',
};

const planToForm = (p) => ({
  planId: p.planId, name: p.name ?? '', description: p.description ?? '',
  priceVnd: String(p.priceVnd ?? 0),
  originalPriceVnd: p.originalPriceVnd != null ? String(p.originalPriceVnd) : '',
  durationDays: p.durationDays, sortOrder: p.sortOrder ?? 0,
  features: p.features?.length ? [...p.features] : [''],
  isMostPopular: !!p.isMostPopular, isActive: !!p.isActive, isTrial: !!p.isTrial,
  maxPerUser: p.maxPerUser != null ? String(p.maxPerUser) : '',
  allowedEmailDomains: p.allowedEmailDomains ?? '',
  startsAt: toVnInput(p.startsAt), endsAt: toVnInput(p.endsAt),
});

/** Kiểm tra phía FE theo đúng luật của BE; trả object lỗi theo field. */
const validate = (f, isEdit) => {
  const e = {};
  const price = Number(f.priceVnd === '' ? NaN : f.priceVnd);
  const orig = f.originalPriceVnd === '' ? null : Number(f.originalPriceVnd);
  const days = Number(f.durationDays);
  if (!isEdit && !PLAN_ID_RE.test(f.planId.trim().toLowerCase()))
    e.planId = 'Chỉ gồm a-z, 0-9, gạch dưới (3–50 ký tự).';
  if (!f.name.trim()) e.name = 'Tên gói không được trống.';
  if (!Number.isFinite(price) || price < 0) e.priceVnd = 'Giá không hợp lệ.';
  else if (price > 0 && price < MIN_PAID) e.priceVnd = 'Gói trả phí tối thiểu 10.000đ.';
  if (orig != null && (!Number.isFinite(orig) || orig <= (Number.isFinite(price) ? price : 0)))
    e.originalPriceVnd = 'Giá gốc phải lớn hơn giá bán.';
  if (!Number.isInteger(days) || days < 1 || days > 3650) e.durationDays = 'Số ngày từ 1 đến 3650.';
  if (f.maxPerUser !== '' && (!Number.isInteger(Number(f.maxPerUser)) || Number(f.maxPerUser) < 1))
    e.maxPerUser = 'Phải là số nguyên >= 1.';
  if (f.startsAt && f.endsAt && f.endsAt <= f.startsAt) e.endsAt = 'Phải sau ngày bắt đầu.';
  return e;
};

const formToDto = (f, isEdit) => {
  const price = Number(f.priceVnd);
  return {
    planId: isEdit ? f.planId : f.planId.trim().toLowerCase(),
    name: f.name.trim(),
    description: f.description.trim(),
    priceVnd: price,
    originalPriceVnd: f.originalPriceVnd === '' ? null : Number(f.originalPriceVnd),
    durationDays: Number(f.durationDays),
    isMostPopular: f.isMostPopular,
    isActive: f.isActive,
    sortOrder: Number(f.sortOrder) || 0,
    features: f.features.map((x) => x.trim()).filter(Boolean),
    isTrial: price === 0 ? true : f.isTrial,
    maxPerUser: f.maxPerUser === '' ? null : Number(f.maxPerUser),
    allowedEmailDomains: f.allowedEmailDomains.trim() || null,
    startsAt: fromVnInput(f.startsAt),
    endsAt: fromVnInput(f.endsAt),
  };
};

// ── Small components ──────────────────────────────────────────────────────────

const Spinner = ({ size = 22 }) => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2.5px solid ${T.accentLight}`, borderTopColor: ACCENT,
      animation: 'pl-spin 0.7s linear infinite',
    }} />
  </div>
);

const Empty = ({ text }) => (
  <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted, textAlign: 'center', padding: '40px 0', margin: 0 }}>{text}</p>
);

const Btn = ({ onClick, children, active, disabled, primary, danger, small, type = 'button', title }) => {
  const [hov, setHov] = useState(false);
  const on = active || primary;
  return (
    <button
      type={type} onClick={onClick} disabled={disabled} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: FONT, fontSize: small ? 12 : 12.5, fontWeight: on ? 700 : 500,
        color: on ? '#fff' : danger ? T.red : hov ? T.text : T.textSub,
        background: on ? ACCENT : hov ? (danger ? '#FEF2F2' : T.surfaceHov) : T.surface,
        border: `1px solid ${on ? ACCENT : danger ? '#FECACA' : hov ? T.borderMed : T.border}`,
        borderRadius: 8, padding: small ? '5px 11px' : '7px 14px', whiteSpace: 'nowrap',
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1,
        outline: 'none', transition: 'all 0.13s',
      }}
    >
      {children}
    </button>
  );
};

const Badge = ({ meta, children }) => (
  <span style={{
    fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: meta.color, background: meta.bg,
    border: `1px solid ${meta.border}`, padding: '2px 9px', borderRadius: 99, whiteSpace: 'nowrap',
  }}>
    {children}
  </span>
);

const TAG = {
  popular: { color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  trial:   { color: ACCENT2,   bg: '#F5F3FF', border: '#DDD6FE' },
  domain:  { color: '#0E7490', bg: '#ECFEFF', border: '#A5F3FC' },
  limit:   { color: T.textSub, bg: T.bg,      border: T.border },
};

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
          <h3 style={{ fontFamily: FONT_TITLE, fontSize: 13.5, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em' }}>{title}</h3>
          {subtitle && <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: '2px 0 0' }}>{subtitle}</p>}
        </div>
        {action}
      </header>
    )}
    <div style={noPad ? undefined : { padding: '18px 20px' }}>{children}</div>
  </section>
);

const StatCard = ({ label, value, sub, featured, index, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04, duration: 0.22 }}
    style={{
      background: featured ? `linear-gradient(135deg, ${ACCENT} 0%, #145232 100%)` : T.surface,
      border: `1px solid ${featured ? 'transparent' : T.border}`, borderRadius: 16, padding: '18px 20px',
      boxShadow: featured ? '0 8px 28px rgba(28,95,58,0.22)' : T.shadow,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, minHeight: 104,
    }}
  >
    <span style={{
      fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
      color: featured ? 'rgba(255,255,255,0.65)' : T.textMuted,
    }}>{label}</span>
    <div>
      <p style={{
        fontFamily: FONT_TITLE, fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1,
        margin: '0 0 4px', color: featured ? '#fff' : T.text,
      }}>{loading ? '…' : value}</p>
      {sub && <p style={{ fontFamily: FONT, fontSize: 11.5, margin: 0, color: featured ? 'rgba(255,255,255,0.6)' : T.textMuted }}>{sub}</p>}
    </div>
  </motion.div>
);

const Toggle = ({ checked, onChange, disabled, label }) => (
  <button
    type="button" role="switch" aria-checked={checked} aria-label={label}
    disabled={disabled} onClick={() => onChange(!checked)}
    style={{
      width: 38, height: 22, borderRadius: 99, border: 'none', padding: 2, flexShrink: 0,
      background: checked ? ACCENT : '#D4D4D8', cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1, transition: 'background 0.15s', display: 'flex',
      justifyContent: checked ? 'flex-end' : 'flex-start',
    }}
  >
    <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }} />
  </button>
);

const inputStyle = (err) => ({
  width: '100%', fontFamily: FONT, fontSize: 13, color: T.text, background: T.surface,
  border: `1px solid ${err ? '#FECACA' : T.border}`, borderRadius: 8, padding: '8px 11px', outline: 'none',
});

const Field = ({ label, hint, error, children, required }) => (
  <label style={{ display: 'block', minWidth: 0 }}>
    <span style={{ display: 'block', fontFamily: FONT, fontSize: 11.5, fontWeight: 700, color: T.textSub, marginBottom: 5 }}>
      {label}{required && <span style={{ color: T.red }}> *</span>}
    </span>
    {children}
    {error
      ? <span style={{ display: 'block', fontFamily: FONT, fontSize: 11, color: T.red, marginTop: 4 }}>{error}</span>
      : hint && <span style={{ display: 'block', fontFamily: FONT, fontSize: 11, color: T.textMuted, marginTop: 4, lineHeight: 1.5 }}>{hint}</span>}
  </label>
);

const SectionTitle = ({ children }) => (
  <p style={{
    fontFamily: FONT, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
    color: T.textMuted, margin: '4px 0 -2px', paddingTop: 6, borderTop: `1px solid ${T.border}`,
  }}>{children}</p>
);

const CheckRow = ({ checked, onChange, title, desc, disabled }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, opacity: disabled ? 0.55 : 1 }}>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>{title}</p>
      {desc && <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: '2px 0 0', lineHeight: 1.45 }}>{desc}</p>}
    </div>
    <Toggle checked={checked} onChange={onChange} disabled={disabled} label={title} />
  </div>
);

// ── Modal shell ───────────────────────────────────────────────────────────────

const Modal = ({ open, onClose, title, subtitle, width = 860, children, footer }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(24,24,27,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.18 }}
            role="dialog" aria-modal="true"
            style={{
              width: '100%', maxWidth: width, maxHeight: '92vh', display: 'flex', flexDirection: 'column',
              background: T.surface, borderRadius: 18, boxShadow: T.shadowLg, overflow: 'hidden',
            }}
          >
            <header style={{ padding: '16px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontFamily: FONT_TITLE, fontSize: 16, fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.02em' }}>{title}</h3>
                {subtitle && <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, margin: '3px 0 0' }}>{subtitle}</p>}
              </div>
              <Btn small onClick={onClose}>Đóng</Btn>
            </header>
            <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1 }}>{children}</div>
            {footer && (
              <footer style={{ padding: '12px 22px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8, background: T.surfaceAlt }}>
                {footer}
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ── Preview: hiển thị gần giống thẻ gói người dùng thấy ───────────────────────

const PlanPreview = ({ f }) => {
  const price = Number(f.priceVnd) || 0;
  const orig = f.originalPriceVnd === '' ? null : Number(f.originalPriceVnd);
  const feats = f.features.map((x) => x.trim()).filter(Boolean);
  const free = price === 0;
  return (
    <div style={{
      border: `1.5px solid ${f.isMostPopular ? ACCENT : T.border}`, borderRadius: 16, padding: 18,
      background: T.surface, boxShadow: f.isMostPopular ? '0 8px 28px rgba(28,95,58,0.14)' : T.shadow,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <p style={{ fontFamily: FONT_TITLE, fontSize: 15, fontWeight: 800, color: T.text, margin: 0 }}>{f.name || 'Tên gói'}</p>
        {f.isMostPopular && <Badge meta={TAG.popular}>Phổ biến nhất</Badge>}
      </div>
      <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, margin: '0 0 12px', lineHeight: 1.5 }}>
        {f.description || 'Mô tả ngắn của gói'}
      </p>
      {orig != null && orig > price && (
        <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, textDecoration: 'line-through', margin: 0 }}>{fmtVnd(orig)}</p>
      )}
      <p style={{ fontFamily: FONT_TITLE, fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: ACCENT, margin: '0 0 12px' }}>
        {free ? `Miễn phí ${f.durationDays || 0} ngày` : <>{fmtVnd(price)}<span style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>{durationText(Number(f.durationDays))}</span></>}
      </p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {feats.length === 0 && <li style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted }}>Chưa có quyền lợi</li>}
        {feats.map((x, i) => (
          <li key={i} style={{ fontFamily: FONT, fontSize: 12.5, color: T.text, display: 'flex', gap: 7 }}>
            <span style={{ color: ACCENT, fontWeight: 800 }}>✓</span><span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ── Plan form modal ───────────────────────────────────────────────────────────

function PlanFormModal({ open, plan, onClose, onSaved, toast }) {
  const isEdit = !!plan;
  const [f, setF] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showErr, setShowErr] = useState(false);

  useEffect(() => {
    if (open) {
      setF(plan ? planToForm(plan) : EMPTY_FORM);
      setErrors({}); setShowErr(false); setSaving(false);
    }
  }, [open, plan]);

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const on = (k) => (e) => set(k)(e.target.value);

  useEffect(() => { if (showErr) setErrors(validate(f, isEdit)); }, [f, showErr, isEdit]);

  const price = Number(f.priceVnd);
  const free = f.priceVnd !== '' && price === 0;

  const setFeature = (i, v) => setF((p) => ({ ...p, features: p.features.map((x, j) => (j === i ? v : x)) }));
  const addFeature = () => setF((p) => ({ ...p, features: [...p.features, ''] }));
  const delFeature = (i) => setF((p) => ({ ...p, features: p.features.length > 1 ? p.features.filter((_, j) => j !== i) : [''] }));
  const moveFeature = (i, d) => setF((p) => {
    const j = i + d;
    if (j < 0 || j >= p.features.length) return p;
    const a = [...p.features]; [a[i], a[j]] = [a[j], a[i]];
    return { ...p, features: a };
  });

  const submit = async () => {
    const err = validate(f, isEdit);
    setErrors(err); setShowErr(true);
    if (Object.keys(err).length) return;
    setSaving(true);
    try {
      const dto = formToDto(f, isEdit);
      if (isEdit) await paymentService.adminUpdatePlan(plan.id, dto);
      else await paymentService.adminCreatePlan(dto);
      toast?.success?.(isEdit ? 'Đã cập nhật gói' : 'Đã tạo gói mới');
      onSaved();
    } catch (e) {
      toast?.error?.(getApiErrorMessage(e, 'Không thể lưu gói'));
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open} onClose={saving ? () => {} : onClose}
      title={isEdit ? `Sửa gói: ${plan?.name}` : 'Tạo gói mới'}
      subtitle={isEdit ? 'Sửa gói không ảnh hưởng các đơn đã mua (đơn lưu sẵn tên, giá, số ngày).' : 'Mã gói không đổi được sau khi tạo.'}
      footer={<><Btn onClick={onClose} disabled={saving}>Hủy</Btn><Btn primary onClick={submit} disabled={saving}>{saving ? 'Đang lưu…' : isEdit ? 'Lưu thay đổi' : 'Tạo gói'}</Btn></>}
    >
      <div className="pl-form">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <div className="pl-two">
            <Field label="Mã gói" required error={errors.planId}
              hint={isEdit ? 'Không đổi được.' : 'Vd: student_monthly, trial_7d'}>
              <input className="pl-input" style={{ ...inputStyle(errors.planId), fontFamily: 'ui-monospace, Menlo, monospace', background: isEdit ? T.bg : T.surface }}
                value={f.planId} disabled={isEdit} onChange={on('planId')} placeholder="monthly_premium" />
            </Field>
            <Field label="Tên hiển thị" required error={errors.name}>
              <input className="pl-input" style={inputStyle(errors.name)} value={f.name} onChange={on('name')} placeholder="Premium Tháng" />
            </Field>
          </div>

          <Field label="Mô tả ngắn">
            <input className="pl-input" style={inputStyle()} value={f.description} onChange={on('description')} placeholder="Xem không giới hạn, không quảng cáo" />
          </Field>

          <SectionTitle>Giá và thời hạn</SectionTitle>
          <div className="pl-two">
            <Field label="Giá bán (VNĐ)" required error={errors.priceVnd}
              hint={free ? 'Giá 0đ = gói dùng thử, kích hoạt ngay không qua cổng thanh toán.' : 'Gói trả phí tối thiểu 10.000đ.'}>
              <input className="pl-input" style={inputStyle(errors.priceVnd)} type="number" min="0" step="1000" value={f.priceVnd} onChange={on('priceVnd')} placeholder="69000" />
            </Field>
            <Field label="Giá gốc gạch ngang (VNĐ)" error={errors.originalPriceVnd} hint="Để trống nếu không giảm giá.">
              <input className="pl-input" style={inputStyle(errors.originalPriceVnd)} type="number" min="0" step="1000" value={f.originalPriceVnd} onChange={on('originalPriceVnd')} />
            </Field>
          </div>
          <Field label="Thời hạn (ngày)" required error={errors.durationDays}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {DURATION_PRESETS.map((d) => (
                <Btn key={d.days} small active={Number(f.durationDays) === d.days} onClick={() => set('durationDays')(d.days)}>{d.label}</Btn>
              ))}
              <input className="pl-input" style={{ ...inputStyle(errors.durationDays), width: 100 }} type="number" min="1" max="3650"
                value={f.durationDays} onChange={on('durationDays')} />
            </div>
          </Field>

          <SectionTitle>Quyền lợi hiển thị</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {f.features.map((x, i) => (
              <div key={i} style={{ display: 'flex', gap: 6 }}>
                <input className="pl-input" style={inputStyle()} value={x} onChange={(e) => setFeature(i, e.target.value)}
                  placeholder={`Quyền lợi ${i + 1}`}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }} />
                <Btn small onClick={() => moveFeature(i, -1)} disabled={i === 0} title="Lên">↑</Btn>
                <Btn small onClick={() => moveFeature(i, 1)} disabled={i === f.features.length - 1} title="Xuống">↓</Btn>
                <Btn small danger onClick={() => delFeature(i)} title="Xóa">✕</Btn>
              </div>
            ))}
            <div><Btn small onClick={addFeature}>+ Thêm quyền lợi</Btn></div>
          </div>

          <SectionTitle>Điều kiện và lịch bán</SectionTitle>
          <div className="pl-two">
            <Field label="Giới hạn số lần mua / user" error={errors.maxPerUser}
              hint={free ? 'Gói 0đ mặc định 1 lần nếu để trống.' : 'Để trống = không giới hạn.'}>
              <input className="pl-input" style={inputStyle(errors.maxPerUser)} type="number" min="1" value={f.maxPerUser} onChange={on('maxPerUser')} placeholder={free ? '1' : 'Không giới hạn'} />
            </Field>
            <Field label="Thứ tự hiển thị" hint="Nhỏ hơn hiện trước.">
              <input className="pl-input" style={inputStyle()} type="number" value={f.sortOrder} onChange={on('sortOrder')} />
            </Field>
          </div>
          <Field label="Chỉ cho email thuộc domain" hint="Cách nhau bằng dấu phẩy, vd: edu.vn, hust.edu.vn. Để trống = ai cũng mua được (gói sinh viên dùng mục này).">
            <input className="pl-input" style={inputStyle()} value={f.allowedEmailDomains} onChange={on('allowedEmailDomains')} placeholder="edu.vn" />
          </Field>
          <div className="pl-two">
            <Field label="Mở bán từ (giờ VN)" hint="Để trống = bán ngay.">
              <input className="pl-input" style={inputStyle()} type="datetime-local" value={f.startsAt} onChange={on('startsAt')} />
            </Field>
            <Field label="Ngừng bán lúc (giờ VN)" error={errors.endsAt} hint="Để trống = không giới hạn.">
              <input className="pl-input" style={inputStyle(errors.endsAt)} type="datetime-local" value={f.endsAt} min={f.startsAt || undefined} onChange={on('endsAt')} />
            </Field>
          </div>

          <SectionTitle>Tùy chọn</SectionTitle>
          <CheckRow checked={f.isActive} onChange={set('isActive')} title="Bật bán" desc="Tắt để ẩn gói khỏi trang mua (không xóa, giữ lịch sử đơn)." />
          <CheckRow checked={f.isMostPopular} onChange={set('isMostPopular')} title="Gắn nhãn “Phổ biến nhất”" desc="Chỉ một gói được gắn; các gói khác tự bỏ nhãn khi lưu." />
          <CheckRow checked={free ? true : f.isTrial} onChange={set('isTrial')} disabled={free} title="Gói dùng thử" desc={free ? 'Gói 0đ luôn là gói dùng thử.' : 'Chỉ mua được khi user chưa có Premium đang hoạt động.'} />
        </div>

        <div style={{ minWidth: 0 }}>
          <p style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 8px' }}>Xem trước</p>
          <div style={{ position: 'sticky', top: 0 }}><PlanPreview f={f} /></div>
        </div>
      </div>
    </Modal>
  );
}

// ── Grant / revoke modal ──────────────────────────────────────────────────────

const toDateInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function GrantModal({ open, plans, onClose, onDone, toast }) {
  const [mode, setMode] = useState('grant');
  const [userId, setUserId] = useState('');
  const [planId, setPlanId] = useState('');
  const [expiry, setExpiry] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  useEffect(() => {
    if (open) {
      setMode('grant'); setUserId(''); setExpiry(''); setBusy(false); setConfirmRevoke(false);
      setPlanId((p) => p || plans[0]?.planId || '');
    }
  }, [open, plans]);

  const plan = plans.find((p) => p.planId === planId);
  const idOk = GUID_RE.test(userId.trim());
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); setExpiry(toDateInput(d)); };
  const expiryOk = expiry && new Date(`${expiry}T23:59:59`).getTime() > Date.now();

  const grant = async () => {
    setBusy(true);
    try {
      // Hết hạn vào cuối ngày đã chọn theo giờ VN
      await paymentService.adminGrantSubscription({
        userId: userId.trim(), planId, expiredAt: new Date(`${expiry}T23:59:59+07:00`).toISOString(),
      });
      toast?.success?.('Đã cấp Premium');
      onDone();
    } catch (e) {
      toast?.error?.(getApiErrorMessage(e, 'Không thể cấp Premium'));
      setBusy(false);
    }
  };
  const revoke = async () => {
    setBusy(true);
    try {
      await paymentService.adminRevokeSubscription(userId.trim());
      toast?.success?.('Đã thu hồi Premium');
      onDone();
    } catch (e) {
      toast?.error?.(getApiErrorMessage(e, 'Không thể thu hồi Premium'));
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} width={520}
      title="Cấp / thu hồi Premium thủ công" subtitle="Áp dụng ngay cho một user, không qua thanh toán."
      footer={
        <>
          <Btn onClick={onClose} disabled={busy}>Hủy</Btn>
          {mode === 'grant'
            ? <Btn primary disabled={busy || !idOk || !planId || !expiryOk} onClick={grant}>{busy ? 'Đang cấp…' : 'Cấp Premium'}</Btn>
            : confirmRevoke
              ? <Btn danger disabled={busy} onClick={revoke}>{busy ? 'Đang thu hồi…' : 'Xác nhận thu hồi'}</Btn>
              : <Btn danger disabled={!idOk} onClick={() => setConfirmRevoke(true)}>Thu hồi Premium</Btn>}
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'inline-flex', alignSelf: 'flex-start', borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}` }}>
          {[{ v: 'grant', l: 'Cấp / gia hạn' }, { v: 'revoke', l: 'Thu hồi' }].map((o) => (
            <button key={o.v} type="button" onClick={() => { setMode(o.v); setConfirmRevoke(false); }}
              style={{
                fontFamily: FONT, fontSize: 12.5, fontWeight: mode === o.v ? 700 : 500, border: 'none', padding: '7px 16px', cursor: 'pointer',
                color: mode === o.v ? '#fff' : T.textSub, background: mode === o.v ? ACCENT : 'transparent',
              }}>{o.l}</button>
          ))}
        </div>

        <Field label="ID người dùng" required
          error={userId && !idOk ? 'ID phải có dạng GUID (xem ở trang Người dùng).' : undefined}>
          <input className="pl-input" style={{ ...inputStyle(userId && !idOk), fontFamily: 'ui-monospace, Menlo, monospace' }}
            value={userId} onChange={(e) => { setUserId(e.target.value); setConfirmRevoke(false); }}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
        </Field>

        {mode === 'grant' ? (
          <>
            <Field label="Gói" required hint="Chọn được cả gói đã tắt bán (vd gói dùng thử để tặng).">
              <select className="pl-input" style={{ ...inputStyle(), cursor: 'pointer' }} value={planId} onChange={(e) => { setPlanId(e.target.value); }}>
                {plans.map((p) => <option key={p.planId} value={p.planId}>{p.name} ({p.planId}){p.isActive ? '' : ' · đã tắt'}</option>)}
              </select>
            </Field>
            <Field label="Hết hạn vào cuối ngày (giờ VN)" required error={expiry && !expiryOk ? 'Ngày hết hạn phải ở tương lai.' : undefined}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <input className="pl-input" style={{ ...inputStyle(expiry && !expiryOk), width: 170 }} type="date" value={expiry}
                  min={toDateInput(new Date())} onChange={(e) => setExpiry(e.target.value)} />
                {plan && <Btn small onClick={() => addDays(plan.durationDays)}>+ {plan.durationDays} ngày (theo gói)</Btn>}
                <Btn small onClick={() => addDays(30)}>+30 ngày</Btn>
                <Btn small onClick={() => addDays(365)}>+1 năm</Btn>
              </div>
            </Field>
            <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: 0, lineHeight: 1.55 }}>
              Ngày hết hạn được đặt đúng như bạn chọn (không cộng dồn với thời hạn còn lại của user).
            </p>
          </>
        ) : (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ fontFamily: FONT, fontSize: 12.5, color: '#991B1B', margin: 0, lineHeight: 1.55 }}>
              {confirmRevoke
                ? 'Bạn chắc chắn? User sẽ mất quyền Premium ngay lập tức và không hoàn tác được.'
                : 'Thu hồi xóa gói của user, mất quyền Premium ngay, không giữ đến hết kỳ.'}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────

const PlanCard = ({ p, index, onEdit, onToggle, busy }) => {
  const st = saleState(p);
  const domains = (p.allowedEmailDomains || '').split(',').map((x) => x.trim()).filter(Boolean);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.2 }}
      style={{
        background: T.surface, border: `1px solid ${p.isMostPopular && st === 'onsale' ? ACCENT : T.border}`,
        borderRadius: 16, boxShadow: T.shadow, display: 'flex', flexDirection: 'column', minWidth: 0,
        opacity: st === 'off' ? 0.8 : 1,
      }}
    >
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: FONT_TITLE, fontSize: 15, fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.02em' }}>{p.name}</p>
            <p style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, color: T.textMuted, margin: '2px 0 0' }}>{p.planId}</p>
          </div>
          <Badge meta={SALE[st]}>{SALE[st].label}</Badge>
        </div>

        <div>
          {p.originalPriceVnd > p.priceVnd && (
            <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, textDecoration: 'line-through', marginRight: 8 }}>{fmtVnd(p.originalPriceVnd)}</span>
          )}
          <span style={{ fontFamily: FONT_TITLE, fontSize: 22, fontWeight: 800, color: ACCENT, letterSpacing: '-0.03em' }}>{priceText(p)}</span>
          <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, marginLeft: 6 }}>
            {p.priceVnd ? durationText(p.durationDays) : `· ${p.durationDays} ngày`}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {p.isMostPopular && <Badge meta={TAG.popular}>Phổ biến nhất</Badge>}
          {p.isTrial && <Badge meta={TAG.trial}>Dùng thử</Badge>}
          {p.maxPerUser != null && <Badge meta={TAG.limit}>Tối đa {p.maxPerUser} lần/user</Badge>}
          {domains.length > 0 && <Badge meta={TAG.domain}>Email: {domains.join(', ')}</Badge>}
        </div>

        {p.description && <p style={{ fontFamily: FONT, fontSize: 12, color: T.textSub, margin: 0, lineHeight: 1.5 }}>{p.description}</p>}

        {p.features?.length > 0 && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {p.features.slice(0, 4).map((x, i) => (
              <li key={i} style={{ fontFamily: FONT, fontSize: 12, color: T.text, display: 'flex', gap: 6 }}>
                <span style={{ color: ACCENT, fontWeight: 800 }}>✓</span><span>{x}</span>
              </li>
            ))}
            {p.features.length > 4 && <li style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>+{p.features.length - 4} quyền lợi khác</li>}
          </ul>
        )}

        {(p.startsAt || p.endsAt) && (
          <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: 0, lineHeight: 1.55 }}>
            {p.startsAt && <>Mở bán: {fmtVn(p.startsAt)}<br /></>}
            {p.endsAt && <>Ngừng bán: {fmtVn(p.endsAt)}</>}
          </p>
        )}
      </div>

      <div style={{
        padding: '10px 18px', borderTop: `1px solid ${T.border}`, display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', gap: 10, background: T.surfaceAlt,
      }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: FONT, fontSize: 12, color: T.textSub }}>
          <Toggle checked={p.isActive} disabled={busy} onChange={(v) => onToggle(p, v)} label={`Bật bán ${p.name}`} />
          {p.isActive ? 'Đang bật' : 'Đang tắt'}
        </label>
        <Btn small onClick={() => onEdit(p)}>Sửa</Btn>
      </div>
    </motion.div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminPlans() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [grantOpen, setGrantOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await paymentService.adminGetPlans();
      setPlans(Array.isArray(res) ? res : []);
      setError(false);
    } catch (e) {
      console.error(e);
      if (!silent) {
        setError(true);
        toastRef.current?.error?.(getApiErrorMessage(e, 'Không tải được danh sách gói'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (p) => { setEditing(p); setFormOpen(true); };

  const toggleActive = async (p, v) => {
    setBusyId(p.id);
    try {
      await paymentService.adminSetPlanActive(p.id, v);
      toastRef.current?.success?.(v ? `Đã bật bán “${p.name}”` : `Đã tắt bán “${p.name}”`);
      await load(true);
    } catch (e) {
      toastRef.current?.error?.(getApiErrorMessage(e, 'Không thể đổi trạng thái gói'));
    } finally {
      setBusyId(null);
    }
  };

  const counts = useMemo(() => {
    const c = { all: plans.length, onsale: 0, scheduled: 0, ended: 0, off: 0 };
    plans.forEach((p) => { c[saleState(p)] += 1; });
    return c;
  }, [plans]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plans.filter((p) =>
      (filter === 'all' || saleState(p) === filter)
      && (!q || p.name?.toLowerCase().includes(q) || p.planId?.toLowerCase().includes(q)));
  }, [plans, filter, search]);

  const trialCount = plans.filter((p) => p.isTrial).length;
  const popular = plans.find((p) => p.isMostPopular);

  return (
    <div style={{ padding: '28px 28px 80px', maxWidth: 1400, fontFamily: FONT }}>
      <style>{CSS}</style>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <p style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 3px' }}>
            Quản lý tài chính
          </p>
          <h2 style={{ fontFamily: FONT_TITLE, fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: T.text, margin: 0 }}>
            Gói Premium
          </h2>
          <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, margin: '6px 0 0', lineHeight: 1.5, maxWidth: 680 }}>
            Tạo gói, đặt giá, lịch bán và điều kiện mua (dùng thử, email sinh viên). Gói không bị xóa, chỉ <strong>tắt bán</strong> để giữ lịch sử đơn.
            Sửa gói không ảnh hưởng các đơn đã mua.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={() => load()}>Làm mới</Btn>
          <Btn onClick={() => setGrantOpen(true)} disabled={plans.length === 0}>Cấp / thu hồi Premium</Btn>
          <Btn primary onClick={openCreate}>+ Tạo gói mới</Btn>
        </div>
      </div>

      <div className="pl-kpis" style={{ marginBottom: 16 }}>
        <StatCard index={0} featured label="Đang bán" loading={loading} value={counts.onsale} sub={`${counts.all} gói tổng cộng`} />
        <StatCard index={1} label="Đã tắt / hết hạn bán" loading={loading} value={counts.off + counts.ended} sub={`${counts.off} tắt · ${counts.ended} hết hạn`} />
        <StatCard index={2} label="Chưa mở bán" loading={loading} value={counts.scheduled} sub="Đã hẹn giờ mở bán" />
        <StatCard index={3} label="Gói dùng thử" loading={loading} value={trialCount} sub={popular ? `Phổ biến: ${popular.name}` : 'Chưa gắn nhãn phổ biến'} />
      </div>

      <Card
        title="Danh sách gói"
        subtitle={`${shown.length}/${plans.length} gói · thời gian theo giờ Việt Nam (GMT+7)`}
        noPad
      >
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map((s) => (
              <Btn key={s.value} active={filter === s.value} onClick={() => setFilter(s.value)}>
                {s.label} ({counts[s.value]})
              </Btn>
            ))}
          </div>
          <input className="pl-input" style={{ ...inputStyle(), maxWidth: 360 }} value={search}
            onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc mã gói" />
        </div>

        <div style={{ padding: 18 }}>
          {loading ? <Spinner /> : error ? (
            <div style={{ textAlign: 'center', padding: '36px 0' }}>
              <p style={{ fontFamily: FONT, fontSize: 13, color: T.red, margin: '0 0 12px' }}>Không tải được danh sách gói.</p>
              <Btn onClick={() => load()}>Thử lại</Btn>
            </div>
          ) : plans.length === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <Empty text="Chưa có gói nào. Tạo gói đầu tiên để bắt đầu bán Premium." />
              <Btn primary onClick={openCreate}>+ Tạo gói mới</Btn>
            </div>
          ) : shown.length === 0 ? (
            <Empty text="Không có gói nào khớp bộ lọc" />
          ) : (
            <div className="pl-grid">
              {shown.map((p, i) => (
                <PlanCard key={p.id} p={p} index={i} onEdit={openEdit} onToggle={toggleActive} busy={busyId === p.id} />
              ))}
            </div>
          )}
        </div>
      </Card>

      <PlanFormModal
        open={formOpen} plan={editing} toast={toast}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); load(true); }}
      />
      <GrantModal
        open={grantOpen} plans={plans} toast={toast}
        onClose={() => setGrantOpen(false)}
        onDone={() => setGrantOpen(false)}
      />
    </div>
  );
}