// src/components/admin/tvshow/GenreAndImageFields.jsx
// Ô chọn thể loại (multi-select) và gallery ảnh backdrop, dùng chung cho
// TvShowAddModal & TvShowEditModal.

import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, ImageOff } from 'lucide-react';
import tvShowService from '../../../services/tvShowService';
import { T, FONT_BODY as FONT } from '../../../context/adminTokens';

// ── Chọn thể loại ────────────────────────────────────────────────────────────
/**
 * Props:
 *   value    – Array<string> (Guid thể loại đang chọn)
 *   onChange – (nextArray) => void
 */
export function GenrePickerField({ value = [], onChange }) {
  const [genres, setGenres]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    let cancelled = false;
    tvShowService.getGenres()
      .then(res => {
        if (cancelled) return;
        const list = res?.data ?? res ?? [];
        setGenres(Array.isArray(list) ? list : []);
      })
      .catch(() => { if (!cancelled) setError('Không tải được danh sách thể loại'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const toggle = (id) => {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Thể loại
      </label>

      {loading && (
        <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.textMuted, margin: 0 }}>Đang tải thể loại...</p>
      )}

      {!loading && error && (
        <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.red, margin: 0 }}>{error}</p>
      )}

      {!loading && !error && genres.length === 0 && (
        <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.textMuted, margin: 0 }}>
          Chưa có thể loại nào trong hệ thống. Hãy đồng bộ thể loại từ TMDB trước.
        </p>
      )}

      {!loading && genres.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {genres.map(g => {
            const active = value.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggle(g.id)}
                style={{
                  padding: '6px 12px', borderRadius: 999,
                  background: active ? T.accent : T.surfaceAlt,
                  border: `1px solid ${active ? T.accent : T.border}`,
                  color: active ? 'white' : T.textSub,
                  fontFamily: FONT, fontSize: 12.5, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {g.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Ô ảnh đơn (Poster / Backdrop bìa chính) ──────────────────────────────────
/**
 * Ô ảnh dùng cho "poster" hoặc "backdrop" bìa chính của phim (không phải
 * gallery). Cho phép dán URL trực tiếp hoặc upload file — dùng chung cho
 * MovieAddModal & MovieEditModal.
 *
 * Props:
 *   label     – nhãn hiển thị, VD: "Poster", "Backdrop (ảnh bìa)"
 *   imageType – "poster" | "backdrop" — truyền cho tvShowService.uploadImage
 *   value     – string URL hiện tại
 *   onChange  – (nextUrl) => void
 */
export function PosterField({ label, imageType = 'poster', value = '', onChange }) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadErr('');
    try {
      const res = await tvShowService.uploadImage(file, imageType);
      const url = res?.data?.url ?? res?.url;
      if (url) onChange(url);
      else setUploadErr('Không nhận được URL từ server');
    } catch (e) {
      setUploadErr(e?.response?.data?.message ?? e?.message ?? 'Upload ảnh thất bại');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Dán URL ảnh..."
          style={{
            flex: 1, height: 42, padding: '0 14px',
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 10, color: T.text, outline: 'none',
            fontFamily: FONT, fontSize: 13, boxSizing: 'border-box',
          }}
        />
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files?.[0])} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            height: 42, padding: '0 14px', borderRadius: 10,
            background: T.surfaceAlt, border: `1px dashed ${T.border}`,
            cursor: uploading ? 'wait' : 'pointer', color: T.textSub,
            fontFamily: FONT, fontSize: 13, fontWeight: 600,
          }}
        >
          {uploading
            ? <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
            : <Upload size={14} />
          }
          Upload
        </button>
      </div>

      {uploadErr && <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red, margin: 0 }}>{uploadErr}</p>}

      {value && (
        <div style={{ width: 96, borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}`, aspectRatio: imageType === 'poster' ? '2/3' : '16/9' }}>
          <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}
    </div>
  );
}

// ── Gallery ảnh Backdrop (nhiều ảnh, giống tab "Hình ảnh" khi import TMDB) ────
let bdUidSeq = 0;
const nextBdUid = () => `bd_${Date.now()}_${bdUidSeq++}`;

/**
 * Props:
 *   value    – Array<{ uid, id?, url }>   id chỉ có khi ảnh đã tồn tại trong DB (chế độ edit)
 *   onChange – (nextArray) => void
 */
export function BackdropGalleryField({ value = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlErr, setUrlErr] = useState('');
  const fileRef = useRef();

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadErr('');
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        const res = await tvShowService.uploadImage(file, 'backdrop');
        const url = res?.data?.url ?? res?.url;
        if (url) uploaded.push({ uid: nextBdUid(), url });
      }
      if (uploaded.length) onChange([...value, ...uploaded]);
      else setUploadErr('Không nhận được URL từ server');
    } catch (e) {
      setUploadErr(e?.response?.data?.message ?? e?.message ?? 'Upload ảnh thất bại');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!/^https?:\/\/.+/i.test(url)) {
      setUrlErr('Link phải bắt đầu bằng http:// hoặc https://');
      return;
    }
    if (value.some(v => v.url === url)) {
      setUrlErr('Link này đã có trong danh sách');
      return;
    }
    onChange([...value, { uid: nextBdUid(), url }]);
    setUrlInput('');
    setUrlErr('');
  };

  const handleUrlKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUrl();
    }
  };

  const remove = (uid) => onChange(value.filter(v => v.uid !== uid));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Ảnh Backdrop (gallery)
      </label>

      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)} />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          height: 42, borderRadius: 10,
          background: T.surfaceAlt, border: `1px dashed ${T.border}`,
          cursor: uploading ? 'wait' : 'pointer', color: T.textSub,
          fontFamily: FONT, fontSize: 13, fontWeight: 600,
        }}
      >
        {uploading
          ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Đang upload...</>
          : <><Upload size={14} /> Thêm ảnh backdrop (chọn được nhiều ảnh)</>
        }
      </button>

      {uploadErr && <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red, margin: 0 }}>{uploadErr}</p>}

      {/* Nhập link ảnh trực tiếp (không qua upload) */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={urlInput}
          onChange={e => { setUrlInput(e.target.value); if (urlErr) setUrlErr(''); }}
          onKeyDown={handleUrlKeyDown}
          placeholder="Dán link ảnh backdrop (https://...)"
          style={{
            flex: 1, height: 38, padding: '0 12px',
            background: T.surface,
            border: `1px solid ${urlErr ? 'rgba(220,38,38,0.5)' : T.border}`,
            borderRadius: 9, color: T.text, outline: 'none',
            fontFamily: FONT, fontSize: 13, boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={handleAddUrl}
          disabled={!urlInput.trim()}
          style={{
            height: 38, padding: '0 14px', borderRadius: 9,
            background: urlInput.trim() ? T.accent : T.surfaceAlt,
            border: `1px solid ${urlInput.trim() ? T.accent : T.border}`,
            color: urlInput.trim() ? 'white' : T.textMuted,
            cursor: urlInput.trim() ? 'pointer' : 'not-allowed',
            fontFamily: FONT, fontSize: 13, fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          Thêm link
        </button>
      </div>
      {urlErr && <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red, margin: 0 }}>{urlErr}</p>}

      {value.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {value.map(img => (
            <div key={img.uid} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}`, aspectRatio: '16/9' }}>
              <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <button
                type="button"
                onClick={() => remove(img.uid)}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.55)', border: 'none',
                  cursor: 'pointer', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', borderRadius: 9,
          background: T.surfaceAlt, border: `1px solid ${T.border}`,
        }}>
          <ImageOff size={14} color={T.textMuted} />
          <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted }}>Chưa có ảnh backdrop nào</span>
        </div>
      )}
    </div>
  );
}

// ── Helpers chuyển đổi sang shape DTO backend (ImportImageDTO) ────────────────
export function backdropStateToDto(backdropState) {
  return backdropState.map(b => ({ url: b.url, imageType: 'backdrop' }));
}