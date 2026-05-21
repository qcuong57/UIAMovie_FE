// src/components/admin/tvshow/TvShowDetailPanel.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  Calendar,
  Globe,
  Tv,
  User,
  Pencil,
  ChevronDown,
  ChevronRight,
  Play,
  Clock,
  RefreshCw,
  Video,
  Trash2,
} from "lucide-react";
import axiosInstance from "../../../config/axios";
import { UploadZone } from "../movie/VideoUploadPanel";
import EpisodeSubtitlePanel from "./EpisodeSubtitlePanel";

const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const T = {
  bg: "#F4F3EF",
  surface: "#FFFFFF",
  surfaceAlt: "#FAFAF8",
  surfaceHov: "#F6F6F3",
  accent: "#1C5F3A",
  accentLight: "#EAF5EF",
  accentText: "#155230",
  text: "#18181B",
  textSub: "#71717A",
  textMuted: "#A1A1AA",
  border: "rgba(0,0,0,0.08)",
  borderMed: "rgba(0,0,0,0.13)",
  shadow: "0 1px 3px rgba(0,0,0,0.07)",
  shadowLg: "0 20px 60px rgba(0,0,0,0.14)",
  gold: "#D97706",
  red: "#DC2626",
};

const COUNTRY_FLAG = {
  KR: "🇰🇷",
  US: "🇺🇸",
  JP: "🇯🇵",
  CN: "🇨🇳",
  VN: "🇻🇳",
  FR: "🇫🇷",
  GB: "🇬🇧",
  IN: "🇮🇳",
  TH: "🇹🇭",
};

const VIDEO_TYPES = ['main', 'trailer', 'clip', 'behind'];
const TYPE_LABEL  = { main: 'Phim chính', trailer: 'Trailer', clip: 'Clip', behind: 'Hậu trường' };
const TYPE_COLOR  = { main: T.accent, trailer: '#D97706', clip: '#2563EB', behind: '#7C3AED' };

const TABS = [
  { key: "info",    label: "Thông tin" },
  { key: "cast",    label: "Diễn viên" },
  { key: "images",  label: "Hình ảnh"  },
  { key: "videos",  label: "Video"     },
  { key: "seasons", label: "Seasons"   },
];

