// src/components/admin/tvshow/TvShowEditModal.jsx
import React, { useState, useEffect } from 'react';
import { Check, Crown, X } from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../../context/adminTokens';

function LightInput({ label, value, onChange, placeholder, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </label>
      )}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: 42, padding: '0 14px',
          background: T.surface,
          border: `1px solid ${error ? 'rgba(220,38,38,0.5)' : focused ? T.borderFocus : T.border}`,
          borderRadius: 10, color: T.text, outline: 'none',
          fontFamily: FONT, fontSize: 13.5,
          transition: 'border-color 0.15s', boxSizing: 'border-box', width: '100%',
        }}
      />
      {error && <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red }}>{error}</p>}
    </div>
  );
}

function LightTextarea({ label, value, onChange, placeholder, rows = 4 }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '10px 14px',
          background: T.surface,
          border: `1px solid ${focused ? T.borderFocus : T.border}`,
          borderRadius: 10, color: T.text, outline: 'none',
          fontFamily: FONT, fontSize: 13.5, lineHeight: 1.65,
          resize: 'vertical', transition: 'border-color 0.15s',
          boxSizing: 'border-box', width: '100%',
        }}
      />
    </div>
  );
}

const gold      = '#D97706';
const goldLight = '#FEF3C7';

function PremiumToggleField({ value, onChange }) {
  const id = 'premium-toggle-tvshow-edit';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Loại nội dung
      </label>
      <label
        htmlFor={id}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
          background: value ? goldLight : T.surfaceAlt,
          border: `1px solid ${value ? 'rgba(217,119,6,0.35)' : T.border}`,
          transition: 'all 0.18s', userSelect: 'none',
        }}
      >
        <input id={id} type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} style={{ display: 'none' }} />
        <div style={{
          width: 36, height: 20, borderRadius: 10, flexShrink: 0,
          background: value ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'rgba(0,0,0,0.12)',
          position: 'relative', transition: 'background 0.18s',
          boxShadow: value ? '0 1px 6px rgba(245,158,11,0.4)' : 'none',
        }}>
          <div style={{
            position: 'absolute', top: 2, left: value ? 18 : 2,
            width: 16, height: 16, borderRadius: '50%', background: '#fff',
            transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Crown size={14} color={value ? gold : T.textMuted} style={{ flexShrink: 0, transition: 'color 0.18s' }} />
          <span style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: value ? 700 : 500, color: value ? '#92400E' : T.textSub, transition: 'color 0.18s' }}>
            {value ? 'Premium — Chỉ tài khoản Premium mới xem được' : 'Free — Ai cũng xem được'}
          </span>
        </div>
      </label>
    </div>
  );
}

export default function TvShowEditModal({ show, onClose, onSaved }) {
  const [form,   setForm]   = useState({ title: '', description: '', rating: '', isPremium: false });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (show) {
      setForm({
        title:       show.title ?? show.name ?? '',
        description: show.description ?? '',
        rating:      show.rating != null ? String(show.rating) : '',
        isPremium:   show.isPremium ?? false,
      });
      setError('');
    }
  }, [show]);

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Tên TV show không được để trống'); return; }
    const rating = form.rating ? parseFloat(form.rating) : null;
    if (rating !== null && (isNaN(rating) || rating < 0 || rating > 10)) {
      setError('Rating phải từ 0 đến 10'); return;
    }
    setSaving(true); setError('');
    try {
      await axiosInstance.put(`/tvshows/${show.id}`, {
        title:       form.title.trim(),
        description: form.description.trim() || null,
        rating,
        isPremium:   form.isPremium,
      });
      onSaved?.({ ...show, title: form.title.trim(), description: form.description.trim(), rating, isPremium: form.isPremium });
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Có lỗi xảy ra');
    } finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {!!show && (
        <>
          <style>{ADMIN_GOOGLE_FONTS}</style>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 299, backdropFilter: 'blur(3px)' }}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{   opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            style={{
              position: 'fixed', inset: 0, margin: 'auto',
              width: 500, height: 'fit-content', maxHeight: '90vh',
              zIndex: 300,
              background: T.surface,
              borderRadius: 16,
              border: `1px solid ${T.border}`,
              boxShadow: T.shadowLg,
              display: 'flex', flexDirection: 'column',
              fontFamily: FONT, overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <p style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3, fontWeight: 600, fontFamily: FONT }}>TV Show</p>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em', fontFamily: FONT_TITLE }}>Chỉnh sửa</h2>
              </div>
              <button
                onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: T.surface, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Poster preview */}
              {show?.posterUrl && (
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 14px', borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                  <img src={show.posterUrl} alt=""
                    style={{ width: 48, height: 68, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: `1px solid ${T.border}` }}
                  />
                  <div>
                    <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Đang chỉnh sửa</p>
                    <p style={{ fontFamily: FONT, fontSize: 14, color: T.text, fontWeight: 700, lineHeight: 1.4 }}>{show?.title ?? show?.name}</p>
                    {show?.numberOfSeasons > 0 && (
                      <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                        {show.numberOfSeasons} mùa{show?.tmdbId ? ` · TMDB #${show.tmdbId}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <LightInput label="Tên TV show" placeholder="Tên TV show..." value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} error={/tên|Tên/i.test(error) ? error : ''} />
              <LightTextarea label="Mô tả" placeholder="Nội dung mô tả TV show..." value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} rows={4} />
              <LightInput label="Rating IMDB (0–10)" placeholder="VD: 8.5" value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} error={/Rating/i.test(error) ? error : ''} />
              <PremiumToggleField value={form.isPremium} onChange={v => setForm(f => ({ ...f, isPremium: v }))} />

              {error && !/tên|Tên|Rating/i.test(error) && (
                <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.red }}>{error}</p>
              )}

              <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, lineHeight: 1.65, padding: '10px 14px', background: T.surfaceAlt, borderRadius: 9, border: `1px solid ${T.border}`, margin: 0 }}>
                Chỉ có thể sửa tên, mô tả, rating và loại nội dung. Để cập nhật thông tin khác hãy xóa và import lại từ TMDB.
              </p>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: T.surface, display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
              <button
                onClick={onClose}
                style={{ padding: '8px 16px', borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub }}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '8px 18px', borderRadius: 8, background: saving ? T.accentLight : T.accent, border: `1px solid ${saving ? T.accent + '30' : 'transparent'}`, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: saving ? T.accentText : 'white', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s' }}
              >
                {saving
                  ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Đang lưu...</>
                  : <><Check size={13} /> Lưu thay đổi</>
                }
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}