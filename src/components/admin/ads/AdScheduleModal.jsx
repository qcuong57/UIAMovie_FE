// src/components/admin/ads/AdScheduleModal.jsx
// Gắn lịch phát cho 1 quảng cáo. Bố cục 2 cột, mỗi cột tự cuộn → không còn phần nào bị che:
//   TRÁI  : form tạo slot (Global Slot / Content Override)
//   PHẢI  : lịch đã gắn của ad này (trục thời gian + danh sách, bật/tắt/xóa tại chỗ)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, CalendarRange, Check, ChevronDown, AlertCircle, Trash2, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import adService from '../../../services/adService';
import { useToast } from '../common/Toast';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS, AD_POSITIONS } from '../../../context/adminTokens';
import { GLOBAL_SCOPES, OVERRIDE_TYPES, CONTENT_ID_HINT, PLAYABLE_TYPES, scopeLabel, scopeDesc, scopeCovers } from './adContentScopes';
import AdTimeline, { PositionBadge, fmtClock } from './AdTimeline';
import AdSlotDeleteModal from './AdSlotDeleteModal';

// ── Atoms (export để AdScheduleSettingsModal dùng lại) ────────────────────────
export function Field({ label, required, hint, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {label}
          </label>
          {required && <span style={{ fontSize: 11, color: T.red, fontWeight: 700 }}>*</span>}
          {hint && <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— {hint}</span>}
        </div>
      )}
      {children}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <AlertCircle size={11} color={T.red} />
          <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red, margin: 0 }}>{error}</p>
        </div>
      )}
    </div>
  );
}

export function LightInput({ value, onChange, placeholder, type = 'text', min, disabled, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} value={value} min={min} disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        height: 40, padding: '0 12px',
        background: disabled ? T.surfaceAlt : T.surface,
        border: `1px solid ${error ? 'rgba(220,38,38,0.5)' : focused ? T.borderFocus : T.border}`,
        borderRadius: 10, color: disabled ? T.textMuted : T.text, outline: 'none',
        fontFamily: FONT, fontSize: 13.5, width: '100%', boxSizing: 'border-box',
        transition: 'border-color 0.15s', cursor: disabled ? 'not-allowed' : 'text',
      }}
    />
  );
}

export function LightSelect({ value, onChange, children, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: 40, padding: '0 36px 0 12px', background: T.surface,
          border: `1px solid ${error ? 'rgba(220,38,38,0.5)' : focused ? T.borderFocus : T.border}`,
          borderRadius: 10, color: value ? T.text : T.textMuted, outline: 'none',
          fontFamily: FONT, fontSize: 13.5, width: '100%', boxSizing: 'border-box',
          transition: 'border-color 0.15s', appearance: 'none', cursor: 'pointer',
        }}
      >
        {children}
      </select>
      <ChevronDown size={14} color={T.textMuted} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  );
}

// ── Position picker (gọn: 3 thẻ) ──────────────────────────────────────────────
function PositionPicker({ value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
      {AD_POSITIONS.map((pos) => {
        const selected = value === pos.value;
        return (
          <button
            key={pos.value} type="button" onClick={() => onChange(pos.value)}
            style={{
              textAlign: 'left', padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
              background: selected ? pos.bg : T.surfaceAlt,
              border: `1.5px solid ${selected ? pos.color : T.border}`, transition: 'all 0.15s',
            }}
          >
            <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: selected ? pos.color : T.text }}>{pos.label}</span>
            <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, margin: '3px 0 0', lineHeight: 1.4 }}>{pos.desc}</p>
          </button>
        );
      })}
    </div>
  );
}

