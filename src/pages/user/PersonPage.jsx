// src/pages/PersonPage.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film, Calendar, ExternalLink, Camera,
  X, ChevronLeft, ChevronRight, ZoomIn,
} from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import personService from '../../services/personService';
import movieService from '../../services/movieService';
import BackButton from '../../components/common/BackButton';
import MovieCard from '../../components/movie/MovieCard';
import { Rating } from '../../components/home/sections/shared/Badges';

// ── Tokens ────────────────────────────────────────────────────────
const C = {
  bg:          '#080808',
  surfaceMid:  '#141414',
  border:      'rgba(255,255,255,0.07)',
  borderBright:'rgba(255,255,255,0.16)',
  accent:      '#e5181e',
  accentSoft:  'rgba(229,24,30,0.12)',
  text:        '#f0f0f3',
  textSub:     '#9aa0ae',
  textDim:     '#4a5060',
};

const FT = "'Be Vietnam Pro', sans-serif";
const FB = "'Nunito', sans-serif";

// ── Helpers ───────────────────────────────────────────────────────
const calcAge = (dob, dod) => {
  if (!dob) return null;
  const end   = dod ? new Date(dod) : new Date();
  const birth = new Date(dob);
  return end.getFullYear() - birth.getFullYear() -
    (end < new Date(birth.setFullYear(end.getFullYear())) ? 1 : 0);
};
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
  : null;
const fmtYear = (d) => d ? new Date(d).getFullYear() : null;

// personService trả nguyên ApiResponseDTO { data, message } → lấy phần data.
const unwrap = (res) => res?.data ?? res;

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLE_LABEL = { cast: 'Diễn viên', director: 'Đạo diễn' };
const DEPT_LABEL = { Acting: 'Diễn viên', Directing: 'Đạo diễn', Writing: 'Biên kịch', Production: 'Sản xuất' };

const filmTime = (film) => new Date(film.releaseDate || film.year || 0).getTime();
const filmRating = (film) => film.rating ?? film.voteAverage ?? 0;

// Chuyển item filmography → đúng shape mà MovieCard đang dùng
const toCardMovie = (f) => ({
  ...f,
  id:        f.id || f.movieId,
  isTvShow:  f.mediaType === 'tv',
  posterUrl: f.posterUrl || f.poster || null,
  rating:    filmRating(f),
  year:      fmtYear(f.releaseDate) || f.year || null,
});

const normalizeImages = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(i => (typeof i === 'string' ? i : i?.url || i?.filePath || i?.profileUrl))
    .filter(Boolean);
};

// ── Skeleton ──────────────────────────────────────────────────────
const Sk = ({ w = '100%', h = 14, r = 6, style = {} }) => (
  <div style={{
    width: w, height: h, borderRadius: r, flexShrink: 0,
    background: 'linear-gradient(90deg,#161616 25%,#1e1e1e 50%,#161616 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', ...style,
  }} />
);

// ── Lightbox (có điều hướng trước/sau + phím tắt) ─────────────────
const Lightbox = ({ images, index, onClose, onChange }) => {
  const total = images.length;
  const prev = useCallback(() => onChange((index - 1 + total) % total), [index, total, onChange]);
  const next = useCallback(() => onChange((index + 1) % total), [index, total, onChange]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [prev, next, onClose]);

  const navBtn = (side, onClick, Icon) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: 'absolute', top: '50%', [side]: 20, transform: 'translateY(-50%)',
        width: 46, height: 46, borderRadius: '50%', cursor: 'pointer',
        background: 'rgba(255,255,255,0.08)', border: `1px solid ${C.borderBright}`,
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Icon size={22} />
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 20, width: 42, height: 42, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', border: `1px solid ${C.borderBright}`,
          color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <X size={20} />
      </button>

      <AnimatePresence mode="wait">
        <motion.img
          key={index} src={images[index]} alt=""
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.97, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ maxWidth: '88vw', maxHeight: '86vh', objectFit: 'contain', borderRadius: 10 }}
          onClick={(e) => e.stopPropagation()}
        />
      </AnimatePresence>

      {total > 1 && navBtn('left', prev, ChevronLeft)}
      {total > 1 && navBtn('right', next, ChevronRight)}

      <div style={{
        position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)',
        fontFamily: FB, fontSize: 13, fontWeight: 700, color: C.textSub,
        padding: '6px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.06)',
      }}>
        {index + 1} / {total}
      </div>
    </motion.div>
  );
};

