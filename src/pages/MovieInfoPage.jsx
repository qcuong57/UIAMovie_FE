// src/pages/MovieInfoPage.jsx
// Trang thông tin chi tiết phim — hiển thị trước khi vào xem phim
// Route: /movie/:id/info → /movie/:id (player)

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Star, Heart, ChevronLeft, Clock, Calendar,
  Globe, Award, Users, ChevronRight, X, Volume2, VolumeX,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import movieService from '../services/movieService';
import PersonScrollRow from '../components/movie/Personscrollrow';
import ReviewSection from '../components/movie/Reviewsection';

// ── Design tokens (đồng bộ với Homepage & MovieDetailPage) ─────
const C = {
  bg:          '#000000',
  surface:     '#0a0a0a',
  surfaceHigh: '#111111',
  surfaceMid:  '#181818',
  card:        '#141414',
  border:      'rgba(255,255,255,0.07)',
  borderBright:'rgba(255,255,255,0.14)',
  accent:      '#e5181e',
  accentSoft:  'rgba(229,24,30,0.15)',
  accentGlow:  'rgba(229,24,30,0.35)',
  text:        '#f0f2f8',
  textSub:     '#9299a8',
  textDim:     '#525868',
  gold:        '#f5c518',
  green:       '#46d369',
};

// ── Helpers ────────────────────────────────────────────────────
const fmt = (n) => n ? n.toFixed(1) : '—';
const fmtRuntime = (min) => {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}g ${m}p` : `${m}p`;
};

// Parse YouTube video ID từ full URL (watch?v=KEY hoặc youtu.be/KEY)
const extractYoutubeKey = (url) => {
  if (!url) return null;
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  return null;
};

// ── Skeleton loader ────────────────────────────────────────────
const Skeleton = ({ w = '100%', h = 16, r = 6, style = {} }) => (
  <div style={{
    width: w, height: h, borderRadius: r,
    background: 'linear-gradient(90deg, #1a1a1a 25%, #242424 50%, #1a1a1a 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    ...style,
  }} />
);

// ── Star Rating component ──────────────────────────────────────
const StarRating = ({ score, votes }) => {
  const pct = ((score || 0) / 10) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Circular score */}
      <div style={{ position: 'relative', width: 54, height: 54, flexShrink: 0 }}>
        <svg width="54" height="54" viewBox="0 0 54 54" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="27" cy="27" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
          <circle cx="27" cy="27" r="22" fill="none" stroke={C.gold} strokeWidth="3.5"
            strokeDasharray={`${2 * Math.PI * 22}`}
            strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 15, fontWeight: 800, color: C.gold, letterSpacing: '-0.02em' }}>
            {score ? score.toFixed(1) : '—'}
          </span>
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={11}
              style={{ color: i <= Math.round((score||0)/2) ? C.gold : 'rgba(255,255,255,0.15)',
                       fill:  i <= Math.round((score||0)/2) ? C.gold : 'none' }}
            />
          ))}
        </div>
        {votes && (
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.textDim }}>
            {votes.toLocaleString()} đánh giá
          </p>
        )}
      </div>
    </div>
  );
};

// ── Trailer Modal ──────────────────────────────────────────────
const TrailerModal = ({ trailerKey, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(12px)',
    }}
  >
    <motion.div
      initial={{ scale: 0.88, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      onClick={e => e.stopPropagation()}
      style={{
        width: '90vw', maxWidth: 960,
        aspectRatio: '16/9',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: `0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px ${C.border}`,
      }}
    >
      <iframe
        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
        allow="autoplay; fullscreen"
        allowFullScreen
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="Trailer"
      />
      <button onClick={onClose}
        style={{
          position: 'absolute', top: 12, right: 12,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(0,0,0,0.7)', border: `1px solid ${C.border}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
        }}>
        <X size={16} />
      </button>
    </motion.div>
  </motion.div>
);