// ── MetaRow ───────────────────────────────────────────────────────────────────
const MetaRow = ({ icon: Icon, label, value, accent }) =>
  value ? (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "9px 0",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          flexShrink: 0,
          background: accent ? `${accent}12` : T.surfaceAlt,
          border: `1px solid ${accent ? `${accent}25` : T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={13} color={accent ?? T.textMuted} />
      </div>
      <span
        style={{
          fontFamily: FONT,
          fontSize: 12,
          color: T.textMuted,
          minWidth: 90,
          flexShrink: 0,
          paddingTop: 5,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: FONT,
          fontSize: 13,
          color: T.text,
          lineHeight: 1.5,
          paddingTop: 4,
        }}
      >
        {value}
      </span>
    </div>
  ) : null;

// ── VideoList ─────────────────────────────────────────────────────────────────
function VideoList({ videos, onDelete }) {
  const [deleting, setDeleting] = useState(null);
  const [preview,  setPreview]  = useState(null);

  const handleDelete = async (v) => {
    if (!window.confirm(`Xóa video "${TYPE_LABEL[v.videoType] ?? v.videoType}"?`)) return;
    setDeleting(v.id);
    try {
      await axiosInstance.delete(`/tvshows/videos/${v.id}`);
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
      <AnimatePresence>
        {preview && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPreview(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, backdropFilter: 'blur(6px)' }}
            />
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 401, width: 'min(90vw, 820px)' }}>
              <video src={preview.videoUrl} controls autoPlay
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
                  {v.videoUrl && (
                    <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                      {v.videoUrl}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  {v.videoUrl && (
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

// ── EpisodeVideoZone ─────────────────────────────────────────────────────────
function EpisodeVideoZone({ episode, onUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [deleting,  setDeleting]  = useState(false);
  const [dragOver,  setDragOver]  = useState(false);
  const [preview,   setPreview]   = useState(false);
  const inputRef = React.useRef(null);

  const hasVideo = !!episode.videoUrl;

  const doUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append('videoFile', file);
      const res = await axiosInstance.post(
        `/tvshows/episodes/${episode.id}/video`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (ev) => setProgress(Math.round((ev.loaded * 100) / ev.total)),
        }
      );
      const data = (res?.data ?? res)?.data ?? (res?.data ?? res);
      onUpdated?.({ ...episode, videoUrl: data?.videoUrl ?? episode.videoUrl });
    } catch (err) {
      alert(err?.response?.data?.message ?? 'Upload thất bại');
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Xóa video tập ${episode.episodeNumber ?? ''}?`)) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/tvshows/episodes/${episode.id}/video`);
      onUpdated?.({ ...episode, videoUrl: null });
    } catch (err) {
      alert(err?.response?.data?.message ?? 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  };

  // ── Đã có video ───────────────────────────────────────────────────────────
  if (hasVideo) return (
    <>
      <AnimatePresence>
        {preview && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPreview(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 500, backdropFilter: 'blur(7px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
              style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 501, width: 'min(90vw, 820px)' }}>
              <video src={episode.videoUrl} controls autoPlay
                style={{ width: '100%', borderRadius: 12, display: 'block', background: '#000', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }} />
              <button onClick={() => setPreview(false)}
                style={{ position: 'absolute', top: -14, right: -14, width: 32, height: 32, borderRadius: '50%', background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <div style={{ margin: '0 14px 10px', borderRadius: 9, background: T.surface, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: uploading ? `1px solid ${T.border}` : 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: T.accentLight, border: `1px solid ${T.accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Video size={13} color={T.accentText} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 1 }}>Video tập phim</p>
            <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {episode.videoUrl}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            <button onClick={() => setPreview(true)}
              style={{ height: 28, padding: '0 10px', borderRadius: 7, background: T.accentLight, border: `1px solid ${T.accent}30`, cursor: 'pointer', color: T.accentText, display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT, fontSize: 11.5, fontWeight: 600 }}>
              <Play size={11} /> Xem
            </button>
            <input ref={inputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => doUpload(e.target.files?.[0])} />
            <button onClick={() => inputRef.current?.click()} disabled={uploading}
              style={{ height: 28, padding: '0 10px', borderRadius: 7, background: '#EFF6FF', border: '1px solid rgba(37,99,235,0.22)', cursor: uploading ? 'not-allowed' : 'pointer', color: '#2563EB', display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT, fontSize: 11.5, fontWeight: 600 }}>
              <RefreshCw size={11} style={uploading ? { animation: 'spinCw 0.8s linear infinite' } : {}} />
              {uploading ? `${progress}%` : 'Thay file'}
            </button>
            <button onClick={handleDelete} disabled={deleting}
              style={{ width: 28, height: 28, borderRadius: 7, background: '#FEF2F2', border: '1px solid rgba(220,38,38,0.2)', cursor: deleting ? 'not-allowed' : 'pointer', color: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deleting ? 0.5 : 1 }}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        {uploading && (
          <div style={{ height: 3, background: T.border }}>
            <div style={{ height: '100%', background: T.accent, width: `${progress}%`, transition: 'width 0.25s', borderRadius: 2 }} />
          </div>
        )}
      </div>
    </>
  );

  // ── Chưa có video: upload zone ────────────────────────────────────────────
  return (
    <div style={{ margin: '0 14px 10px' }}>
      <input ref={inputRef} type="file" accept="video/*" style={{ display: 'none' }}
        onChange={e => doUpload(e.target.files?.[0])} />
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); doUpload(e.dataTransfer.files?.[0]); }}
        style={{
          borderRadius: 9,
          border: `1.5px dashed ${dragOver ? T.accent : uploading ? T.accent : T.borderMed}`,
          background: dragOver ? T.accentLight : uploading ? `${T.accent}07` : T.surfaceAlt,
          padding: '11px 14px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
          transition: 'all 0.15s',
        }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {uploading
            ? <div style={{ width: 13, height: 13, border: `2px solid ${T.accentLight}`, borderTopColor: T.accent, borderRadius: '50%', animation: 'spinCw 0.7s linear infinite' }} />
            : <Video size={14} color={T.accent} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {uploading ? (
            <>
              <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: T.accent, marginBottom: 4 }}>
                Đang upload… {progress}%
              </p>
              <div style={{ height: 4, borderRadius: 2, background: T.border, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: T.accent, width: `${progress}%`, transition: 'width 0.25s', borderRadius: 2 }} />
              </div>
            </>
          ) : (
            <>
              <p style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: T.text, marginBottom: 1 }}>
                Upload video cho tập này
              </p>
              <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>
                Kéo thả hoặc click · MP4, MKV, MOV…
              </p>
            </>
          )}
        </div>
        {!uploading && (
          <span style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 700, color: T.accentText, background: T.accentLight, border: `1px solid ${T.accent}30`, padding: '4px 10px', borderRadius: 6, flexShrink: 0 }}>
            Chọn file
          </span>
        )}
      </div>
    </div>
  );
}

