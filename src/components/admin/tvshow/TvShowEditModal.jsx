// src/components/admin/tvshow/TvShowEditModal.jsx
import React, { useState, useEffect } from 'react';
import { Check, Crown, X } from 'lucide-react';
import axiosInstance from '../../../config/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { T, FONT_BODY as FONT, FONT_TITLE, ADMIN_GOOGLE_FONTS } from '../../../context/adminTokens';
import { CastPickerField, DirectorPickerField, castStateToDto, directorStateToDto } from './PersonPickerField';
import { GenrePickerField, PosterField, BackdropGalleryField, backdropStateToDto } from '../shared/GenreAndImageFields';
import tvShowService from '../../../services/tvShowService';
import { useToast } from '../common/Toast';

let editUidSeq = 0;
const nextEditUid = () => `ec_${Date.now()}_${editUidSeq++}`;

function LightInput({ label, value, onChange, placeholder, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </label>
      )}
      <input
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
      {error && <p style={{ fontFamily: FONT, fontSize: 11.5, color: T.red }}>{error}</p>}
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

const gold      = '#D97706';
const goldLight = '#FEF3C7';

const STATUS_OPTIONS = [
  { value: '', label: 'Không rõ' },
  { value: 'Returning Series', label: 'Đang phát sóng (Returning Series)' },
  { value: 'Ended', label: 'Đã kết thúc (Ended)' },
  { value: 'Canceled', label: 'Đã hủy (Canceled)' },
];

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
  const id = 'premium-toggle-tvshow-edit';
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
          transition: 'all 0.18s', userSelect: 'none',
        }}
      >
        <input id={id} type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} style={{ display: 'none' }} />
        <div style={{
          width: 36, height: 20, borderRadius: 10, flexShrink: 0,
          background: value ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'rgba(0,0,0,0.12)',
          position: 'relative', transition: 'background 0.18s',
          boxShadow: value ? '0 1px 6px rgba(245,158,11,0.4)' : 'none',
        }}>
          <div style={{
            position: 'absolute', top: 2, left: value ? 18 : 2,
            width: 16, height: 16, borderRadius: '50%', background: '#fff',
            transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
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

export default function TvShowEditModal({ show, onClose, onSaved }) {
  const [form,   setForm]   = useState({ title: '', description: '', rating: '', isPremium: false, status: '' });
  const [posterUrl, setPosterUrl]     = useState(''); // URL poster hiện tại, sửa được qua PosterField
  const [backdropUrl, setBackdropUrl] = useState(''); // URL backdrop bìa chính, sửa được qua PosterField
  const [cast,     setCast]     = useState([]);   // [{ uid, personId, tmdbPersonId, name, character, order, profileUrl }]
  const [director, setDirector] = useState(null); // { personId, tmdbPersonId, name, profileUrl } | null
  const [genreIds, setGenreIds] = useState([]);   // Array<string guid>
  const [backdrops, setBackdrops] = useState([]); // [{ uid, id?, url }]
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const [error,  setError]  = useState('');

  const [allGenres, setAllGenres] = useState([]); // danh sách thể loại đầy đủ, dùng để match tên → id
  const [fullShow, setFullShow]   = useState(null); // chi tiết đầy đủ, fetch riêng vì list item (show) không có description/cast/director/images

  useEffect(() => {
    let cancelled = false;
    tvShowService.getGenres()
      .then(res => {
        if (cancelled) return;
        const list = res?.data ?? res ?? [];
        setAllGenres(Array.isArray(list) ? list : []);
      })
      .catch(() => { /* GenrePickerField sẽ tự báo lỗi riêng nếu fetch thất bại */ });
    return () => { cancelled = true; };
  }, []);

  // Object `show` truyền từ bảng danh sách chỉ là DTO rút gọn (không có description/cast/director/images).
  // Luôn fetch lại chi tiết đầy đủ theo id khi modal mở để form không bị trống.
  useEffect(() => {
    let cancelled = false;
    if (show?.id) {
      setFullShow(null);
      tvShowService.getTvShowById(show.id)
        .then(res => {
          if (cancelled) return;
          const detail = res?.data ?? res ?? null;
          setFullShow(detail);
        })
        .catch(() => {
          if (cancelled) return;
          // Fetch lỗi → tạm dùng object đã có (title/rating/isPremium vẫn hiện đúng, phần còn lại có thể trống)
          setFullShow(show);
        });
    } else {
      setFullShow(null);
    }
    return () => { cancelled = true; };
  }, [show?.id]);

  useEffect(() => {
    const s = fullShow; // dùng bản chi tiết đầy đủ để khởi tạo form, không dùng list item nữa
    if (s) {
      setForm({
        title:       s.title ?? s.name ?? '',
        description: s.description ?? '',
        rating:      s.rating != null ? String(s.rating) : '',
        isPremium:   s.isPremium ?? false,
        status:      s.status ?? '',
      });
      setPosterUrl(s.posterUrl ?? '');
      setBackdropUrl(s.backdropUrl ?? '');

      // Ảnh backdrop hiện có trong gallery (tab "Hình ảnh")
      const initialBackdrops = (s.images ?? [])
        .filter(img => img.imageType === 'backdrop')
        .map(img => ({ uid: `bd_${img.id ?? img.url}`, id: img.id, url: img.url }));
      setBackdrops(initialBackdrops);

      // s.cast (TvShowCastDTO) không có personId — chỉ có tmdbPersonId (nếu import từ TMDB).
      // Khi lưu, backend sẽ match lại theo tmdbPersonId hoặc theo Name.
      const initialCast = (s.cast ?? [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .map(c => ({
          uid: nextEditUid(),
          personId: null,
          tmdbPersonId: c.tmdbPersonId ?? null,
          name: c.name,
          character: c.character ?? '',
          order: c.order ?? 0,
          profileUrl: c.profileUrl ?? null,
        }));
      setCast(initialCast);

      const directorName = s.directorDetail?.name ?? s.director ?? '';
      setDirector(
        directorName
          ? {
              personId: null,
              tmdbPersonId: s.directorDetail?.tmdbPersonId ?? null,
              name: directorName,
              profileUrl: s.directorDetail?.profileUrl ?? null,
            }
          : null
      );

      setError('');
    }
  }, [fullShow]);

  // Match tên thể loại hiện có của TV show (fullShow.genres: string[]) sang Guid khi danh sách thể loại đã tải xong
  useEffect(() => {
    if (!fullShow || allGenres.length === 0) return;
    const names = (fullShow.genres ?? []).map(n => n.toLowerCase());
    const matchedIds = allGenres
      .filter(g => names.includes(g.name.toLowerCase()))
      .map(g => g.id);
    setGenreIds(matchedIds);
  }, [fullShow, allGenres]);

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Tên TV show không được để trống'); return; }
    const rating = form.rating ? parseFloat(form.rating) : null;
    if (rating !== null && (isNaN(rating) || rating < 0 || rating > 10)) {
      setError('Rating phải từ 0 đến 10'); return;
    }
    setSaving(true); setError('');
    try {
      await axiosInstance.put(`/tvshows/${show.id}`, {
        title:          form.title.trim(),
        description:    form.description.trim() || null,
        rating,
        isPremium:      form.isPremium,
        status:         form.status || null,
        posterUrl:      posterUrl.trim() || null,
        backdropUrl:    backdropUrl.trim() || null,
        cast:           castStateToDto(cast),
        director:       directorStateToDto(director),
        genreIds,
        backdropImages: backdropStateToDto(backdrops),
      });
      const genreNames = allGenres.filter(g => genreIds.includes(g.id)).map(g => g.name);
      onSaved?.({
        ...show,
        title:       form.title.trim(),
        description: form.description.trim(),
        rating,
        isPremium:   form.isPremium,
        status:      form.status || null,
        posterUrl:   posterUrl.trim() || null,
        backdropUrl: backdropUrl.trim() || null,
        director:    director?.name || null,
        genres:      genreNames,
        images: [
          ...(show.images ?? []).filter(img => img.imageType !== 'backdrop'),
          ...backdrops.map(b => ({ id: b.id, url: b.url, imageType: 'backdrop' })),
        ],
      });
      toast.success(`Đã lưu "${form.title.trim()}"`);
      onClose();
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Có lỗi xảy ra';
      setError(msg);
      toast.error(msg);
    } finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {!!show && (
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
              width: 500, height: 'fit-content', maxHeight: '90vh',
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
                <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em', fontFamily: FONT_TITLE }}>Chỉnh sửa</h2>
              </div>
              <button
                onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: T.surface, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Poster preview */}
              {show?.posterUrl && (
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 14px', borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                  <img src={show.posterUrl} alt=""
                    style={{ width: 48, height: 68, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: `1px solid ${T.border}` }}
                  />
                  <div>
                    <p style={{ fontFamily: FONT, fontSize: 10.5, color: T.textMuted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Đang chỉnh sửa</p>
                    <p style={{ fontFamily: FONT, fontSize: 14, color: T.text, fontWeight: 700, lineHeight: 1.4 }}>{show?.title ?? show?.name}</p>
                    {show?.numberOfSeasons > 0 && (
                      <p style={{ fontFamily: FONT, fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                        {show.numberOfSeasons} mùa{show?.tmdbId ? ` · TMDB #${show.tmdbId}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <LightInput label="Tên TV show" placeholder="Tên TV show..." value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} error={/tên|Tên/i.test(error) ? error : ''} />
              <LightTextarea label="Mô tả" placeholder="Nội dung mô tả TV show..." value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} rows={4} />
              <Row>
                <LightInput label="Rating IMDB (0–10)" placeholder="VD: 8.5" value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} error={/Rating/i.test(error) ? error : ''} />
                <LightSelect label="Trạng thái" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={STATUS_OPTIONS} />
              </Row>
              <PremiumToggleField value={form.isPremium} onChange={v => setForm(f => ({ ...f, isPremium: v }))} />

              <PosterField service={tvShowService} label="Poster" imageType="poster" value={posterUrl} onChange={setPosterUrl} />
              <PosterField service={tvShowService} label="Backdrop (ảnh bìa)" imageType="backdrop" value={backdropUrl} onChange={setBackdropUrl} />

              <GenrePickerField service={tvShowService} value={genreIds} onChange={setGenreIds} />
              <BackdropGalleryField service={tvShowService} value={backdrops} onChange={setBackdrops} />

              <DirectorPickerField value={director} onChange={setDirector} />
              <CastPickerField value={cast} onChange={setCast} />

              {error && !/tên|Tên|Rating/i.test(error) && (
                <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.red }}>{error}</p>
              )}

              <p style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, lineHeight: 1.65, padding: '10px 14px', background: T.surfaceAlt, borderRadius: 9, border: `1px solid ${T.border}`, margin: 0 }}>
                Có thể sửa tên, mô tả, rating, loại nội dung, poster, backdrop bìa chính, thể loại, ảnh backdrop (gallery), diễn viên và đạo diễn. Diễn viên/đạo diễn có thể chọn từ hệ thống hoặc nhập tên mới. Season/tập phim được quản lý riêng ở trang chi tiết TV show.
              </p>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: T.surface, display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
              <button
                onClick={onClose}
                style={{ padding: '8px 16px', borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub }}
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
                  : <><Check size={13} /> Lưu thay đổi</>
                }
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}