const Panel = ({ title, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 16px', borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
    {title && <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{title}</p>}
    {children}
  </div>
);

const Notice = ({ tone = 'info', children }) => {
  const c = tone === 'warn'
    ? { bg: '#FFFBEB', bd: 'rgba(217,119,6,0.25)', fg: '#92400E', ic: '#D97706' }
    : { bg: '#EFF6FF', bd: 'rgba(37,99,235,0.2)', fg: '#1D4ED8', ic: '#2563EB' };
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 12px', borderRadius: 8, background: c.bg, border: `1px solid ${c.bd}` }}>
      <AlertCircle size={13} color={c.ic} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontFamily: FONT, fontSize: 12, color: c.fg, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
};

const initForm = () => ({
  mode: 'global',            // 'global' | 'override'
  position: AD_POSITIONS[0]?.value ?? 'PreRoll',
  midRollOffsetSeconds: '',
  displayOrder: '0',
  appliesTo: '',             // '' = tất cả
  contentType: OVERRIDE_TYPES[0]?.value ?? 'Movie',
  contentId: '',
});


// ══════════════════════════════════════════════════════════════════════════════
export default function AdScheduleModal({ ad, open, onClose, onScheduled, onOpenSettings }) {
  const toast = useToast();
  const [form, setForm] = useState(initForm());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [slots, setSlots] = useState(null);       // null = đang tải
  const [settings, setSettings] = useState(null); // cấu hình Fixed/Random hiện tại
  const [sampleMin, setSampleMin] = useState('90');
  const [slotToDelete, setSlotToDelete] = useState(null); // mở modal xác nhận xóa
  const [busyId, setBusyId] = useState(null);
  const [nextOrder, setNextOrder] = useState(null);        // thứ tự gợi ý từ server
  const orderTouched = useRef(false);                      // user tự sửa thứ tự → không ghi đè
  const [showAdv, setShowAdv] = useState(false); // Random: hiện vị trí / thời điểm (chỉ dùng khi quay về Cố định)

  const loadSlots = useCallback(async () => {
    if (!ad?.id) return;
    try {
      const d = await adService.getAdById(ad.id);
      setSlots(d?.globalSlots ?? []);
    } catch {
      setSlots([]);
      toast.error('Không tải được lịch đã gắn');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad?.id]);

  useEffect(() => {
    if (!open) return;
    setForm(initForm());
    setErrors({});
    setSlots(null);
    setSlotToDelete(null);
    setNextOrder(null);
    orderTouched.current = false;
    setShowAdv(false);
    loadSlots();
    adService.getScheduleSettings().then(setSettings).catch(() => setSettings(null));
  }, [open, ad?.id, loadSlots]);

  const setF = (key) => (val) => {
    if (key === 'displayOrder') orderTouched.current = true;
    else if (['position', 'appliesTo', 'mode', 'contentType', 'contentId'].includes(key)) orderTouched.current = false;
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const isMidRoll = form.position === 'MidRoll';
  const isOverride = form.mode === 'override';
  const isRandom = settings?.mode === 1 || settings?.mode === 'Random';
  // Random: slot chỉ là "kho quảng cáo" → vị trí / thời điểm không có tác dụng, ẩn cho gọn
  const poolOnly = isRandom && !isOverride;
  const fieldsHidden = poolOnly && !showAdv;
  const midActive = isMidRoll && !fieldsHidden;

  // Thứ tự tự nhảy: lấy "số tiếp theo" của cùng vị trí + phạm vi từ server (tính cả các quảng cáo khác).
  // Khi user chưa tự sửa ô thứ tự thì điền thẳng; đổi vị trí / phạm vi / sau khi tạo xong sẽ tính lại.
  useEffect(() => {
    if (!open || fieldsHidden) return;
    const contentId = form.contentId.trim();
    if (isOverride && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contentId)) {
      setNextOrder(null);
      return;
    }
    let cancelled = false;
    adService.getNextDisplayOrder({
      position: form.position,
      ...(isOverride
        ? { contentType: form.contentType, contentId }
        : form.appliesTo ? { appliesTo: form.appliesTo } : {}),
    })
      .then((r) => {
        if (cancelled) return;
        const next = r?.next ?? 0;
        setNextOrder(next);
        if (!orderTouched.current) setForm((f) => ({ ...f, displayOrder: String(next) }));
      })
      .catch(() => {
        if (cancelled) return;
        // Dự phòng: tính từ các slot của chính quảng cáo này
        const same = (slots ?? []).filter((s) => s.position === form.position);
        const next = same.length ? Math.max(...same.map((s) => s.displayOrder ?? 0)) + 1 : 0;
        setNextOrder(next);
        if (!orderTouched.current) setForm((f) => ({ ...f, displayOrder: String(next) }));
      });
    return () => { cancelled = true; };
  }, [open, fieldsHidden, isOverride, form.position, form.appliesTo, form.contentType, form.contentId, slots]);

  const validate = () => {
    const e = {};
    if (isOverride) {
      const id = form.contentId.trim();
      if (!id) e.contentId = 'Content ID không được để trống';
      else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) e.contentId = 'Content ID phải là UUID hợp lệ';
    }
    if (midActive) {
      const v = form.midRollOffsetSeconds;
      if (v === '' || v == null) e.midRollOffsetSeconds = 'Mid-Roll cần thời điểm phát (giây)';
      else if (isNaN(+v) || +v < 0) e.midRollOffsetSeconds = 'Giá trị phải ≥ 0';
    }
    if (!fieldsHidden && form.displayOrder !== '' && (isNaN(+form.displayOrder) || +form.displayOrder < 0)) e.displayOrder = 'Thứ tự phải là số ≥ 0';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (fieldsHidden && (slots ?? []).some((s) => (s.appliesTo ?? '') === form.appliesTo)) {
      toast.error(`Quảng cáo đã có trong kho cho phạm vi "${scopeLabel(form.appliesTo)}"`);
      return;
    }
    setSaving(true);
    try {
      const shared = {
        position: fieldsHidden ? 'PreRoll' : form.position,
        midRollOffsetSeconds: midActive ? parseInt(form.midRollOffsetSeconds, 10) : null,
        displayOrder: !fieldsHidden && form.displayOrder !== '' ? parseInt(form.displayOrder, 10) : 0,
      };
      if (isOverride) {
        await adService.createOverride(ad.id, { ...shared, contentType: form.contentType, contentId: form.contentId.trim() });
        toast.success('Đã gắn override cho nội dung');
      } else {
        await adService.createGlobalSlot(ad.id, { ...shared, appliesTo: form.appliesTo || null });
        toast.success(fieldsHidden ? 'Đã thêm vào kho quảng cáo ngẫu nhiên' : 'Đã gắn lịch phát toàn cục');
      }
      orderTouched.current = false;
      setForm((f) => ({ ...initForm(), mode: f.mode, appliesTo: f.appliesTo, contentType: f.contentType }));
      await loadSlots();
      onScheduled?.();
    } catch (err) {
      toast.error(err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? 'Có lỗi xảy ra khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const toggleSlot = async (s) => {
    setBusyId(s.slotId);
    try {
      await adService.toggleGlobalSlotStatus(s.slotId, !s.isActive);
      setSlots((prev) => prev.map((x) => (x.slotId === s.slotId ? { ...x, isActive: !x.isActive } : x)));
      onScheduled?.();
    } catch { toast.error('Không đổi được trạng thái slot'); }
    finally { setBusyId(null); }
  };

  // Modal xóa đã gọi API; ở đây chỉ cập nhật danh sách
  const handleSlotDeleted = (slotId) => {
    setSlots((prev) => (prev ?? []).filter((x) => x.slotId !== slotId));
    setSlotToDelete(null);
    onScheduled?.();
  };

  const handleClose = () => { if (!saving) onClose?.(); };

  const sampleSec = Math.max(1, (parseFloat(sampleMin) || 0) * 60);
  const timelineItems = (slots ?? []).map((s) => ({
    key: s.slotId,
    position: s.position,
    offset: s.midRollOffsetSeconds ?? 0,
    title: scopeLabel(s.appliesTo),
    durationSeconds: ad?.durationSeconds,
    muted: !s.isActive,
  }));

  const modeBtn = (key, label, desc) => {
    const active = form.mode === key;
    return (
      <button key={key} type="button" onClick={() => setF('mode')(key)} style={{
        flex: 1, textAlign: 'left', padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
        background: active ? T.accentLight : T.surfaceAlt, border: `1.5px solid ${active ? T.accent : T.border}`, transition: 'all 0.15s',
      }}>
        <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: active ? T.accent : T.text, margin: '0 0 3px' }}>{label}</p>
        <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: 0, lineHeight: 1.4 }}>{desc}</p>
      </button>
    );
  };

  return (
    <AnimatePresence>
      {open && ad && (
        <>
          <style>{ADMIN_GOOGLE_FONTS}</style>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            .asm-grid { display: grid; grid-template-columns: minmax(340px, 440px) minmax(0, 1fr); flex: 1; min-height: 0; }
            @media (max-width: 900px) { .asm-grid { grid-template-columns: 1fr; overflow-y: auto; } .asm-pane { overflow: visible !important; } }
          `}</style>

          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 299, backdropFilter: 'blur(3px)' }} />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            style={{
              position: 'fixed', inset: 0, margin: 'auto', zIndex: 300,
              width: 'min(1080px, 96vw)', height: 'min(760px, 92vh)',
              background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: T.shadowLg,
              display: 'flex', flexDirection: 'column', fontFamily: FONT, overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: T.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CalendarRange size={16} color={T.accent} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px', fontWeight: 600 }}>Lịch phát quảng cáo</p>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0, fontFamily: FONT_TITLE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ad.title}
                    <span style={{ fontWeight: 500, color: T.textMuted, fontSize: 13 }}> · {ad.durationSeconds}s{ad.skipAfterSeconds != null ? ` · skip sau ${ad.skipAfterSeconds}s` : ''}</span>
                  </h2>
                </div>
              </div>
              <button onClick={handleClose} disabled={saving} style={{ width: 30, height: 30, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>

            <div className="asm-grid">
              {/* ═══ TRÁI: form tạo slot ═══ */}
              <div className="asm-pane" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: `1px solid ${T.border}` }}>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>Thêm lịch mới</p>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {modeBtn('global', 'Global Slot', 'Theo loại nội dung hoặc tất cả')}
                    {modeBtn('override', 'Content Override', 'Gắn riêng 1 nội dung')}
                  </div>

                  {!isOverride ? (
                    <Panel title="Phạm vi áp dụng">
                      <Field label="Áp dụng cho" hint={scopeDesc(form.appliesTo)}>
                        <LightSelect value={form.appliesTo} onChange={setF('appliesTo')}>
                          {GLOBAL_SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </LightSelect>
                      </Field>
                    </Panel>
                  ) : (
                    <Panel title="Nội dung đích">
                      <Field label="Loại nội dung" required hint={scopeDesc(form.contentType)}>
                        <LightSelect value={form.contentType} onChange={setF('contentType')}>
                          {OVERRIDE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </LightSelect>
                      </Field>
                      <Field label="Content ID" required hint={CONTENT_ID_HINT[form.contentType]} error={errors.contentId}>
                        <LightInput value={form.contentId} onChange={setF('contentId')} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" error={errors.contentId} />
                      </Field>
                      <Notice tone="warn">Override thay thế Global Slot ở cùng vị trí cho content này và luôn dùng lịch tay (không random).</Notice>
                    </Panel>
                  )}

                  {poolOnly && (
                    <Notice>
                      Đang ở chế độ <b>Ngẫu nhiên</b>: chỉ cần chọn phạm vi để đưa quảng cáo vào kho. Vị trí và thời điểm do thuật toán quyết định.
                      {' '}
                      <button type="button" onClick={() => setShowAdv((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontWeight: 700, textDecoration: 'underline', fontFamily: FONT, fontSize: 12 }}>
                        {showAdv ? 'Ẩn tùy chọn vị trí' : 'Tùy chọn vị trí (dùng khi quay về Cố định)'}
                      </button>
                    </Notice>
                  )}

                  {!fieldsHidden && (
                  <>
                  <Field label="Vị trí phát" required>
                    <PositionPicker value={form.position} onChange={setF('position')} />
                  </Field>

                  <div style={{ display: 'grid', gridTemplateColumns: isMidRoll ? '1fr 1fr' : '1fr', gap: 12 }}>
                    {isMidRoll && (
                      <Field label="Thời điểm (giây)" required hint={form.midRollOffsetSeconds !== '' && !isNaN(+form.midRollOffsetSeconds) ? `= ${fmtClock(+form.midRollOffsetSeconds)}` : 'từ đầu video'} error={errors.midRollOffsetSeconds}>
                        <LightInput type="number" min="0" value={form.midRollOffsetSeconds} onChange={setF('midRollOffsetSeconds')} placeholder="VD: 300" error={errors.midRollOffsetSeconds} />
                      </Field>
                    )}
                    <Field label="Thứ tự hiển thị" hint={nextOrder != null ? `tự động: ${nextOrder}` : 'nếu nhiều ad cùng vị trí'} error={errors.displayOrder}>
                      <LightInput type="number" min="0" value={form.displayOrder} onChange={setF('displayOrder')} placeholder="0" error={errors.displayOrder} />
                    </Field>
                  </div>
                  </>
                  )}
                </div>

                <div style={{ padding: '12px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0, background: T.surface }}>
                  <button onClick={handleClose} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub }}>
                    Đóng
                  </button>
                  <button onClick={handleSave} disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, background: T.accent, border: '1px solid transparent', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
                    {saving
                      ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Đang lưu...</>
                      : <><Check size={13} /> {isOverride ? 'Tạo Override' : fieldsHidden ? 'Thêm vào kho ngẫu nhiên' : 'Tạo Global Slot'}</>}
                  </button>
                </div>
              </div>

              {/* ═══ PHẢI: lịch đã gắn ═══ */}
              <div className="asm-pane" style={{ minHeight: 0, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14, background: T.surfaceAlt + '55' }}>
                {isRandom && (
                  <Notice>
                    Hệ thống đang ở chế độ <b>Ngẫu nhiên</b>: các slot bên dưới chỉ dùng làm <b>kho quảng cáo</b> (ad nào được phát), còn số lượng và thời điểm do thuật toán quyết định mỗi lượt xem.
                    {onOpenSettings && (
                      <> <button type="button" onClick={onOpenSettings} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontWeight: 700, textDecoration: 'underline', fontFamily: FONT, fontSize: 12 }}>
                        <Shuffle size={11} style={{ verticalAlign: '-1px' }} /> Mở cấu hình ngẫu nhiên
                      </button></>
                    )}
                  </Notice>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
                  <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>
                    Lịch đã gắn {slots ? `(${slots.length})` : ''}
                  </p>
                  <div style={{ width: 170 }}>
                    <Field label="Xem trên phim dài (phút)">
                      <LightInput type="number" min="1" value={sampleMin} onChange={setSampleMin} />
                    </Field>
                  </div>
                </div>

                {slots === null ? (
                  <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', margin: '0 auto', border: `2.5px solid ${T.accentLight}`, borderTopColor: T.accent, animation: 'spin 0.75s linear infinite' }} />
                  </div>
                ) : (
                  <>
                    {isRandom && (
                      <Panel title="Kho quảng cáo ngẫu nhiên">
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {PLAYABLE_TYPES.map((pt) => {
                            const inPool = (slots ?? []).some((s) => s.isActive && scopeCovers(s.appliesTo, pt));
                            return (
                              <span key={pt} style={{
                                padding: '4px 10px', borderRadius: 14, fontFamily: FONT, fontSize: 12, fontWeight: 700,
                                background: inPool ? '#F0FDF4' : T.surface, color: inPool ? '#16A34A' : T.textMuted,
                                border: `1px solid ${inPool ? 'rgba(22,163,74,0.25)' : T.border}`,
                              }}>
                                {inPool ? '✓' : '✗'} {scopeLabel(pt)}
                              </span>
                            );
                          })}
                        </div>
                        <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>
                          ✓ = quảng cáo này có thể được bốc ngẫu nhiên cho hình thức đó. Trục thời gian bên dưới là lịch <b>cố định</b>, chỉ có hiệu lực khi chuyển về chế độ Cố định.
                        </p>
                      </Panel>
                    )}
                    <Panel>
                      <AdTimeline items={timelineItems} durationSeconds={sampleSec} emptyText="Quảng cáo này chưa được gắn Global Slot nào." />
                    </Panel>

                    {slots.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '2px 0' }}>Quản lý slot</p>
                        {slots.map((s) => (
                          <div key={s.slotId} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10,
                            background: T.surface, border: `1px solid ${T.border}`, opacity: s.isActive ? 1 : 0.6,
                          }}>
                            <PositionBadge position={s.position} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: T.text, margin: 0 }}>
                                {scopeLabel(s.appliesTo)}{s.position === 'MidRoll' && s.midRollOffsetSeconds != null ? ` · tại ${fmtClock(s.midRollOffsetSeconds)}` : ''}
                              </p>
                              <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, margin: '1px 0 0' }}>Thứ tự {s.displayOrder}</p>
                            </div>
                            <button type="button" disabled={busyId === s.slotId} onClick={() => toggleSlot(s)} style={{
                              padding: '4px 10px', borderRadius: 14, cursor: 'pointer', fontFamily: FONT, fontSize: 11.5, fontWeight: 700,
                              background: s.isActive ? '#F0FDF4' : T.surfaceAlt, color: s.isActive ? '#16A34A' : T.textMuted,
                              border: `1px solid ${s.isActive ? 'rgba(22,163,74,0.25)' : T.border}`,
                            }}>
                              {s.isActive ? 'Đang bật' : 'Đang tắt'}
                            </button>
                            <button type="button" title="Xóa lịch phát" disabled={busyId === s.slotId} onClick={() => setSlotToDelete(s)} style={{ width: 28, height: 28, borderRadius: 7, cursor: 'pointer', background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)', color: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>
                      Danh sách này chỉ gồm Global Slot của quảng cáo. Content Override (gắn riêng từng phim/tập) được tạo ở form bên trái.
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          <AdSlotDeleteModal
            slot={slotToDelete}
            adTitle={ad.title}
            isLastSlot={(slots ?? []).length === 1}
            onClose={() => setSlotToDelete(null)}
            onDeleted={handleSlotDeleted}
          />
        </>
      )}
    </AnimatePresence>
  );
}