// ── SeasonAccordion ───────────────────────────────────────────────────────────
const SeasonAccordion = ({ season, showId, invalidated }) => {
  const [open, setOpen] = useState(false);
  const [episodes, setEpisodes] = useState(season.episodes ?? []);
  const [loadingEps, setLoadingEps] = useState(false);
  const [loaded, setLoaded] = useState((season.episodes ?? []).length > 0);

  // Bug 4 fix: khi backend báo season này đã bị cache bust sau sync,
  // reset loaded=false để lần mở tiếp theo sẽ fetch lại thay vì dùng snapshot cũ.
  const prevInvalidated = React.useRef(false);
  React.useEffect(() => {
    if (invalidated && !prevInvalidated.current) {
      setLoaded(false);
      setEpisodes([]);
    }
    prevInvalidated.current = invalidated;
  }, [invalidated]);

  const handleEpisodeUpdated = (updated) => {
    setEpisodes(prev => prev.map(ep => ep.id === updated.id ? updated : ep));
  };

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !loaded && showId) {
      setLoadingEps(true);
      try {
        const data = await axiosInstance
          .get(`/tvshows/${showId}/seasons/${season.seasonNumber}`)
          .then((res) => {
            const envelope = res?.data ?? res;
            return envelope?.data ?? envelope;
          });
        setEpisodes(data?.episodes ?? []);
        setLoaded(true);
      } catch (err) {
        console.error('[SeasonAccordion] Error loading episodes:', err);
      } finally {
        setLoadingEps(false);
      }
    }
  };

  return (
    <div
      style={{
        borderRadius: 10,
        border: `1px solid ${T.border}`,
        overflow: "hidden",
        marginBottom: 8,
      }}
    >
      <button
        onClick={handleToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "11px 14px",
          background: T.surface,
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          transition: "background 0.12s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceHov)}
        onMouseLeave={(e) => (e.currentTarget.style.background = T.surface)}
      >
        {season.posterUrl ? (
          <img
            src={season.posterUrl}
            alt=""
            style={{
              width: 36,
              height: 52,
              borderRadius: 6,
              objectFit: "cover",
              flexShrink: 0,
              border: `1px solid ${T.border}`,
            }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 52,
              borderRadius: 6,
              background: T.bg,
              border: `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Tv size={14} color={T.textMuted} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 13.5,
              fontWeight: 700,
              color: T.text,
              marginBottom: 2,
            }}
          >
            {season.name ?? `Season ${season.seasonNumber}`}
          </p>
          <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted }}>
            {episodes.length > 0
              ? `${episodes.length} tập`
              : season.episodeCount != null
                ? `${season.episodeCount} tập`
                : "Không có tập"}
            {season.airDate
              ? ` · ${new Date(season.airDate).getFullYear()}`
              : ""}
          </p>
        </div>
        <div
          style={{
            flexShrink: 0,
            color: T.textMuted,
            display: "flex",
            alignItems: "center",
            transition: "transform 0.2s",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          }}
        >
          <ChevronDown size={16} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            {loadingEps ? (
              <div
                style={{
                  padding: "16px 14px",
                  borderTop: `1px solid ${T.border}`,
                  background: T.bg,
                  textAlign: "center",
                }}
              >
                <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.textMuted }}>
                  Đang tải tập phim...
                </p>
              </div>
            ) : episodes.length === 0 ? (
              <div
                style={{
                  padding: "16px 14px",
                  borderTop: `1px solid ${T.border}`,
                  background: T.bg,
                }}
              >
                <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.textMuted, textAlign: "center" }}>
                  Chưa có dữ liệu tập phim
                </p>
              </div>
            ) : (
              <div style={{ borderTop: `1px solid ${T.border}`, background: T.bg }}>
                {episodes
                  .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0))
                  .map((ep, idx) => (
                    <div key={ep.id ?? idx} style={{ borderBottom: idx < episodes.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      {/* Episode info row */}
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px 8px", transition: "background 0.1s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceHov)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {ep.stillUrl ? (
                          <img src={ep.stillUrl} alt=""
                            style={{ width: 72, height: 42, borderRadius: 6, objectFit: "cover", flexShrink: 0, border: `1px solid ${T.border}` }} />
                        ) : (
                          <div style={{ width: 72, height: 42, borderRadius: 6, background: T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Play size={12} color={T.textMuted} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                            <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 700, color: T.accentText, background: T.accentLight, border: `1px solid ${T.accent}25`, padding: "1px 6px", borderRadius: 4 }}>
                              T{ep.episodeNumber ?? idx + 1}
                            </span>
                            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {ep.name ?? ep.title ?? `Tập ${ep.episodeNumber ?? idx + 1}`}
                            </p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {ep.runtime && (
                              <span style={{ display: "flex", alignItems: "center", gap: 3, fontFamily: FONT, fontSize: 11, color: T.textMuted }}>
                                <Clock size={9} /> {ep.runtime} phút
                              </span>
                            )}
                            {ep.airDate && (
                              <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted }}>
                                {new Date(ep.airDate).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                            {ep.videoUrl && (
                              <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: T.accentText, background: T.accentLight, border: `1px solid ${T.accent}30`, padding: '1px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Play size={8} style={{ fill: T.accentText }} /> Có video
                              </span>
                            )}
                          </div>
                        </div>
                        {ep.voteAverage > 0 && (
                          <span style={{ display: "flex", alignItems: "center", gap: 3, fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.gold, flexShrink: 0 }}>
                            <Star size={9} style={{ fill: T.gold, color: T.gold }} /> {Number(ep.voteAverage).toFixed(1)}
                          </span>
                        )}
                      </div>
                      {/* Video upload zone — luôn hiển thị bên dưới info row */}
                      {ep.id && <EpisodeVideoZone episode={ep} onUpdated={handleEpisodeUpdated} />}
                      {/* Subtitle panel — quản lý subtitle cho tập phim */}
                      {ep.id && (
                        <div style={{
                          margin: "0 14px 12px",
                          padding: "12px 14px",
                          background: T.surfaceAlt,
                          borderRadius: 10,
                          border: `1px solid ${T.border}`,
                        }}>
                          <EpisodeSubtitlePanel episodeId={ep.id} />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Panel ─────────────────────────────────────────────────────────────────
export default function TvShowDetailPanel({ showId, onClose, onEdit }) {
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("info");

  // State cho quá trình Sync tập mới
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  // Bug 4 fix: lưu danh sách season numbers đã bị cache bust để truyền xuống SeasonAccordion
  const [invalidatedSeasons, setInvalidatedSeasons] = useState([]);

  // Tách hàm load riêng để gọi lại sau khi sync thành công
  const loadShowData = () => {
    setLoading(true);
    axiosInstance
      .get(`/tvshows/${showId}`)
      .then((res) => {
        const payload = res?.data ?? res;
        setShow(payload?.data ?? payload);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!showId) return;
    setTab("info");
    loadShowData();
  }, [showId]);

  const handleVideoUploaded = (video) => {
    setShow(prev => prev ? { ...prev, videos: [...(prev.videos ?? []), video] } : prev);
  };
  const handleVideoDeleted = (videoId) => {
    setShow(prev => prev ? { ...prev, videos: (prev.videos ?? []).filter(v => v.id !== videoId) } : prev);
  };

  // Xử lý nút Sync Tập Mới
  const handleSyncEpisodes = async () => {
    setSyncing(true);
    setSyncMsg(null);
    setInvalidatedSeasons([]); // reset trước khi sync mới
    try {
      const res = await axiosInstance.post(`/tvshows/${showId}/sync`);
      const data = res?.data?.data ?? res?.data;
      setSyncMsg({ type: "success", text: data?.message || "Đồng bộ tập mới thành công!" });
      // Bug 4 fix: đánh dấu các season cần re-fetch TRƯỚC khi loadShowData
      // để SeasonAccordion nhận được invalidated=true và reset loaded=false
      if (Array.isArray(data?.invalidatedSeasons) && data.invalidatedSeasons.length > 0) {
        setInvalidatedSeasons(data.invalidatedSeasons);
      }
      loadShowData(); // Load lại data để lấy số tập / season mới
      setTimeout(() => setSyncMsg(null), 5000); // Ẩn thông báo sau 5s
    } catch (error) {
      const msg = error?.response?.data?.message || "Đồng bộ thất bại, hãy thử lại";
      setSyncMsg({ type: "error", text: msg });
      setTimeout(() => setSyncMsg(null), 5000);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      {/* Khai báo animation spin cho icon loading */}
      <style>{`@keyframes spinCw { to { transform: rotate(360deg); } }`}</style>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.25)",
          zIndex: 199,
          backdropFilter: "blur(3px)",
        }}
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 480,
          zIndex: 200,
          background: T.surface,
          borderLeft: `1px solid ${T.borderMed}`,
          display: "flex",
          flexDirection: "column",
          boxShadow: T.shadowLg,
          fontFamily: FONT,
        }}
      >
        <div style={{ flexShrink: 0 }}>
          {!loading && show && (
            <div style={{ position: "relative", overflow: "hidden", background: T.bg }}>
              {show.backdropUrl && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${show.backdropUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "blur(2px) brightness(0.92)",
                    transform: "scale(1.05)",
                  }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to bottom, rgba(244,243,239,0.5) 0%, rgba(244,243,239,0.97) 100%)",
                }}
              />

              <div style={{ position: "relative", padding: "20px 20px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                {show.posterUrl && (
                  <div style={{ width: 64, flexShrink: 0, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                    <img src={show.posterUrl} alt="" style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", display: "block" }} />
                  </div>
                )}
                
                <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                  <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, marginBottom: 4, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Chi tiết TV show
                  </p>
                  <h2 style={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: T.text, margin: "0 0 6px", letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                    {show.title ?? show.name}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {show.rating && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: FONT, fontSize: 12, fontWeight: 700, color: T.gold }}>
                        <Star size={11} style={{ fill: T.gold, color: T.gold }} /> {Number(show.rating).toFixed(1)}
                      </span>
                    )}
                    {show.firstAirDate && (
                      <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted }}>
                        {new Date(show.firstAirDate).getFullYear()}
                      </span>
                    )}
                    {show.numberOfSeasons > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: FONT, fontSize: 12, color: T.textMuted }}>
                        <Tv size={11} /> {show.numberOfSeasons} mùa
                      </span>
                    )}
                    {show.status && (
                      <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: T.accentLight, color: T.accentText, border: `1px solid ${T.accent}25` }}>
                        {show.status}
                      </span>
                    )}
                  </div>
                  
                  {/* --- HIỂN THỊ THÔNG BÁO SYNC --- */}
                  {syncMsg && (
                    <div style={{ 
                      marginTop: 8, padding: "5px 10px", borderRadius: 6,
                      background: syncMsg.type === "success" ? "#F0FDF4" : "#FEF2F2",
                      border: `1px solid ${syncMsg.type === "success" ? "#BBF7D0" : "#FECACA"}`,
                      fontFamily: FONT, fontSize: 11.5, fontWeight: 600,
                      color: syncMsg.type === "success" ? "#16A34A" : "#DC2626",
                      display: "inline-block"
                    }}>
                      {syncMsg.type === "success" ? "✓" : "❌"} {syncMsg.text}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                  {/* --- NÚT SYNC TẬP MỚI --- */}
                  <button
                    onClick={handleSyncEpisodes}
                    disabled={syncing}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 8,
                      background: syncing ? T.surfaceAlt : "#EFF6FF",
                      border: `1px solid ${syncing ? T.border : "#BFDBFE"}`,
                      cursor: syncing ? "wait" : "pointer",
                      fontFamily: FONT, fontSize: 12, fontWeight: 600,
                      color: syncing ? T.textMuted : "#2563EB",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    <RefreshCw size={12} style={{ animation: syncing ? "spinCw 1s linear infinite" : "none" }} />
                    {syncing ? "Đang Sync..." : "Sync Tập Mới"}
                  </button>

                  {onEdit && (
                    <button
                      onClick={() => onEdit(show)}
                      style={{ padding: "7px 12px", borderRadius: 8, background: T.accentLight, border: `1px solid ${T.accent}30`, cursor: "pointer", fontFamily: FONT, fontSize: 12, fontWeight: 600, color: T.accentText, display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <Pencil size={12} /> Sửa
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    style={{ width: 32, height: 32, borderRadius: "50%", background: T.surface, border: `1px solid ${T.border}`, cursor: "pointer", color: T.textSub, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {(loading || !show) && (
            <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 4 }}>Chi tiết</p>
                <h2 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: T.text, margin: 0 }}>TV Show</h2>
              </div>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: T.bg, border: `1px solid ${T.border}`, cursor: "pointer", color: T.textSub, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={15} />
              </button>
            </div>
          )}

          {!loading && show && (
            <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, paddingLeft: 20 }}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    padding: "10px 16px", background: "none", border: "none",
                    borderBottom: `2px solid ${tab === t.key ? T.accent : "transparent"}`,
                    cursor: "pointer", fontFamily: FONT, fontSize: 12.5,
                    fontWeight: tab === t.key ? 700 : 400,
                    color: tab === t.key ? T.accentText : T.textMuted,
                    transition: "all 0.15s", marginBottom: -1,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20, background: T.bg }}>
          {loading && (
            <div style={{ padding: "64px 0", textAlign: "center" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", border: `2.5px solid ${T.accentLight}`, borderTopColor: T.accent, animation: "spinCw 0.75s linear infinite", margin: "0 auto" }} />
            </div>
          )}

          {!loading && show && (
            <AnimatePresence mode="wait">
              {tab === "info" && (
                <motion.div key="info" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {show.description && (
                    <div style={{ marginBottom: 14, padding: "14px 16px", borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                      <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Mô tả</p>
                      <p style={{ fontFamily: FONT, fontSize: 13, color: T.textSub, lineHeight: 1.7 }}>{show.description}</p>
                    </div>
                  )}
                  <div style={{ padding: 16, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, boxShadow: T.shadow, marginBottom: 14 }}>
                    <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Chi tiết</p>
                    <MetaRow icon={Star} label="Rating" value={show.rating ? `${Number(show.rating).toFixed(1)} / 10` : null} accent={T.gold} />
                    <MetaRow icon={Calendar} label="Phát sóng" value={show.firstAirDate ? new Date(show.firstAirDate).toLocaleDateString("vi-VN") : null} />
                    <MetaRow icon={Tv} label="Seasons" value={show.numberOfSeasons != null ? `${show.numberOfSeasons} mùa` : null} accent={T.accent} />
                    <MetaRow icon={Globe} label="Quốc gia" value={show.originCountry ? `${COUNTRY_FLAG[show.originCountry] ?? ""} ${show.originCountry}` : null} />
                    <MetaRow icon={Tv} label="Thể loại" value={show.genres?.join(", ") || null} />
                    <MetaRow icon={User} label="Trạng thái" value={show.status || null} />
                    {show.networks?.length > 0 && <MetaRow icon={Globe} label="Network" value={show.networks.join(", ")} />}
                  </div>
                  {show.genres?.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {show.genres.map((g) => (
                        <span key={g} style={{ fontFamily: FONT, fontSize: 12, color: T.accentText, padding: "4px 12px", borderRadius: 99, background: T.accentLight, border: `1px solid ${T.accent}30` }}>{g}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {tab === "cast" && (
                <motion.div key="cast" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {!show.cast || show.cast.length === 0 ? (
                    <div style={{ padding: "48px 0", textAlign: "center" }}>
                      <User size={28} color={T.textMuted} style={{ margin: "0 auto 10px", opacity: 0.35 }} />
                      <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Chưa có diễn viên</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {show.cast.sort((a, b) => a.order - b.order).map((c, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                          <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", background: T.bg, flexShrink: 0, border: `1px solid ${T.border}` }}>
                            {c.profileUrl ? <img src={c.profileUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={16} color={T.textMuted} style={{ margin: "11px auto", display: "block" }} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2 }}>{c.name}</p>
                            <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, fontStyle: "italic" }}>{c.character}</p>
                          </div>
                          <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, flexShrink: 0, background: T.surfaceAlt, padding: "2px 8px", borderRadius: 6, border: `1px solid ${T.border}` }}>#{c.order + 1}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {tab === "images" && (
                <motion.div key="images" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {!show.images || show.images.length === 0 ? (
                    <div style={{ padding: "48px 0", textAlign: "center" }}>
                      <Tv size={28} color={T.textMuted} style={{ margin: "0 auto 10px", opacity: 0.35 }} />
                      <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Chưa có hình ảnh</p>
                    </div>
                  ) : (
                    <>
                      {["backdrop", "poster"].map((type) => {
                        const imgs = show.images.filter((i) => i.imageType === type);
                        if (!imgs.length) return null;
                        return (
                          <div key={type} style={{ marginBottom: 20 }}>
                            <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>{type === "backdrop" ? "Backdrop" : "Poster"} ({imgs.length})</p>
                            <div style={{ display: "grid", gridTemplateColumns: type === "backdrop" ? "1fr" : "repeat(3, 1fr)", gap: 8 }}>
                              {imgs.map((img, i) => (
                                <a key={i} href={img.url} target="_blank" rel="noreferrer" style={{ display: "block", borderRadius: 9, overflow: "hidden", border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                                  <img src={img.url} alt="" style={{ width: "100%", aspectRatio: type === "backdrop" ? "16/9" : "2/3", objectFit: "cover", display: "block", transition: "transform 0.2s" }} onMouseEnter={(e) => (e.target.style.transform = "scale(1.04)")} onMouseLeave={(e) => (e.target.style.transform = "scale(1)")} />
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

              {tab === "videos" && (
                <motion.div key="videos" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <UploadZone uploadUrl={`/tvshows/${show.id}/videos`} onUploaded={handleVideoUploaded} />
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20, marginTop: 4 }}>
                    <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
                      Danh sách video
                    </p>
                    <VideoList videos={show.videos} onDelete={handleVideoDeleted} />
                  </div>
                </motion.div>
              )}

              {tab === "seasons" && (
                <motion.div key="seasons" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {!show.seasons || show.seasons.length === 0 ? (
                    <div style={{ padding: "48px 0", textAlign: "center" }}>
                      <Tv size={28} color={T.textMuted} style={{ margin: "0 auto 10px", opacity: 0.35 }} />
                      <p style={{ fontFamily: FONT, fontSize: 13, color: T.textMuted }}>Chưa có dữ liệu season</p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>{show.seasons.length} Season{show.seasons.length > 1 ? "s" : ""}</p>
                      {show.seasons.sort((a, b) => (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0)).map((season) => (
                        <SeasonAccordion
                          key={season.id ?? season.seasonNumber}
                          season={season}
                          showId={show.id}
                          invalidated={invalidatedSeasons.includes(season.seasonNumber)}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </>
  );
}