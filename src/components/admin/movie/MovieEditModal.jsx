// src/components/admin/MovieEditModal.jsx
import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { Button, Input, Modal } from '../../ui';
import { C, FONT_BODY } from '../../../context/homeTokens';

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
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={!!movie}
      onClose={onClose}
      title={`Chỉnh sửa: ${movie?.title ?? ''}`}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Poster preview */}
        {movie?.posterUrl && (
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
            <img src={movie.posterUrl} alt="" style={{ width: 48, height: 68, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }}/>
            <div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Đang chỉnh sửa</p>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'white', fontWeight: 600 }}>{movie?.title}</p>
              {movie?.tmdbId && <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>TMDB #{movie.tmdbId}</p>}
            </div>
          </div>
        )}

        <Input
          label="Tên phim"
          placeholder="Tên phim..."
          value={form.title}
          onChange={v => setForm(f => ({ ...f, title: v }))}
          error={error && error.includes('tên') ? error : ''}
        />

        {/* Description textarea */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Mô tả
          </label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Nội dung mô tả phim..."
            rows={4}
            style={{
              width: '100%', padding: '10px 14px',
              background: '#111', border: `1px solid ${C.border}`,
              borderRadius: 8, color: 'white', outline: 'none',
              fontFamily: FONT_BODY, fontSize: 13, resize: 'vertical',
              lineHeight: 1.6,
            }}
          />
        </div>

        <Input
          label="Rating IMDB (0–10)"
          placeholder="VD: 8.5"
          value={form.imdbRating}
          onChange={v => setForm(f => ({ ...f, imdbRating: v }))}
          error={error && error.includes('Rating') ? error : ''}
        />

        {error && !error.includes('tên') && !error.includes('Rating') && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: '#e5181e' }}>{error}</p>
        )}

        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
          Chỉ có thể sửa tên, mô tả và rating. Để cập nhật thông tin khác hãy xóa và import lại từ TMDB.
        </p>
      </div>
    </Modal>
  );
}