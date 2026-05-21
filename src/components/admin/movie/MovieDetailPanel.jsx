// src/components/admin/movie/MovieDetailPanel.jsx  ← REDESIGNED light theme
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Clock, Calendar, Globe, Film, User, Video, Trash2, Play, Pencil } from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { UploadZone } from './VideoUploadPanel';
import SubtitlePanel from './SubtitlePanel';

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
  shadow:      '0 1px 3px rgba(0,0,0,0.07)',
  shadowLg:    '0 20px 60px rgba(0,0,0,0.14)',
  gold:        '#D97706',
  red:         '#DC2626',
};

const COUNTRY_FLAG = { KR:'🇰🇷', US:'🇺🇸', JP:'🇯🇵', CN:'🇨🇳', VN:'🇻🇳', FR:'🇫🇷', GB:'🇬🇧', IN:'🇮🇳', TH:'🇹🇭' };
const VIDEO_TYPES  = ['main', 'trailer', 'clip', 'behind'];
const TYPE_LABEL   = { main: 'Phim chính', trailer: 'Trailer', clip: 'Clip', behind: 'Hậu trường' };
const TYPE_COLOR   = { main: T.accent, trailer: '#D97706', clip: '#2563EB', behind: '#7C3AED' };

const TABS = [
  { key: 'info',      label: 'Thông tin' },
  { key: 'cast',      label: 'Diễn viên' },
  { key: 'images',    label: 'Hình ảnh'  },
  { key: 'videos',    label: 'Video'     },
  { key: 'subtitles', label: 'Subtitles' },
];

