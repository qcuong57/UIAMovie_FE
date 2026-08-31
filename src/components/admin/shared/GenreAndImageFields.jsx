// src/components/admin/movie/GenreAndImageFields.jsx
// Ô chọn thể loại (multi-select) và gallery ảnh backdrop, dùng chung cho
// MovieAddModal & MovieEditModal.

import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, ImageOff, Youtube, FileVideo, Trash2 } from 'lucide-react';
import movieService from '../../../services/movieService';
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
    movieService.getGenres()
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
 *   imageType – "poster" | "backdrop" — truyền cho movieService.uploadImage
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
      const res = await movieService.uploadImage(file, imageType);
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
        const res = await movieService.uploadImage(file, 'backdrop');
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

// ── Trailer (Youtube + video upload Cloudinary) ───────────────────────────────
/**
 * Ô trailer, gộp 2 nguồn chạy song song (giống backend: TrailerKey + TrailerVideoUrl):
 *   1) Link Youtube — sửa trực tiếp, gửi lên khi bấm "Lưu thay đổi".
 *   2) Video tự upload lên Cloudinary — CHỈ chọn file ở đây (chưa upload ngay),
 *      việc upload thật sự diễn ra khi modal cha gọi movieService.uploadTrailerVideo
 *      lúc bấm "Lưu thay đổi" (giữ nguyên hành vi "chờ Lưu mới upload").
 *
 * Dùng chung cho MovieAddModal & MovieEditModal.
 *
 * Props:
 *   youtubeUrl        – string, link Youtube hiện tại (rỗng nếu chưa có)
 *   onYoutubeUrlChange – (nextUrl) => void
 *
 *   currentVideoUrl    – string|null, URL trailer đã upload trước đó (chỉ có ở Edit,
 *                        Add luôn null vì phim chưa tồn tại)
 *   markedForRemoval   – boolean, user đã bấm xóa video hiện có (chờ Lưu mới xóa thật)
 *   onRemoveCurrentVideo – () => void, đánh dấu xóa video hiện có
 *   onUndoRemoveCurrentVideo – () => void, hủy đánh dấu xóa
 *
 *   pendingFile        – File|null, file mới user vừa chọn (chưa upload)
 *   onPendingFileChange – (file|null) => void
 *
 *   uploading          – boolean, đang trong lúc Lưu và đang upload trailer (hiển thị %)
 *   uploadProgress      – number 0-100
 */
