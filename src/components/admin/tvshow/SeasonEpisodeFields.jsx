// src/components/admin/tvshow/SeasonEpisodeFields.jsx
// Season/Episode builder dùng khi thêm TV show thủ công (TvShowAddModal) — cho phép
// nhập luôn season + từng tập phim (metadata) ngay lúc tạo show, khớp với
// CreateTvShowDTO.Seasons ở backend (xem TvShowService.CreateTvShowAsync → SaveSeasonsAsync).
//
// Lưu ý: Video của từng tập KHÔNG upload ở đây — episode phải tồn tại trong DB
// (có Id) trước thì mới upload video được, nên video luôn được thêm SAU khi TV show
// đã tạo xong, ở tab "Seasons" tại trang chi tiết (EpisodeVideoZone trong
// TvShowDetailPanel.jsx). Field này chỉ nhập metadata (tên tập, mô tả, ảnh still...).

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Plus, X, Tv, Film, Check } from 'lucide-react';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../../context/adminTokens';
import { PosterField } from '../shared/GenreAndImageFields';
import tvShowService from '../../../services/tvShowService';
import {
  useTvShowSeason, useAddEpisode, useDeleteEpisode, useUpdateSeason, useUpdateEpisode,
} from '../../../hooks/useAdminTvShows';

let seasonUidSeq = 0;
const nextSeasonUid = () => `season_${Date.now()}_${seasonUidSeq++}`;
let episodeUidSeq = 0;
const nextEpisodeUid = () => `ep_${Date.now()}_${episodeUidSeq++}`;

const makeEmptyEpisode = () => ({
  uid: nextEpisodeUid(),
  episodeNumber: '',
  title: '',
  overview: '',
  stillUrl: '',
  runtime: '',
  rating: '',
  airDate: '',
});

const makeEmptySeason = (seasonNumber) => ({
  uid: nextSeasonUid(),
  seasonNumber: String(seasonNumber),
  name: '',
  overview: '',
  posterUrl: '',
  airDate: '',
  episodes: [],
});

function miniInputStyle(hasError) {
  return {
    height: 34, padding: '0 10px',
    background: T.surface, border: `1px solid ${hasError ? 'rgba(220,38,38,0.5)' : T.border}`,
    borderRadius: 8, color: T.text, outline: 'none',
    fontFamily: FONT, fontSize: 12.5, boxSizing: 'border-box', width: '100%',
  };
}

// ── 1 hàng tập phim ───────────────────────────────────────────────────────────
// Ảnh still dùng chung PosterField với EpisodeEditModal (upload file hoặc dán
// URL + xem trước phóng to qua ImageLightbox) — để thêm mới và sửa nhất quán.
function EpisodeRow({ episode, onChange, onRemove }) {
  const set = (key) => (v) => onChange({ ...episode, [key]: v });
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      padding: 10, borderRadius: 8,
      background: T.surface, border: `1px solid ${T.border}`,
    }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="number" placeholder="#"
          value={episode.episodeNumber}
          onChange={e => set('episodeNumber')(e.target.value)}
          style={{ ...miniInputStyle(false), width: 52, flexShrink: 0, textAlign: 'center' }}
        />
        <input
          placeholder="Tên tập..."
          value={episode.title}
          onChange={e => set('title')(e.target.value)}
          style={{ ...miniInputStyle(false), flex: 1 }}
        />
        <input
          type="number" placeholder="Phút"
          value={episode.runtime}
          onChange={e => set('runtime')(e.target.value)}
          style={{ ...miniInputStyle(false), width: 64, flexShrink: 0 }}
        />
        <button type="button" onClick={onRemove}
          title="Xóa tập"
          style={{ width: 26, height: 26, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <X size={11} />
        </button>
      </div>

      <input
        type="date"
        value={episode.airDate}
        onChange={e => set('airDate')(e.target.value)}
        title="Ngày phát sóng tập này (tùy chọn)"
        style={{ ...miniInputStyle(false), width: 140, flexShrink: 0 }}
      />

      <PosterField
        service={tvShowService}
        label="Ảnh still (tùy chọn)"
        imageType="backdrop"
        value={episode.stillUrl}
        onChange={set('stillUrl')}
      />
    </div>
  );
}

