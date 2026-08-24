// src/components/admin/shared/GenreAndImageFields.jsx
// Ô chọn thể loại (multi-select), ô ảnh đơn (Poster/Backdrop bìa chính) và
// gallery ảnh backdrop — dùng CHUNG cho cả Movie & TvShow
// (MovieAddModal / MovieEditModal / TvShowAddModal / TvShowEditModal).
//
// Vì Movie và TvShow có service riêng (movieService / tvShowService) nhưng
// cùng interface getGenres() / uploadImage(file, imageType), mỗi component ở
// đây nhận thêm prop `service` để biết gọi API nào — thay vì import cứng
// 1 service cụ thể như 2 bản trùng lặp trước đây.
//
// Cách dùng:
//   import { GenrePickerField, PosterField, BackdropGalleryField, backdropStateToDto } from '../shared/GenreAndImageFields';
//   <GenrePickerField service={movieService} value={genreIds} onChange={setGenreIds} />
//   <PosterField service={movieService} label="Poster" imageType="poster" value={posterUrl} onChange={setPosterUrl} />
//   <BackdropGalleryField service={movieService} value={backdrops} onChange={setBackdrops} />
//
// Click vào ảnh preview (poster / backdrop bìa / ảnh trong gallery) sẽ mở
// ImageLightbox để xem ảnh phóng to (xem component ImageLightbox bên dưới).

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { T, FONT_BODY as FONT } from '../../../context/adminTokens';

// ── Lightbox xem ảnh phóng to ─────────────────────────────────────────────
/**
 * Modal xem ảnh phóng to — cùng phong cách với BackdropLightbox dùng ở trang
 * xem phim (src/components/movie/ui/BackdropCarousel.jsx), để trải nghiệm
 * xem ảnh nhất quán giữa trang admin và trang người dùng.
 *
 * Hỗ trợ điều hướng nhiều ảnh (gallery), đóng bằng phím Esc, click ra nền
 * tối, hoặc nút X. Dùng chung cho PosterField & BackdropGalleryField.
 *
 * Props:
 *   images  – Array<string> danh sách URL ảnh
 *   index   – number | null   vị trí ảnh đang xem (null/undefined = đóng)
 *   onClose – () => void
 *   onIndexChange – (nextIndex) => void  (không bắt buộc nếu chỉ có 1 ảnh)
 */
export function ImageLightbox({ images = [], index, onClose, onIndexChange }) {
  const total = images.length;
  const isOpen = index !== null && index !== undefined && !!images[index];
  const canPrev = isOpen && index > 0;
  const canNext = isOpen && index < total - 1;

  useEffect(() => {
    if (!isOpen) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && canPrev) onIndexChange(index - 1);
      if (e.key === 'ArrowRight' && canNext) onIndexChange(index + 1);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, index, canPrev, canNext, onClose, onIndexChange]);

  const navBtnStyle = (side) => ({
    position: 'absolute', [side]: 16, top: '50%', transform: 'translateY(-50%)',
    width: 44, height: 44, borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', zIndex: 10,
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Đóng */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            style={{
              position: 'absolute', top: 20, right: 20,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', zIndex: 10,
            }}
          >
            <X size={18} />
          </button>

          {/* Đếm ảnh */}
          {total > 1 && (
            <div style={{
              position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
              fontFamily: FONT, fontSize: 13, color: 'rgba(255,255,255,0.5)',
            }}>
              {index + 1} / {total}
            </div>
          )}

          {/* Trước */}
          {canPrev && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onIndexChange(index - 1); }}
              aria-label="Ảnh trước"
              style={navBtnStyle('left')}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Ảnh */}
          <motion.img
            key={images[index]}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.22 }}
            src={images[index]}
            alt=""
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '85vh',
              objectFit: 'contain', borderRadius: 8,
              boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
            }}
          />

          {/* Sau */}
          {canNext && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onIndexChange(index + 1); }}
              aria-label="Ảnh sau"
              style={navBtnStyle('right')}
            >
              <ChevronRight size={22} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Overlay tối nhẹ khi hover lên ảnh preview, gợi ý có thể bấm để phóng to —
// cùng hiệu ứng hover với card ảnh trong BackdropCarousel.
function ZoomHint({ visible }) {
  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        background: visible ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0)',
        transition: 'background 0.2s',
        pointerEvents: 'none',
      }}
    />
  );
}

// ── Chọn thể loại ────────────────────────────────────────────────────────────
/**
 * Props:
 *   service  – movieService | tvShowService (bắt buộc, cần có getGenres())
 *   value    – Array<string> (Guid thể loại đang chọn)
 *   onChange – (nextArray) => void
 */
