// src/components/admin/ads/AdScheduleModal.jsx
import React, { useState, useEffect } from 'react';
import { X, CalendarRange, Check, ChevronDown, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import adService from '../../../services/adService';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS, AD_CONTENT_TYPES, AD_POSITIONS } from '../../../context/adminTokens';

// ── Atoms ─────────────────────────────────────────────────────────────────────
function Field({ label, required, hint, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <label style={{
            fontFamily: FONT, fontSize: 11, fontWeight: 700,
            color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            {label}
          </label>
          {required && (
            <span style={{ fontSize: 11, color: T.red, fontWeight: 700 }}>*</span>
          )}
          {hint && (
            <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              — {hint}
            </span>
          )}
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

function LightInput({ value, onChange, placeholder, type = 'text', min, disabled, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} value={value} min={min} disabled={disabled}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        height: 42, padding: '0 14px',
        background: disabled ? T.surfaceAlt : T.surface,
        border: `1px solid ${error ? 'rgba(220,38,38,0.5)' : focused ? T.borderFocus : T.border}`,
        borderRadius: 10, color: disabled ? T.textMuted : T.text, outline: 'none',
        fontFamily: FONT, fontSize: 13.5, width: '100%', boxSizing: 'border-box',
        transition: 'border-color 0.15s', cursor: disabled ? 'not-allowed' : 'text',
      }}
    />
  );
}

function LightSelect({ value, onChange, children, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: 42, padding: '0 36px 0 14px',
          background: T.surface,
          border: `1px solid ${error ? 'rgba(220,38,38,0.5)' : focused ? T.borderFocus : T.border}`,
          borderRadius: 10, color: value ? T.text : T.textMuted, outline: 'none',
          fontFamily: FONT, fontSize: 13.5, width: '100%', boxSizing: 'border-box',
          transition: 'border-color 0.15s', appearance: 'none', cursor: 'pointer',
        }}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        color={T.textMuted}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      />
    </div>
  );
}

