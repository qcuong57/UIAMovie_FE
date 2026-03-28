// src/components/admin/movie/VideoUploadPanel.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Video, Upload, CheckCircle, AlertCircle,
} from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { Spinner } from '../../ui';
import { C, FONT_DISPLAY, FONT_BODY } from '../../../context/homeTokens';

const VIDEO_TYPES   = ['main', 'trailer', 'clip', 'behind'];
const VIDEO_QUALITY = ['360p', '480p', '720p', '1080p', '4K'];
const TYPE_LABEL    = { main: 'Phim chính', trailer: 'Trailer', clip: 'Clip', behind: 'Hậu trường' };

// ── Upload Zone (reusable, also used inside MovieDetailPanel) ─────────────────
export function UploadZone({ movieId, onUploaded }) {
  const [dragging,  setDragging]  = useState(false);
  const [file,      setFile]      = useState(null);
  const [videoType, setVideoType] = useState('main');
  const [quality,   setQuality]   = useState('1080p');
  const [progress,  setProgress]  = useState(0);
  const [uploading, setUploading] = useState(false);
  const [status,    setStatus]    = useState(null); // null | 'ok' | 'err'
  const [errMsg,    setErrMsg]    = useState('');
  const inputRef  = useRef();
  // ✅ FIX BUG 2: AbortController để cancel request cũ, tránh duplicate khi user bấm lại sau timeout
  const abortRef  = useRef(null);

  const selectFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('video/')) { setErrMsg('Chỉ chấp nhận file video'); setStatus('err'); return; }
    setFile(f); setStatus(null); setErrMsg(''); setProgress(0);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    selectFile(e.dataTransfer.files[0]);
  };

  // ✅ FIX BUG 2: Hủy upload đang chạy
  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const handleUpload = async () => {
    if (!file) return;

    // ✅ FIX BUG 2: Hủy request cũ nếu đang chạy (tránh tạo duplicate trên Cloudinary)
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fd = new FormData();
    fd.append('VideoFile', file);
    fd.append('VideoType', videoType);
    fd.append('Quality',   quality);

    setUploading(true); setStatus(null); setProgress(0);
    try {
      const res = await axiosInstance.post(`/movies/${movieId}/videos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        // ✅ FIX BUG 2: Tăng timeout lên 30 phút — đủ cho file video lớn (vài GB)
        // Default axios timeout quá ngắn → browser timeout trước khi Cloudinary nhận xong
        // → user bấm lại → tạo duplicate trên Cloudinary
        timeout: 30 * 60 * 1000,
        // ✅ FIX BUG 2: Gắn abort signal để có thể cancel từ nút Hủy
        signal: controller.signal,
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      setStatus('ok');
      onUploaded?.(res?.data ?? res);
      setFile(null); setProgress(0);
    } catch (e) {
      // ✅ FIX BUG 2: Nếu user chủ động hủy thì không hiện lỗi
      if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError' || e?.message === 'canceled') {
        setUploading(false);
        setProgress(0);
        return;
      }
      setStatus('err');
      setErrMsg(e?.response?.data?.message ?? e?.message ?? 'Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  const fmtSize = (b) =>
    b > 1073741824 ? `${(b / 1073741824).toFixed(1)} GB`
    : b > 1048576  ? `${(b / 1048576).toFixed(1)} MB`
    : `${(b / 1024).toFixed(0)} KB`;

  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
        Upload video mới
      </p>

      {/* Drop zone */}
      <motion.div
        animate={{ borderColor: dragging ? C.accent : file ? 'rgba(46,213,115,0.4)' : 'rgba(255,255,255,0.1)' }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        style={{
          border: '2px dashed rgba(255,255,255,0.12)',
          borderRadius: 10, padding: '20px 16px',
          textAlign: 'center', cursor: file ? 'default' : 'pointer',
          background: dragging ? 'rgba(229,24,30,0.04)' : 'rgba(255,255,255,0.02)',
          transition: 'background 0.2s', marginBottom: 12,
        }}
      >
        <input ref={inputRef} type="file" accept="video/*" style={{ display: 'none' }}
          onChange={e => selectFile(e.target.files[0])} />

        {!file ? (
          <>
            <Upload size={24} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
              Kéo thả hoặc <span style={{ color: C.accent }}>chọn file</span>
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>MP4, MKV, AVI, MOV…</p>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Video size={20} color={C.accent} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'white', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
              <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{fmtSize(file.size)}</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setFile(null); setStatus(null); setProgress(0); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 4 }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </motion.div>

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        {[
          { label: 'Loại video', value: videoType, setter: setVideoType, opts: VIDEO_TYPES, display: TYPE_LABEL },
          { label: 'Chất lượng', value: quality,   setter: setQuality,   opts: VIDEO_QUALITY },
        ].map(({ label, value, setter, opts, display }) => (
          <div key={label}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</p>
            <select value={value} onChange={e => setter(e.target.value)} style={{
              width: '100%', padding: '7px 10px', background: '#111', border: `1px solid ${C.border}`,
              borderRadius: 6, color: 'white', fontFamily: FONT_BODY, fontSize: 12, cursor: 'pointer', outline: 'none',
            }}>
              {opts.map(o => <option key={o} value={o}>{display ? display[o] : o}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* ✅ FIX BUG 2: Progress bar + nút Hủy để tránh user bấm Upload lại khi đang chờ */}
      {uploading && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              Đang upload… {progress < 100 ? 'file đang truyền lên Cloudinary' : 'đang xử lý…'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{progress}%</span>
              {/* Nút Hủy — giúp user dừng upload và bắt đầu lại đúng file thay vì bấm lại → duplicate */}
              <button
                onClick={handleCancel}
                style={{
                  background: 'rgba(229,24,30,0.08)',
                  border: `1px solid rgba(229,24,30,0.25)`,
                  borderRadius: 4, cursor: 'pointer',
                  fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700,
                  color: 'rgba(255,80,80,0.7)',
                  padding: '2px 8px', lineHeight: 1.8,
                }}
              >
                Hủy
              </button>
            </div>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div animate={{ width: `${progress}%` }} transition={{ ease: 'linear' }}
              style={{ height: '100%', background: `linear-gradient(90deg, ${C.accent}, #ff4d4d)`, borderRadius: 2 }} />
          </div>
          {/* ✅ FIX BUG 2: Cảnh báo khi file đã lên server 100% nhưng Cloudinary vẫn đang xử lý */}
          {progress === 100 && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 6, lineHeight: 1.5 }}>
              ⏳ File đã gửi xong, đang chờ Cloudinary xử lý — vui lòng không đóng trang hay upload lại.
            </p>
          )}
        </div>
      )}

      {/* Status feedback */}
      <AnimatePresence>
        {status === 'ok' && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 6, background: 'rgba(46,213,115,0.08)', border: '1px solid rgba(46,213,115,0.2)', marginBottom: 8 }}>
            <CheckCircle size={13} color="#2ed573" />
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: '#2ed573' }}>Upload thành công!</span>
          </motion.div>
        )}
        {status === 'err' && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 6, background: 'rgba(229,24,30,0.08)', border: '1px solid rgba(229,24,30,0.2)', marginBottom: 8 }}>
            <AlertCircle size={13} color={C.accent} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.accent }}>{errMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload button */}
      <motion.button
        whileHover={{ scale: file && !uploading ? 1.02 : 1 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{
          width: '100%', padding: '9px 0',
          background: file && !uploading ? `linear-gradient(135deg, ${C.accent}, #c41018)` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${file && !uploading ? C.accent : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 7, cursor: file && !uploading ? 'pointer' : 'not-allowed',
          fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700,
          color: file && !uploading ? 'white' : 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          transition: 'all 0.2s',
        }}
      >
        {uploading ? <Spinner size="xs" color="white" /> : <Upload size={14} />}
        {uploading ? 'Đang tải lên…' : 'Upload video'}
      </motion.button>
    </div>
  );
}

export default function VideoUploadPanel({ movieId, movieTitle, onClose, onUploaded }) {
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 420, zIndex: 200,
        background: '#0a0a0a',
        borderLeft: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.7)',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
            Upload video
          </p>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 900, color: 'white', margin: 0, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {movieTitle ?? `Movie #${movieId}`}
          </h2>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`,
            cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <X size={15} />
        </motion.button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <UploadZone movieId={movieId} onUploaded={onUploaded} />

        {/* Tip */}
        <div style={{
          padding: '12px 14px', borderRadius: 8,
          background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`,
        }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7, margin: 0 }}>
            💡 <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Gợi ý:</strong> Chọn đúng <em>Loại video</em> và <em>Chất lượng</em> trước khi upload.
            Mỗi phim nên có ít nhất một video loại <strong style={{ color: C.accent }}>Phim chính</strong>.
            {' '}Với file lớn, quá trình upload có thể mất vài phút — <strong style={{ color: 'rgba(255,255,255,0.45)' }}>không đóng trang hay upload lại</strong> trong khi đang chờ.
          </p>
        </div>
      </div>
    </motion.div>
  );
}