// ── 1 khối season (accordion, chứa danh sách tập bên trong) ──────────────────
function SeasonCard({ season, onChange, onRemove, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const set = (key) => (v) => onChange({ ...season, [key]: v });

  const addEpisode = () => {
    const nextNumber = season.episodes.length
      ? Math.max(...season.episodes.map(e => Number(e.episodeNumber) || 0)) + 1
      : 1;
    onChange({ ...season, episodes: [...season.episodes, { ...makeEmptyEpisode(), episodeNumber: String(nextNumber) }] });
  };
  const updateEpisode = (uid, next) => {
    onChange({ ...season, episodes: season.episodes.map(e => (e.uid === uid ? next : e)) });
  };
  const removeEpisode = (uid) => {
    onChange({ ...season, episodes: season.episodes.filter(e => e.uid !== uid) });
  };

  return (
    <div style={{ borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', background: T.surfaceAlt, cursor: 'pointer' }}
      >
        {open ? <ChevronDown size={14} color={T.textMuted} /> : <ChevronRight size={14} color={T.textMuted} />}
        <Tv size={13} color={T.textMuted} style={{ flexShrink: 0 }} />
        <input
          type="number" placeholder="Season #"
          value={season.seasonNumber}
          onClick={e => e.stopPropagation()}
          onChange={e => set('seasonNumber')(e.target.value)}
          style={{ ...miniInputStyle(false), width: 78, flexShrink: 0 }}
        />
        <input
          placeholder="Tên season (tùy chọn)"
          value={season.name}
          onClick={e => e.stopPropagation()}
          onChange={e => set('name')(e.target.value)}
          style={{ ...miniInputStyle(false), flex: 1 }}
        />
        <span style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, flexShrink: 0, whiteSpace: 'nowrap' }}>
          {season.episodes.length} tập
        </span>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRemove(); }}
          title="Xóa season"
          style={{ width: 26, height: 26, borderRadius: '50%', background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <X size={11} />
        </button>
      </div>

      {open && (
        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, background: T.surface }}>
          <input
            type="date"
            value={season.airDate}
            onChange={e => set('airDate')(e.target.value)}
            title="Ngày phát sóng season (tùy chọn)"
            style={{ ...miniInputStyle(false), width: 140, flexShrink: 0 }}
          />
          <textarea
            placeholder="Mô tả season (tùy chọn)"
            value={season.overview}
            onChange={e => set('overview')(e.target.value)}
            rows={2}
            style={{ ...miniInputStyle(false), height: 'auto', padding: '8px 10px', resize: 'vertical' }}
          />
          {/* Poster season dùng chung PosterField với SeasonEditModal (upload/dán URL
              + xem trước phóng to qua ImageLightbox) — thêm mới và sửa nhất quán. */}
          <PosterField
            service={tvShowService}
            label="Poster season (tùy chọn)"
            imageType="poster"
            value={season.posterUrl}
            onChange={set('posterUrl')}
          />

          {season.episodes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {season.episodes.map(ep => (
                <EpisodeRow
                  key={ep.uid}
                  episode={ep}
                  onChange={next => updateEpisode(ep.uid, next)}
                  onRemove={() => removeEpisode(ep.uid)}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addEpisode}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              height: 34, borderRadius: 8,
              background: T.surfaceAlt, border: `1px dashed ${T.border}`,
              cursor: 'pointer', color: T.textSub,
              fontFamily: FONT, fontSize: 12, fontWeight: 600,
            }}
          >
            <Film size={12} /> Thêm tập phim
          </button>
        </div>
      )}
    </div>
  );
}

// ── Field chính ────────────────────────────────────────────────────────────────
/**
 * Props:
 *   value    – Array<season state> (xem makeEmptySeason) — season mới nhất mặc định mở sẵn
 *   onChange – (nextArray) => void
 */
