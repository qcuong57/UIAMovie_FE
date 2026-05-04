// src/components/admin/movie/MovieEditModal.jsx  ← REDESIGNED light theme
import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MovieEditModal({ movie, onClose, onSaved }) {
  const [form,   setForm]   = useState({ title: '', description: '', imdbRating: '' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (movie) {
      setForm({
        title:       movie.title       ?? '',
        description: movie.description ?? '',
        imdbRating:  movie.rating != null ? String(movie.rating) : '',
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
      });
      onSaved?.({ ...movie, title: form.title.trim(), description: form.description.trim(), rating });
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

        {error && !/tên|Tên|Rating/i.test(error) && (
          <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.red }}>{error}</p>
        )}

        <p style={{
          fontFamily: FONT, fontSize: 12, color: T.textMuted,
          lineHeight: 1.65, padding: '10px 14px',
          background: T.surfaceAlt, borderRadius: 9,
          border: `1px solid ${T.border}`, margin: 0,
        }}>
          Chỉ có thể sửa tên, mô tả và rating. Để cập nhật thông tin khác hãy xóa và import lại từ TMDB.
        </p>
      </div>
    </Modal>
  );
}