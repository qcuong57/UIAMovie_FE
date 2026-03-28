// src/components/admin/MovieDetailPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Clock, Calendar, Globe, Film, User, Video, Trash2, Play, Plus } from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { Spinner } from '../../ui';
import { C, FONT_DISPLAY, FONT_BODY } from '../../../context/homeTokens';
import { UploadZone } from './VideoUploadPanel';

const COUNTRY_FLAG = { KR:'🇰🇷', US:'🇺🇸', JP:'🇯🇵', CN:'🇨🇳', VN:'🇻🇳', FR:'🇫🇷', GB:'🇬🇧', IN:'🇮🇳', TH:'🇹🇭' };

const VIDEO_TYPES = ['main', 'trailer', 'clip', 'behind'];

const TYPE_LABEL = { main: 'Phim chính', trailer: 'Trailer', clip: 'Clip', behind: 'Hậu trường' };
const TYPE_COLOR = { main: '#e5181e', trailer: '#f59e0b', clip: '#3b82f6', behind: '#8b5cf6' };

const MetaRow = ({ icon: Icon, label, value }) => value ? (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
    <Icon size={14} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0, marginTop: 1 }}/>
    <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.3)', minWidth: 80, flexShrink: 0 }}>{label}</span>
    <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{value}</span>
  </div>
) : null;


