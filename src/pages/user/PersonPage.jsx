// src/pages/PersonPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Film, Calendar, MapPin, Star, ExternalLink, Camera, BookOpen } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import personService from '../../services/personService';
import movieService from '../../services/movieService';
import BackButton from '../../components/common/BackButton';

// ── Tokens ────────────────────────────────────────────────────────
const C = {
  bg:          '#080808',
  surface:     '#0d0d0d',
  surfaceHigh: '#111111',
  surfaceMid:  '#161616',
  card:        '#111111',
  border:      'rgba(255,255,255,0.06)',
  borderBright:'rgba(255,255,255,0.13)',
  accent:      '#e5181e',
  accentSoft:  'rgba(229,24,30,0.1)',
  accentGlow:  'rgba(229,24,30,0.25)',
  text:        '#edeef2',
  textSub:     '#8a909f',
  textDim:     '#3e4351',
  gold:        '#f0b429',
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

// Chuẩn hoá mảng ảnh — chấp nhận string[] hoặc object[]
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

// ── Lightbox ──────────────────────────────────────────────────────
const Lightbox = ({ src, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}
  >
    <motion.img src={src} alt=""
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
      onClick={e => e.stopPropagation()}
    />
  </motion.div>
);

// ── Stat chip ─────────────────────────────────────────────────────
const Chip = ({ icon: Icon, children }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 12px', borderRadius: 20,
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${C.border}`,
  }}>
    {Icon && <Icon size={11} style={{ color: C.textDim }} />}
    <span style={{ fontFamily: FB, fontSize: 12, color: C.textSub }}>{children}</span>
  </div>
);

// ── Film card ─────────────────────────────────────────────────────
const FilmCard = ({ movie, navigate, index }) => {
  const [imgErr, setImgErr] = useState(false);
  const year = fmtYear(movie.releaseDate) || movie.year;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -5, transition: { duration: 0.18 } }}
      onClick={() => navigate(`/movie/${movie.id || movie.movieId}/info`)}
      style={{
        width: 130, flexShrink: 0, cursor: 'pointer',
        borderRadius: 10, overflow: 'hidden',
        background: C.card, border: `1px solid ${C.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderBright; e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.75)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)'; }}
    >
      <div style={{ width: '100%', aspectRatio: '2/3', background: C.surfaceMid, overflow: 'hidden', position: 'relative' }}>
        {(movie.posterUrl || movie.poster) && !imgErr
          ? <img src={movie.posterUrl || movie.poster} alt={movie.title} onError={() => setImgErr(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎬</div>
        }
        {(movie.rating || movie.voteAverage) && (
          <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', borderRadius: 5, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Star size={8} style={{ fill: C.gold, color: C.gold }} />
            <span style={{ fontFamily: FB, fontSize: 9.5, fontWeight: 700, color: C.gold }}>{(movie.rating || movie.voteAverage)?.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div style={{ padding: '8px 10px 10px' }}>
        <p style={{ fontFamily: FB, fontSize: 11, fontWeight: 700, color: C.text, lineHeight: 1.35, marginBottom: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {movie.title}
        </p>
        {movie.character && (
          <p style={{ fontFamily: FB, fontSize: 10, color: C.accent, fontStyle: 'italic', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {movie.character}
          </p>
        )}
        {year && <p style={{ fontFamily: FB, fontSize: 10, color: C.textDim, marginTop: 2 }}>{year}</p>}
      </div>
    </motion.div>
  );
};

// ── Tab button ────────────────────────────────────────────────────
const TabBtn = ({ active, onClick, icon: Icon, label, count }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '9px 12px', border: 'none', cursor: 'pointer', background: 'none',
    fontFamily: FT, fontSize: 12, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase',
    color: active ? C.text : C.textDim,
    borderBottom: `2px solid ${active ? C.accent : 'transparent'}`,
    marginBottom: -1, transition: 'color 0.18s, border-color 0.18s',
    whiteSpace: 'nowrap', flex: 1, justifyContent: 'center',
  }}>
    {Icon && <Icon size={12} style={{ opacity: active ? 1 : 0.5 }} />}
    {label}
    {count > 0 && (
      <span style={{
        fontSize: 9, padding: '2px 6px', borderRadius: 10,
        background: active ? C.accentSoft : 'rgba(255,255,255,0.04)',
        color: active ? C.accent : C.textDim, fontWeight: 800,
      }}>{count}</span>
    )}
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

  const [person,      setPerson]      = useState(null);
  const [images,      setImages]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [imgErr,      setImgErr]      = useState(false);
  const [lightbox,    setLightbox]    = useState(null);
  const [tab,         setTab]         = useState('films');
  const [bioExpanded, setBioExpanded] = useState(false);
  const [headerSolid, setHeaderSolid] = useState(false);

  // Sticky header opacity on scroll
  useEffect(() => {
    const handler = () => setHeaderSolid(window.scrollY > 200);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Scroll lên đầu trang mỗi khi chuyển sang diễn viên khác
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
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
      const tmdbId = stateActor.tmdbPersonId || null;

      setPerson({
        name:               stateActor.name,
        profileUrl:         stateActor.profileUrl   || null,
        biography:          stateActor.biography    || null,
        birthday:           stateActor.birthday     || null,
        placeOfBirth:       stateActor.placeOfBirth || null,
        knownForDepartment: stateActor.knownFor     || stateActor.knownForDepartment || null,
        tmdbPersonId:       tmdbId,
        deathday:           stateActor.deathday     || null,
        popularity:         stateActor.popularity   || null,
        movies:             stateActor.movies       || [],
      });

      // Lấy ảnh từ profileImages truyền qua state (ưu tiên nhất)
      const stateImages = normalizeImages(stateActor.profileImages || []);
      if (stateImages.length > 0) {
        setImages(stateImages);
        setLoading(false);
        return;
      }

      // Fallback: gọi TMDB nếu có tmdbPersonId
      if (tmdbId) {
        personService.getPersonImages(tmdbId)
          .then(raw => setImages(normalizeImages(raw)))
          .catch(() => {});
      }

      setLoading(false);
      return;
    }

    // ── Case 2: direct URL / reload — id là tmdbPersonId ─────────────
    // Nếu không có state (F5, copy link) và id trông như slug (chữ, dấu gạch) → không có gì để load
    if (!id) {
      setLoading(false);
      return;
    }

    // Nếu id là slug tên diễn viên (không phải số) → không gọi API vì không có DB id
    const isNumericId = /^\d+$/.test(id);
    if (!isNumericId) {
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
  const BIO_LIMIT = 600;

  // Fetch phim + ảnh nếu chưa có (khi navigate không truyền đủ data)
  const [extraMovies, setExtraMovies] = useState([]);
  useEffect(() => {
    if (!person?.name) return;

    movieService.searchMoviesByActor(person.name)
      .then(raw => {
        const list = Array.isArray(raw) ? raw : raw?.data || raw?.movies || [];

        // Set phim nếu chưa có
        if (films.length === 0) setExtraMovies(list);

        // Lấy profileImages của diễn viên này từ cast của các phim
        setImages(prev => {
          if (prev.length > 0) return prev; // đã có ảnh → giữ nguyên
          for (const movie of list) {
            const match = (movie.cast || []).find(c =>
              c.tmdbPersonId === person.tmdbPersonId ||
              c.name === person.name
            );
            if (match?.profileImages?.length > 0) {
              return normalizeImages(match.profileImages);
            }
          }
          return prev;
        });
      })
      .catch(() => {});
  }, [person?.name]);

  const allFilms = films.length > 0 ? films : extraMovies;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, overflowX: 'hidden', paddingTop: 56 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,600;0,700;0,800;0,900;1,400&family=Nunito:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ══ STICKY HEADER ══════════════════════════════════════════ */}
      <div style={{
        position: 'sticky', top: 0, left: 0, right: 0, zIndex: 100,
        height: 52,
        background: headerSolid ? 'rgba(8,8,8,0.96)' : 'rgba(8,8,8,0.0)',
        backdropFilter: headerSolid ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: headerSolid ? 'blur(20px)' : 'none',
        borderBottom: `1px solid ${headerSolid ? C.border : 'transparent'}`,
        display: 'flex', alignItems: 'center', gap: 12, padding: isMobile ? '0 16px' : '0 28px',
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
      <div ref={heroRef} style={{ position: 'relative', minHeight: isMobile ? 'auto' : 480, overflow: 'hidden' }}>

        {/* Backdrop blurred bg */}
        {person?.profileUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${person.profileUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center 15%',
            filter: 'blur(72px) brightness(0.14) saturate(1.4)',
            transform: 'scale(1.12)',
          }} />
        )}

        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: isMobile ? 60 : 200,
          background: `linear-gradient(to bottom, transparent, ${C.bg})`,
        }} />

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 1,
          maxWidth: 1120, margin: '0 auto',
          padding: isMobile ? '20px 16px 16px' : '48px 28px 56px',
          display: 'flex', gap: isMobile ? 16 : 44,
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          flexDirection: 'row', flexWrap: isMobile ? 'wrap' : 'nowrap',
        }}>

          {/* ── Avatar ── */}
          {loading ? (
            <Sk w={200} h={290} r={14} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ flexShrink: 0, position: 'relative' }}
            >
              <div style={{
                width: isMobile ? 110 : 200, height: isMobile ? 160 : 290, borderRadius: 14,
                overflow: 'hidden', background: C.surfaceMid,
                boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)',
              }}>
                {person?.profileUrl && !imgErr
                  ? <img
                      src={person.profileUrl}
                      alt={person?.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }}
                      onError={() => setImgErr(true)}
                    />
                  : <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: FT, fontSize: 72, fontWeight: 900, color: C.textDim,
                    }}>
                      {person?.name?.charAt(0)}
                    </div>
                }
              </div>
              <div style={{ position: 'absolute', top: 20, left: -3, width: 3, height: 60, borderRadius: 2, background: C.accent }} />
            </motion.div>
          )}

          {/* ── Info ── */}
          {loading ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
              <Sk w="55%" h={42} r={6} />
              <Sk w="25%" h={14} r={4} />
              <Sk w="70%" h={14} r={4} />
              <Sk w="80%" h={56} r={6} />
            </div>
          ) : person ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}
            >


              <h1 style={{
                fontFamily: FT, fontSize: isMobile ? 'clamp(20px, 6vw, 28px)' : 'clamp(32px, 5vw, 52px)', fontWeight: 900,
                color: C.text, letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: isMobile ? 10 : 16,
              }}>
                {person.name}
              </h1>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {age !== null && (
                  <Chip icon={Calendar}>
                    {person.deathday ? `${age} tuổi · đã mất` : `${age} tuổi`}
                  </Chip>
                )}
                {person.placeOfBirth && !isMobile && <Chip icon={MapPin}>{person.placeOfBirth}</Chip>}
                {allFilms.length > 0 && <Chip icon={Film}>{allFilms.length} phim</Chip>}
                {images.length > 0 && <Chip icon={Camera}>{images.length} ảnh</Chip>}
              </div>

              {bioText && !isMobile && (
                <div style={{ maxWidth: 640 }}>
                  <p style={{
                    fontFamily: FB, fontSize: 14,
                    color: C.textSub, lineHeight: 1.85,
                  }}>
                    {bioExpanded || bioText.length <= BIO_LIMIT
                      ? bioText
                      : bioText.slice(0, BIO_LIMIT) + '...'}
                  </p>
                  {bioText.length > BIO_LIMIT && (
                    <button onClick={() => setBioExpanded(v => !v)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: C.accent, fontFamily: FB, fontSize: 12, fontWeight: 700,
                      padding: '8px 0 0', letterSpacing: '0.02em',
                    }}>
                      {bioExpanded ? '▲ Thu gọn' : '▼ Đọc thêm'}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* Bio mobile — full width, sau hero */}
      {isMobile && bioText && person && (
        <div style={{ padding: '16px 16px 4px', background: C.bg }}>
          <p style={{
            fontFamily: FB, fontSize: 13, color: C.textSub, lineHeight: 1.75,
            display: bioExpanded ? 'block' : '-webkit-box',
            WebkitLineClamp: bioExpanded ? undefined : 5,
            WebkitBoxOrient: 'vertical',
            overflow: bioExpanded ? 'visible' : 'hidden',
          }}>
            {bioText}
          </p>
          <button onClick={() => setBioExpanded(v => !v)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.accent, fontFamily: FB, fontSize: 12, fontWeight: 700,
            padding: '6px 0 0', display: 'block',
          }}>
            {bioExpanded ? '▲ Thu gọn' : '▼ Đọc thêm'}
          </button>
        </div>
      )}

      {/* ══ BODY ════════════════════════════════════════════════════ */}
      <div style={{
        maxWidth: 1120, margin: '0 auto',
        padding: isMobile ? '0 16px 60px' : '0 28px 100px',
        display: 'flex', gap: 40, alignItems: 'flex-start',
        flexDirection: isMobile ? 'column' : 'row',
      }}>

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.45 }}
          style={{ width: 220, flexShrink: 0, position: 'sticky', top: 60, display: isMobile ? 'none' : undefined }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[80, 60, 90, 70].map((w, i) => <Sk key={i} w={`${w}%`} h={14} r={4} />)}
            </div>
          ) : person ? (
            <div style={{ background: C.surfaceMid, borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.border}` }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${C.border}` }}>
                <p style={{ fontFamily: FT, fontSize: 10, fontWeight: 800, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Thông tin
                </p>
              </div>
              <div style={{ padding: '4px 0' }}>
                {[
                  { label: 'Ngày sinh',     value: fmtDate(person.birthday) },
                  { label: 'Ngày mất',      value: person.deathday ? fmtDate(person.deathday) : null },
                  { label: 'Nơi sinh',      value: person.placeOfBirth },
                  { label: 'Phim nổi bật',  value: allFilms.length > 0 ? `${allFilms.length} phim` : null },
                ].filter(r => r.value).map((row, i) => (
                  <div key={i} style={{ padding: '10px 18px', borderBottom: `1px solid ${C.border}` }}>
                    <p style={{ fontFamily: FB, fontSize: 9.5, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>
                      {row.label}
                    </p>
                    <p style={{ fontFamily: FB, fontSize: 12.5, color: C.text, lineHeight: 1.5 }}>
                      {row.value}
                    </p>
                  </div>
                ))}
              </div>

              {person.tmdbPersonId && (
                <a
                  href={`https://www.themoviedb.org/person/${person.tmdbPersonId}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '12px 18px', color: C.textDim,
                    fontFamily: FB, fontSize: 11, textDecoration: 'none',
                    borderTop: `1px solid ${C.border}`,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = C.text}
                  onMouseLeave={e => e.currentTarget.style.color = C.textDim}
                >
                  <ExternalLink size={11} /> Xem trên TMDB
                </a>
              )}
            </div>
          ) : null}
        </motion.aside>

        {/* ── Main content ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          style={{ flex: 1, minWidth: 0 }}
        >
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
                background: C.bg,
                borderBottom: `1px solid ${C.border}`,
                marginBottom: 24,
                marginLeft: isMobile ? -16 : 0,
                marginRight: isMobile ? -16 : 0,
                paddingLeft: isMobile ? 16 : 0,
                paddingRight: isMobile ? 16 : 0,
              }}>
                <div style={{ display: 'flex', gap: 0, width: '100%' }}>
                  <TabBtn active={tab === 'films'}  onClick={() => setTab('films')}  icon={Film}     label="Phim tham gia" count={allFilms.length} />
                  <TabBtn active={tab === 'photos'} onClick={() => setTab('photos')} icon={Camera}   label="Ảnh"           count={images.length} />
                  {bioText && (
                    <TabBtn active={tab === 'bio'} onClick={() => setTab('bio')} icon={BookOpen} label="Tiểu sử" count={0} />
                  )}
                </div>
              </div>

              <div style={{ minHeight: 400 }}>
              <AnimatePresence mode="wait">

                {/* ── Films ── */}
                {tab === 'films' && (
                  <motion.div key="films"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
                  >
                    {loading ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                        {Array(8).fill(0).map((_, i) => <Sk key={i} w={130} h={195} r={10} />)}
                      </div>
                    ) : allFilms.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 0', color: C.textDim, fontFamily: FB, fontSize: 14 }}>
                        Chưa có thông tin phim
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                        {[...allFilms]
                          .sort((a, b) => new Date(b.releaseDate || b.year || 0) - new Date(a.releaseDate || a.year || 0))
                          .map((m, i) => (
                            <FilmCard key={m.id || m.movieId || i} movie={m} navigate={navigate} index={i} />
                          ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Photos ── */}
                {tab === 'photos' && (
                  <motion.div key="photos"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
                  >
                    {loading ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                        {Array(9).fill(0).map((_, i) => <Sk key={i} w="100%" h={210} r={8} />)}
                      </div>
                    ) : images.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 0', color: C.textDim, fontFamily: FB, fontSize: 14 }}>
                        Chưa có ảnh
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                        {images.map((src, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03, duration: 0.25 }}
                            whileHover={{ scale: 1.03, transition: { duration: 0.18 } }}
                            onClick={() => setLightbox(src)}
                            style={{
                              aspectRatio: '2/3', borderRadius: 8, overflow: 'hidden',
                              cursor: 'pointer', border: `1px solid ${C.border}`,
                              transition: 'border-color 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = C.borderBright}
                            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                          >
                            <img
                              src={src}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              loading="lazy"
                            />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Bio ── */}
                {tab === 'bio' && (
                  <motion.div key="bio"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
                  >
                    <div style={{
                      maxWidth: 720, padding: '32px 36px',
                      background: C.surfaceMid, borderRadius: 14, border: `1px solid ${C.border}`,
                    }}>
                      <div style={{ fontFamily: FT, fontSize: 64, lineHeight: 0.7, color: C.accent, opacity: 0.25, marginBottom: 20, userSelect: 'none' }}>
                        "
                      </div>
                      <p style={{ fontFamily: FB, fontSize: 15, color: C.textSub, lineHeight: 2, whiteSpace: 'pre-wrap' }}>
                        {bioText}
                      </p>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* ══ LIGHTBOX ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
      </AnimatePresence>
    </div>
  );
}