// ── Cast Card ─────────────────────────────────────────────────
const CastCard = ({ person, index }) => {
  const [imgErr, setImgErr] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      style={{
        width: 120, flexShrink: 0,
        borderRadius: 10,
        overflow: 'hidden',
        background: C.card,
        border: `1px solid ${C.border}`,
        cursor: 'pointer',
        boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ width: '100%', aspectRatio: '2/3', background: C.surfaceMid, overflow: 'hidden', position: 'relative' }}>
        {person.profileUrl && !imgErr ? (
          <img src={person.profileUrl} alt={person.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.surfaceHigh, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: C.textDim, fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 800 }}>
              {person.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: '10px 10px 12px' }}>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.35, marginBottom: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {person.name}
        </p>
        {person.character && (
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10.5, color: C.textDim, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
            {person.character}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// ── Review Card ───────────────────────────────────────────────
const ReviewCard = ({ review, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.08 }}
    style={{
      padding: '20px 24px',
      background: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      marginBottom: 14,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `hsl(${(review.author?.charCodeAt(0) || 200) * 7}, 40%, 28%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
          {review.author?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 600, color: C.text }}>{review.author || 'Ẩn danh'}</p>
          {review.created_at && (
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.textDim }}>
              {new Date(review.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
      {review.author_details?.rating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: C.accentSoft, border: `1px solid ${C.accentGlow}` }}>
          <Star size={11} style={{ fill: C.gold, color: C.gold }} />
          <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 14, fontWeight: 700, color: C.gold }}>{review.author_details.rating}</span>
        </div>
      )}
    </div>
    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13.5, color: C.textSub, lineHeight: 1.75, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
      {review.content}
    </p>
  </motion.div>
);

// ── Stat Pill ─────────────────────────────────────────────────
const StatPill = ({ icon: Icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 40 }}>
    <Icon size={14} style={{ color: C.accent, flexShrink: 0 }} />
    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textDim }}>{label}</span>
    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 600, color: C.text }}>{value}</span>
  </div>
);

// ── Section heading ───────────────────────────────────────────
const SectionTitle = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
    <div style={{ width: 3, height: 20, borderRadius: 2, background: C.accent, flexShrink: 0 }} />
    <h2 style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '0.03em', textTransform: 'uppercase', margin: 0 }}>
      {children}
    </h2>
  </div>
);

// ══════════════════════════════════════════════════════════════
// ── MAIN PAGE ─────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
export default function MovieInfoPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [movie,    setMovie]    = useState(null);
  const [cast,     setCast]     = useState([]);
  const [directorsFromMovie, setDirectorsFromMovie] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [reviews,  setReviews]  = useState([]);
  const [tmdbData, setTmdbData] = useState(null);   // raw TMDB response nếu có
  const [loading,  setLoading]  = useState(true);
  // currentUser: đọc từ nơi bạn lưu auth (localStorage, context, v.v.)
  // shape: { id: Guid, name: string } | null
  const [currentUser] = useState(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [error,    setError]    = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isFav,    setIsFav]    = useState(false);
  const [activeTab, setActiveTab] = useState('cast'); // 'cast' | 'reviews' | 'details'
  const [imgLoaded, setImgLoaded] = useState(false);

  // ── Fetch data ───────────────────────────────────────────────
  // Scroll lên đầu trang mỗi khi vào trang này (hoặc đổi phim)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      // Movie detail
      const movieRes = await movieService.getMovieById(id);
      const raw = movieRes?.movie || movieRes;
      const normalized = {
        id:          raw.id,
        title:       raw.title,
        tagline:     raw.tagline || '',
        description: raw.description || raw.overview || '',
        year:        raw.releaseDate ? new Date(raw.releaseDate).getFullYear() : raw.year,
        releaseDate: raw.releaseDate,
        runtime:     raw.duration || raw.runtime,
        rating:      raw.rating || raw.voteAverage,
        voteCount:   raw.voteCount,
        popularity:  raw.popularity,
        genres:      raw.genres || [],
        posterUrl:   raw.posterUrl,
        backdropUrl: raw.backdropUrl,
        language:    raw.language || raw.originalLanguage,
        budget:      raw.budget,
        revenue:     raw.revenue,
        tmdbId:      raw.tmdbId,
        trailerKey:  raw.trailerKey || extractYoutubeKey(
                       raw.videos?.find(v => v.videoType === 'trailer')?.videoUrl
                     ),
        trailers:    raw.trailers || [],
        reviews:     raw.reviews || [],
      };
      setMovie(normalized);
      if (normalized.trailers?.length) setTrailers(normalized.trailers);
      if (normalized.reviews?.length)  setReviews(normalized.reviews);

      // Cast từ raw (giống MovieDetailPage)
      if (raw?.director) {
        setDirectorsFromMovie([{ name: raw.director, profileUrl: null }]);
      }
      if (Array.isArray(raw?.cast) && raw.cast.length > 0) {
        const sorted = [...raw.cast]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map(c => ({ name: c.name, character: c.character, profileUrl: c.profileUrl }));
        setCast(sorted);
      }

    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu phim');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────
  // Cast từ movieData.cast không có field job/department nên dùng directorsFromMovie
  const directors = directorsFromMovie.length > 0
    ? directorsFromMovie
    : cast.filter(p => p.job === 'Director' || p.department === 'Directing');
  const actors = cast.filter(p => p.job !== 'Director' && p.department !== 'Directing');

  const firstTrailerKey = movie?.trailerKey
    || (trailers.length > 0 ? trailers[0]?.key : null);

  const year       = movie?.year;
  const runtime    = fmtRuntime(movie?.runtime);
  const genreList  = Array.isArray(movie?.genres)
    ? movie.genres.map(g => (typeof g === 'string' ? g : g.name)).filter(Boolean)
    : [];

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,700;0,800;0,900;1,700&family=Nunito:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
          @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
          @keyframes spin { to { transform: rotate(360deg) } }
          ::-webkit-scrollbar { display: none; }
        `}</style>

        {/* Back button placeholder */}
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Skeleton w={90} h={32} r={20} />
        </div>

        {/* Hero skeleton */}
        <Skeleton w="100%" h={420} r={0} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', width: '100%' }}>
          <Skeleton w={340} h={40} r={6} style={{ marginBottom: 16 }} />
          <Skeleton w={200} h={20} r={4} style={{ marginBottom: 32 }} />
          <Skeleton w="100%" h={80} r={8} style={{ marginBottom: 12 }} />
          <Skeleton w="80%" h={80} r={8} />
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,700;0,800;0,900;1,700&family=Nunito:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');`}</style>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 48, fontWeight: 900, color: C.accent, marginBottom: 12 }}>Oops!</p>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSub, marginBottom: 24 }}>{error}</p>
          <button onClick={fetchAll} style={{ padding: '10px 24px', borderRadius: 40, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // ── Page ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, overflowX: 'hidden', paddingTop: 56 }}>
      {/* Global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,700;0,800;0,900;1,700&family=Nunito:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ──────────── HERO BACKDROP ──────────── */}
      <div style={{ position: 'relative', width: '100%', minHeight: 560, overflow: 'hidden' }}>

        {/* Backdrop image */}
        {movie?.backdropUrl && (
          <>
            <img
              src={movie.backdropUrl}
              alt=""
              onLoad={() => setImgLoaded(true)}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'cover',
                opacity: imgLoaded ? 0.38 : 0,
                transition: 'opacity 0.8s ease',
                filter: 'saturate(1.1)',
              }}
            />
            {/* Gradient overlays */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.96) 38%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.2) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000 0%, transparent 55%)' }} />
          </>
        )}

        {/* Nav bar */}
        <div style={{ position: 'relative', zIndex: 10, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <motion.button
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 40, background: 'rgba(255,255,255,0.07)', border: `1px solid ${C.border}`, cursor: 'pointer', color: C.text }}
          >
            <ChevronLeft size={16} />
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 500 }}>Quay lại</span>
          </motion.button>

          {/* Fav button */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setIsFav(v => !v)}
            style={{ width: 40, height: 40, borderRadius: '50%', background: isFav ? C.accentSoft : 'rgba(255,255,255,0.07)', border: `1px solid ${isFav ? C.accentGlow : C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Heart size={17} style={{ color: isFav ? C.accent : C.textSub, fill: isFav ? C.accent : 'none', transition: 'all 0.2s' }} />
          </motion.button>
        </div>

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', gap: 48, padding: '24px 48px 72px', maxWidth: 1200, margin: '0 auto', alignItems: 'flex-end', minHeight: 460 }}>

          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ flexShrink: 0, width: 220, borderRadius: 12, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)', display: 'none' }}
            className="poster-col"
          >
            {movie?.posterUrl ? (
              <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', aspectRatio: '2/3', background: C.surfaceMid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🎬</div>
            )}
          </motion.div>

          {/* Text info */}
          <div style={{ flex: 1 }}>
            {/* Genres */}
            {genreList.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {genreList.map(g => (
                  <span key={g} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: "'Nunito', sans-serif", background: C.accentSoft, color: C.accent, border: `1px solid ${C.accentGlow}`, letterSpacing: '0.03em' }}>
                    {g}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 'clamp(32px, 6vw, 68px)', fontWeight: 900, color: C.text, lineHeight: 0.95, letterSpacing: '-0.01em', marginBottom: 16, textShadow: '0 4px 30px rgba(0,0,0,0.7)' }}
            >
              {movie?.title}
            </motion.h1>

            {/* Tagline */}
            {movie?.tagline && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
                style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, color: C.textSub, fontStyle: 'italic', marginBottom: 20 }}>
                "{movie.tagline}"
              </motion.p>
            )}

            {/* Meta pills */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24, alignItems: 'center' }}>
              {year      && <StatPill icon={Calendar} label="Năm"       value={year} />}
              {runtime   && <StatPill icon={Clock}    label="Thời lượng" value={runtime} />}
              {movie?.language && <StatPill icon={Globe} label="Ngôn ngữ" value={movie.language.toUpperCase()} />}
              {movie?.rating && <StatPill icon={Star} label="TMDB" value={`${fmt(movie.rating)} / 10`} />}
            </motion.div>

            {/* Actions */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>

              {/* Watch now — style giống nút Phát ở MovieDetailPage */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/movie/${id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 32px', borderRadius: 6, background: 'white', color: 'black', border: 'none', cursor: 'pointer', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 17, fontWeight: 700 }}
              >
                <Play size={18} fill="black" color="black" />
                Phát
              </motion.button>

              {/* Trailer — kiểu chữ gạch dưới Netflix */}
              {firstTrailerKey && (
                <motion.button
                  whileHover={{ opacity: 0.75 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowTrailer(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '13px 4px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 16, fontWeight: 600, color: C.text, textDecoration: 'underline', textUnderlineOffset: 4, textDecorationThickness: 1, letterSpacing: '0.01em' }}
                >
                  <Play size={15} fill={C.text} color={C.text} />
                  Xem Trailer
                </motion.button>
              )}
            </motion.div>
          </div>

          {/* Poster — desktop right */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ flexShrink: 0, width: 200, borderRadius: 12, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)' }}
          >
            {movie?.posterUrl ? (
              <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', aspectRatio: '2/3', background: C.surfaceMid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🎬</div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ──────────── CONTENT AREA ──────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px 80px' }}>

        {/* Rating + Description row */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, paddingBottom: 40, borderBottom: `1px solid ${C.border}`, marginBottom: 40, alignItems: 'start' }}
        >
          {/* Description */}
          <div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, lineHeight: 1.85, color: C.textSub, maxWidth: 720 }}>
              {movie?.description || 'Chưa có mô tả.'}
            </p>
          </div>

          {/* Score */}
          <div style={{ flexShrink: 0 }}>
            <StarRating score={movie?.rating} votes={movie?.voteCount} />
          </div>
        </motion.div>

        {/* ──── TABS ──── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 32, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
            {[
              { key: 'cast',    label: 'Diễn viên',  icon: Users },
              { key: 'reviews', label: 'Đánh giá',   icon: Star },
              { key: 'details', label: 'Chi tiết',   icon: Award },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '10px 20px', border: 'none', cursor: 'pointer',
                  background: 'none',
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 15, fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase',
                  color: activeTab === key ? C.text : C.textDim,
                  borderBottom: `2px solid ${activeTab === key ? C.accent : 'transparent'}`,
                  marginBottom: -1,
                  transition: 'all 0.18s',
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">

            {/* ── CAST tab ── */}
            {activeTab === 'cast' && (
              <motion.div key="cast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>

                {/* Directors */}
                {directors.length > 0 && (
                  <div style={{ marginBottom: 36 }}>
                    <SectionTitle>Đạo Diễn</SectionTitle>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {directors.map((p, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, minWidth: 220 }}
                        >
                          <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', background: C.surfaceMid, flexShrink: 0, border: `2px solid ${C.accentGlow}` }}>
                            {p.profileUrl
                              ? <img src={p.profileUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 22, fontWeight: 900, color: C.textDim }}>{p.name?.charAt(0)}</div>
                            }
                          </div>
                          <div>
                            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>{p.name}</p>
                            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Đạo diễn</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actors */}
                {actors.length > 0 ? (
                  <div>
                    <SectionTitle>Diễn Viên</SectionTitle>
                    <PersonScrollRow people={actors} />
                  </div>
                ) : (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: C.textDim, fontFamily: "'Nunito', sans-serif", fontSize: 14 }}>
                    Chưa có thông tin diễn viên
                  </div>
                )}
              </motion.div>
            )}

            {/* ── REVIEWS tab ── */}
            {activeTab === 'reviews' && (
              <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                <ReviewSection
                  movieId={id}
                  movieRating={movie?.rating}
                  voteCount={movie?.voteCount}
                  currentUser={currentUser}
                />
              </motion.div>
            )}

            {/* ── DETAILS tab ── */}
            {activeTab === 'details' && (
              <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                <SectionTitle>Thông Tin Chi Tiết</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, maxWidth: 880 }}>
                  {[
                    ['Năm phát hành',    year || '—'],
                    ['Ngày chiếu',       movie?.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : '—'],
                    ['Thời lượng',       runtime || '—'],
                    ['Ngôn ngữ gốc',    movie?.language?.toUpperCase() || '—'],
                    ['Điểm TMDB',        movie?.rating ? `${fmt(movie.rating)} / 10` : '—'],
                    ['Số đánh giá',      movie?.voteCount ? movie.voteCount.toLocaleString() : '—'],
                    ['Thể loại',         genreList.join(', ') || '—'],
                    ['Đạo diễn',        directors.map(d => d.name).join(', ') || '—'],
                    ['Diễn viên chính', actors.slice(0,3).map(a => a.name).join(', ') || '—'],
                    ...(movie?.budget  ? [['Ngân sách', `$${(movie.budget/1e6).toFixed(0)}M`]]  : []),
                    ...(movie?.revenue ? [['Doanh thu', `$${(movie.revenue/1e6).toFixed(0)}M`]] : []),
                  ].map(([label, value]) => (
                    <div key={label} style={{ padding: '16px 20px', background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
                      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: C.textDim, textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
                      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.5 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        {/* ──── BOTTOM CTA ──── */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ marginTop: 56, padding: '36px 40px', borderRadius: 20, background: `linear-gradient(135deg, ${C.accentSoft} 0%, rgba(229,24,30,0.04) 100%)`, border: `1px solid ${C.accentGlow}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}
        >
          <div>
            <p style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 28, fontWeight: 900, color: C.text, marginBottom: 6, letterSpacing: '0.03em' }}>
              Sẵn sàng xem chưa?
            </p>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSub }}>
              Chất lượng cao · Không quảng cáo · Xem ngay
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/movie/${id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 36px', borderRadius: 6, background: 'white', color: 'black', border: 'none', cursor: 'pointer', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 18, fontWeight: 700, flexShrink: 0 }}
          >
            <Play size={18} fill="black" color="black" />
            Xem Ngay
          </motion.button>
        </motion.div> */}

      </div>

      {/* ──── TRAILER MODAL ──── */}
      <AnimatePresence>
        {showTrailer && firstTrailerKey && (
          <TrailerModal trailerKey={firstTrailerKey} onClose={() => setShowTrailer(false)} />
        )}
      </AnimatePresence>

    </div>
  );
}