export function TrailerField({
  youtubeUrl = '',
  onYoutubeUrlChange,
  currentVideoUrl = null,
  markedForRemoval = false,
  onRemoveCurrentVideo,
  onUndoRemoveCurrentVideo,
  pendingFile = null,
  onPendingFileChange,
  uploading = false,
  uploadProgress = 0,
}) {
  const fileRef = useRef();
  const [fileErr, setFileErr] = useState('');

  const handlePick = (file) => {
    if (!file) return;
    setFileErr('');
    if (!file.type.startsWith('video/')) {
      setFileErr('Vui lòng chọn file video (mp4, mkv, webm...)');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    onPendingFileChange?.(file);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
  };

  const showingExisting = currentVideoUrl && !markedForRemoval && !pendingFile;

  // Trích video ID từ link Youtube để hiển thị ảnh thumbnail preview (nhiều định dạng: watch?v=, youtu.be/, embed/, shorts/)
  const extractYoutubeId = (url) => {
    if (!url) return null;
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };
  const youtubeId = extractYoutubeId(youtubeUrl);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Trailer
      </label>

      {/* Youtube URL */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Youtube size={13} color={T.textMuted} />
          <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, fontWeight: 600 }}>Link Youtube</span>
        </div>
        <input
          value={youtubeUrl}
          onChange={e => onYoutubeUrlChange?.(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          style={{
            height: 42, padding: '0 14px',
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 10, color: T.text, outline: 'none',
            fontFamily: FONT, fontSize: 13, boxSizing: 'border-box', width: '100%',
          }}
        />

        {/* Thumbnail preview — chỉ hiện khi link Youtube hợp lệ, giúp xác nhận đúng video trước khi lưu */}
        {youtubeId && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: 8, borderRadius: 9,
            background: T.surfaceAlt, border: `1px solid ${T.border}`,
          }}>
            <img
              src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
              alt="Xem trước trailer Youtube"
              style={{ width: 96, height: 54, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
            />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: FONT, fontSize: 12, color: T.textSub, fontWeight: 600, margin: 0 }}>
                Xem trước ảnh thumbnail
              </p>
              <a
                href={`https://www.youtube.com/watch?v=${youtubeId}`} target="_blank" rel="noreferrer"
                style={{ fontFamily: FONT, fontSize: 11.5, color: T.accentText, textDecoration: 'none' }}
              >
                Mở trên Youtube
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Video upload */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileVideo size={13} color={T.textMuted} />
          <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, fontWeight: 600 }}>Video trailer tự upload</span>
        </div>

        {/* Video hiện có (Edit) — chưa đánh dấu xóa, chưa chọn file mới */}
        {showingExisting && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 9,
            background: T.surfaceAlt, border: `1px solid ${T.border}`,
          }}>
            <FileVideo size={15} color={T.textSub} style={{ flexShrink: 0 }} />
            <a
              href={currentVideoUrl} target="_blank" rel="noreferrer"
              style={{ fontFamily: FONT, fontSize: 12.5, color: T.accentText, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none' }}
            >
              Xem video trailer hiện tại
            </a>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ padding: '5px 10px', borderRadius: 7, background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: T.textSub }}
            >
              Thay video
            </button>
            <button
              type="button"
              onClick={() => onRemoveCurrentVideo?.()}
              title="Xóa video trailer"
              style={{ width: 26, height: 26, borderRadius: 7, background: 'transparent', border: `1px solid ${T.border}`, cursor: 'pointer', color: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}

        {/* Đã đánh dấu xóa video hiện có, chưa chọn file mới */}
        {currentVideoUrl && markedForRemoval && !pendingFile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 9,
            background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.25)',
          }}>
            <Trash2 size={14} color={T.red} style={{ flexShrink: 0 }} />
            <span style={{ fontFamily: FONT, fontSize: 12, color: T.red, flex: 1 }}>
              Video trailer sẽ bị xóa khi lưu thay đổi
            </span>
            <button
              type="button"
              onClick={() => onUndoRemoveCurrentVideo?.()}
              style={{ padding: '5px 10px', borderRadius: 7, background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: T.textSub }}
            >
              Hoàn tác
            </button>
          </div>
        )}

        {/* File mới vừa chọn, chưa upload (chờ bấm Lưu) */}
        {pendingFile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 9,
            background: goldTint, border: '1px solid rgba(217,119,6,0.3)',
          }}>
            <FileVideo size={15} color="#D97706" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.text, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pendingFile.name}
              </p>
              <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, margin: '2px 0 0' }}>
                {formatSize(pendingFile.size)} · sẽ upload khi lưu
              </p>
              {uploading && (
                <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: 'rgba(217,119,6,0.15)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${uploadProgress}%`, background: '#D97706', transition: 'width 0.2s' }} />
                </div>
              )}
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={() => { onPendingFileChange?.(null); if (fileRef.current) fileRef.current.value = ''; }}
                title="Bỏ chọn file"
                style={{ width: 26, height: 26, borderRadius: 7, background: 'transparent', border: `1px solid ${T.border}`, cursor: 'pointer', color: T.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Chưa có video nào (Add, hoặc Edit mà phim chưa có trailer upload) */}
        {!currentVideoUrl && !pendingFile && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              height: 42, borderRadius: 10, cursor: 'pointer',
              background: T.surfaceAlt, border: `1px dashed ${T.border}`,
              fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: T.textSub,
            }}
          >
            <Upload size={14} /> Chọn file video trailer...
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={e => handlePick(e.target.files?.[0])}
        />

        {fileErr && <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red, margin: 0 }}>{fileErr}</p>}
      </div>
    </div>
  );
}

const goldTint = '#FEF3C7';

// ── Helpers chuyển đổi sang shape DTO backend (ImportImageDTO) ────────────────
export function backdropStateToDto(backdropState) {
  return backdropState.map(b => ({ url: b.url, imageType: 'backdrop' }));
}