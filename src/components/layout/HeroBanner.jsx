// src/components/HeroBanner.jsx
// Hỗ trợ cả Movie lẫn TV Show — cùng pattern với CountryMovieRows

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Star, ChevronLeft, ChevronRight, Tv, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';
import tvShowService from '../../services/tvShowService';

const AUTO_PLAY_INTERVAL = 6000;

// ── Normalize movie ────────────────────────────────────────────
const normalizeMovie = (m) => ({
  id: m.id,
  title: m.title,
  releaseDate: m.releaseDate ?? null,
  year: m.releaseDate
    ? new Date(m.releaseDate).getFullYear()
    : (m.year ?? null),
  rating: m.rating ?? m.imdbRating ?? 0,
  posterUrl: m.posterUrl ?? null,
  backdropUrl: m.backdropUrl ?? null,
  genres: m.genres ?? [],
  description: m.description ?? '',
  duration: m.duration ?? null,
  isTvShow: false,
});

// ── Normalize TV show ──────────────────────────────────────────
const normalizeTvShow = (s) => ({
  id: s.id,
  title: s.title ?? s.name,
  releaseDate: s.firstAirDate ?? null,
  year: s.firstAirDate
    ? new Date(s.firstAirDate).getFullYear()
    : (s.year ?? null),
  rating: s.rating ?? s.voteAverage ?? 0,
  posterUrl: s.posterUrl ?? null,
  backdropUrl: s.backdropUrl ?? null,
  genres: s.genres ?? [],
  description: s.description ?? s.overview ?? '',
  duration: null,
  isTvShow: true,
});

// ── Helper: extract items từ mọi dạng response ────────────────
const extractItems = (res, normalize) => {
  if (!res) return [];
  let raw = [];
  if (Array.isArray(res))                        raw = res;
  else if (Array.isArray(res?.items))            raw = res.items;
  else if (Array.isArray(res?.data?.items))      raw = res.data.items;
  else if (Array.isArray(res?.movies))           raw = res.movies;
  else if (Array.isArray(res?.tvShows))          raw = res.tvShows;
  else if (Array.isArray(res?.data?.movies))     raw = res.data.movies;
  else if (Array.isArray(res?.data?.tvShows))    raw = res.data.tvShows;
  else if (Array.isArray(res?.data))             raw = res.data;
  return raw.map(normalize);
};

// ── Sort key an toàn ──────────────────────────────────────────
// KHÔNG dùng new Date(year) vì new Date(2024) = năm 1970 (milliseconds)!
const sortKey = (item) => {
  if (item.releaseDate) return new Date(item.releaseDate).getTime();
  if (item.year)        return item.year; // so sánh số năm trực tiếp
  return 0;
};