// ── Video list ───────────────────────────────────────────────────
function VideoList({ videos, onDelete }) {
  const [deleting, setDeleting] = useState(null);
  const [preview,  setPreview]  = useState(null);

  const handleDelete = async (v) => {
    if (!window.confirm(`Xóa video "${TYPE_LABEL[v.videoType] ?? v.videoType}" (${v.quality})?`)) return;
    setDeleting(v.id);
    try {
      await axiosInstance.delete(`/movies/videos/${v.id}`);
      onDelete?.(v.id);
    } catch (e) {
      alert(e?.response?.data?.message ?? 'Xóa thất bại');
    } finally {
      setDeleting(null);
    }
  };

  if (!videos?.length) return (
    <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '24px 0' }}>
      Chưa có video nào
    </p>
  );

  // group by type
  const grouped = VIDEO_TYPES.reduce((acc, t) => {
    const items = videos.filter(v => v.videoType === t);
    if (items.length) acc[t] = items;
    return acc;
  }, {});

  return (
    <>
      {/* Preview modal */}
      <AnimatePresence>
        {preview && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPreview(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, backdropFilter: 'blur(6px)' }}/>
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 301, width: 'min(90vw, 860px)' }}>
              <video src={preview.url} controls autoPlay
                style={{ width: '100%', borderRadius: 10, display: 'block', background: '#000' }}/>
              <button onClick={() => setPreview(null)}
                style={{ position: 'absolute', top: -14, right: -14, width: 30, height: 30, borderRadius: '50%', background: '#222', border: `1px solid ${C.border}`, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14}/>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLOR[type] ?? '#888', flexShrink: 0 }}/>
            <p style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {TYPE_LABEL[type] ?? type} ({items.length})
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((v, i) => (
              <motion.div key={v.id ?? i} layout
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
                <Video size={14} color={TYPE_COLOR[type] ?? 'rgba(255,255,255,0.2)'} style={{ flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'white', fontWeight: 600, marginBottom: 2 }}>
                    {TYPE_LABEL[type] ?? type}
                    {v.quality && <span style={{ marginLeft: 6, fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 400, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)' }}>{v.quality}</span>}
                  </p>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.url}</p>
                </div>

                {/* Preview */}
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setPreview(v)}
                  style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Play size={11} fill="rgba(255,255,255,0.5)"/>
                </motion.button>

                {/* Delete */}
                <motion.button whileHover={{ scale: 1.1, color: C.accent }} whileTap={{ scale: 0.9 }}
                  onClick={() => handleDelete(v)}
                  disabled={deleting === v.id}
                  style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(229,24,30,0.06)', border: '1px solid rgba(229,24,30,0.15)', cursor: 'pointer', color: 'rgba(229,24,30,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {deleting === v.id ? <Spinner size="xs" color="red"/> : <Trash2 size={11}/>}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN PANEL
// ════════════════════════════════════════════════════════════════
export default function MovieDetailPanel({ movieId, onClose, onEdit }) {
  const [movie,   setMovie]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('info'); // info | cast | images | videos

  useEffect(() => {
    if (!movieId) return;
    setLoading(true);
    setTab('info');
    axiosInstance.get(`/movies/${movieId}`)
      .then(res => setMovie(res?.data ?? res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [movieId]);

  const handleVideoUploaded = useCallback((data) => {
    // Refresh movie data after upload to show new video
    axiosInstance.get(`/movies/${movieId}`)
      .then(res => setMovie(res?.data ?? res))
      .catch(console.error);
  }, [movieId]);

  const handleVideoDeleted = useCallback((videoId) => {
    setMovie(m => m ? { ...m, videos: m.videos?.filter(v => v.id !== videoId) } : m);
  }, []);

  const year = movie?.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;

  const TABS = [
    { key: 'info',   label: 'Thông tin' },
    { key: 'cast',   label: `Diễn viên (${movie?.cast?.length ?? 0})` },
    { key: 'images', label: `Hình ảnh (${movie?.images?.length ?? 0})` },
    { key: 'videos', label: `Videos (${movie?.videos?.length ?? 0})` },
  ];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 199, backdropFilter: 'blur(3px)' }}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 520, zIndex: 200,
          background: '#0a0a0a',
          borderLeft: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div style={{ flexShrink: 0, borderBottom: `1px solid ${C.border}` }}>
          {movie?.backdropUrl && (
            <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
              <img src={movie.backdropUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, transparent 60%)' }} />
            </div>
          )}

          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: movie?.backdropUrl ? -40 : 0, position: 'relative' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flex: 1, minWidth: 0 }}>
              {movie?.posterUrl && (
                <img src={movie.posterUrl} alt="" style={{ width: 56, height: 80, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: `1px solid ${C.border}` }} />
              )}
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 900, color: 'white', margin: '0 0 6px', lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {loading ? '...' : movie?.title}
                </h2>
                {!loading && movie && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {movie.rating > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: FONT_BODY, fontSize: 11, color: '#f5c518', fontWeight: 700 }}>
                        <Star size={10} style={{ fill: '#f5c518', color: '#f5c518' }}/> {Number(movie.rating).toFixed(1)}
                      </span>
                    )}
                    {year && <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{year}</span>}
                    {movie.originCountry && <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{COUNTRY_FLAG[movie.originCountry] ?? '🌐'} {movie.originCountry}</span>}
                    {movie.videos?.length > 0 && (
                      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: '#2ed573', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Play size={9} fill="#2ed573"/> {movie.videos.length} video
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {onEdit && !loading && movie && (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => onEdit(movie)}
                  style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(229,24,30,0.12)', border: `1px solid rgba(229,24,30,0.3)`, cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: C.accent }}>
                  Sửa
                </motion.button>
              )}
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
                style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14}/>
              </motion.button>
            </div>
          </div>

          {/* Tabs */}
          {!loading && movie && (
            <div style={{ display: 'flex', padding: '0 20px', borderTop: `1px solid ${C.border}`, overflowX: 'auto' }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  padding: '10px 14px', background: 'none', border: 'none',
                  borderBottom: `2px solid ${tab === t.key ? (t.key === 'videos' ? '#2ed573' : C.accent) : 'transparent'}`,
                  cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 12, whiteSpace: 'nowrap',
                  fontWeight: tab === t.key ? 700 : 500,
                  color: tab === t.key ? 'white' : 'rgba(255,255,255,0.35)',
                  transition: 'all 0.15s', marginBottom: -1,
                }}>{t.label}</button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loading && <div style={{ padding: '48px 0', textAlign: 'center' }}><Spinner size="md" color="red"/></div>}

          {!loading && movie && (
            <AnimatePresence mode="wait">

              {/* ── Info tab ── */}
              {tab === 'info' && (
                <motion.div key="info" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {movie.description && (
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Mô tả</p>
                      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{movie.description}</p>
                    </div>
                  )}
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Chi tiết</p>
                    <MetaRow icon={Star}     label="Rating"     value={movie.rating ? `${Number(movie.rating).toFixed(1)} / 10` : null} />
                    <MetaRow icon={Calendar} label="Phát hành"  value={movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : null} />
                    <MetaRow icon={Clock}    label="Thời lượng" value={movie.duration ? `${movie.duration} phút` : null} />
                    <MetaRow icon={Globe}    label="Quốc gia"   value={movie.originCountry ? `${COUNTRY_FLAG[movie.originCountry] ?? ''} ${movie.originCountry}` : null} />
                    <MetaRow icon={Film}     label="Thể loại"   value={movie.genres?.join(', ') || null} />
                    <MetaRow icon={User}     label="Đạo diễn"   value={movie.director || null} />
                    <MetaRow icon={Video}    label="TMDB ID"    value={movie.tmdbId ? `#${movie.tmdbId}` : null} />
                  </div>
                  {movie.genres?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {movie.genres.map(g => (
                        <span key={g} style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.5)', padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}` }}>{g}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Cast tab ── */}
              {tab === 'cast' && (
                <motion.div key="cast" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {(!movie.cast || movie.cast.length === 0) ? (
                    <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '40px 0' }}>Chưa có diễn viên</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {movie.cast.sort((a,b) => a.order - b.order).map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 }}>
                            {c.profileUrl ? <img src={c.profileUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <User size={18} color="rgba(255,255,255,0.15)" style={{ margin: '11px auto', display: 'block' }}/>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 2 }}>{c.name}</p>
                            <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>{c.character}</p>
                          </div>
                          <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>#{c.order + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Images tab ── */}
              {tab === 'images' && (
                <motion.div key="images" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {(!movie.images || movie.images.length === 0) ? (
                    <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '40px 0' }}>Chưa có hình ảnh</p>
                  ) : (
                    <>
                      {['backdrop', 'poster'].map(type => {
                        const imgs = movie.images.filter(i => i.imageType === type);
                        if (!imgs.length) return null;
                        return (
                          <div key={type} style={{ marginBottom: 20 }}>
                            <p style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                              {type === 'backdrop' ? 'Backdrop' : 'Poster'} ({imgs.length})
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: type === 'backdrop' ? '1fr' : 'repeat(3, 1fr)', gap: 8 }}>
                              {imgs.map((img, i) => (
                                <a key={i} href={img.url} target="_blank" rel="noreferrer">
                                  <img src={img.url} alt="" style={{ width: '100%', borderRadius: 6, aspectRatio: type === 'backdrop' ? '16/9' : '2/3', objectFit: 'cover', display: 'block' }}/>
                                </a>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </motion.div>
              )}

              {/* ── Videos tab ── */}
              {tab === 'videos' && (
                <motion.div key="videos" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <UploadZone movieId={movieId} onUploaded={handleVideoUploaded}/>

                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
                    <p style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                      Danh sách video
                    </p>
                    <VideoList videos={movie.videos} onDelete={handleVideoDeleted}/>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </>
  );
}