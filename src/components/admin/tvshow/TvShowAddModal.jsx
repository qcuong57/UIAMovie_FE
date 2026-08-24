// src/components/admin/tvshow/TvShowAddModal.jsx
// Thêm TV show thủ công — không qua TMDB. Dùng chung style với TvShowEditModal.
import React, { useState } from 'react';
import { Check, Crown, X, ImagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import tvShowService from '../../../services/tvShowService';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../../context/adminTokens';
import { CastPickerField, DirectorPickerField, castStateToDto, directorStateToDto } from './PersonPickerField';
import { GenrePickerField, PosterField, BackdropGalleryField, backdropStateToDto } from '../shared/GenreAndImageFields';
import { SeasonEpisodeBuilderField, seasonsStateToDto } from './SeasonEpisodeFields';

const gold      = '#D97706';
const goldLight = '#FEF3C7';

const STATUS_OPTIONS = [
  { value: '', label: 'Không rõ' },
  { value: 'Returning Series', label: 'Đang phát sóng (Returning Series)' },
  { value: 'Ended', label: 'Đã kết thúc (Ended)' },
  { value: 'Canceled', label: 'Đã hủy (Canceled)' },
];

const EMPTY_FORM = {
  title: '',
  description: '',
  firstAirDate: '',
  lastAirDate: '',
  episodeRuntime: '',
  imdbRating: '',
  contentRating: '',
  originCountry: '',
  status: '',
  numberOfSeasons: '',
  numberOfEpisodes: '',
  posterUrl: '',
  backdropUrl: '',
  isPremium: false,
};

// ── Field components (giống MovieEditModal) ───────────────────────────────────
function LightInput({ label, value, onChange, placeholder, error, type = 'text' }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </label>
      )}
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
          border: `1px solid ${error ? 'rgba(220,38,38,0.5)' : focused ? T.borderFocus : T.border}`,
          borderRadius: 10, color: T.text, outline: 'none',
          fontFamily: FONT, fontSize: 13.5,
          transition: 'border-color 0.15s', boxSizing: 'border-box', width: '100%',
        }}
      />
      {error && <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red, margin: 0 }}>{error}</p>}
    </div>
  );
}

function LightTextarea({ label, value, onChange, placeholder, rows = 4 }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </label>
      )}
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
    </div>
  );
}

/** Ô 2 cột dùng cho các field ngắn (năm/rating/quốc gia...) */
function Row({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;
}

function LightSelect({ label, value, onChange, options }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: 42, padding: '0 12px',
          background: T.surface,
          border: `1px solid ${focused ? T.borderFocus : T.border}`,
          borderRadius: 10, color: T.text, outline: 'none',
          fontFamily: FONT, fontSize: 13.5,
          transition: 'border-color 0.15s', boxSizing: 'border-box', width: '100%',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function PremiumToggleField({ value, onChange }) {
  const id = 'premium-toggle-add';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Loại nội dung
      </label>
      <label
        htmlFor={id}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
          background: value ? goldLight : T.surfaceAlt,
          border: `1px solid ${value ? 'rgba(217,119,6,0.35)' : T.border}`,
          transition: 'all 0.18s',
          userSelect: 'none',
        }}
      >
        <input id={id} type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} style={{ display: 'none' }} />
        <div style={{
          width: 36, height: 20, borderRadius: 10, flexShrink: 0,
          background: value ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'rgba(0,0,0,0.12)',
          position: 'relative', transition: 'background 0.18s',
          boxShadow: value ? '0 1px 6px rgba(245,158,11,0.4)' : 'none',
        }}>
          <div style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Crown size={14} color={value ? gold : T.textMuted} style={{ flexShrink: 0, transition: 'color 0.18s' }} />
          <span style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: value ? 700 : 500, color: value ? '#92400E' : T.textSub, transition: 'color 0.18s' }}>
            {value ? 'Premium — Chỉ tài khoản Premium mới xem được' : 'Free — Ai cũng xem được'}
          </span>
        </div>
      </label>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
/**
 * Props:
 *   open    – boolean, hiện modal khi true
 *   onClose – () => void
 *   onCreated – (showId) => void   gọi sau khi tạo thành công
 */