// ─────────────────────────────────────────────────────────────────
const HeroBanner = ({ movie, movies, tvShows }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [fetchedTvShows, setFetchedTvShows] = useState([]);

  // Tự fetch TV shows nếu không có prop
  useEffect(() => {
    if (tvShows != null) return;
    tvShowService
      .getTvShows({ pageSize: 10, sortBy: 'rating', sortDesc: true })
      .then((res) => setFetchedTvShows(extractItems(res, normalizeTvShow)))
      .catch(() => setFetchedTvShows([]));
  }, [tvShows]);

  const slides = useMemo(() => {
    const normalizedMovies = movies
      ? extractItems(movies, normalizeMovie)
      : movie
      ? [normalizeMovie(movie)]
      : [];

    const normalizedTvShows = tvShows != null
      ? extractItems(tvShows, normalizeTvShow)
      : fetchedTvShows;

    console.log('[HeroBanner] raw movies:', normalizedMovies.length, 'raw tvShows:', normalizedTvShows.length);

    // Lấy top 3 movies + top 2 TV shows để đảm bảo mix đều
    const topMovies  = normalizedMovies .filter((i) => !!i.backdropUrl).sort((a, b) => sortKey(b) - sortKey(a)).slice(0, 3);
    const topTvShows = normalizedTvShows.filter((i) => !!i.backdropUrl).sort((a, b) => sortKey(b) - sortKey(a)).slice(0, 2);

    // Xen kẽ: movie, tvshow, movie, tvshow, movie
    const mixed = [];
    const maxLen = Math.max(topMovies.length, topTvShows.length);
    for (let i = 0; i < maxLen; i++) {
      if (topMovies[i])  mixed.push(topMovies[i]);
      if (topTvShows[i]) mixed.push(topTvShows[i]);
    }

    const result = mixed.slice(0, 5);
    console.log('[HeroBanner] slides:', result.map((s) => `${s.isTvShow ? 'TV' : 'MV'} ${s.title} (${s.year})`));
    return result;
  }, [movies, movie, tvShows, fetchedTvShows]);

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => { setCurrent(0); }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goTo = (idx) => { setDirection(idx > current ? 1 : -1); setCurrent(idx); };
  const prev = () => { setDirection(-1); setCurrent((p) => (p - 1 + slides.length) % slides.length); };
  const next = () => { setDirection(1); setCurrent((p) => (p + 1) % slides.length); };

  const activeItem = slides[current];

  const slideVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 80 : -80 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -80 : 80 }),
  };

  if (!activeItem) return null;

  const detailPath = activeItem.isTvShow ? `/tvshow/${activeItem.id}`      : `/movie/${activeItem.id}`;
  const infoPath   = activeItem.isTvShow ? `/tvshow/${activeItem.id}/info` : `/movie/${activeItem.id}/info`;

  return (
    <div
      className="relative bg-cover bg-center flex items-end overflow-hidden"
      style={{ height: isMobile ? '75vw' : '100vh', minHeight: isMobile ? 320 : 500 }}
    >
      {/* ── Background ── */}
      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          key={activeItem.id}
          variants={{
            enter: () => ({ opacity: 0, scale: 1.08 }),
            center:      { opacity: 1, scale: 1 },
            exit:  () => ({ opacity: 0, scale: 1 }),
          }}
          initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${activeItem.backdropUrl})` }}
        />
      </AnimatePresence>

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* ── Content ── */}
      <AnimatePresence custom={direction} initial={false} mode="wait">
        <motion.div
          key={activeItem.id + '-content'}
          custom={direction}
          variants={slideVariants}
          initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 max-w-3xl"
          style={{
            paddingLeft: isMobile ? 16 : 32,
            paddingRight: isMobile ? 16 : 32,
            paddingBottom: isMobile ? 48 : 112,
          }}
        >
          {/* Type badge */}
          <div style={{ marginBottom: isMobile ? 6 : 10 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 99,
              fontSize: isMobile ? 10 : 11, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              background: activeItem.isTvShow ? 'rgba(126,174,232,0.18)' : 'rgba(229,24,30,0.18)',
              border: `1px solid ${activeItem.isTvShow ? 'rgba(126,174,232,0.4)' : 'rgba(229,24,30,0.4)'}`,
              color: activeItem.isTvShow ? '#7eaee8' : '#e5181e',
            }}>
              {activeItem.isTvShow ? <Tv size={11} strokeWidth={2.5} /> : <Film size={11} strokeWidth={2.5} />}
              {activeItem.isTvShow ? 'TV Series' : 'Movies'}
            </span>
          </div>

          {/* Meta pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: isMobile ? 8 : 16 }}>
            {activeItem.rating > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 11px', borderRadius: 99,
                background: 'rgba(245,197,24,0.15)', border: '1px solid rgba(245,197,24,0.35)',
              }}>
                <Star size={12} style={{ fill: '#f5c518', color: '#f5c518' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f5c518' }}>{activeItem.rating}</span>
              </div>
            )}

            {activeItem.year && (
              <span style={{
                fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
                padding: '5px 11px', borderRadius: 99,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              }}>
                {activeItem.year}
              </span>
            )}

            {activeItem.duration && !isMobile && !activeItem.isTvShow && (
              <span style={{
                fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
                padding: '5px 11px', borderRadius: 99,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              }}>
                {Math.floor(activeItem.duration / 60) > 0
                  ? `${Math.floor(activeItem.duration / 60)}g ${activeItem.duration % 60}p`
                  : `${activeItem.duration} phút`}
              </span>
            )}

            {activeItem.genres?.slice(0, isMobile ? 1 : 3).map((g) => (
              <span key={g} style={{
                fontSize: isMobile ? 11 : 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                padding: isMobile ? '3px 8px' : '5px 11px', borderRadius: 99,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                maxWidth: isMobile ? 90 : 'none', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {g}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-black leading-tight text-white drop-shadow-lg" style={{
            fontSize: isMobile ? 'clamp(22px, 6vw, 36px)' : 'clamp(40px, 6vw, 72px)',
            marginBottom: isMobile ? 8 : 16,
          }}>
            {activeItem.title}
          </h1>

          {/* Description */}
          <p style={{
            marginBottom: isMobile ? 10 : 32,
            fontSize: isMobile ? 11 : 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: isMobile ? 2 : 3, WebkitBoxOrient: 'vertical',
          }}>
            {activeItem.description}
          </p>

          {/* Buttons */}
          <div className="flex gap-4 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate(detailPath)}
              className="bg-white text-black font-bold rounded-lg hover:bg-gray-200 flex items-center gap-2"
              style={{ padding: isMobile ? '8px 16px' : '12px 32px', fontSize: isMobile ? 13 : 16 }}
            >
              <Play size={20} fill="currentColor" />
              Phát
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate(infoPath)}
              className="bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 flex items-center gap-2 border border-white/30"
              style={{ padding: isMobile ? '8px 16px' : '12px 32px', fontSize: isMobile ? 13 : 16 }}
            >
              <Info size={20} />
              Chi tiết
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Dots + Prev/Next ── */}
      {slides.length > 1 && (
        <div className="absolute z-20 flex items-center gap-3" style={{
          bottom: isMobile ? 12 : 32,
          right: isMobile ? 'auto' : 32,
          left: isMobile ? 16 : 'auto',
        }}>
          <div className="flex items-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="relative overflow-hidden rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 28 : 8, height: 8,
                  background: i === current
                    ? (slide.isTvShow ? '#7eaee8' : '#e5181e')
                    : 'rgba(255,255,255,0.3)',
                }}
              >
                {i === current && (
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.4)' }}
                    initial={{ width: '0%' }} animate={{ width: '100%' }}
                    transition={{ duration: AUTO_PLAY_INTERVAL / 1000, ease: 'linear' }}
                    key={current}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {[{ fn: prev, Icon: ChevronLeft }, { fn: next, Icon: ChevronRight }].map(({ fn, Icon }, i) => (
              <button key={i} onClick={fn}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: '#fff' }}
              >
                <Icon size={16} strokeWidth={2.5} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroBanner;