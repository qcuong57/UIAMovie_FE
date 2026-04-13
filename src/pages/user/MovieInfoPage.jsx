// src/pages/MovieInfoPage.jsx
// Trang thông tin chi tiết phim — hiển thị trước khi vào xem phim
// Route: /movie/:id/info → /movie/:id (player)

import React, { useState, useEffect } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Heart, Clock, Calendar, Globe, Star, Award, Users } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import movieService from '../../services/movieService';
import PersonScrollRow from '../../components/movie/Personscrollrow';
import ReviewSection from '../../components/movie/Reviewsection';
import BackButton from '../../components/common/BackButton';

// ── Shared components ──────────────────────────────────────────
import { C, toSlug, fmt, fmtRuntime, extractYoutubeKey, GLOBAL_STYLES } from '../../components/movie/ui/movieConstants';
import Skeleton        from '../../components/movie/ui/Skeleton';
import StarRating      from '../../components/movie/ui/StarRating';
import TrailerModal    from '../../components/movie/ui/TrailerModal';
import SectionTitle    from '../../components/movie/ui/SectionTitle';
import StatPill        from '../../components/movie/ui/StatPill';
import BackdropCarousel from '../../components/movie/ui/BackdropCarousel';

// ── Director Card (local — chỉ dùng trong trang này) ──────────
const DirectorCard = ({ person, index, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
    whileHover={{ y: -4, transition: { duration: 0.18 } }}
    onClick={onClick}
    style={{
      width: 140, flexShrink: 0,
      borderRadius: 10, overflow: 'hidden',
      background: C.card,
      border: `1px solid ${C.border}`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      cursor: person.name ? 'pointer' : 'default',
    }}
  >
    {/* Ảnh 2:3 */}
    <div style={{ width: '100%', aspectRatio: '2/3', background: C.surfaceMid, overflow: 'hidden', position: 'relative' }}>
      {person.profileUrl ? (
        <img src={person.profileUrl} alt={person.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c1c1c' }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" fill="#3a3a3a" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
    {/* Info */}
    <div style={{ padding: '12px 12px 14px' }}>
      <p style={{
        fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.text,
        lineHeight: 1.35, marginBottom: 4,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {person.name}
      </p>
      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11.5, color: C.textSub, fontStyle: 'italic' }}>
        Đạo diễn
      </p>
    </div>
  </motion.div>
);

// ══════════════════════════════════════════════════════════════
// ── MAIN PAGE ─────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
export default function MovieInfoPage() {
  const isMobile = useIsMobile();
  const { id }   = useParams();
  const navigate = useNavigate();

  const [movie,               setMovie]               = useState(null);
  const [cast,                setCast]                = useState([]);
  const [directorsFromMovie,  setDirectorsFromMovie]  = useState([]);
  const [trailers,            setTrailers]            = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [error,               setError]               = useState(null);
  const [showTrailer,         setShowTrailer]         = useState(false);
  const [isFav,               setIsFav]               = useState(false);
  const [activeTab,           setActiveTab]           = useState('cast'); // 'cast' | 'reviews' | 'details'
  const [imgLoaded,           setImgLoaded]           = useState(false);

  // currentUser: đọc từ nơi bạn lưu auth (localStorage, context, v.v.)
  const [currentUser] = useState(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  // ── Scroll lên đầu mỗi khi đổi phim ─────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchAll();
  }, [id]);

  // ── Fetch data ───────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
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
        images:      raw.images || [],
      };
      setMovie(normalized);
      if (normalized.trailers?.length) setTrailers(normalized.trailers);

      // Directors
      if (raw?.directorDetail) {
        setDirectorsFromMovie([{
          id:           raw.directorDetail.id ?? raw.directorDetail.personId ?? raw.directorDetail.tmdbPersonId ?? null,
          name:         raw.directorDetail.name,
          profileUrl:   raw.directorDetail.profileUrl,
          biography:    raw.directorDetail.biography,
          birthday:     raw.directorDetail.birthday,
          placeOfBirth: raw.directorDetail.placeOfBirth,
        }]);
      } else if (raw?.director) {
        setDirectorsFromMovie([{ name: raw.director, profileUrl: null }]);
      }

      // Cast
      if (Array.isArray(raw?.cast) && raw.cast.length > 0) {
        const sorted = [...raw.cast]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map(c => ({
            id:           c.id ?? c.personId ?? c.tmdbPersonId ?? null,
            name:         c.name,
            character:    c.character,
            profileUrl:   c.profileUrl,
            biography:    c.biography,
            birthday:     c.birthday,
            placeOfBirth: c.placeOfBirth,
          }));
        setCast(sorted);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu phim');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────
  const directors = directorsFromMovie.length > 0
    ? directorsFromMovie
    : cast.filter(p => p.job === 'Director' || p.department === 'Directing');
  const actors = cast.filter(p => p.job !== 'Director' && p.department !== 'Directing');

  const firstTrailerKey = movie?.trailerKey || (trailers.length > 0 ? trailers[0]?.key : null);
  const year      = movie?.year;
  const runtime   = fmtRuntime(movie?.runtime);
  const genreList = Array.isArray(movie?.genres)
    ? movie.genres.map(g => (typeof g === 'string' ? g : g.name)).filter(Boolean)
    : [];

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
        <style>{GLOBAL_STYLES}</style>
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Skeleton w={90} h={32} r={20} />
        </div>
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
        <style>{GLOBAL_STYLES}</style>
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
      <style>{GLOBAL_STYLES}</style>

      {/* ──────────── HERO BACKDROP ──────────── */}
      <div style={{ position: 'relative', width: '100%', minHeight: isMobile ? 420 : 560, overflow: 'hidden' }}>

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
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.96) 38%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.2) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000 0%, transparent 55%)' }} />
          </>
        )}

        {/* Nav bar */}
        <div style={{ position: 'relative', zIndex: 10, padding: isMobile ? '16px' : '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BackButton />

          {/* Fav button */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setIsFav(v => !v)}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: isFav ? C.accentSoft : 'rgba(255,255,255,0.07)',
              border: `1px solid ${isFav ? C.accentGlow : C.border}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Heart size={17} style={{ color: isFav ? C.accent : C.textSub, fill: isFav ? C.accent : 'none', transition: 'all 0.2s' }} />
          </motion.button>
        </div>

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 16 : 48,
          padding: isMobile ? '16px 16px 36px' : '24px 48px 72px',
          maxWidth: 1200, margin: '0 auto',
          alignItems: 'flex-end',
          minHeight: isMobile ? 360 : 460,
        }}>

          {/* Poster — desktop right */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0, x: 30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ flexShrink: 0, width: 200, borderRadius: 12, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)', order: 2 }}
            >
              {movie?.posterUrl ? (
                <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', aspectRatio: '2/3', background: C.surfaceMid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🎬</div>
              )}
            </motion.div>
          )}

          {/* Text info */}
          <div style={{ flex: 1 }}>
            {/* Genres */}
            {genreList.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {genreList.map(g => (
                  <span key={g} style={{
                    padding: '3px 10px', borderRadius: 20,
                    fontSize: 11, fontWeight: 600, fontFamily: "'Nunito', sans-serif",
                    background: C.accentSoft, color: C.accent, border: `1px solid ${C.accentGlow}`,
                    letterSpacing: '0.03em',
                  }}>
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
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: isMobile ? 'clamp(24px, 7vw, 40px)' : 'clamp(32px, 6vw, 68px)',
                fontWeight: 900, color: C.text, lineHeight: 1.1,
                letterSpacing: '-0.01em', marginBottom: 14,
                textShadow: '0 4px 30px rgba(0,0,0,0.7)',
              }}
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
              {year       && <StatPill icon={Calendar} label="Năm"        value={year} />}
              {runtime    && <StatPill icon={Clock}    label="Thời lượng" value={runtime} />}
              {movie?.language && <StatPill icon={Globe} label="Ngôn ngữ" value={movie.language.toUpperCase()} />}
              {movie?.rating   && <StatPill icon={Star}  label="TMDB"     value={`${fmt(movie.rating)} / 10`} />}
            </motion.div>

            {/* Actions */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/movie/${id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 32px', borderRadius: 6, background: 'white', color: 'black', border: 'none', cursor: 'pointer', fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 17, fontWeight: 700 }}
              >
                <Play size={18} fill="black" color="black" />
                Phát
              </motion.button>

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
        </div>
      </div>

      {/* ──────────── CONTENT AREA ──────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 16px 60px' : '0 28px 80px' }}>

        {/* Rating + Description row */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
            gap: isMobile ? 24 : 48,
            paddingBottom: 40, borderBottom: `1px solid ${C.border}`, marginBottom: 40,
            alignItems: 'start',
          }}
        >
          <div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, lineHeight: 1.85, color: C.textSub, maxWidth: 720 }}>
              {movie?.description || 'Chưa có mô tả.'}
            </p>
          </div>
          <div style={{ flexShrink: 0 }}>
            <StarRating score={movie?.rating} votes={movie?.voteCount} />
          </div>
        </motion.div>

        {/* ──── BACKDROP CAROUSEL ──── */}
        {(() => {
          const backdrops = (movie?.images || []).filter(i => i.imageType === 'backdrop');
          if (!backdrops.length) return null;
          return <BackdropCarousel backdrops={backdrops} />;
        })()}

        {/* ──── TABS ──── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: isMobile ? 0 : 4, marginBottom: 32, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
            {[
              { key: 'cast',    label: 'Diễn viên', icon: Users },
              { key: 'reviews', label: 'Đánh giá',  icon: Star  },
              { key: 'details', label: 'Chi tiết',  icon: Award },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 7,
                  padding: isMobile ? '10px 14px' : '10px 20px',
                  border: 'none', cursor: 'pointer', background: 'none',
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: isMobile ? 12 : 15, fontWeight: 800,
                  letterSpacing: '0.02em', textTransform: 'uppercase',
                  color: activeTab === key ? C.text : C.textDim,
                  borderBottom: `2px solid ${activeTab === key ? C.accent : 'transparent'}`,
                  marginBottom: -1,
                  transition: 'all 0.18s',
                  whiteSpace: 'nowrap',
                  flex: isMobile ? 1 : 'unset',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                }}
              >
                <Icon size={isMobile ? 11 : 13} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">

            {/* ── CAST tab ── */}
            {activeTab === 'cast' && (
              <motion.div key="cast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>

                {directors.length > 0 && (
                  <div style={{ marginBottom: 36 }}>
                    <SectionTitle>Đạo Diễn</SectionTitle>
                    <div style={{ display: 'flex', gap: 16 }}>
                      {directors.map((p, i) => (
                        <DirectorCard
                          key={i}
                          person={p}
                          index={i}
                          onClick={() => p.name && navigate(`/person/${toSlug(p.name)}`, { state: { actor: p } })}
                        />
                      ))}
                    </div>
                  </div>
                )}

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
                    ['Ngôn ngữ gốc',     movie?.language?.toUpperCase() || '—'],
                    ['Điểm TMDB',        movie?.rating ? `${fmt(movie.rating)} / 10` : '—'],
                    ['Số đánh giá',      movie?.voteCount ? movie.voteCount.toLocaleString() : '—'],
                    ['Thể loại',         genreList.join(', ') || '—'],
                    ['Đạo diễn',         directors.map(d => d.name).join(', ') || '—'],
                    ['Diễn viên chính',  actors.slice(0, 3).map(a => a.name).join(', ') || '—'],
                    ...(movie?.budget  ? [['Ngân sách', `$${(movie.budget  / 1e6).toFixed(0)}M`]] : []),
                    ...(movie?.revenue ? [['Doanh thu', `$${(movie.revenue / 1e6).toFixed(0)}M`]] : []),
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