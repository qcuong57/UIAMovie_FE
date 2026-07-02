// src/components/admin/ads/AdCreateModal.jsx
import React, { useState, useRef } from 'react';
import { X, Upload, Link, Check, MonitorPlay } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import adService from '../../../services/adService';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../../context/adminTokens';

// ── Reusable field atoms ───────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </label>
      )}
      {children}
      {error && <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red, margin: 0 }}>{error}</p>}
    </div>
  );
}

function LightInput({ value, onChange, placeholder, type = 'text', min, max, step, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} value={value} min={min} max={max} step={step}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        height: 42, padding: '0 14px',
        background: T.surface,
        border: `1px solid ${error ? 'rgba(220,38,38,0.5)' : focused ? T.borderFocus : T.border}`,
        borderRadius: 10, color: T.text, outline: 'none',
        fontFamily: FONT, fontSize: 13.5, width: '100%', boxSizing: 'border-box',
        transition: 'border-color 0.15s',
      }}
    />
  );
}

// ── Video source toggle ───────────────────────────────────────────────────────
function SourceToggle({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0, background: T.surfaceAlt, borderRadius: 10, padding: 3, border: `1px solid ${T.border}` }}>
      {[
        { key: 'upload', icon: Upload, label: 'Upload file' },
        { key: 'url',    icon: Link,   label: 'URL ngoài'   },
      ].map(opt => (
        <button key={opt.key} onClick={() => onChange(opt.key)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontFamily: FONT, fontSize: 13, fontWeight: value === opt.key ? 700 : 500,
            background: value === opt.key ? T.surface : 'transparent',
            color: value === opt.key ? T.text : T.textSub,
            boxShadow: value === opt.key ? T.shadow : 'none',
            transition: 'all 0.15s',
          }}
        >
          <opt.icon size={13} />
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── File drop zone ────────────────────────────────────────────────────────────
function VideoDropZone({ file, onFile }) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef();

  const accept = (f) => {
    if (f && f.type.startsWith('video/')) onFile(f);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files[0]); }}
      onClick={() => ref.current?.click()}
      style={{
        border: `2px dashed ${dragging ? T.accent : file ? 'rgba(28,95,58,0.35)' : T.border}`,
        borderRadius: 12, padding: '24px 16px', textAlign: 'center',
        background: dragging ? T.accentLight : file ? '#F0FDF4' : T.surfaceAlt,
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      <input ref={ref} type="file" accept="video/*" style={{ display: 'none' }}
        onChange={e => accept(e.target.files[0])} />

      {file ? (
        <>
          <MonitorPlay size={22} color={T.accent} style={{ margin: '0 auto 8px', display: 'block' }} />
          <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: T.text }}>{file.name}</p>
          <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, marginTop: 4 }}>
            {(file.size / 1024 / 1024).toFixed(1)} MB · bấm để đổi file
          </p>
        </>
      ) : (
        <>
          <Upload size={22} color={T.textMuted} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
          <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: T.textSub }}>Kéo thả hoặc bấm để chọn video</p>
          <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, marginTop: 4 }}>MP4, MOV, WebM · tối đa 500MB</p>
        </>
      )}
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ percent }) {
  return (
    <div style={{ height: 6, borderRadius: 99, background: T.accentLight, overflow: 'hidden' }}>
      <motion.div animate={{ width: `${percent}%` }} transition={{ duration: 0.3 }}
        style={{ height: '100%', borderRadius: 99, background: T.accent }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function AdCreateModal({ open, onClose, onCreated }) {
  const initForm = () => ({
    title: '', durationSeconds: '', skipAfterSeconds: '', clickThroughUrl: '',
  });

  const [form,      setForm]      = useState(initForm());
  const [source,    setSource]    = useState('upload');
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl,  setVideoUrl]  = useState('');
  const [saving,    setSaving]    = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [errors,    setErrors]    = useState({});
  const [globalErr, setGlobalErr] = useState('');

  const setF = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.title.trim())              e.title = 'Tên quảng cáo không được để trống';
    if (!form.durationSeconds || isNaN(+form.durationSeconds) || +form.durationSeconds <= 0)
                                          e.durationSeconds = 'Thời lượng phải > 0';
    if (form.skipAfterSeconds && (isNaN(+form.skipAfterSeconds) || +form.skipAfterSeconds < 0))
                                          e.skipAfterSeconds = 'Giá trị không hợp lệ';
    if (source === 'upload' && !videoFile) e.video = 'Chọn file video để upload';
    if (source === 'url'    && !videoUrl.trim()) e.video = 'Nhập URL video';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setProgress(0); setGlobalErr('');
    try {
      await adService.createAd({
        title:             form.title.trim(),
        durationSeconds:   parseInt(form.durationSeconds),
        skipAfterSeconds:  form.skipAfterSeconds ? parseInt(form.skipAfterSeconds) : null,
        clickThroughUrl:   form.clickThroughUrl.trim() || null,
        videoFile:         source === 'upload' ? videoFile : null,
        videoUrl:          source === 'url'    ? videoUrl.trim() : null,
      }, (pct) => setProgress(pct));
      // reset
      setForm(initForm()); setVideoFile(null); setVideoUrl(''); setErrors({});
      onCreated?.();
    } catch (err) {
      setGlobalErr(err?.response?.data?.message ?? err?.message ?? 'Có lỗi xảy ra');
    } finally { setSaving(false); }
  };

  const handleClose = () => {
    if (saving) return;
    setForm(initForm()); setVideoFile(null); setVideoUrl(''); setErrors({}); setGlobalErr('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <style>{ADMIN_GOOGLE_FONTS}</style>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 299, backdropFilter: 'blur(3px)' }}
          />

          <motion.div key="modal"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{   opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            style={{
              position: 'fixed', inset: 0, margin: 'auto',
              width: 520, height: 'fit-content', maxHeight: '92vh',
              zIndex: 300, background: T.surface, borderRadius: 16,
              border: `1px solid ${T.border}`, boxShadow: T.shadowLg,
              display: 'flex', flexDirection: 'column', fontFamily: FONT, overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <p style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3, fontWeight: 600 }}>Quảng cáo</p>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em', fontFamily: FONT_TITLE }}>Thêm quảng cáo mới</h2>
              </div>
              <button onClick={handleClose} disabled={saving}
                style={{ width: 32, height: 32, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: saving ? 'not-allowed' : 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.5 : 1 }}>
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

              <Field label="Tên quảng cáo" error={errors.title}>
                <LightInput value={form.title} onChange={setF('title')} placeholder="VD: Nike Summer 2025" error={errors.title} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Thời lượng (giây)" error={errors.durationSeconds}>
                  <LightInput type="number" value={form.durationSeconds} onChange={setF('durationSeconds')} placeholder="VD: 30" min="1" error={errors.durationSeconds} />
                </Field>
                <Field label="Cho phép skip sau (giây)" error={errors.skipAfterSeconds}>
                  <LightInput type="number" value={form.skipAfterSeconds} onChange={setF('skipAfterSeconds')} placeholder="Để trống = không skip" min="0" error={errors.skipAfterSeconds} />
                </Field>
              </div>

              <Field label="Click-through URL (tuỳ chọn)">
                <LightInput value={form.clickThroughUrl} onChange={setF('clickThroughUrl')} placeholder="https://example.com" />
              </Field>

              {/* Video source */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Nguồn video
                </label>
                <SourceToggle value={source} onChange={(v) => { setSource(v); setErrors(e => ({ ...e, video: '' })); }} />

                {source === 'upload' ? (
                  <VideoDropZone file={videoFile} onFile={f => { setVideoFile(f); setErrors(e => ({ ...e, video: '' })); }} />
                ) : (
                  <LightInput value={videoUrl} onChange={v => { setVideoUrl(v); setErrors(e => ({ ...e, video: '' })); }} placeholder="https://example.com/ad.mp4" error={errors.video} />
                )}
                {errors.video && source === 'upload' && (
                  <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red }}>{errors.video}</p>
                )}
              </div>

              {/* Upload progress */}
              {saving && source === 'upload' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: FONT, fontSize: 12, color: T.textSub }}>Đang upload…</span>
                    <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: T.accent }}>{progress}%</span>
                  </div>
                  <ProgressBar percent={progress} />
                </div>
              )}

              {globalErr && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.25)', fontFamily: FONT, fontSize: 12.5, color: T.red }}>
                  {globalErr}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
              <button onClick={handleClose} disabled={saving}
                style={{ padding: '8px 16px', borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub, opacity: saving ? 0.6 : 1 }}>
                Hủy
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{
                  padding: '8px 18px', borderRadius: 8,
                  background: saving ? T.accentLight : T.accent,
                  border: `1px solid ${saving ? T.accent + '30' : 'transparent'}`,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: FONT, fontSize: 13, fontWeight: 600,
                  color: saving ? T.accentText : 'white',
                  display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s',
                }}>
                {saving
                  ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Đang tạo...</>
                  : <><Check size={13} /> Tạo quảng cáo</>
                }
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}