export function SeasonEpisodeBuilderField({ value = [], onChange }) {
  const addSeason = () => {
    const nextNumber = value.length
      ? Math.max(...value.map(s => Number(s.seasonNumber) || 0)) + 1
      : 1;
    onChange([...value, makeEmptySeason(nextNumber)]);
  };
  const updateSeason = (uid, next) => onChange(value.map(s => (s.uid === uid ? next : s)));
  const removeSeason = (uid) => onChange(value.filter(s => s.uid !== uid));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Seasons &amp; Episodes (tùy chọn)
      </label>

      {value.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {value.map((s, i) => (
            <SeasonCard
              key={s.uid}
              season={s}
              defaultOpen={i === value.length - 1}
              onChange={next => updateSeason(s.uid, next)}
              onRemove={() => removeSeason(s.uid)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addSeason}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          height: 40, borderRadius: 10,
          background: T.surfaceAlt, border: `1px dashed ${T.border}`,
          cursor: 'pointer', color: T.textSub,
          fontFamily: FONT, fontSize: 13, fontWeight: 600,
        }}
      >
        <Plus size={14} /> Thêm season
      </button>

      <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.textMuted, lineHeight: 1.6, margin: 0 }}>
        Có thể bỏ trống lúc tạo — season/tập có thể bổ sung sau bằng cách import/đồng bộ
        từ TMDB. Video từng tập luôn được upload sau, ở tab "Seasons" tại trang chi tiết
        (sau khi TV show đã được tạo).
      </p>
    </div>
  );
}

// ── Helper chuyển đổi sang shape DTO backend (CreateSeasonDTO / CreateEpisodeDTO) ──
/**
 * Bỏ qua season có SeasonNumber &lt;= 0 — khớp với TvShowService.SaveSeasonsAsync
 * (chỉ lưu season có SeasonNumber > 0, giống quy ước "Specials = 0" của TMDB).
 * Bỏ qua episode chưa nhập Title hoặc EpisodeNumber hợp lệ — tránh gửi tập rỗng lên
 * backend.
 */
export function seasonsStateToDto(seasonsState) {
  return seasonsState
    .filter(s => Number(s.seasonNumber) > 0)
    .map(s => ({
      seasonNumber: Number(s.seasonNumber) || 0,
      name: s.name?.trim() || null,
      overview: s.overview?.trim() || null,
      posterUrl: s.posterUrl?.trim() || null,
      airDate: s.airDate ? new Date(s.airDate).toISOString() : null,
      episodes: s.episodes
        .filter(e => e.title?.trim() && Number(e.episodeNumber) > 0)
        .map(e => ({
          episodeNumber: Number(e.episodeNumber) || 0,
          title: e.title.trim(),
          overview: e.overview?.trim() || null,
          stillUrl: e.stillUrl?.trim() || null,
          runtime: e.runtime ? Number(e.runtime) : null,
          rating: e.rating ? Number(e.rating) : null,
          airDate: e.airDate ? new Date(e.airDate).toISOString() : null,
        })),
    }));
}

// ══════════════════════════════════════════════════════════════════════════
// SỬA SEASON / EPISODE ĐÃ TỒN TẠI — dùng ở trang chi tiết TV show (không phải
// lúc tạo mới). Gọi PUT /api/tvshows/{id}/seasons/{seasonNumber} và
// PUT /api/tvshows/episodes/{episodeId} (xem UpdateSeasonDTO/UpdateEpisodeDTO
// và TvShowService.UpdateSeasonAsync/UpdateEpisodeAsync ở backend).
//
// Khác với SeasonEpisodeBuilderField (chỉ tạo mới lúc thêm show), 2 modal dưới
// đây CHỈ sửa metadata (tiêu đề/mô tả/ảnh/ngày) của 1 season hoặc 1 episode đã
// có sẵn — không tạo mới, không xóa, không đụng video (video sửa riêng qua
// UploadEpisodeVideo/DeleteEpisodeVideo).
// ══════════════════════════════════════════════════════════════════════════