export function GenrePickerField({ service, value = [], onChange }) {
  const [genres, setGenres]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    let cancelled = false;
    service.getGenres()
      .then(res => {
        if (cancelled) return;
        const list = res?.data ?? res ?? [];
        setGenres(Array.isArray(list) ? list : []);
      })
      .catch(() => { if (!cancelled) setError('Không tải được danh sách thể loại'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [service]);

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
 * Ô ảnh dùng cho "poster" hoặc "backdrop" bìa chính của phim/TV show (không
 * phải gallery). Cho phép dán URL trực tiếp hoặc upload file. Click vào ảnh
 * preview sẽ mở ImageLightbox để xem phóng to.
 *
 * Props:
 *   service   – movieService | tvShowService (bắt buộc, cần có uploadImage())
 *   label     – nhãn hiển thị, VD: "Poster", "Backdrop (ảnh bìa)"
 *   imageType – "poster" | "backdrop" — truyền cho service.uploadImage
 *   value     – string URL hiện tại
 *   onChange  – (nextUrl) => void
 */
export function PosterField({ service, label, imageType = 'poster', value = '', onChange }) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadErr('');
    try {
      const res = await service.uploadImage(file, imageType);
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

      {/* Preview — phóng to rõ ràng hơn: poster theo tỉ lệ 2:3 rộng 160px,
          backdrop full chiều rộng (tối đa 380px) theo tỉ lệ 16:9.
          Click vào ảnh để mở lightbox xem full-size. */}
      {value && (
        <div style={{ marginTop: 2 }}>
          <div
            role="button"
            tabIndex={0}
            aria-label="Xem ảnh phóng to"
            onClick={() => setLightboxOpen(true)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setLightboxOpen(true); }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            style={{
              position: 'relative', display: 'block',
              width: imageType === 'backdrop' ? '100%' : 160,
              maxWidth: imageType === 'backdrop' ? 380 : 160,
              borderRadius: 10, overflow: 'hidden',
              border: `1px solid ${T.border}`,
              cursor: 'zoom-in',
            }}
          >
            <img
              src={value}
              alt=""
              style={{
                display: 'block', width: '100%',
                aspectRatio: imageType === 'backdrop' ? '16 / 9' : '2 / 3',
                objectFit: 'cover',
              }}
            />
            <ZoomHint visible={hovering} />
          </div>
          <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, display: 'block', marginTop: 6 }}>Xem trước — bấm để phóng to</span>
        </div>
      )}

      <ImageLightbox
        images={value ? [value] : []}
        index={lightboxOpen ? 0 : null}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={() => {}}
      />
    </div>
  );
}

// ── Gallery ảnh Backdrop (nhiều ảnh, giống tab "Hình ảnh" khi import TMDB) ────
let bdUidSeq = 0;
const nextBdUid = () => `bd_${Date.now()}_${bdUidSeq++}`;

/**
 * Props:
 *   service  – movieService | tvShowService (bắt buộc, cần có uploadImage())
 *   value    – Array<{ uid, id?, url }>   id chỉ có khi ảnh đã tồn tại trong DB (chế độ edit)
 *   onChange – (nextArray) => void
 *
 * Click vào 1 ảnh trong gallery sẽ mở ImageLightbox, có thể điều hướng
 * qua lại giữa các ảnh (phím mũi tên hoặc nút prev/next).
 */
export function BackdropGalleryField({ service, value = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlErr, setUrlErr] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [hoveredUid, setHoveredUid] = useState(null);
  const fileRef = useRef();

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadErr('');
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        const res = await service.uploadImage(file, 'backdrop');
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

  const remove = (e, uid) => {
    e.stopPropagation(); // tránh nổ bubble mở lightbox khi bấm nút xoá
    onChange(value.filter(v => v.uid !== uid));
  };

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
          {value.map((img, idx) => (
            <div
              key={img.uid}
              role="button"
              tabIndex={0}
              aria-label="Xem ảnh phóng to"
              onClick={() => setLightboxIndex(idx)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setLightboxIndex(idx); }}
              onMouseEnter={() => setHoveredUid(img.uid)}
              onMouseLeave={() => setHoveredUid(null)}
              style={{
                position: 'relative', borderRadius: 8, overflow: 'hidden',
                border: `1px solid ${T.border}`, aspectRatio: '16/9',
                cursor: 'zoom-in',
              }}
            >
              <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <ZoomHint visible={hoveredUid === img.uid} />
              <button
                type="button"
                onClick={(e) => remove(e, img.uid)}
                aria-label="Xoá ảnh"
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

      <ImageLightbox
        images={value.map(v => v.url)}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
}

// ── Helpers chuyển đổi sang shape DTO backend (ImportImageDTO) ────────────────
export function backdropStateToDto(backdropState) {
  return backdropState.map(b => ({ url: b.url, imageType: 'backdrop' }));
}