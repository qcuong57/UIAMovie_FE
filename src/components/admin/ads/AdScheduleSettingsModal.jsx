// src/components/admin/ads/AdScheduleSettingsModal.jsx
// Admin chỉnh chế độ lập lịch quảng cáo: Cố định | Ngẫu nhiên (kiểu YouTube).
//   TRÁI  : chế độ + tham số (toàn bộ giá trị lấy từ server, không có số mặc định cứng ở FE)
//   PHẢI  : xem thử — tự cập nhật khi chỉnh (debounce), gọi đúng thuật toán của BE, hiện kho quảng cáo + lịch mẫu
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Shuffle, Check, RefreshCw, RotateCcw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import adService from '../../../services/adService';
import { useToast } from '../common/Toast';
import { T, FONT_BODY as FONT, FONT_TITLE } from '../../../context/adminTokens';
import { Field, LightInput, LightSelect } from './AdScheduleModal';
import AdTimeline, { fromContentAds } from './AdTimeline';
import { PREVIEW_SCOPES, ALL_SCOPE, scopeDesc } from './adContentScopes';

const PREVIEW_DEBOUNCE_MS = 450;

// ── Server ↔ form (ratio 0..1 ↔ %; không có fallback số cứng) ───────────────────
const str = (v) => (v == null ? '' : String(v));
const pct = (r) => (r == null ? '' : String(Math.round(r * 100)));

const toForm = (s) => ({
  mode: s.mode === 1 || s.mode === 'Random' ? 'Random' : 'Fixed',
  weights: (s.preRollWeights ?? []).map(String),
  intervalPct: pct(s.midRollIntervalRatio),
  jitterPct: pct(s.jitterRatio),
  minGap: pct(s.minMidRollGapRatio),
  endGuard: pct(s.endGuardRatio),
  minDuration: str(s.minDurationForMidRollSeconds),
  maxMid: str(s.maxMidRolls),
  postPct: pct(s.postRollChance),
});

const n = (v) => Number(v) || 0;
const toPayload = (f) => ({
  mode: f.mode,
  preRollWeights: f.weights.map((w) => Math.round(n(w))),
  midRollIntervalRatio: n(f.intervalPct) / 100,
  jitterRatio: n(f.jitterPct) / 100,
  minMidRollGapRatio: n(f.minGap) / 100,
  endGuardRatio: n(f.endGuard) / 100,
  minDurationForMidRollSeconds: Math.round(n(f.minDuration)),
  maxMidRolls: Math.round(n(f.maxMid)),
  postRollChance: n(f.postPct) / 100,
});

// Chỉ kiểm tra những gì server từ chối; giá trị vượt giới hạn mềm sẽ được server tự điều chỉnh
// và form được cập nhật theo giá trị server trả về sau khi lưu.
const validate = (f) => {
  const e = {};
  const blank = (v) => v === '' || v == null || Number.isNaN(Number(v));
  const neg = (v) => Number(v) < 0;
  const need = (key, v, { max } = {}) => {
    if (blank(v)) e[key] = 'Bắt buộc';
    else if (neg(v)) e[key] = 'Không được âm';
    else if (max != null && Number(v) > max) e[key] = `Tối đa ${max}`;
  };
  f.weights.forEach((w, i) => need(`w${i}`, w));
  if (f.mode === 'Random' && f.weights.reduce((a, w) => a + n(w), 0) <= 0) e.weights = 'Tổng trọng số phải > 0';
  need('intervalPct', f.intervalPct, { max: 100 });
  need('jitterPct', f.jitterPct, { max: 100 });
  need('minGap', f.minGap, { max: 100 });
  need('endGuard', f.endGuard, { max: 100 });
  need('minDuration', f.minDuration);
  need('maxMid', f.maxMid);
  need('postPct', f.postPct, { max: 100 });
  return e;
};

// Vị trí mid-roll danh nghĩa (% thời lượng) suy ra từ chính cấu hình — không có số cứng
const nominalPositions = (f) => {
  const r = n(f.intervalPct) / 100;
  const guard = n(f.endGuard) / 100;
  const max = Math.round(n(f.maxMid));
  const out = [];
  if (r <= 0) return out;
  for (let k = 1; k <= max && k * r <= 1 - guard + 1e-9; k += 1) out.push(Math.round(k * r * 100));
  return out;
};