// ── MetaRow ───────────────────────────────────────────────────────────────────
const MetaRow = ({ icon: Icon, label, value, accent }) => value ? (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '9px 0', borderBottom: `1px solid ${T.border}` }}>
    <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: accent ? `${accent}12` : T.surfaceAlt, border: `1px solid ${accent ? `${accent}25` : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={13} color={accent ?? T.textMuted} />
    </div>
    <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, minWidth: 90, flexShrink: 0, paddingTop: 5 }}>{label}</span>
    <span style={{ fontFamily: FONT, fontSize: 13, color: T.text, lineHeight: 1.5, paddingTop: 4 }}>{value}</span>
  </div>
) : null;

// ── VideoList ─────────────────────────────────────────────────────────────────
function VideoList({ videos, onDelete }) {
  const [deleting, setDeleting] = useState(null);
  const [preview,  setPreview]  = useState(null);

  const handleDelete = async (v) => {
    if (!window.confirm(`Xóa video "${TYPE_LABEL[v.videoType] ?? v.videoType}" (${v.quality})?`)) return;
    setDeleting(v.id);
    try {
      await axiosInstance.delete(`/movies/videos/${v.id}`);
      onDelete?.(v.id);
    } catch (e) { alert(e?.response?.data?.message ?? 'Xóa thất bại'); }
    finally { setDeleting(null); }
  };

  if (!videos?.length) return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <Video size={28} color={T.textMuted} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
      <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Chưa có video nào</p>
    </div>
  );

  const grouped = VIDEO_TYPES.reduce((acc, t) => {
    const items = videos.filter(v => v.videoType === t);
    if (items.length) acc[t] = items;
    return acc;
  }, {});

  return (
    <>
      {/* Preview overlay */}
      <AnimatePresence>
        {preview && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPreview(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, backdropFilter: 'blur(6px)' }}
            />
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 401, width: 'min(90vw, 820px)' }}>
              <video src={preview.url} controls autoPlay
                style={{ width: '100%', borderRadius: 12, display: 'block', background: '#000', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }} />
              <button onClick={() => setPreview(null)}
                style={{ position: 'absolute', top: -14, right: -14, width: 32, height: 32, borderRadius: '50%', background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLOR[type] ?? T.textMuted, flexShrink: 0 }} />
            <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {TYPE_LABEL[type] ?? type} ({items.length})
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((v, i) => (
              <motion.div key={v.id ?? i} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${TYPE_COLOR[type] ?? T.textMuted}14`, border: `1px solid ${TYPE_COLOR[type] ?? T.border}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Video size={13} color={TYPE_COLOR[type] ?? T.textMuted} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FONT, fontSize: 13, color: T.text, fontWeight: 600, marginBottom: 2 }}>
                    {TYPE_LABEL[type] ?? type}
                    {v.quality && (
                      <span style={{ marginLeft: 6, fontFamily: FONT, fontSize: 10.5, color: T.textMuted, fontWeight: 500, padding: '2px 6px', borderRadius: 4, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                        {v.quality}
                      </span>
                    )}
                  </p>
                  {v.url && (
                    <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                      {v.url}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  {v.url && (
                    <button onClick={() => setPreview(v)}
                      style={{ width: 28, height: 28, borderRadius: 7, background: T.accentLight, border: `1px solid ${T.accent}30`, cursor: 'pointer', color: T.accentText, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={12} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(v)} disabled={deleting === v.id}
                    style={{ width: 28, height: 28, borderRadius: 7, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)', cursor: 'pointer', color: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deleting === v.id ? 0.5 : 1 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// ── MovieDetailPanel ──────────────────────────────────────────────────────────
export default function MovieDetailPanel({ movieId, onClose, onEdit }) {
  const [movie,   setMovie]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('info');

  useEffect(() => {
    if (!movieId) return;
    setLoading(true); setTab('info');
    axiosInstance.get(`/movies/${movieId}`)
      .then(res => setMovie(res?.data ?? res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [movieId]);

  const handleVideoUploaded = (video) => {
    setMovie(prev => prev ? { ...prev, videos: [...(prev.videos ?? []), video] } : prev);
  };
  const handleVideoDeleted = (videoId) => {
    setMovie(prev => prev ? { ...prev, videos: (prev.videos ?? []).filter(v => v.id !== videoId) } : prev);
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 199, backdropFilter: 'blur(3px)' }}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 480, zIndex: 200,
          background: T.surface,
          borderLeft: `1px solid ${T.borderMed}`,
          display: 'flex', flexDirection: 'column',
          boxShadow: T.shadowLg,
          fontFamily: FONT,
        }}
      >
        {/* Header */}
        <div style={{ flexShrink: 0 }}>
          {/* Movie hero */}
          {!loading && movie && (
            <div style={{
              position: 'relative', overflow: 'hidden',
              background: T.bg,
            }}>
              {/* Backdrop blur bg */}
              {movie.backdropUrl && (
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${movie.backdropUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(2px) brightness(0.92)', transform: 'scale(1.05)' }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(244,243,239,0.5) 0%, rgba(244,243,239,0.97) 100%)' }} />

              <div style={{ position: 'relative', padding: '20px 20px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {/* Poster */}
                {movie.posterUrl && (
                  <div style={{ width: 64, flexShrink: 0, borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                    <img src={movie.posterUrl} alt="" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                  <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, marginBottom: 4, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Chi tiết phim</p>
                  <h2 style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: T.text, margin: '0 0 6px', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                    {movie.title}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {movie.rating && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontSize: 12, fontWeight: 700, color: T.gold }}>
                        <Star size={11} style={{ fill: T.gold, color: T.gold }}/> {Number(movie.rating).toFixed(1)}
                      </span>
                    )}
                    {movie.year && <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted }}>{movie.year}</span>}
                    {movie.duration && <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted }}>{movie.duration} phút</span>}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                  {onEdit && (
                    <button onClick={() => onEdit(movie)}
                      style={{ padding: '7px 12px', borderRadius: 8, background: T.accentLight, border: `1px solid ${T.accent}30`, cursor: 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: 600, color: T.accentText, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Pencil size={12}/> Sửa
                    </button>
                  )}
                  <button onClick={onClose}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Simple header when loading or no movie */}
          {(loading || !movie) && (
            <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 4 }}>Chi tiết</p>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: 0 }}>Phim</h2>
              </div>
              <button onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: '50%', background: T.bg, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} />
              </button>
            </div>
          )}

          {/* Tabs */}
          {!loading && movie && (
            <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, paddingLeft: 20 }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  padding: '10px 16px', background: 'none', border: 'none',
                  borderBottom: `2px solid ${tab === t.key ? T.accent : 'transparent'}`,
                  cursor: 'pointer', fontFamily: FONT, fontSize: 12.5,
                  fontWeight: tab === t.key ? 700 : 400,
                  color: tab === t.key ? T.accentText : T.textMuted,
                  transition: 'all 0.15s', marginBottom: -1,
                }}>{t.label}</button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: T.bg }}>
          {loading && (
            <div style={{ padding: '64px 0', textAlign: 'center' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', border: `2.5px solid ${T.accentLight}`, borderTopColor: T.accent, animation: 'spin 0.75s linear infinite', margin: '0 auto' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {!loading && movie && (
            <AnimatePresence mode="wait">

              {/* ── Info ── */}
              {tab === 'info' && (
                <motion.div key="info" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {movie.description && (
                    <div style={{ marginBottom: 14, padding: '14px 16px', borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                      <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Mô tả</p>
                      <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, lineHeight: 1.7 }}>{movie.description}</p>
                    </div>
                  )}
                  <div style={{ padding: 16, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, boxShadow: T.shadow, marginBottom: 14 }}>
                    <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Chi tiết</p>
                    <MetaRow icon={Star}     label="Rating"     value={movie.rating ? `${Number(movie.rating).toFixed(1)} / 10` : null} accent={T.gold} />
                    <MetaRow icon={Calendar} label="Phát hành"  value={movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : null} />
                    <MetaRow icon={Clock}    label="Thời lượng" value={movie.duration ? `${movie.duration} phút` : null} />
                    <MetaRow icon={Globe}    label="Quốc gia"   value={movie.originCountry ? `${COUNTRY_FLAG[movie.originCountry] ?? ''} ${movie.originCountry}` : null} />
                    <MetaRow icon={Film}     label="Thể loại"   value={movie.genres?.join(', ') || null} />
                    <MetaRow icon={User}     label="Đạo diễn"   value={movie.director || null} accent={T.accent} />
                  </div>
                  {movie.genres?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {movie.genres.map(g => (
                        <span key={g} style={{ fontFamily: FONT, fontSize: 12, color: T.accentText, padding: '4px 12px', borderRadius: 99, background: T.accentLight, border: `1px solid ${T.accent}30` }}>{g}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Cast ── */}
              {tab === 'cast' && (
                <motion.div key="cast" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {(!movie.cast || movie.cast.length === 0) ? (
                    <div style={{ padding: '48px 0', textAlign: 'center' }}>
                      <User size={28} color={T.textMuted} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                      <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Chưa có diễn viên</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {movie.cast.sort((a, b) => a.order - b.order).map((c, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', background: T.bg, flexShrink: 0, border: `1px solid ${T.border}` }}>
                            {c.profileUrl
                              ? <img src={c.profileUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <User size={16} color={T.textMuted} style={{ margin: '11px auto', display: 'block' }} />
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2 }}>{c.name}</p>
                            <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, fontStyle: 'italic' }}>{c.character}</p>
                          </div>
                          <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, flexShrink: 0, background: T.surfaceAlt, padding: '2px 8px', borderRadius: 6, border: `1px solid ${T.border}` }}>#{c.order + 1}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Images ── */}
              {tab === 'images' && (
                <motion.div key="images" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {(!movie.images || movie.images.length === 0) ? (
                    <div style={{ padding: '48px 0', textAlign: 'center' }}>
                      <Film size={28} color={T.textMuted} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                      <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Chưa có hình ảnh</p>
                    </div>
                  ) : (
                    <>
                      {['backdrop', 'poster'].map(type => {
                        const imgs = movie.images.filter(i => i.imageType === type);
                        if (!imgs.length) return null;
                        return (
                          <div key={type} style={{ marginBottom: 20 }}>
                            <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                              {type === 'backdrop' ? 'Backdrop' : 'Poster'} ({imgs.length})
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: type === 'backdrop' ? '1fr' : 'repeat(3, 1fr)', gap: 8 }}>
                              {imgs.map((img, i) => (
                                <a key={i} href={img.url} target="_blank" rel="noreferrer"
                                  style={{ display: 'block', borderRadius: 9, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                                  <img src={img.url} alt="" style={{ width: '100%', aspectRatio: type === 'backdrop' ? '16/9' : '2/3', objectFit: 'cover', display: 'block', transition: 'transform 0.2s' }}
                                    onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
                                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                                  />
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

              {/* ── Videos ── */}
              {tab === 'videos' && (
                <motion.div key="videos" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <UploadZone movieId={movieId} onUploaded={handleVideoUploaded} />
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20, marginTop: 4 }}>
                    <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                      Danh sách video
                    </p>
                    <VideoList videos={movie.videos} onDelete={handleVideoDeleted} />
                  </div>
                </motion.div>
              )}

              {/* ── Subtitles ── */}
              {tab === 'subtitles' && (
                <motion.div key="subtitles" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <SubtitlePanel movieId={movieId} />
                </motion.div>
              )}

            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </>
  );
}