// ── Fact (Ngày sinh / Nơi sinh ...) ───────────────────────────────
const Fact = ({ label, value }) => (
  <div style={{ minWidth: 0 }}>
    <p style={{ fontFamily: FB, fontSize: 10, fontWeight: 800, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
      {label}
    </p>
    <p style={{ fontFamily: FB, fontSize: 13.5, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{value}</p>
  </div>
);

// ── Tab button ────────────────────────────────────────────────────
const TabBtn = ({ active, onClick, icon: Icon, label, count }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '14px 18px', border: 'none', cursor: 'pointer', background: 'none',
    fontFamily: FT, fontSize: 13, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase',
    color: active ? C.text : C.textDim,
    borderBottom: `2px solid ${active ? C.accent : 'transparent'}`,
    marginBottom: -1, transition: 'color 0.18s, border-color 0.18s', whiteSpace: 'nowrap',
  }}>
    {Icon && <Icon size={14} style={{ opacity: active ? 1 : 0.55 }} />}
    {label}
    {count > 0 && (
      <span style={{
        fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 800,
        background: active ? C.accentSoft : 'rgba(255,255,255,0.05)',
        color: active ? C.accent : C.textDim,
      }}>{count}</span>
    )}
  </button>
);

// ── Hero pill — cùng style với badge/meta pill của HeroBanner ──────
const HERO_PILL_TONES = {
  type:    { bg: 'rgba(229,24,30,0.2)',   border: 'rgba(229,24,30,0.4)',   color: '#ff3b42' },
  neutral: { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' },
};

const HeroPill = ({ icon: Icon, children, tone = 'neutral', upper = false, isMobile }) => {
  const t = HERO_PILL_TONES[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: isMobile ? '2px 8px' : '4px 10px',
      borderRadius: 99,
      fontFamily: FB,
      fontSize: upper ? (isMobile ? 10 : 11) : (isMobile ? 11 : 12),
      fontWeight: upper ? 700 : 600,
      letterSpacing: upper ? '0.08em' : undefined,
      textTransform: upper ? 'uppercase' : undefined,
      background: t.bg, border: `1px solid ${t.border}`, color: t.color,
      lineHeight: 1.4, whiteSpace: 'nowrap',
    }}>
      {Icon && <Icon size={isMobile ? 11 : 12} strokeWidth={2.5} />}
      {children}
    </span>
  );
};

// ── Pill filter ───────────────────────────────────────────────────
const Pill = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
    fontFamily: FB, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap',
    background: active ? C.accent : 'rgba(255,255,255,0.05)',
    color: active ? '#fff' : C.textSub,
    border: `1px solid ${active ? C.accent : C.border}`,
    transition: 'all 0.16s',
  }}>
    {children}
  </button>
);

