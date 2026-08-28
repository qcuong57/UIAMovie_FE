// src/components/admin/ads/AdEditModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Link, Save, MonitorPlay, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import adService from '../../../services/adService';
import { useToast } from '../common/Toast';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../../context/adminTokens';

// ── Atoms ─────────────────────────────────────────────────────────────────────
function Field({ label, hint, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {label}
          </label>
          {hint && <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>{hint}</span>}
        </div>
      )}
      {children}
      {error && <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red, margin: 0 }}>{error}</p>}
    </div>
  );
}

function LightInput({ value, onChange, placeholder, type = 'text', min, error, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} value={value ?? ''} min={min}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
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

function ToggleSwitch({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', padding: 3,
          background: value ? T.accent : T.borderMed,
          transition: 'background 0.2s', position: 'relative', flexShrink: 0,
        }}
      >
        <motion.div
          animate={{ x: value ? 18 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
        />
      </button>
      <span style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}

function SourceToggle({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0, background: T.surfaceAlt, borderRadius: 10, padding: 3, border: `1px solid ${T.border}` }}>
      {[
        { key: 'upload', icon: Upload, label: 'Upload file mới' },
        { key: 'url',    icon: Link,   label: 'Thay bằng URL'   },
        { key: 'keep',   icon: MonitorPlay, label: 'Giữ nguyên' },
      ].map(opt => (
        <button key={opt.key} onClick={() => onChange(opt.key)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontFamily: FONT, fontSize: 12, fontWeight: value === opt.key ? 700 : 500,
            background: value === opt.key ? T.surface : 'transparent',
            color: value === opt.key ? T.text : T.textSub,
            boxShadow: value === opt.key ? T.shadow : 'none',
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}
        >
          <opt.icon size={12} />
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function VideoDropZone({ file, onFile }) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef();
  const accept = (f) => { if (f && f.type.startsWith('video/')) onFile(f); };
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files[0]); }}
      onClick={() => ref.current?.click()}
      style={{
        border: `2px dashed ${dragging ? T.accent : file ? 'rgba(28,95,58,0.35)' : T.border}`,
        borderRadius: 12, padding: '20px 16px', textAlign: 'center',
        background: dragging ? T.accentLight : file ? '#F0FDF4' : T.surfaceAlt,
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      <input ref={ref} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => accept(e.target.files[0])} />
      {file ? (
        <>
          <MonitorPlay size={20} color={T.accent} style={{ margin: '0 auto 6px', display: 'block' }} />
          <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.text }}>{file.name}</p>
          <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, marginTop: 3 }}>
            {(file.size / 1024 / 1024).toFixed(1)} MB · bấm để đổi
          </p>
        </>
      ) : (
        <>
          <Upload size={20} color={T.textMuted} style={{ margin: '0 auto 6px', display: 'block', opacity: 0.4 }} />
          <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub }}>Kéo thả hoặc bấm để chọn video</p>
          <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, marginTop: 3 }}>MP4, MOV, WebM · tối đa 500MB</p>
        </>
      )}
    </div>
  );
}

