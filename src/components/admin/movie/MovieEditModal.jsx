// src/components/admin/movie/MovieEditModal.jsx  ← REDESIGNED light theme
import React, { useState, useEffect } from 'react';
import { Check, Crown } from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { Button, Modal } from '../../ui';

const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const T = {
  bg:          '#F4F3EF',
  surface:     '#FFFFFF',
  surfaceAlt:  '#FAFAF8',
  accent:      '#1C5F3A',
  accentLight: '#EAF5EF',
  accentText:  '#155230',
  text:        '#18181B',
  textSub:     '#71717A',
  textMuted:   '#A1A1AA',
  border:      'rgba(0,0,0,0.08)',
  borderFocus: 'rgba(28,95,58,0.4)',
  red:         '#DC2626',
  gold:        '#D97706',
  goldLight:   '#FEF3C7',
};

// ── Field components ──────────────────────────────────────────────────────────
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

/**
 * Toggle switch kiểu pill cho trường isPremium.
 * Bấm vào thẻ label → checkbox ẩn toggle → giao diện đổi màu.
 */
function PremiumToggleField({ value, onChange }) {
  const id = 'premium-toggle-edit';
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
          background: value ? T.goldLight : T.surfaceAlt,
          border: `1px solid ${value ? 'rgba(217,119,6,0.35)' : T.border}`,
          transition: 'all 0.18s',
          userSelect: 'none',
        }}
      >
        {/* Hidden checkbox */}
        <input
          id={id}
          type="checkbox"
          checked={value}
          onChange={e => onChange(e.target.checked)}
          style={{ display: 'none' }}
        />

        {/* Visual toggle pill */}
        <div style={{
          width: 36, height: 20, borderRadius: 10, flexShrink: 0,
          background: value
            ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
            : 'rgba(0,0,0,0.12)',
          position: 'relative', transition: 'background 0.18s',
          boxShadow: value ? '0 1px 6px rgba(245,158,11,0.4)' : 'none',
        }}>
          <div style={{
            position: 'absolute', top: 2,
            left: value ? 18 : 2,
            width: 16, height: 16, borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.18s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </div>

        {/* Label text + icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Crown size={14} color={value ? T.gold : T.textMuted} style={{ flexShrink: 0, transition: 'color 0.18s' }} />
          <span style={{
            fontFamily: FONT, fontSize: 13.5, fontWeight: value ? 700 : 500,
            color: value ? '#92400E' : T.textSub,
            transition: 'color 0.18s',
          }}>
            {value ? 'Premium — Chỉ tài khoản Premium mới xem được' : 'Free — Ai cũng xem được'}
          </span>
        </div>
      </label>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MovieEditModal({ movie, onClose, onSaved }) {
  const [form,   setForm]   = useState({ title: '', description: '', imdbRating: '', isPremium: false });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (movie) {
      setForm({
        title:       movie.title       ?? '',
        description: movie.description ?? '',
        imdbRating:  movie.rating != null ? String(movie.rating) : '',
        isPremium:   movie.isPremium   ?? false,
      });
      setError('');
    }
  }, [movie]);

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Tên phim không được để trống'); return; }
    const rating = form.imdbRating ? parseFloat(form.imdbRating) : null;
    if (rating !== null && (isNaN(rating) || rating < 0 || rating > 10)) {
      setError('Rating phải từ 0 đến 10'); return;
    }
    setSaving(true); setError('');
    try {
      await axiosInstance.put(`/movies/${movie.id}`, {
        title:       form.title.trim(),
        description: form.description.trim() || null,
        imdbRating:  rating,
        isPremium:   form.isPremium,
      });
      onSaved?.({
        ...movie,
        title:       form.title.trim(),
        description: form.description.trim(),
        rating,
        isPremium:   form.isPremium,
      });
      onClose();
    } catch (e) {
      setError(e?.message ?? 'Có lỗi xảy ra');
    } finally { setSaving(false); }
  };

  return (
    <Modal
      isOpen={!!movie}
      onClose={onClose}
      title={`Chỉnh sửa phim`}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Hủy</Button>
          <Button variant="primary" size="sm" loading={saving} icon={<Check size={14}/>} onClick={handleSave}>
            Lưu thay đổi
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: FONT }}>

        {/* Poster preview */}
        {movie?.posterUrl && (
          <div style={{
            display: 'flex', gap: 14, alignItems: 'center',
            padding: '12px 14px', borderRadius: 10,
            background: T.surfaceAlt, border: `1px solid ${T.border}`,
          }}>
            <img src={movie.posterUrl} alt=""
              style={{ width: 48, height: 68, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: `1px solid ${T.border}` }}
            />
            <div>
              <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
                Đang chỉnh sửa
              </p>
              <p style={{ fontFamily: FONT, fontSize: 14, color: T.text, fontWeight: 700, lineHeight: 1.4 }}>
                {movie?.title}
              </p>
              {movie?.tmdbId && (
                <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                  TMDB #{movie.tmdbId}
                </p>
              )}
            </div>
          </div>
        )}

        <LightInput
          label="Tên phim"
          placeholder="Tên phim..."
          value={form.title}
          onChange={v => setForm(f => ({ ...f, title: v }))}
          error={/tên|Tên/i.test(error) ? error : ''}
        />

        <LightTextarea
          label="Mô tả"
          placeholder="Nội dung mô tả phim..."
          value={form.description}
          onChange={v => setForm(f => ({ ...f, description: v }))}
          rows={4}
        />

        <LightInput
          label="Rating IMDB (0–10)"
          placeholder="VD: 8.5"
          value={form.imdbRating}
          onChange={v => setForm(f => ({ ...f, imdbRating: v }))}
          error={/Rating/i.test(error) ? error : ''}
        />

        {/* NEW: Premium toggle */}
        <PremiumToggleField
          value={form.isPremium}
          onChange={v => setForm(f => ({ ...f, isPremium: v }))}
        />

        {error && !/tên|Tên|Rating/i.test(error) && (
          <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.red }}>{error}</p>
        )}

        <p style={{
          fontFamily: FONT, fontSize: 12, color: T.textMuted,
          lineHeight: 1.65, padding: '10px 14px',
          background: T.surfaceAlt, borderRadius: 9,
          border: `1px solid ${T.border}`, margin: 0,
        }}>
          Chỉ có thể sửa tên, mô tả, rating và loại nội dung. Để cập nhật thông tin khác hãy xóa và import lại từ TMDB.
        </p>
      </div>
    </Modal>
  );
}