// ══════════════════════════════════════════════════════════════════
// Main
// ══════════════════════════════════════════════════════════════════
export default function PersonPage() {
  const isMobile = useIsMobile();
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const heroRef  = useRef(null);

  const [person,       setPerson]       = useState(null);
  const [images,       setImages]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [imgErr,       setImgErr]       = useState(false);
  const [lightbox,     setLightbox]     = useState(null); // index | null
  const [tab,          setTab]          = useState('films');
  const [bioExpanded,  setBioExpanded]  = useState(false);
  const [headerSolid,  setHeaderSolid]  = useState(false);
  const [filmography,  setFilmography]  = useState([]);
  const [filmsLoading, setFilmsLoading] = useState(false);
  const [filter,       setFilter]       = useState('all');    // all | movie | tv | cast | director
  const [sortBy,       setSortBy]       = useState('newest'); // newest | rating

  // Sticky header opacity on scroll
  useEffect(() => {
    const handler = () => setHeaderSolid(window.scrollY > 240);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Scroll lên đầu + reset filter khi đổi diễn viên
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setFilter('all');
    setSortBy('newest');
    setTab('films');
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setBioExpanded(false);
    setImgErr(false);
    setImages([]);
    setPerson(null);

    const stateActor = location.state?.actor;

    // ── Case 1: navigate từ MovieDetailPage / MovieInfoPage ───────────
    if (stateActor) {
      setPerson({
        personId:           stateActor.personId     || null,
        name:               stateActor.name,
        profileUrl:         stateActor.profileUrl   || null,
        biography:          stateActor.biography    || null,
        birthday:           stateActor.birthday     || null,
        placeOfBirth:       stateActor.placeOfBirth || null,
        knownForDepartment: stateActor.knownFor     || stateActor.knownForDepartment || null,
        tmdbPersonId:       stateActor.tmdbPersonId || null,
        deathday:           stateActor.deathday     || null,
        popularity:         stateActor.popularity   || null,
        movies:             stateActor.movies       || [],
      });

      const stateImages = normalizeImages(stateActor.profileImages || []);
      if (stateImages.length > 0) setImages(stateImages);
      setLoading(false);
      return;
    }

    // ── Case 2: direct URL / reload ───────────────────────────────────
    if (!id) {
      setLoading(false);
      return;
    }

    // id là Guid Person trong DB → load trực tiếp
    if (GUID_RE.test(id)) {
      personService.getPersonById(id)
        .then(res => {
          const detail = unwrap(res);
          setPerson({ ...detail, personId: detail.id });
          setImages(normalizeImages(detail.profileImages));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }

    // id là slug tên (không phải số) → không có gì để gọi API
    if (!/^\d+$/.test(id)) {
      setLoading(false);
      return;
    }

    Promise.all([
      personService.getPersonDetail(id),
      personService.getPersonImages(id),
    ])
      .then(([detail, imgs]) => {
        setPerson(detail);
        setImages(normalizeImages(imgs));
      })
      .catch(() => {})
      .finally(() => setLoading(false));

  }, [id, location.state]);

  const age     = calcAge(person?.birthday, person?.deathday);
  const films   = person?.movies || person?.filmography || person?.credits || [];
  const bioText = person?.biography || person?.bio || '';
  const BIO_LIMIT = 520;

  // State thiếu personId → tra Person trong DB theo tmdbPersonId / tên.
  useEffect(() => {
    if (!person?.name || person.personId) return;

    let cancelled = false;
    const name = person.name.trim().toLowerCase();
    personService.searchPersons(person.name, 1, 10)
      .then(res => {
        const items = unwrap(res)?.items ?? [];
        const match =
          items.find(p => person.tmdbPersonId && p.tmdbPersonId === person.tmdbPersonId) ||
          items.find(p => p.name?.trim().toLowerCase() === name);
        if (match && !cancelled) {
          setPerson(prev => (prev?.name === person.name ? { ...prev, personId: match.id } : prev));
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [person?.name, person?.personId, person?.tmdbPersonId]);

  // Filmography chính xác theo Person.Id (movie + TV, cast + director).
  useEffect(() => {
    const personId = person?.personId;
    if (!personId) return;

    let cancelled = false;
    setFilmsLoading(true);
    personService.getPersonMovies(personId)
      .then(res => {
        const list = unwrap(res);
        if (!cancelled) setFilmography(Array.isArray(list) ? list : []);
      })
      .catch(() => { if (!cancelled) setFilmography([]); })
      .finally(() => { if (!cancelled) setFilmsLoading(false); });

    personService.getPersonById(personId)
      .then(res => {
        if (cancelled) return;
        const d = unwrap(res) || {};

        const imgs = normalizeImages(d.profileImages);
        if (imgs.length > 0) setImages(prev => (prev.length > 0 ? prev : imgs));

        // State từ search (Navbar) chỉ có id/name/ảnh → bù tiểu sử, ngày sinh... từ DB.
        // Chỉ điền vào field đang trống, không ghi đè dữ liệu đã có.
        const fill = (cur, val) => cur || val || null;
        setPerson(prev => {
          if (!prev || prev.personId !== personId) return prev;
          return {
            ...prev,
            profileUrl:         fill(prev.profileUrl,         d.profileUrl),
            biography:          fill(prev.biography,          d.biography ?? d.bio),
            birthday:           fill(prev.birthday,           d.birthday),
            deathday:           fill(prev.deathday,           d.deathday),
            placeOfBirth:       fill(prev.placeOfBirth,       d.placeOfBirth),
            knownForDepartment: fill(prev.knownForDepartment, d.knownForDepartment ?? d.knownFor),
            tmdbPersonId:       fill(prev.tmdbPersonId,       d.tmdbPersonId),
            popularity:         fill(prev.popularity,         d.popularity),
          };
        });
      })
      .catch(() => {});

    return () => { cancelled = true; setFilmography([]); };
  }, [person?.personId]);

  // Fallback cho luồng cũ không có personId: tìm theo tên diễn viên.
  const [extraMovies, setExtraMovies] = useState([]);
  useEffect(() => {
    if (!person?.name || person.personId) return;

    movieService.searchMoviesByActor(person.name)
      .then(raw => {
        const list = Array.isArray(raw) ? raw : raw?.data || raw?.movies || [];
        if (films.length === 0) setExtraMovies(list);

        setImages(prev => {
          if (prev.length > 0) return prev;
          for (const movie of list) {
            const match = (movie.cast || []).find(c =>
              c.tmdbPersonId === person.tmdbPersonId || c.name === person.name
            );
            if (match?.profileImages?.length > 0) return normalizeImages(match.profileImages);
          }
          return prev;
        });
      })
      .catch(() => {});
  }, [person?.name, person?.personId]);

  const allFilms = person?.personId
    ? filmography
    : (films.length > 0 ? films : extraMovies);

  // Đếm theo loại để chỉ hiện các filter có dữ liệu
  const counts = useMemo(() => ({
    all:      allFilms.length,
    movie:    allFilms.filter(f => f.mediaType !== 'tv').length,
    tv:       allFilms.filter(f => f.mediaType === 'tv').length,
    cast:     allFilms.filter(f => f.roles?.includes('cast')).length,
    director: allFilms.filter(f => f.roles?.includes('director')).length,
  }), [allFilms]);

  const visibleFilms = useMemo(() => {
    let list = allFilms;
    if (filter === 'movie')         list = list.filter(f => f.mediaType !== 'tv');
    else if (filter === 'tv')       list = list.filter(f => f.mediaType === 'tv');
    else if (filter === 'cast')     list = list.filter(f => f.roles?.includes('cast'));
    else if (filter === 'director') list = list.filter(f => f.roles?.includes('director'));

    return [...list].sort((a, b) =>
      sortBy === 'rating' ? filmRating(b) - filmRating(a) : filmTime(b) - filmTime(a)
    );
  }, [allFilms, filter, sortBy]);

  // Điểm trung bình các tác phẩm đã có điểm
  const avgRating = useMemo(() => {
    const rated = allFilms.map(filmRating).filter(r => Number(r) > 0);
    return rated.length ? rated.reduce((s, r) => s + Number(r), 0) / rated.length : 0;
  }, [allFilms]);

  const dept = DEPT_LABEL[person?.knownForDepartment] || person?.knownForDepartment;
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const facts = [
    { label: 'Ngày sinh', value: fmtDate(person?.birthday) },
    { label: 'Ngày mất',  value: person?.deathday ? fmtDate(person.deathday) : null },
    { label: 'Nơi sinh',  value: person?.placeOfBirth },
  ].filter(f => f.value);

  const gridCols = isMobile
    ? 'repeat(2, minmax(0, 1fr))'
    : 'repeat(auto-fill, minmax(200px, 1fr))';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, overflowX: 'hidden', paddingTop: 56 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,600;0,700;0,800;0,900;1,400&family=Nunito:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .pp-filters { scrollbar-width: none; }
        .pp-filters::-webkit-scrollbar { display: none; }
        .pp-photo:hover .pp-photo-zoom { opacity: 1; }
        .pp-photo:hover img { transform: scale(1.06); }
      `}</style>

      {/* ══ STICKY HEADER ══════════════════════════════════════════ */}
      <div style={{
        position: 'sticky', top: 0, left: 0, right: 0, zIndex: 100,
        height: 52,
        background: headerSolid ? 'rgba(8,8,8,0.96)' : 'rgba(8,8,8,0)',
        backdropFilter: headerSolid ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: headerSolid ? 'blur(20px)' : 'none',
        borderBottom: `1px solid ${headerSolid ? C.border : 'transparent'}`,
        display: 'flex', alignItems: 'center', gap: 12, padding: isMobile ? '0 16px' : '0 32px',
        transition: 'background 0.3s, border-color 0.3s',
      }}>
        <BackButton />
        <AnimatePresence>
          {headerSolid && person && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 1, height: 16, background: C.border }} />
              {person.profileUrl && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', border: `1px solid ${C.border}` }}>
                  <img src={person.profileUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <span style={{ fontFamily: FT, fontSize: 14, fontWeight: 700, color: C.text }}>{person.name}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══ HERO ════════════════════════════════════════════════════ */}
      <div ref={heroRef} style={{ position: 'relative', marginTop: -52, paddingTop: 52, overflow: 'hidden' }}>
        {person?.profileUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${person.profileUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center 20%',
            filter: 'blur(80px) brightness(0.22) saturate(1.5)',
            transform: 'scale(1.2)',
          }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 20% 30%, transparent 0%, ${C.bg} 85%)`,
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: isMobile ? 80 : 180,
          background: `linear-gradient(to bottom, transparent, ${C.bg})`,
        }} />

        <div style={{
          position: 'relative', zIndex: 1,
          maxWidth: 1280, margin: '0 auto',
          padding: isMobile ? '24px 16px 28px' : '56px 32px 72px',
          display: 'flex', gap: isMobile ? 18 : 56,
          alignItems: isMobile ? 'flex-start' : 'center',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
        }}>

          {/* ── Portrait ── */}
          {loading ? (
            <Sk w={isMobile ? 120 : 280} h={isMobile ? 180 : 420} r={16} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ flexShrink: 0, position: 'relative' }}
            >
              <div style={{
                width: isMobile ? 120 : 280, height: isMobile ? 180 : 420, borderRadius: 16,
                overflow: 'hidden', background: C.surfaceMid,
                boxShadow: '0 40px 90px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.09)',
              }}>
                {person?.profileUrl && !imgErr ? (
                  <img
                    src={person.profileUrl} alt={person?.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 12%' }}
                    onError={() => setImgErr(true)}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FT, fontSize: 90, fontWeight: 900, color: C.textDim,
                  }}>
                    {person?.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div style={{ position: 'absolute', top: 28, left: -4, width: 4, height: 72, borderRadius: 2, background: C.accent }} />
            </motion.div>
          )}

          {/* ── Info ── */}
          {loading ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Sk w="50%" h={48} r={8} />
              <Sk w="30%" h={16} r={4} />
              <Sk w="75%" h={70} r={10} />
              <Sk w="85%" h={80} r={8} />
            </div>
          ) : person ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ flex: 1, minWidth: 0 }}
            >
              {dept && (
                <div style={{ marginBottom: isMobile ? 8 : 14 }}>
                  <HeroPill tone="type" upper icon={Film} isMobile={isMobile}>{dept}</HeroPill>
                </div>
              )}

              <h1 style={{
                fontFamily: FT, fontWeight: 900, color: C.text,
                fontSize: isMobile ? 'clamp(26px, 8vw, 34px)' : 'clamp(40px, 5.4vw, 68px)',
                letterSpacing: '-0.025em', lineHeight: 1.02, marginBottom: isMobile ? 14 : 24,
              }}>
                {person.name}
              </h1>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: isMobile ? 14 : 26 }}>
                {age !== null && (
                  <HeroPill icon={Calendar} isMobile={isMobile}>
                    {person.deathday ? `${age} tuổi · đã mất` : `${age} tuổi`}
                  </HeroPill>
                )}
                {avgRating > 0 && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: isMobile ? '2px 8px' : '4px 10px', borderRadius: 99,
                    background: 'rgba(245,197,24,0.15)', border: '1px solid rgba(245,197,24,0.35)',
                    fontFamily: FB, fontSize: isMobile ? 11 : 13, lineHeight: 1.3,
                  }}>
                    <Rating value={avgRating} size={isMobile ? 11 : 12} />
                    <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 600, color: 'rgba(245,197,24,0.75)' }}>TB</span>
                  </span>
                )}
                {allFilms.length > 0 && (
                  <HeroPill icon={Film} isMobile={isMobile}>{allFilms.length} phim</HeroPill>
                )}
                {images.length > 0 && (
                  <HeroPill icon={Camera} isMobile={isMobile}>{images.length} ảnh</HeroPill>
                )}
              </div>

              {/* Facts */}
              {facts.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : `repeat(${Math.min(facts.length, 3)}, minmax(0, auto))`,
                  gap: isMobile ? 12 : 40, marginBottom: isMobile ? 16 : 26,
                  justifyContent: 'start',
                }}>
                  {facts.map(f => <Fact key={f.label} {...f} />)}
                </div>
              )}

              {/* Bio — desktop */}
              {bioText && !isMobile && (
                <div style={{ maxWidth: 680 }}>
                  <p style={{ fontFamily: FB, fontSize: 14.5, color: C.textSub, lineHeight: 1.85 }}>
                    {bioExpanded || bioText.length <= BIO_LIMIT ? bioText : bioText.slice(0, BIO_LIMIT) + '...'}
                  </p>
                  {bioText.length > BIO_LIMIT && (
                    <button onClick={() => setBioExpanded(v => !v)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: C.accent, fontFamily: FB, fontSize: 12.5, fontWeight: 800,
                      padding: '8px 0 0', letterSpacing: '0.02em',
                    }}>
                      {bioExpanded ? '▲ Thu gọn' : '▼ Đọc thêm'}
                    </button>
                  )}
                </div>
              )}

              {person.tmdbPersonId && !isMobile && (
                <a
                  href={`https://www.themoviedb.org/person/${person.tmdbPersonId}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 18,
                    color: C.textDim, fontFamily: FB, fontSize: 12, textDecoration: 'none',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = C.text}
                  onMouseLeave={e => e.currentTarget.style.color = C.textDim}
                >
                  <ExternalLink size={12} /> Xem trên TMDB
                </a>
              )}
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* Bio mobile */}
      {isMobile && bioText && person && (
        <div style={{ padding: '4px 16px 8px' }}>
          <p style={{
            fontFamily: FB, fontSize: 13, color: C.textSub, lineHeight: 1.75,
            display: bioExpanded ? 'block' : '-webkit-box',
            WebkitLineClamp: bioExpanded ? undefined : 4,
            WebkitBoxOrient: 'vertical',
            overflow: bioExpanded ? 'visible' : 'hidden',
          }}>
            {bioText}
          </p>
          <button onClick={() => setBioExpanded(v => !v)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.accent, fontFamily: FB, fontSize: 12, fontWeight: 800, padding: '6px 0 0',
          }}>
            {bioExpanded ? '▲ Thu gọn' : '▼ Đọc thêm'}
          </button>
        </div>
      )}

      {/* ══ BODY ════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '0 16px 60px' : '0 32px 100px' }}>

        {!loading && !person ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎭</div>
            <p style={{ fontFamily: FT, fontSize: 18, fontWeight: 700, color: C.textSub }}>
              Không tìm thấy thông tin
            </p>
          </div>
        ) : (
          <>
            {/* Tab bar */}
            <div style={{
              position: 'sticky', top: 52, zIndex: 40,
              background: C.bg, borderBottom: `1px solid ${C.border}`,
              marginBottom: 28,
              marginLeft: isMobile ? -16 : 0, marginRight: isMobile ? -16 : 0,
              paddingLeft: isMobile ? 16 : 0, paddingRight: isMobile ? 16 : 0,
              overflowX: 'auto',
            }} className="pp-filters">
              <div style={{ display: 'flex', width: 'max-content', minWidth: '100%' }}>
                <TabBtn active={tab === 'films'}  onClick={() => setTab('films')}  icon={Film}   label="Phim tham gia" count={allFilms.length} />
                <TabBtn active={tab === 'photos'} onClick={() => setTab('photos')} icon={Camera} label="Hình ảnh"      count={images.length} />
              </div>
            </div>

            <AnimatePresence mode="wait">

              {/* ── Films ── */}
              {tab === 'films' && (
                <motion.div key="films"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
                  style={{ minHeight: 400 }}
                >
                  {/* Toolbar: filter + sort */}
                  {!loading && !filmsLoading && allFilms.length > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 12, marginBottom: 24, flexWrap: isMobile ? 'nowrap' : 'wrap',
                    }}>
                      <div className="pp-filters" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                        <Pill active={filter === 'all'} onClick={() => setFilter('all')}>Tất cả · {counts.all}</Pill>
                        {counts.movie > 0    && <Pill active={filter === 'movie'}    onClick={() => setFilter('movie')}>Phim lẻ · {counts.movie}</Pill>}
                        {counts.tv > 0       && <Pill active={filter === 'tv'}       onClick={() => setFilter('tv')}>TV Show · {counts.tv}</Pill>}
                        {counts.cast > 0 && counts.director > 0 && (
                          <Pill active={filter === 'cast'} onClick={() => setFilter('cast')}>{ROLE_LABEL.cast} · {counts.cast}</Pill>
                        )}
                        {counts.director > 0 && counts.cast > 0 && (
                          <Pill active={filter === 'director'} onClick={() => setFilter('director')}>{ROLE_LABEL.director} · {counts.director}</Pill>
                        )}
                      </div>

                      {!isMobile && (
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <Pill active={sortBy === 'newest'} onClick={() => setSortBy('newest')}>Mới nhất</Pill>
                          <Pill active={sortBy === 'rating'} onClick={() => setSortBy('rating')}>Điểm cao</Pill>
                        </div>
                      )}
                    </div>
                  )}

                  {loading || filmsLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: isMobile ? 14 : 24 }}>
                      {Array(isMobile ? 6 : 10).fill(0).map((_, i) => (
                        <Sk key={i} w="100%" h="auto" r={10} style={{ aspectRatio: '2/3' }} />
                      ))}
                    </div>
                  ) : allFilms.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: C.textDim, fontFamily: FB, fontSize: 14 }}>
                      Chưa có thông tin phim
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid', gridTemplateColumns: gridCols,
                      columnGap: isMobile ? 14 : 24, rowGap: isMobile ? 24 : 36,
                    }}>
                      {visibleFilms.map((f, i) => {
                        const movie = toCardMovie(f);
                        const sub = f.character || (f.roles?.length > 0
                          ? f.roles.map(r => ROLE_LABEL[r] || r).join(' · ')
                          : null);
                        return (
                          <motion.div
                            key={`${f.mediaType || 'movie'}-${movie.id || i}`}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i, 12) * 0.035, duration: 0.3 }}
                            style={{ minWidth: 0 }}
                          >
                            <MovieCard movie={movie} cardWidth="100%" />
                            <div style={{ paddingTop: isMobile ? 0 : 10 }}>
                              {!isMobile && (
                                <p style={{
                                  fontFamily: FB, fontSize: 13, fontWeight: 700, color: C.text,
                                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                                }}>
                                  {movie.title}
                                </p>
                              )}
                              {sub && (
                                <p style={{
                                  fontFamily: FB, fontSize: 11.5, color: C.accent, fontStyle: 'italic', marginTop: 2,
                                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                                }}>
                                  {sub}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {!loading && !filmsLoading && allFilms.length > 0 && visibleFilms.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: C.textDim, fontFamily: FB, fontSize: 14 }}>
                      Không có tác phẩm nào trong mục này
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Photos ── */}
              {tab === 'photos' && (
                <motion.div key="photos"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
                  style={{ minHeight: 400 }}
                >
                  {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: isMobile ? 12 : 20 }}>
                      {Array(8).fill(0).map((_, i) => (
                        <Sk key={i} w="100%" h="auto" r={12} style={{ aspectRatio: '2/3' }} />
                      ))}
                    </div>
                  ) : images.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: C.textDim, fontFamily: FB, fontSize: 14 }}>
                      Chưa có ảnh
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: isMobile ? 12 : 20 }}>
                      {images.map((src, i) => (
                        <motion.div
                          key={`${src}-${i}`}
                          className="pp-photo"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: Math.min(i, 12) * 0.03, duration: 0.25 }}
                          onClick={() => setLightbox(i)}
                          style={{
                            position: 'relative', aspectRatio: '2/3', borderRadius: 12, overflow: 'hidden',
                            cursor: 'pointer', background: C.surfaceMid,
                            border: `1px solid ${C.border}`,
                            boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
                          }}
                        >
                          <img
                            src={src} alt="" loading="lazy"
                            style={{
                              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                              transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
                            }}
                          />
                          <div
                            className="pp-photo-zoom"
                            style={{
                              position: 'absolute', inset: 0, opacity: 0, transition: 'opacity 0.22s',
                              background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent 55%)',
                              display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 12,
                            }}
                          >
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(6px)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <ZoomIn size={16} color="#fff" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </>
        )}
      </div>

      {/* ══ LIGHTBOX ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {lightbox !== null && images.length > 0 && (
          <Lightbox images={images} index={lightbox} onClose={closeLightbox} onChange={setLightbox} />
        )}
      </AnimatePresence>
    </div>
  );
}