// ── Position picker ────────────────────────────────────────────────────────────
function PositionPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {AD_POSITIONS.map(pos => {
        const selected = value === pos.value;
        return (
          <button
            key={pos.value}
            onClick={() => onChange(pos.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
              background: selected ? pos.bg : T.surfaceAlt,
              border: `1px solid ${selected ? pos.border : T.border}`,
              textAlign: 'left', transition: 'all 0.15s',
            }}
          >
            {/* Radio dot */}
            <div style={{
              width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${selected ? pos.color : T.border}`,
              background: selected ? pos.color : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>
              {selected && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                fontFamily: FONT, fontSize: 13, fontWeight: 700,
                color: selected ? pos.color : T.text,
              }}>
                {pos.label}
              </span>
              <p style={{
                fontFamily: FONT, fontSize: 11.5, color: T.textMuted,
                margin: '2px 0 0', lineHeight: 1.4,
              }}>
                {pos.desc}
              </p>
            </div>

            {/* Badge */}
            <span style={{
              padding: '2px 8px', borderRadius: 6,
              background: selected ? pos.bg : T.surface,
              border: `1px solid ${selected ? pos.border : T.border}`,
              fontFamily: FONT, fontSize: 10.5, fontWeight: 700,
              color: selected ? pos.color : T.textMuted,
              flexShrink: 0,
            }}>
              {pos.value}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Ad info chip (shown in header area) ───────────────────────────────────────
function AdChip({ ad }) {
  if (!ad) return null;
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 10,
      background: T.surfaceAlt, border: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 38, height: 26, borderRadius: 6, flexShrink: 0,
        background: `linear-gradient(135deg, ${T.accentLight}, ${T.surfaceAlt})`,
        border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CalendarRange size={12} color={T.accent} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ad.title}
        </p>
        <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, marginTop: 2 }}>
          {ad.durationSeconds}s
          {ad.skipAfterSeconds != null ? ` · skip sau ${ad.skipAfterSeconds}s` : ''}
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
const initForm = () => ({
  // shared
  mode:                 'global',   // 'global' | 'override'
  position:             'PreRoll',
  midRollOffsetSeconds: '',
  displayOrder:         '0',
  // global slot
  appliesTo:            '',         // '' = tất cả | 'Movie' | 'TvShow' | 'Episode'
  // content override
  contentType:          'Movie',
  contentId:            '',
});

export default function AdScheduleModal({ ad, open, onClose, onScheduled }) {
  const [form,      setForm]      = useState(initForm());
  const [saving,    setSaving]    = useState(false);
  const [errors,    setErrors]    = useState({});
  const [globalErr, setGlobalErr] = useState('');
  const [success,   setSuccess]   = useState(false);

  // Reset khi mở modal mới
  useEffect(() => {
    if (open) {
      setForm(initForm());
      setErrors({});
      setGlobalErr('');
      setSuccess(false);
    }
  }, [open, ad?.id]);

  const setF = (key) => (val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (form.mode === 'override') {
      if (!form.contentId.trim()) {
        e.contentId = 'Content ID không được để trống';
      } else {
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRe.test(form.contentId.trim())) e.contentId = 'Content ID phải là UUID hợp lệ';
      }
    }
    if (form.position === 'MidRoll') {
      if (!form.midRollOffsetSeconds && form.midRollOffsetSeconds !== 0) {
        e.midRollOffsetSeconds = 'Mid-Roll cần thời điểm phát (giây)';
      } else if (isNaN(+form.midRollOffsetSeconds) || +form.midRollOffsetSeconds < 0) {
        e.midRollOffsetSeconds = 'Giá trị phải ≥ 0';
      }
    }
    if (form.displayOrder !== '' && (isNaN(+form.displayOrder) || +form.displayOrder < 0)) {
      e.displayOrder = 'Thứ tự phải là số ≥ 0';
    }
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setGlobalErr('');
    try {
      const shared = {
        position:             form.position,
        midRollOffsetSeconds: form.position === 'MidRoll' ? parseInt(form.midRollOffsetSeconds) : null,
        displayOrder:         form.displayOrder !== '' ? parseInt(form.displayOrder) : 0,
      };

      if (form.mode === 'global') {
        // POST /api/ads/{adId}/global-slots
        await adService.createGlobalSlot(ad.id, {
          ...shared,
          appliesTo: form.appliesTo || null,  // null = tất cả
        });
      } else {
        // POST /api/ads/{adId}/overrides
        await adService.createOverride(ad.id, {
          ...shared,
          contentType: form.contentType,
          contentId:   form.contentId.trim(),
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onScheduled?.();
        onClose?.();
      }, 900);
    } catch (err) {
      setGlobalErr(err?.response?.data?.message ?? err?.message ?? 'Có lỗi xảy ra khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    onClose?.();
  };

  const isMidRoll  = form.position === 'MidRoll';
  const isOverride = form.mode === 'override';

  // Mode picker styles helper
  const modeBtn = (key, label, desc) => {
    const active = form.mode === key;
    return (
      <button
        key={key}
        onClick={() => setF('mode')(key)}
        style={{
          flex: 1, textAlign: 'left', padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
          background: active ? T.accentLight : T.surfaceAlt,
          border: `1.5px solid ${active ? T.accent : T.border}`,
          transition: 'all 0.15s',
        }}
      >
        <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: active ? T.accent : T.text, margin: '0 0 3px' }}>{label}</p>
        <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: 0, lineHeight: 1.4 }}>{desc}</p>
      </button>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <style>{ADMIN_GOOGLE_FONTS}</style>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {/* Backdrop */}
          <motion.div
            key="bd"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.3)', zIndex: 299,
              backdropFilter: 'blur(3px)',
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{   opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            style={{
              position: 'fixed', inset: 0, margin: 'auto',
              width: 520, height: 'fit-content', maxHeight: '92vh',
              zIndex: 300, background: T.surface, borderRadius: 16,
              border: `1px solid ${T.border}`, boxShadow: T.shadowLg,
              display: 'flex', flexDirection: 'column', fontFamily: FONT,
              overflow: 'hidden', minHeight: 0,
            }}
          >
            {/* ── Header ── */}
            <div style={{
              padding: '18px 20px', borderBottom: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: T.accentLight,
                  border: `1px solid ${T.accent}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <CalendarRange size={16} color={T.accent} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2, fontWeight: 600 }}>
                    Gắn quảng cáo
                  </p>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em', fontFamily: FONT_TITLE }}>
                    Tạo slot phát
                  </h2>
                </div>
              </div>
              <button
                onClick={handleClose} disabled={saving}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: T.surfaceAlt, border: `1px solid ${T.border}`,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: saving ? 0.5 : 1,
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* ── Body ── */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Ad chip */}
              <AdChip ad={ad} />

              {/* ── Mode picker ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                  Loại slot
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {modeBtn('global',   'Global Slot',       'Phát trên tất cả hoặc theo loại nội dung')}
                  {modeBtn('override', 'Content Override',  'Gắn riêng vào 1 nội dung cụ thể')}
                </div>
              </div>

              {/* ── Global Slot fields ── */}
              <AnimatePresence>
                {!isOverride && (
                  <motion.div
                    key="global-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: 12,
                      padding: '14px 16px', borderRadius: 12,
                      background: T.surfaceAlt, border: `1px solid ${T.border}`,
                    }}>
                      <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                        Phạm vi áp dụng
                      </p>
                      <Field label="Áp dụng cho" hint="để trống = tất cả">
                        <LightSelect value={form.appliesTo} onChange={setF('appliesTo')}>
                          <option value="">Tất cả nội dung</option>
                          {AD_CONTENT_TYPES.map(ct => (
                            <option key={ct.value} value={ct.value}>{ct.label}</option>
                          ))}
                        </LightSelect>
                      </Field>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 12px', borderRadius: 8, background: '#EFF6FF', border: '1px solid rgba(37,99,235,0.2)' }}>
                        <AlertCircle size={13} color="#2563EB" style={{ flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontFamily: FONT, fontSize: 12, color: '#1D4ED8', margin: 0, lineHeight: 1.5 }}>
                          Global slot sẽ phát trên tất cả content thuộc phạm vi, trừ khi content đó có Override riêng ở cùng position.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Content Override fields ── */}
              <AnimatePresence>
                {isOverride && (
                  <motion.div
                    key="override-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: 12,
                      padding: '14px 16px', borderRadius: 12,
                      background: T.surfaceAlt, border: `1px solid ${T.border}`,
                    }}>
                      <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                        Nội dung đích
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 10 }}>
                        <Field label="Loại nội dung" required>
                          <LightSelect value={form.contentType} onChange={setF('contentType')}>
                            {AD_CONTENT_TYPES.map(ct => (
                              <option key={ct.value} value={ct.value}>{ct.label}</option>
                            ))}
                          </LightSelect>
                        </Field>
                        <Field label="Content ID" required error={errors.contentId}>
                          <LightInput
                            value={form.contentId}
                            onChange={setF('contentId')}
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            error={errors.contentId}
                          />
                        </Field>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 12px', borderRadius: 8, background: '#FFFBEB', border: '1px solid rgba(217,119,6,0.2)' }}>
                        <AlertCircle size={13} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontFamily: FONT, fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                          Override sẽ thay thế Global Slot ở cùng position cho content này.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Section: Position ── */}
              <Field label="Vị trí phát" required>
                <PositionPicker value={form.position} onChange={setF('position')} />
              </Field>

              {/* ── MidRoll offset (conditional) ── */}
              <AnimatePresence>
                {isMidRoll && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Thời điểm phát (giây)" required hint="tính từ đầu video" error={errors.midRollOffsetSeconds}>
                        <LightInput
                          type="number"
                          value={form.midRollOffsetSeconds}
                          onChange={setF('midRollOffsetSeconds')}
                          placeholder="VD: 300 (= 5 phút)"
                          min="0"
                          error={errors.midRollOffsetSeconds}
                        />
                      </Field>
                      <Field label="Thứ tự hiển thị" hint="nếu nhiều ad cùng vị trí" error={errors.displayOrder}>
                        <LightInput
                          type="number"
                          value={form.displayOrder}
                          onChange={setF('displayOrder')}
                          placeholder="0"
                          min="0"
                          error={errors.displayOrder}
                        />
                      </Field>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* displayOrder (non-MidRoll) */}
              {!isMidRoll && (
                <Field label="Thứ tự hiển thị" hint="nếu nhiều ad cùng vị trí" error={errors.displayOrder}>
                  <LightInput
                    type="number"
                    value={form.displayOrder}
                    onChange={setF('displayOrder')}
                    placeholder="0"
                    min="0"
                    error={errors.displayOrder}
                  />
                </Field>
              )}

              {/* Global error */}
              {globalErr && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.25)',
                  fontFamily: FONT, fontSize: 12.5, color: T.red,
                  display: 'flex', alignItems: 'center', gap: 7,
                }}>
                  <AlertCircle size={13} color={T.red} style={{ flexShrink: 0 }} />
                  {globalErr}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div style={{
              padding: '14px 20px', borderTop: `1px solid ${T.border}`,
              display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0,
            }}>
              <button
                onClick={handleClose} disabled={saving}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  background: T.surfaceAlt, border: `1px solid ${T.border}`,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: FONT, fontSize: 13, fontWeight: 600,
                  color: T.textSub, opacity: saving ? 0.6 : 1,
                }}
              >
                Hủy
              </button>

              <button
                onClick={handleSave} disabled={saving || success}
                style={{
                  padding: '8px 18px', borderRadius: 8,
                  background: success ? '#16A34A' : saving ? T.accentLight : T.accent,
                  border: `1px solid ${saving ? T.accent + '30' : 'transparent'}`,
                  cursor: (saving || success) ? 'not-allowed' : 'pointer',
                  fontFamily: FONT, fontSize: 13, fontWeight: 600,
                  color: (saving && !success) ? T.accentText : 'white',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'background 0.2s',
                }}
              >
                {success ? (
                  <><Check size={13} /> Đã tạo slot!</>
                ) : saving ? (
                  <>
                    <div style={{
                      width: 13, height: 13, borderRadius: '50%',
                      border: '2px solid currentColor', borderTopColor: 'transparent',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                    Đang lưu...
                  </>
                ) : (
                  <><CalendarRange size={13} /> {isOverride ? 'Tạo Override' : 'Tạo Global Slot'}</>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}