const Section = ({ title, desc, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 16px', borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
    <div>
      <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{title}</p>
      {desc && <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, margin: '4px 0 0', lineHeight: 1.5 }}>{desc}</p>}
    </div>
    {children}
  </div>
);

const Stat = ({ label, value }) => (
  <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, textAlign: 'center' }}>
    <p style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: T.text, margin: 0 }}>{value}</p>
    <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
  </div>
);

const Spinner = ({ size = 24 }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', margin: '0 auto', border: `2.5px solid ${T.accentLight}`, borderTopColor: T.accent, animation: 'spin 0.75s linear infinite' }} />
);

export default function AdScheduleSettingsModal({ open, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(null); // null = đang tải
  const [baseline, setBaseline] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Xem thử
  const [pvScope, setPvScope] = useState(ALL_SCOPE);
  const [pvMin, setPvMin] = useState('90');
  const [pv, setPv] = useState({ data: null, loading: false, error: false });
  const [tick, setTick] = useState(0);
  const immediate = useRef(false);

  const errors = useMemo(() => (form ? validate(form) : {}), [form]);
  const invalid = Object.keys(errors).length > 0;
  const dirty = !!form && JSON.stringify(toPayload(form)) !== baseline;

  const applyServer = (s) => {
    const f = toForm(s);
    setForm(f);
    setBaseline(JSON.stringify(toPayload(f)));
  };

  // Tải cấu hình khi mở
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setForm(null);
    setConfirmDiscard(false);
    setConfirmReset(false);
    setPv({ data: null, loading: false, error: false });
    immediate.current = true;
    adService.getScheduleSettings()
      .then((s) => !cancelled && applyServer(s))
      .catch(() => { if (!cancelled) { toast.error('Không tải được cấu hình lịch quảng cáo'); onClose?.(); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Xem thử tự cập nhật: debounce khi chỉnh, bỏ qua kết quả cũ (race)
  useEffect(() => {
    if (!open || !form || invalid) return;
    const duration = Math.round(n(pvMin) * 60);
    if (duration <= 0) return;
    let cancelled = false;
    const delay = immediate.current ? 0 : PREVIEW_DEBOUNCE_MS;
    immediate.current = false;
    const id = setTimeout(async () => {
      setPv((p) => ({ ...p, loading: true, error: false }));
      try {
        const data = await adService.previewSchedule({
          contentType: pvScope || null,
          durationSeconds: duration,
          options: toPayload(form),
        });
        if (!cancelled) setPv({ data, loading: false, error: false });
      } catch {
        if (!cancelled) setPv((p) => ({ ...p, loading: false, error: true }));
      }
    }, delay);
    return () => { cancelled = true; clearTimeout(id); };
  }, [open, form, invalid, pvScope, pvMin, tick]);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setConfirmDiscard(false); };
  const setWeight = (i) => (v) => { setForm((f) => ({ ...f, weights: f.weights.map((w, j) => (j === i ? v : w)) })); setConfirmDiscard(false); };

  const isRandom = form?.mode === 'Random';
  const weightSum = form ? form.weights.reduce((a, w) => a + Math.max(0, n(w)), 0) : 0;
  const avgPre = form && weightSum > 0 ? form.weights.reduce((a, w, i) => a + i * Math.max(0, n(w)), 0) / weightSum : 0;

  const handleSave = async () => {
    if (invalid) { toast.error('Vui lòng sửa các ô đang báo lỗi'); return; }
    setSaving(true);
    try {
      const saved = await adService.updateScheduleSettings(toPayload(form));
      applyServer(saved); // hiển thị đúng giá trị server đã điều chỉnh
      toast.success(saved.mode === 1 || saved.mode === 'Random' ? 'Đã bật lịch quảng cáo ngẫu nhiên' : 'Đã chuyển về lịch cố định');
      onSaved?.(saved);
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    setSaving(true);
    try {
      const def = await adService.resetScheduleSettings();
      applyServer(def);
      setConfirmReset(false);
      toast.success('Đã khôi phục cấu hình mặc định');
      onSaved?.(def);
    } catch {
      toast.error('Không khôi phục được cấu hình mặc định');
    } finally {
      setSaving(false);
    }
  };

  const close = () => {
    if (saving) return;
    if (dirty && !confirmDiscard) { setConfirmDiscard(true); return; }
    onClose?.();
  };

  const modeBtn = (key, label, desc) => {
    const active = form?.mode === key;
    return (
      <button key={key} type="button" onClick={() => set('mode')(key)} style={{
        flex: 1, textAlign: 'left', padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
        background: active ? T.accentLight : T.surfaceAlt, border: `1.5px solid ${active ? T.accent : T.border}`, transition: 'all 0.15s',
      }}>
        <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: active ? T.accent : T.text, margin: '0 0 3px' }}>{label}</p>
        <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: 0, lineHeight: 1.4 }}>{desc}</p>
      </button>
    );
  };

  const sched = pv.data?.schedule;
  const items = sched ? fromContentAds(sched) : [];
  const count = (pos) => items.filter((i) => i.position === pos).length;
  const pool = pv.data?.pool ?? [];
  const previewIsRandom = pv.data && (pv.data.mode === 1 || pv.data.mode === 'Random');
  const loading = !form;

  return (
    <AnimatePresence>
      {open && (
        <>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            .ass-grid { display: grid; grid-template-columns: minmax(360px, 500px) minmax(0, 1fr); flex: 1; min-height: 0; }
            @media (max-width: 900px) { .ass-grid { grid-template-columns: 1fr; overflow-y: auto; } .ass-pane { overflow: visible !important; } }
          `}</style>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 299, backdropFilter: 'blur(3px)' }} />
          <motion.div key="modal"
            initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            style={{
              position: 'fixed', inset: 0, margin: 'auto', zIndex: 300,
              width: 'min(1100px, 96vw)', height: 'min(800px, 92vh)',
              background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: T.shadowLg,
              display: 'flex', flexDirection: 'column', fontFamily: FONT, overflow: 'hidden',
            }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: T.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shuffle size={16} color={T.accent} />
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0, fontFamily: FONT_TITLE }}>Cấu hình lịch phát quảng cáo</h2>
              </div>
              <button onClick={close} style={{ width: 30, height: 30, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} />
              </button>
            </div>

            <div className="ass-grid">
              {/* ═══ TRÁI: cấu hình ═══ */}
              <div className="ass-pane" style={{ minHeight: 0, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14, borderRight: `1px solid ${T.border}` }}>
                {loading ? (
                  <div style={{ padding: '60px 0' }}><Spinner size={26} /></div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {modeBtn('Fixed', 'Cố định', 'Đúng Global Slot / Override admin đã gắn')}
                      {modeBtn('Random', 'Ngẫu nhiên (kiểu YouTube)', 'Mỗi lượt xem một lịch khác nhau từ kho quảng cáo')}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, opacity: isRandom ? 1 : 0.45, pointerEvents: isRandom ? 'auto' : 'none' }}>
                      <Section
                        title="Quảng cáo đầu video (pre-roll)"
                        desc={`Trọng số cho số ad ở đầu video. Dồn trọng số vào 2–3 ad để đầu video nhiều quảng cáo hơn.${weightSum > 0 ? ` Trung bình ~${avgPre.toFixed(1)} ad.` : ''}`}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(form.weights.length, 1)}, minmax(0, 1fr))`, gap: 10 }}>
                          {form.weights.map((w, i) => {
                            const share = weightSum > 0 ? Math.round((Math.max(0, n(w)) / weightSum) * 100) : 0;
                            return (
                              <Field key={i} label={`${i} ad`} hint={`${share}%`} error={errors[`w${i}`]}>
                                <LightInput type="number" min="0" value={w} onChange={setWeight(i)} error={errors[`w${i}`]} />
                                <div style={{ height: 4, borderRadius: 2, background: T.border, overflow: 'hidden' }}>
                                  <div style={{ width: `${share}%`, height: '100%', background: T.accent, transition: 'width 0.2s' }} />
                                </div>
                              </Field>
                            );
                          })}
                        </div>
                        {errors.weights && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <AlertCircle size={11} color={T.red} />
                            <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red, margin: 0 }}>{errors.weights}</p>
                          </div>
                        )}
                      </Section>

                      <Section title="Quảng cáo giữa video (mid-roll)" desc="Chia theo % thời lượng THỰC của từng video: video 2 phút hay 2 tiếng đều được chia cùng tỉ lệ.">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <Field label="Cứ mỗi (% thời lượng)" error={errors.intervalPct}><LightInput type="number" min="0" value={form.intervalPct} onChange={set('intervalPct')} error={errors.intervalPct} /></Field>
                          <Field label="Lệch ngẫu nhiên ± (%)" error={errors.jitterPct}><LightInput type="number" min="0" value={form.jitterPct} onChange={set('jitterPct')} error={errors.jitterPct} /></Field>
                          <Field label="Cách nhau tối thiểu (% thời lượng)" error={errors.minGap}><LightInput type="number" min="0" value={form.minGap} onChange={set('minGap')} error={errors.minGap} /></Field>
                          <Field label="Không chèn trong N% cuối" error={errors.endGuard}><LightInput type="number" min="0" value={form.endGuard} onChange={set('endGuard')} error={errors.endGuard} /></Field>
                          <Field label="Bỏ mid-roll nếu video ngắn hơn (giây)" hint="0 = luôn có" error={errors.minDuration}><LightInput type="number" min="0" value={form.minDuration} onChange={set('minDuration')} error={errors.minDuration} /></Field>
                          <Field label="Tối đa mid-roll" error={errors.maxMid}><LightInput type="number" min="0" value={form.maxMid} onChange={set('maxMid')} error={errors.maxMid} /></Field>
                        </div>
                        {(() => {
                          const pos = nominalPositions(form);
                          return (
                            <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: T.accent, margin: 0, lineHeight: 1.5 }}>
                              {pos.length
                                ? `Mỗi video: ${pos.map((p) => `${p}%`).join(' · ')} (lệch ±${Math.round(n(form.jitterPct))}% của khoảng cách)`
                                : 'Không có mid-roll'}
                            </p>
                          );
                        })()}
                      </Section>

                      <Section title="Quảng cáo cuối video (post-roll)">
                        <Field label="Xác suất có post-roll (%)" error={errors.postPct}><LightInput type="number" min="0" value={form.postPct} onChange={set('postPct')} error={errors.postPct} /></Field>
                      </Section>
                    </div>

                    <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>
                      Ngẫu nhiên lấy ad từ các Global Slot đang bật; content có Override riêng vẫn dùng lịch tay. Giá trị vượt giới hạn sẽ được server tự điều chỉnh khi lưu.
                    </p>
                  </>
                )}
              </div>

              {/* ═══ PHẢI: xem thử ═══ */}
              <div className="ass-pane" style={{ minHeight: 0, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>Xem thử một lượt xem</p>
                  <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, margin: '4px 0 0', lineHeight: 1.5 }}>
                    Tự cập nhật khi bạn chỉnh (chưa cần lưu) và chạy đúng thuật toán của server. Bấm "Tạo lại" để thấy một lượt xem khác.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr) auto', gap: 10, alignItems: 'end' }}>
                  <Field label="Hình thức" hint={scopeDesc(pvScope)}>
                    <LightSelect value={pvScope} onChange={setPvScope}>
                      {PREVIEW_SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </LightSelect>
                  </Field>
                  <Field label="Độ dài video mẫu (phút)">
                    <LightInput type="number" min="1" value={pvMin} onChange={setPvMin} />
                  </Field>
                  <button type="button" disabled={loading || invalid || pv.loading} onClick={() => { immediate.current = true; setTick((t) => t + 1); }} style={{
                    height: 40, padding: '0 14px', borderRadius: 10, cursor: loading || invalid || pv.loading ? 'not-allowed' : 'pointer',
                    background: T.accent, color: '#fff', border: 'none', fontFamily: FONT, fontSize: 13, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 6, opacity: loading || invalid || pv.loading ? 0.6 : 1,
                  }}>
                    <RefreshCw size={13} style={pv.loading ? { animation: 'spin 0.75s linear infinite' } : undefined} /> Tạo lại
                  </button>
                </div>

                {invalid && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, background: '#FFFBEB', border: '1px solid rgba(217,119,6,0.25)' }}>
                    <AlertCircle size={13} color="#D97706" />
                    <p style={{ fontFamily: FONT, fontSize: 12, color: '#92400E', margin: 0 }}>Sửa các ô đang báo lỗi để xem thử.</p>
                  </div>
                )}
                {pv.error && !invalid && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)' }}>
                    <AlertCircle size={13} color={T.red} />
                    <p style={{ fontFamily: FONT, fontSize: 12, color: T.red, margin: 0 }}>Không tạo được lịch xem thử. Bấm "Tạo lại" để thử lại.</p>
                  </div>
                )}

                {pv.data && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, opacity: pv.loading ? 0.55 : 1, transition: 'opacity 0.15s' }}>
                    {/* Kho quảng cáo */}
                    <div style={{ padding: '12px 14px', borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${pool.length ? T.border : 'rgba(217,119,6,0.4)'}` }}>
                      <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>
                        Kho quảng cáo ({pool.length})
                      </p>
                      {pool.length ? (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {pool.map((a) => (
                            <span key={a.adId} style={{ padding: '3px 10px', borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, fontFamily: FONT, fontSize: 12, color: T.textSub }}>
                              {a.title} · {a.durationSeconds}s
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontFamily: FONT, fontSize: 12.5, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                          Chưa có quảng cáo nào đang bật được gắn Global Slot cho hình thức này, nên sẽ không phát gì. Vào "Lịch phát" của một quảng cáo để thêm vào kho.
                        </p>
                      )}
                    </div>

                    <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: T.accent, margin: 0 }}>
                      {previewIsRandom ? 'Lịch ngẫu nhiên mẫu' : 'Đang ở chế độ Cố định: hiển thị lịch cố định từ Global Slot (không ngẫu nhiên)'}
                    </p>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <Stat label="Pre-roll" value={count('PreRoll')} />
                      <Stat label="Mid-roll" value={count('MidRoll')} />
                      <Stat label="Post-roll" value={count('PostRoll')} />
                    </div>

                    <div style={{ padding: '14px 16px', borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                      <AdTimeline
                        items={items}
                        durationSeconds={pv.data.durationSeconds}
                        emptyText={pool.length
                          ? 'Lượt này không có quảng cáo nào (pre-roll có thể ra 0 ad, video ngắn không có mid-roll, post-roll theo xác suất). Bấm "Tạo lại" để xem lượt khác.'
                          : 'Lịch trống vì kho quảng cáo đang rỗng.'}
                      />
                    </div>
                  </div>
                )}

                {!pv.data && !pv.error && !invalid && !loading && <div style={{ padding: '40px 0' }}><Spinner /></div>}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
              <button onClick={handleReset} disabled={saving || loading} style={{
                padding: '8px 14px', borderRadius: 8, cursor: saving || loading ? 'not-allowed' : 'pointer',
                background: confirmReset ? '#FEF2F2' : T.surfaceAlt, border: `1px solid ${confirmReset ? 'rgba(220,38,38,0.3)' : T.border}`,
                fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: confirmReset ? T.red : T.textSub, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <RotateCcw size={12} /> {confirmReset ? 'Bấm lần nữa để khôi phục mặc định' : 'Khôi phục mặc định'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {dirty && (
                  <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: confirmDiscard ? T.red : '#D97706' }}>
                    {confirmDiscard ? 'Có thay đổi chưa lưu — bấm Hủy lần nữa để bỏ' : 'Chưa lưu'}
                  </span>
                )}
                <button onClick={close} style={{ padding: '8px 16px', borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub }}>Hủy</button>
                <button onClick={handleSave} disabled={saving || loading || invalid || !dirty} style={{
                  padding: '8px 18px', borderRadius: 8, background: T.accent, border: '1px solid transparent',
                  cursor: saving || loading || invalid || !dirty ? 'not-allowed' : 'pointer',
                  fontFamily: FONT, fontSize: 13, fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: 6,
                  opacity: saving || loading || invalid || !dirty ? 0.55 : 1,
                }}>
                  <Check size={13} /> {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}