// src/components/admin/movie/VideoUploadPanel.jsx
import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Check, AlertCircle, Film } from 'lucide-react';
import axiosInstance from '../../../config/axios';

const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const T = {
  bg:          '#F4F3EF',
  surface:     '#FFFFFF',
  surfaceAlt:  '#FAFAF8',
  surfaceHov:  '#F6F6F3',
  accent:      '#1C5F3A',
  accentLight: '#EAF5EF',
  accentText:  '#155230',
  text:        '#18181B',
  textSub:     '#71717A',
  textMuted:   '#A1A1AA',
  border:      'rgba(0,0,0,0.08)',
  borderMed:   'rgba(0,0,0,0.13)',
  borderFocus: 'rgba(28,95,58,0.4)',
  shadow:      '0 1px 3px rgba(0,0,0,0.07)',
  shadowLg:    '0 20px 60px rgba(0,0,0,0.14)',
  red:         '#DC2626',
};

const VIDEO_TYPES = ['main', 'trailer', 'clip', 'behind'];
const TYPE_LABEL  = { main: 'Phim chính', trailer: 'Trailer', clip: 'Clip', behind: 'Hậu trường' };
const QUALITIES   = ['1080p', '720p', '480p', '360p'];

// ── UploadZone ────────────────────────────────────────────────────────────────
export function UploadZone({ movieId, onUploaded }) {
  const [videoType, setVideoType] = useState('main');
  const [quality,   setQuality]   = useState('1080p');
  const [file,      setFile]      = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [result,    setResult]    = useState(null);
  const [dragging,  setDragging]  = useState(false);
  const fileRef = useRef();

  const handleDrop = useCallback(e => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('video/')) setFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setResult({ type: 'error', text: 'Vui lòng chọn file video' });
      return;
    }
    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      // ✅ Field names phải viết hoa chữ đầu để khớp với C# DTO (UploadMovieVideoDTO)
      const fd = new FormData();
      fd.append('VideoFile', file);       // ✅ khớp VideoFile
      fd.append('VideoType', videoType);  // ✅ khớp VideoType
      fd.append('Quality', quality);      // ✅ khớp Quality

      // ✅ URL đúng: /movies/{id}/videos  (không có /upload)
      const response = await axiosInstance.post(
        `/movies/${movieId}/videos`,
        fd,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: e => {
            if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
          },
          timeout: 10 * 60 * 1000, // 10 phút cho file lớn
        }
      );

      const video = response?.data?.data ?? response?.data ?? response;
      setResult({ type: 'success', text: 'Upload thành công!' });
      setFile(null);
      setProgress(0);
      onUploaded?.(video);
    } catch (e) {
      setResult({
        type: 'error',
        text: e?.response?.data?.message ?? e?.message ?? 'Upload thất bại',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
        Thêm video mới
      </p>

      {/* Type + Quality */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Loại video</label>
          <select value={videoType} onChange={e => setVideoType(e.target.value)}
            style={{ height: 40, padding: '0 12px', borderRadius: 9, background: T.surface, border: `1px solid ${T.border}`, fontFamily: FONT, fontSize: 13, color: T.text, outline: 'none', cursor: 'pointer' }}>
            {VIDEO_TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Chất lượng</label>
          <select value={quality} onChange={e => setQuality(e.target.value)}
            style={{ height: 40, padding: '0 12px', borderRadius: 9, background: T.surface, border: `1px solid ${T.border}`, fontFamily: FONT, fontSize: 13, color: T.text, outline: 'none', cursor: 'pointer' }}>
            {QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        style={{
          borderRadius: 10,
          border: `2px dashed ${dragging ? T.accent : file ? T.accent : T.border}`,
          padding: '22px 14px',
          textAlign: 'center',
          background: dragging ? T.accentLight : file ? '#F0FDF4' : T.surfaceAlt,
          cursor: uploading ? 'default' : 'pointer',
          transition: 'all 0.15s',
          marginBottom: 12,
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={e => setFile(e.target.files[0] || null)}
        />
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
            <Film size={15} color={T.accentText} />
            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.accentText, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name}
            </p>
            <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, flexShrink: 0 }}>
              ({(file.size / 1024 / 1024).toFixed(1)} MB)
            </span>
            <button
              onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }}
              disabled={uploading}
              style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(28,95,58,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accentText, flexShrink: 0 }}>
              <X size={11} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={18} color={dragging ? T.accentText : T.textMuted} style={{ margin: '0 auto 7px' }} />
            <p style={{ fontFamily: FONT, fontSize: 12.5, color: dragging ? T.accentText : T.textMuted }}>
              Kéo thả file video hoặc <span style={{ color: T.accentText, fontWeight: 600 }}>duyệt file</span>
            </p>
            <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, marginTop: 4 }}>
              MP4, MKV, MOV — tối đa 500MB
            </p>
          </>
        )}
      </div>

      {/* Progress */}
      {uploading && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>Đang upload…</span>
            <span style={{ fontFamily: FONT, fontSize: 11.5, color: T.accentText, fontWeight: 700 }}>{progress}%</span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: T.surfaceAlt, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: T.accent, borderRadius: 3, transition: 'width 0.2s' }} />
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          padding: '9px 14px', borderRadius: 9, marginBottom: 12,
          background: result.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          border: `1px solid ${result.type === 'success' ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {result.type === 'success'
            ? <Check size={14} color="#16A34A" />
            : <AlertCircle size={14} color={T.red} />}
          <p style={{ fontFamily: FONT, fontSize: 12.5, color: result.type === 'success' ? '#16A34A' : T.red }}>
            {result.text}
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        style={{
          width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
          background: T.accent,
          cursor: (uploading || !file) ? 'default' : 'pointer',
          fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: (uploading || !file) ? 0.5 : 1,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (!uploading && file) e.currentTarget.style.background = '#155230'; }}
        onMouseLeave={e => e.currentTarget.style.background = T.accent}
      >
        <Upload size={15} />
        {uploading ? `Đang upload… ${progress}%` : 'Upload video'}
      </button>
    </div>
  );
}

// ── VideoList ─────────────────────────────────────────────────────────────────
export function VideoList({ movieId, videos: initialVideos = [], onDelete }) {
  const VIDEO_TYPES_ALL = ['main', 'trailer', 'clip', 'behind'];
  const TYPE_COLORS = {
    main:    { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A', dot: '#22C55E' },
    trailer: { bg: '#FFF7ED', border: '#FED7AA', text: '#EA580C', dot: '#F97316' },
    clip:    { bg: '#F5F3FF', border: '#DDD6FE', text: '#7C3AED', dot: '#8B5CF6' },
    behind:  { bg: '#ECFEFF', border: '#A5F3FC', text: '#0891B2', dot: '#06B6D4' },
  };
  const TYPE_MISSING_COLOR = { bg: '#FAFAF8', border: 'rgba(0,0,0,0.08)', text: '#A1A1AA', dot: '#D4D4D8' };

  const [videos,   setVideos]   = useState(initialVideos);
  const [deleting, setDeleting] = useState(null);

  const grouped = VIDEO_TYPES_ALL.reduce((acc, t) => {
    acc[t] = videos.filter(v => (v.videoType ?? v.type ?? '').toLowerCase() === t);
    return acc;
  }, {});

  const handleDelete = async (videoId) => {
    if (!window.confirm('Xóa video này?')) return;
    setDeleting(videoId);
    try {
      // ✅ URL đúng: /movies/videos/{videoId}  (không có movieId)
      await axiosInstance.delete(`/movies/videos/${videoId}`);
      setVideos(prev => prev.filter(v => v.id !== videoId));
      onDelete?.(videoId);
    } catch (e) {
      alert(e?.response?.data?.message ?? 'Xóa thất bại');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
        Trạng thái video
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {VIDEO_TYPES_ALL.map(type => {
          const list = grouped[type];
          const hasAny = list.length > 0;
          const c = hasAny ? TYPE_COLORS[type] : TYPE_MISSING_COLOR;
          return (
            <div key={type} style={{ borderRadius: 10, border: `1px solid ${c.border}`, background: c.bg, overflow: 'hidden' }}>
              {/* Type header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
                  <span style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: c.text }}>
                    {TYPE_LABEL[type]}
                  </span>
                </div>
                {!hasAny && (
                  <span style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, fontStyle: 'italic' }}>
                    Chưa có
                  </span>
                )}
                {hasAny && (
                  <span style={{
                    fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: c.text,
                    padding: '1px 7px', borderRadius: 99, background: `${c.dot}20`, border: `1px solid ${c.border}`,
                  }}>
                    {list.length} video
                  </span>
                )}
              </div>
              {/* Video items */}
              {hasAny && list.map((v, idx) => (
                <div key={v.id ?? idx} style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '7px 12px', borderTop: `1px solid ${c.border}`,
                  background: T.surface,
                }}>
                  <Film size={12} color={c.text} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: FONT, fontSize: 11.5, color: T.text,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      marginBottom: 1,
                    }}>
                      {v.url ?? v.videoUrl ?? v.filePath ?? `Video #${idx + 1}`}
                    </p>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      {v.quality && (
                        <span style={{ fontFamily: FONT, fontSize: 10, color: T.textMuted, padding: '0px 5px', borderRadius: 4, background: T.bg, border: `1px solid ${T.border}` }}>
                          {v.quality}
                        </span>
                      )}
                      {v.duration && (
                        <span style={{ fontFamily: FONT, fontSize: 10, color: T.textMuted }}>
                          {Math.floor(v.duration / 60)}:{String(v.duration % 60).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(v.id)}
                    disabled={deleting === v.id}
                    style={{
                      width: 24, height: 24, borderRadius: 6, border: 'none',
                      background: '#fef2f2', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: T.red, flexShrink: 0, opacity: deleting === v.id ? 0.5 : 1,
                    }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── VideoUploadPanel (default export) ─────────────────────────────────────────
export default function VideoUploadPanel({ movieId, movieTitle, videos: initialVideos = [], onClose, onUploaded }) {
  const [videoList, setVideoList] = useState(initialVideos);

  const handleUploaded = (v) => {
    // Backend trả về { data: { videoUrl } } — thêm vào list nếu có object đầy đủ
    if (v && typeof v === 'object') {
      setVideoList(prev => [...prev, v]);
    }
    onUploaded?.(v);
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 420, zIndex: 200,
        background: T.surface,
        borderLeft: `1px solid ${T.borderMed}`,
        display: 'flex', flexDirection: 'column',
        boxShadow: T.shadowLg,
        fontFamily: FONT,
      }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '20px 20px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Upload Video</p>
          <h2 style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {movieTitle ?? 'Phim'}
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{ width: 32, height: 32, borderRadius: '50%', background: T.bg, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: T.bg }}>
        <VideoList
          movieId={movieId}
          videos={videoList}
          onDelete={id => setVideoList(prev => prev.filter(v => v.id !== id))}
        />
        <div style={{ height: 1, background: T.border, marginBottom: 20 }} />
        <UploadZone movieId={movieId} onUploaded={handleUploaded} />
      </div>
    </motion.div>
  );
}