function ModalField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

function ModalInput({ label, value, onChange, placeholder, type = 'text' }) {
  const [focused, setFocused] = useState(false);
  return (
    <ModalField label={label}>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: 42, padding: '0 14px',
          background: T.surface,
          border: `1px solid ${focused ? T.borderFocus : T.border}`,
          borderRadius: 10, color: T.text, outline: 'none',
          fontFamily: FONT, fontSize: 13.5,
          transition: 'border-color 0.15s', boxSizing: 'border-box', width: '100%',
        }}
      />
    </ModalField>
  );
}

function ModalTextarea({ label, value, onChange, placeholder, rows = 3 }) {
  const [focused, setFocused] = useState(false);
  return (
    <ModalField label={label}>
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
    </ModalField>
  );
}

/** Khung modal dùng chung cho SeasonEditModal & EpisodeEditModal — chỉ khác nội dung body/footer. */
function EditModalShell({ open, title, subtitle, onClose, error, saving, onSave, saveLabel, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <style>{ADMIN_GOOGLE_FONTS}</style>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 299, backdropFilter: 'blur(3px)' }}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{   opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            style={{
              position: 'fixed', inset: 0, margin: 'auto',
              width: 460, height: 'fit-content', maxHeight: '90vh',
              zIndex: 300,
              background: T.surface,
              borderRadius: 16,
              border: `1px solid ${T.border}`,
              boxShadow: T.shadowLg,
              display: 'flex', flexDirection: 'column',
              fontFamily: FONT, overflow: 'hidden',
            }}
          >
            <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <p style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3, fontWeight: 600, fontFamily: FONT }}>{subtitle}</p>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em', fontFamily: FONT_TITLE }}>{title}</h2>
              </div>
              <button
                onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: T.surface, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {children}
              {error && <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.red, margin: 0 }}>{error}</p>}
            </div>

            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: T.surface, display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
              <button
                onClick={onClose}
                style={{ padding: '8px 16px', borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub }}
              >
                Hủy
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                style={{ padding: '8px 18px', borderRadius: 8, background: saving ? T.accentLight : T.accent, border: `1px solid ${saving ? T.accent + '30' : 'transparent'}`, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: saving ? T.accentText : 'white', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s' }}
              >
                {saving
                  ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Đang lưu...</>
                  : <><Check size={13} /> {saveLabel}</>
                }
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Quản lý danh sách tập ngay trong modal sửa season ─────────────────────────
// Trước đây modal sửa season CHỈ sửa metadata (tên/mô tả/poster/ngày) — không có
// cách nào thêm tập mới ngoài lúc tạo show (SeasonEpisodeBuilderField). Component
// này lấp khoảng trống đó: load danh sách tập hiện có của season, cho xóa từng
// tập, và có 1 form thêm tập mới dùng chung PosterField (giống EpisodeRow ở luồng
// thêm) — bấm "Thêm tập" là gọi POST ngay (giống cách PosterField/BackdropGallery
// upload ảnh ngay khi chọn file, không đợi bấm "Lưu thay đổi" của cả season).
//
// Props:
//   tvShowId        – Guid TV show
//   seasonNumber    – number season đang sửa
//   onEpisodeAdded   – (episodeDTO) => void   (tùy chọn) báo trang cha có tập mới
//   onEpisodeDeleted – (episodeId) => void    (tùy chọn) báo trang cha đã xóa tập
function SeasonEpisodesManager({ tvShowId, seasonNumber, onEpisodeAdded, onEpisodeDeleted }) {
  // Danh sách tập nằm trong cache TanStack Query (cùng key với trang chi tiết) →
  // thêm/xóa tập ở đây, tab Seasons ở DetailPanel tự cập nhật theo, không cần callback để đồng bộ.
  const { data: episodes = [], isPending: loading, error: loadErr } = useTvShowSeason(tvShowId, seasonNumber);
  const addEpisode    = useAddEpisode();
  const deleteEpisode = useDeleteEpisode();

  const loadError  = loadErr ? 'Không tải được danh sách tập' : '';
  const adding     = addEpisode.isPending;
  const deletingId = deleteEpisode.isPending ? deleteEpisode.variables?.episodeId : null;

  const [newEpisode, setNewEpisode] = useState(makeEmptyEpisode());
  const [addError, setAddError]     = useState('');

  // Điền sẵn "số tập kế tiếp" MỘT lần cho mỗi season, khi dữ liệu tải xong
  // (refetch nền không được ghi đè số người dùng đang gõ).
  const seededFor = useRef(null);
  useEffect(() => {
    const key = `${tvShowId}:${seasonNumber}`;
    if (loading || seededFor.current === key) return;
    seededFor.current = key;
    const nextNumber = episodes.length ? Math.max(...episodes.map(e => e.episodeNumber ?? 0)) + 1 : 1;
    setNewEpisode(prev => ({ ...prev, episodeNumber: String(nextNumber) }));
  }, [loading, episodes, tvShowId, seasonNumber]);

  const handleAdd = async () => {
    if (!newEpisode.title.trim()) { setAddError('Tên tập không được để trống'); return; }
    if (!(Number(newEpisode.episodeNumber) > 0)) { setAddError('Số tập phải lớn hơn 0'); return; }
    setAddError('');
    try {
      const created = await addEpisode.mutateAsync({
        showId: tvShowId,
        seasonNumber,
        payload: {
          episodeNumber: Number(newEpisode.episodeNumber),
          title: newEpisode.title.trim(),
          overview: newEpisode.overview.trim() || null,
          stillUrl: newEpisode.stillUrl.trim() || null,
          runtime: newEpisode.runtime ? Number(newEpisode.runtime) : null,
          rating: newEpisode.rating ? Number(newEpisode.rating) : null,
          airDate: newEpisode.airDate ? new Date(newEpisode.airDate).toISOString() : null,
        },
      });
      setNewEpisode({ ...makeEmptyEpisode(), episodeNumber: String(Number(newEpisode.episodeNumber) + 1) });
      onEpisodeAdded?.(created);
    } catch (e) {
      setAddError(e?.response?.data?.message ?? e?.message ?? 'Không thêm được tập phim');
    }
  };

  const handleDelete = async (ep) => {
    setAddError('');
    try {
      await deleteEpisode.mutateAsync({ showId: tvShowId, episodeId: ep.id });
      onEpisodeDeleted?.(ep.id);
    } catch (e) {
      setAddError(e?.response?.data?.message ?? e?.message ?? 'Không xóa được tập phim');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Tập phim
      </label>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
          <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', color: T.textMuted, animation: 'spin 0.7s linear infinite' }} />
          <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted }}>Đang tải danh sách tập...</span>
        </div>
      ) : loadError ? (
        <p style={{ fontFamily: FONT, fontSize: 12, color: T.red, margin: 0 }}>{loadError}</p>
      ) : episodes.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {episodes.map(ep => (
            <div key={ep.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', borderRadius: 8,
              background: T.surface, border: `1px solid ${T.border}`,
            }}>
              <span style={{
                fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted,
                flexShrink: 0, width: 28, textAlign: 'center',
              }}>
                #{ep.episodeNumber}
              </span>
              <span style={{ fontFamily: FONT, fontSize: 12.5, color: T.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ep.title}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(ep)}
                disabled={deletingId === ep.id}
                title="Xóa tập"
                style={{ width: 24, height: 24, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: deletingId === ep.id ? 'wait' : 'pointer', color: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                {deletingId === ep.id
                  ? <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                  : <X size={10} />
                }
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, margin: 0 }}>Season chưa có tập nào.</p>
      )}

      {/* Form thêm tập mới — cùng field/PosterField với EpisodeRow ở luồng tạo show */}
      <EpisodeRow
        episode={newEpisode}
        onChange={setNewEpisode}
        onRemove={() => setNewEpisode(makeEmptyEpisode())}
      />
      {addError && <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red, margin: 0 }}>{addError}</p>}
      <button
        type="button"
        onClick={handleAdd}
        disabled={adding}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          height: 36, borderRadius: 8,
          background: adding ? T.accentLight : T.surfaceAlt,
          border: `1px dashed ${T.border}`,
          cursor: adding ? 'wait' : 'pointer', color: T.textSub,
          fontFamily: FONT, fontSize: 12, fontWeight: 600,
        }}
      >
        {adding
          ? <><div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Đang thêm...</>
          : <><Film size={12} /> Thêm tập phim</>
        }
      </button>
    </div>
  );
}