function ImageDropZone({ file, onFile }) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const ref = useRef();
  const accept = (f) => { if (f && f.type.startsWith('image/')) onFile(f); };

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files[0]); }}
      onClick={() => ref.current?.click()}
      style={{
        border: `2px dashed ${dragging ? T.accent : file ? 'rgba(28,95,58,0.35)' : T.border}`,
        borderRadius: 12, padding: '14px 16px', textAlign: 'center',
        background: dragging ? T.accentLight : file ? '#F0FDF4' : T.surfaceAlt,
        cursor: 'pointer', transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => accept(e.target.files[0])} />
      <div style={{
        width: 40, height: 40, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
        background: T.surface, border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {preview
          ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3, boxSizing: 'border-box' }} />
          : <ImageIcon size={16} color={T.textMuted} style={{ opacity: 0.4 }} />
        }
      </div>
      <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
        {file ? (
          <>
            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
            <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, marginTop: 2 }}>{(file.size / 1024).toFixed(0)} KB · bấm để đổi</p>
          </>
        ) : (
          <>
            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub }}>Kéo thả hoặc bấm để chọn ảnh nhãn hiệu</p>
            <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, marginTop: 2 }}>PNG, JPG, WebP</p>
          </>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ percent }) {
  return (
    <div style={{ height: 5, borderRadius: 99, background: T.accentLight, overflow: 'hidden' }}>
      <motion.div animate={{ width: `${percent}%` }} transition={{ duration: 0.3 }}
        style={{ height: '100%', borderRadius: 99, background: T.accent }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function AdEditModal({ ad, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '', durationSeconds: '', skipAfterSeconds: '', clickThroughUrl: '', isActive: true,
  });
  const [videoSource, setVideoSource] = useState('keep');
  const [videoFile,   setVideoFile]   = useState(null);
  const [videoUrl,    setVideoUrl]    = useState('');
  const [brandImageSource, setBrandImageSource] = useState('keep');
  const [brandImageFile,   setBrandImageFile]   = useState(null);
  const [brandImageUrl,    setBrandImageUrl]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [errors,      setErrors]      = useState({});
  const toast = useToast();

  // Sync form khi ad thay đổi
  useEffect(() => {
    if (!ad) return;
    setForm({
      title:            ad.title ?? '',
      durationSeconds:  String(ad.durationSeconds ?? ''),
      skipAfterSeconds: ad.skipAfterSeconds != null ? String(ad.skipAfterSeconds) : '',
      clickThroughUrl:  ad.clickThroughUrl ?? '',
      isActive:         ad.isActive ?? true,
    });
    setVideoSource('keep');
    setVideoFile(null);
    setVideoUrl('');
    setBrandImageSource('keep');
    setBrandImageFile(null);
    setBrandImageUrl('');
    setErrors({});
  }, [ad]);

  const setF = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.title.trim())
      e.title = 'Tên quảng cáo không được để trống';
    if (!form.durationSeconds || isNaN(+form.durationSeconds) || +form.durationSeconds <= 0)
      e.durationSeconds = 'Thời lượng phải > 0';
    if (form.skipAfterSeconds && (isNaN(+form.skipAfterSeconds) || +form.skipAfterSeconds < 0))
      e.skipAfterSeconds = 'Giá trị không hợp lệ';
    if (videoSource === 'upload' && !videoFile)
      e.video = 'Chọn file video để upload';
    if (videoSource === 'url' && !videoUrl.trim())
      e.video = 'Nhập URL video';
    if (brandImageSource === 'upload' && !brandImageFile)
      e.brandImage = 'Chọn ảnh nhãn hiệu để upload';
    if (brandImageSource === 'url' && !brandImageUrl.trim())
      e.brandImage = 'Nhập URL ảnh nhãn hiệu';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setProgress(0);
    try {
      const dto = {
        title:           form.title.trim(),
        durationSeconds: parseInt(form.durationSeconds),
        skipAfterSeconds: form.skipAfterSeconds ? parseInt(form.skipAfterSeconds) : null,
        clickThroughUrl:  form.clickThroughUrl.trim() || null,
        isActive:         form.isActive,
      };
      if (videoSource === 'upload') dto.videoFile = videoFile;
      if (videoSource === 'url')    dto.videoUrl  = videoUrl.trim();
      if (brandImageSource === 'upload') dto.brandImageFile = brandImageFile;
      if (brandImageSource === 'url')    dto.brandImageUrl  = brandImageUrl.trim();

      await adService.updateAd(ad.id, dto, (pct) => setProgress(pct));
      onSaved?.({
        ...ad, ...dto,
        videoUrl: videoSource === 'url' ? videoUrl.trim() : ad.videoUrl,
        brandImageUrl: brandImageSource === 'url' ? brandImageUrl.trim() : ad.brandImageUrl,
      });
      toast.success(`Đã cập nhật quảng cáo "${form.title.trim()}"`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Có lỗi xảy ra');
    } finally { setSaving(false); }
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const isOpen = !!ad;

  return (
    <AnimatePresence>
      {isOpen && (
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
              width: 540, height: 'fit-content', maxHeight: '92vh',
              zIndex: 300, background: T.surface, borderRadius: 16,
              border: `1px solid ${T.border}`, boxShadow: T.shadowLg,
              display: 'flex', flexDirection: 'column', fontFamily: FONT, overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <p style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3, fontWeight: 600 }}>Chỉnh sửa</p>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em', fontFamily: FONT_TITLE }}>
                  {ad?.title}
                </h2>
              </div>
              <button onClick={handleClose} disabled={saving}
                style={{ width: 32, height: 32, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: saving ? 'not-allowed' : 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.5 : 1 }}>
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Trạng thái */}
              <div style={{ padding: '12px 14px', borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                <ToggleSwitch
                  value={form.isActive}
                  onChange={setF('isActive')}
                  label={form.isActive ? 'Đang chạy — bấm để tạm dừng' : 'Đang tạm dừng — bấm để kích hoạt'}
                />
              </div>

              <Field label="Tên quảng cáo" error={errors.title}>
                <LightInput value={form.title} onChange={setF('title')} placeholder="VD: Nike Summer 2025" error={errors.title} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Thời lượng (giây)" error={errors.durationSeconds}>
                  <LightInput type="number" value={form.durationSeconds} onChange={setF('durationSeconds')} placeholder="VD: 30" min="1" error={errors.durationSeconds} />
                </Field>
                <Field label="Cho phép skip sau (giây)" hint="để trống = không skip" error={errors.skipAfterSeconds}>
                  <LightInput type="number" value={form.skipAfterSeconds} onChange={setF('skipAfterSeconds')} placeholder="—" min="0" error={errors.skipAfterSeconds} />
                </Field>
              </div>

              <Field label="Click-through URL">
                <LightInput value={form.clickThroughUrl} onChange={setF('clickThroughUrl')} placeholder="https://example.com" />
              </Field>

              {/* Video */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Video
                </label>
                <SourceToggle value={videoSource} onChange={(v) => { setVideoSource(v); setErrors(e => ({ ...e, video: '' })); }} />

                {videoSource === 'keep' && ad?.videoUrl && (
                  <div style={{ padding: '10px 14px', borderRadius: 9, background: T.surfaceAlt, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MonitorPlay size={14} color={T.accent} style={{ flexShrink: 0 }} />
                    <span style={{ fontFamily: FONT, fontSize: 12, color: T.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ad.videoUrl}
                    </span>
                  </div>
                )}

                {videoSource === 'upload' && (
                  <VideoDropZone file={videoFile} onFile={f => { setVideoFile(f); setErrors(e => ({ ...e, video: '' })); }} />
                )}

                {videoSource === 'url' && (
                  <LightInput value={videoUrl} onChange={v => { setVideoUrl(v); setErrors(e => ({ ...e, video: '' })); }} placeholder="https://example.com/ad.mp4" error={errors.video} />
                )}

                {errors.video && videoSource !== 'url' && (
                  <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red }}>{errors.video}</p>
                )}
              </div>

              {/* Brand image */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Ảnh nhãn hiệu
                </label>
                <SourceToggle value={brandImageSource} onChange={(v) => { setBrandImageSource(v); setErrors(e => ({ ...e, brandImage: '' })); }} />

                {brandImageSource === 'keep' && ad?.brandImageUrl && (
                  <div style={{ padding: '8px 14px', borderRadius: 9, background: T.surfaceAlt, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, overflow: 'hidden', flexShrink: 0, border: `1px solid ${T.border}`, background: '#fff' }}>
                      <img src={ad.brandImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2, boxSizing: 'border-box' }} />
                    </div>
                    <span style={{ fontFamily: FONT, fontSize: 12, color: T.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ad.brandImageUrl}
                    </span>
                  </div>
                )}

                {brandImageSource === 'upload' && (
                  <ImageDropZone file={brandImageFile} onFile={f => { setBrandImageFile(f); setErrors(e => ({ ...e, brandImage: '' })); }} />
                )}

                {brandImageSource === 'url' && (
                  <LightInput value={brandImageUrl} onChange={v => { setBrandImageUrl(v); setErrors(e => ({ ...e, brandImage: '' })); }} placeholder="https://example.com/logo.png" error={errors.brandImage} />
                )}

                {errors.brandImage && brandImageSource !== 'url' && (
                  <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red }}>{errors.brandImage}</p>
                )}
              </div>

              {/* Progress */}
              {saving && videoSource === 'upload' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: FONT, fontSize: 12, color: T.textSub }}>Đang upload…</span>
                    <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: T.accent }}>{progress}%</span>
                  </div>
                  <ProgressBar percent={progress} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>
                ID: {ad?.id?.slice(0, 8)}…
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
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
                    ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Đang lưu...</>
                    : <><Save size={13} /> Lưu thay đổi</>
                  }
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}