export default function TvShowAddModal({ open, onClose, onCreated }) {
  const [form,   setForm]   = useState(EMPTY_FORM);
  const [cast,     setCast]     = useState([]);   // [{ uid, personId, tmdbPersonId, name, character, order, profileUrl }]
  const [director, setDirector] = useState(null); // { personId, tmdbPersonId, name, profileUrl } | null
  const [genreIds, setGenreIds] = useState([]);   // Array<string guid>
  const [backdrops, setBackdrops] = useState([]); // [{ uid, url }]
  const [seasons, setSeasons] = useState([]);     // [{ uid, seasonNumber, name, overview, posterUrl, airDate, episodes: [...] }]
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (key) => (v) => setForm(f => ({ ...f, [key]: v }));

  const resetAndClose = () => {
    if (saving) return;
    setForm(EMPTY_FORM);
    setCast([]);
    setDirector(null);
    setGenreIds([]);
    setBackdrops([]);
    setSeasons([]);
    setError('');
    onClose?.();
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Tên TV show không được để trống'); return; }

    const rating = form.imdbRating ? parseFloat(form.imdbRating) : null;
    if (rating !== null && (isNaN(rating) || rating < 0 || rating > 10)) {
      setError('Rating phải từ 0 đến 10'); return;
    }
    const episodeRuntime = form.episodeRuntime ? parseInt(form.episodeRuntime, 10) : null;
    if (episodeRuntime !== null && (isNaN(episodeRuntime) || episodeRuntime <= 0)) {
      setError('Thời lượng mỗi tập phải là số phút hợp lệ'); return;
    }
    const numberOfSeasons = form.numberOfSeasons ? parseInt(form.numberOfSeasons, 10) : null;
    if (numberOfSeasons !== null && (isNaN(numberOfSeasons) || numberOfSeasons <= 0)) {
      setError('Số mùa phải là số hợp lệ'); return;
    }
    const numberOfEpisodes = form.numberOfEpisodes ? parseInt(form.numberOfEpisodes, 10) : null;
    if (numberOfEpisodes !== null && (isNaN(numberOfEpisodes) || numberOfEpisodes <= 0)) {
      setError('Số tập phải là số hợp lệ'); return;
    }

    setSaving(true); setError('');
    try {
      const dto = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        firstAirDate: form.firstAirDate ? new Date(form.firstAirDate).toISOString() : null,
        lastAirDate: form.lastAirDate ? new Date(form.lastAirDate).toISOString() : null,
        posterUrl: form.posterUrl.trim() || null,
        backdropUrl: form.backdropUrl.trim() || null,
        episodeRuntime,
        imdbRating: rating,
        contentRating: form.contentRating.trim() || null,
        originCountry: form.originCountry.trim().toUpperCase() || null,
        status: form.status || null,
        numberOfSeasons,
        numberOfEpisodes,
        isPremium: form.isPremium,
        genreIds,
        cast: castStateToDto(cast),
        director: director ? directorStateToDto(director) : null,
        images: backdropStateToDto(backdrops),
        trailers: [],
        seasons: seasonsStateToDto(seasons),
      };
      const res = await tvShowService.createTvShow(dto);
      const showId = res?.data?.showId ?? res?.showId;
      onCreated?.(showId);
      resetAndClose();
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Có lỗi xảy ra khi tạo TV show');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <style>{ADMIN_GOOGLE_FONTS}</style>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={resetAndClose}
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
              width: 540, height: 'fit-content', maxHeight: '90vh',
              zIndex: 300,
              background: T.surface,
              borderRadius: 16,
              border: `1px solid ${T.border}`,
              boxShadow: T.shadowLg,
              display: 'flex', flexDirection: 'column',
              fontFamily: FONT, overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <p style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3, fontWeight: 600, fontFamily: FONT }}>TV Show</p>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em', fontFamily: FONT_TITLE, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ImagePlus size={16} color={T.accentText} /> Thêm TV show thủ công
                </h2>
              </div>
              <button
                onClick={resetAndClose}
                disabled={saving}
                style={{ width: 32, height: 32, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: saving ? 'not-allowed' : 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: T.surface, display: 'flex', flexDirection: 'column', gap: 14 }}>

              <LightInput label="Tên TV show" placeholder="Tên TV show..." value={form.title} onChange={set('title')} error={/tên|Tên/i.test(error) ? error : ''} />
              <LightTextarea label="Mô tả" placeholder="Nội dung mô tả TV show..." value={form.description} onChange={set('description')} rows={3} />

              <Row>
                <LightInput label="Ngày phát sóng đầu tiên" type="date" value={form.firstAirDate} onChange={set('firstAirDate')} />
                <LightInput label="Ngày phát sóng cuối" type="date" value={form.lastAirDate} onChange={set('lastAirDate')} />
              </Row>

              <Row>
                <LightInput label="Thời lượng mỗi tập (phút)" placeholder="VD: 45" type="number" value={form.episodeRuntime} onChange={set('episodeRuntime')} error={/mỗi tập/i.test(error) ? error : ''} />
                <LightSelect label="Trạng thái" value={form.status} onChange={set('status')} options={STATUS_OPTIONS} />
              </Row>

              <Row>
                <LightInput label="Số mùa" placeholder="VD: 3" type="number" value={form.numberOfSeasons} onChange={set('numberOfSeasons')} error={/Số mùa/i.test(error) ? error : ''} />
                <LightInput label="Số tập" placeholder="VD: 24" type="number" value={form.numberOfEpisodes} onChange={set('numberOfEpisodes')} error={/Số tập/i.test(error) ? error : ''} />
              </Row>

              <Row>
                <LightInput label="Rating IMDB (0–10)" placeholder="VD: 8.5" value={form.imdbRating} onChange={set('imdbRating')} error={/Rating/i.test(error) ? error : ''} />
                <LightInput label="Phân loại độ tuổi" placeholder="VD: PG-13, 18+" value={form.contentRating} onChange={set('contentRating')} />
              </Row>

              <LightInput label="Quốc gia (mã ISO 2 ký tự)" placeholder="VD: KR, US, VN" value={form.originCountry} onChange={set('originCountry')} />

              <PosterField service={tvShowService} label="Poster" imageType="poster" value={form.posterUrl} onChange={set('posterUrl')} />
              <PosterField service={tvShowService} label="Backdrop (ảnh bìa)" imageType="backdrop" value={form.backdropUrl} onChange={set('backdropUrl')} />
              <BackdropGalleryField service={tvShowService} value={backdrops} onChange={setBackdrops} />

              <PremiumToggleField value={form.isPremium} onChange={set('isPremium')} />

              <GenrePickerField service={tvShowService} value={genreIds} onChange={setGenreIds} />

              <DirectorPickerField value={director} onChange={setDirector} />
              <CastPickerField value={cast} onChange={setCast} />

              <SeasonEpisodeBuilderField value={seasons} onChange={setSeasons} />

              {error && !/tên|Tên|Rating|mỗi tập|Số mùa|Số tập/i.test(error) && (
                <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.red, margin: 0 }}>{error}</p>
              )}

              <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, lineHeight: 1.65, padding: '10px 14px', background: T.surfaceAlt, borderRadius: 9, border: `1px solid ${T.border}`, margin: 0 }}>
                Diễn viên/đạo diễn có thể chọn từ hệ thống hoặc nhập tên mới (nếu chưa có). "Backdrop (ảnh bìa)" là ảnh nền hiển thị ở đầu trang chi tiết, còn gallery bên dưới là các ảnh backdrop hiển thị ở tab "Hình ảnh". Có thể nhập luôn season/tập phim ở trên hoặc để trống rồi đồng bộ từ TMDB sau — video từng tập luôn được upload sau khi lưu TV show, ở trang chi tiết.
              </p>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: T.surface, display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
              <button
                onClick={resetAndClose}
                disabled={saving}
                style={{ padding: '8px 16px', borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub }}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '8px 18px', borderRadius: 8, background: saving ? T.accentLight : T.accent, border: `1px solid ${saving ? T.accent + '30' : 'transparent'}`, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: saving ? T.accentText : 'white', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s' }}
              >
                {saving
                  ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Đang lưu...</>
                  : <><Check size={13} /> Tạo TV show</>
                }
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}