/**
 * Sửa season đã tồn tại — tiêu đề, mô tả, poster, ngày phát sóng — và quản lý
 * danh sách tập của season (thêm tập mới / xóa tập) ngay trong cùng modal, thay
 * vì chỉ sửa metadata như trước. Sửa chi tiết từng tập (tên/mô tả/still/rating...)
 * vẫn dùng EpisodeEditModal riêng.
 *
 * Props:
 *   tvShowId         – Guid TV show
 *   season           – { seasonNumber, name, overview, posterUrl, airDate } | null (null = đóng)
 *   onClose          – () => void
 *   onSaved          – (patch) => void       gọi sau khi lưu metadata thành công
 *   onEpisodeAdded   – (episodeDTO) => void  (tùy chọn) gọi khi thêm tập mới thành công
 *   onEpisodeDeleted – (episodeId) => void   (tùy chọn) gọi khi xóa tập thành công
 */
export function SeasonEditModal({ tvShowId, season, onClose, onSaved, onEpisodeAdded, onEpisodeDeleted }) {
  const [form, setForm]     = useState({ name: '', overview: '', posterUrl: '', airDate: '' });
  const updateSeason = useUpdateSeason();
  const saving = updateSeason.isPending;
  const [error, setError]   = useState('');

  // Khởi tạo form khi mở season (theo seasonNumber) — cập nhật cache/refetch nền không ghi đè phần đang sửa.
  useEffect(() => {
    if (season) {
      setForm({
        name: season.name ?? '',
        overview: season.overview ?? '',
        posterUrl: season.posterUrl ?? '',
        airDate: season.airDate ? String(season.airDate).slice(0, 10) : '',
      });
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season?.seasonNumber]);

  const handleSave = async () => {
    setError('');
    const patch = {
      seasonNumber: season.seasonNumber,
      name: form.name.trim(),
      overview: form.overview.trim(),
      posterUrl: form.posterUrl.trim(),
      airDate: form.airDate || null,
    };
    try {
      await updateSeason.mutateAsync({
        showId: tvShowId,
        seasonNumber: season.seasonNumber,
        payload: {
          name: patch.name,
          overview: patch.overview,
          posterUrl: patch.posterUrl,
          airDate: form.airDate ? new Date(form.airDate).toISOString() : null,
        },
        patch, // hook vá thẳng vào detail.seasons trong cache
      });
      onSaved?.(patch);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Có lỗi xảy ra khi lưu season');
    }
  };

  return (
    <EditModalShell
      open={!!season}
      subtitle={season ? `Season ${season.seasonNumber}` : ''}
      title="Sửa season"
      onClose={onClose}
      error={error}
      saving={saving}
      onSave={handleSave}
      saveLabel="Lưu thay đổi"
    >
      <ModalInput label="Tên season" placeholder="VD: Season 1" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
      <ModalTextarea label="Mô tả" placeholder="Nội dung mô tả season..." value={form.overview} onChange={v => setForm(f => ({ ...f, overview: v }))} rows={3} />
      <PosterField service={tvShowService} label="Poster season" imageType="poster" value={form.posterUrl} onChange={v => setForm(f => ({ ...f, posterUrl: v }))} />
      <ModalInput label="Ngày phát sóng" type="date" value={form.airDate} onChange={v => setForm(f => ({ ...f, airDate: v }))} />

      {season && (
        <SeasonEpisodesManager
          tvShowId={tvShowId}
          seasonNumber={season.seasonNumber}
          onEpisodeAdded={onEpisodeAdded}
          onEpisodeDeleted={onEpisodeDeleted}
        />
      )}
    </EditModalShell>
  );
}

/**
 * Sửa episode đã tồn tại — tiêu đề, mô tả, ảnh still, thời lượng, rating, ngày
 * phát sóng. Không sửa video — dùng chức năng upload/xóa video tập riêng.
 *
 * Props:
 *   tvShowId – Guid TV show (để vá đúng cache season của show; thiếu thì chỉ gọi onSaved)
 *   episode  – { id, episodeNumber, title, overview, stillUrl, runtime, rating, airDate } | null (null = đóng)
 *   onClose  – () => void
 *   onSaved  – (patch) => void   (tùy chọn) gọi sau khi lưu thành công
 */
export function EpisodeEditModal({ tvShowId, episode, onClose, onSaved }) {
  const [form, setForm]     = useState({ title: '', overview: '', stillUrl: '', runtime: '', rating: '', airDate: '' });
  const updateEpisode = useUpdateEpisode();
  const saving = updateEpisode.isPending;
  const [error, setError]   = useState('');

  useEffect(() => {
    if (episode) {
      setForm({
        title: episode.title ?? '',
        overview: episode.overview ?? '',
        stillUrl: episode.stillUrl ?? '',
        runtime: episode.runtime != null ? String(episode.runtime) : '',
        rating: episode.rating != null ? String(episode.rating) : '',
        airDate: episode.airDate ? String(episode.airDate).slice(0, 10) : '',
      });
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode?.id]);

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Tên tập không được để trống'); return; }
    setError('');
    const patch = {
      id: episode.id,
      title: form.title.trim(),
      overview: form.overview.trim(),
      stillUrl: form.stillUrl.trim(),
      runtime: form.runtime ? Number(form.runtime) : null,
      rating: form.rating ? Number(form.rating) : null,
      airDate: form.airDate || null,
    };
    try {
      await updateEpisode.mutateAsync({
        showId: tvShowId,
        episodeId: episode.id,
        payload: {
          title: patch.title,
          overview: patch.overview,
          stillUrl: patch.stillUrl,
          runtime: patch.runtime,
          rating: patch.rating,
          airDate: form.airDate ? new Date(form.airDate).toISOString() : null,
        },
        patch, // hook vá tập này trong mọi season đang cache của show
      });
      onSaved?.(patch);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Có lỗi xảy ra khi lưu episode');
    }
  };

  return (
    <EditModalShell
      open={!!episode}
      subtitle={episode ? `Tập ${episode.episodeNumber}` : ''}
      title="Sửa episode"
      onClose={onClose}
      error={error}
      saving={saving}
      onSave={handleSave}
      saveLabel="Lưu thay đổi"
    >
      <ModalInput label="Tên tập" placeholder="Tên tập phim..." value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} />
      <ModalTextarea label="Mô tả" placeholder="Nội dung mô tả tập phim..." value={form.overview} onChange={v => setForm(f => ({ ...f, overview: v }))} rows={3} />
      <PosterField service={tvShowService} label="Ảnh still (thumbnail tập)" imageType="backdrop" value={form.stillUrl} onChange={v => setForm(f => ({ ...f, stillUrl: v }))} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <ModalInput label="Thời lượng (phút)" type="number" placeholder="VD: 45" value={form.runtime} onChange={v => setForm(f => ({ ...f, runtime: v }))} />
        <ModalInput label="Rating (0–10)" placeholder="VD: 8.2" value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
      </div>
      <ModalInput label="Ngày phát sóng" type="date" value={form.airDate} onChange={v => setForm(f => ({ ...f, airDate: v }))} />
    </EditModalShell>
  );
}