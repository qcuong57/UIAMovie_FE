// src/components/home/TrendingSection.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Heart, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { C, FONT_DISPLAY, FONT_BODY } from '../../context/homeTokens';
import MovieRow from './MovieRow';

// ── HeroSpotlight — phim nổi bật kiểu Netflix hero ───────────────────────────
const HeroSpotlight = ({ movies = [], isFavorited, onFavoriteToggle }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const navigate  = useNavigate();
  const movie     = movies[activeIdx] || movies[0];
  if (!movie) return null;

  const favorited = isFavorited?.(movie.id);

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/7', minHeight: 380 }}>
      {/* Backdrop with crossfade */}
      <AnimatePresence mode="sync">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {movie.backdropUrl ? (
            <img
              src={movie.backdropUrl} alt={movie.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            }} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Multi-layer gradients — Netflix style: left vignette + bottom vignette + subtle top */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.1) 70%, transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 30%, transparent 60%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 20%)' }} />

      {/* Content — left side */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '0 48px 48px',
        maxWidth: '52%',
      }}>
        {/* Genre tags */}
        {movie.genres?.length > 0 && (
          <motion.div
            key={movie.id + '-genres'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}
          >
            {movie.genres.slice(0, 3).map((g, i) => (
              <span key={i} style={{
                fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700,
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                padding: '3px 0',
              }}>
                {i > 0 && <span style={{ marginRight: 6, opacity: 0.4 }}>•</span>}
                {g}
              </span>
            ))}
          </motion.div>
        )}

        {/* Title */}
        <motion.h2
          key={movie.id + '-title'}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={{
            fontFamily: FONT_DISPLAY, fontWeight: 900,
            fontSize: 'clamp(28px, 4vw, 54px)',
            color: 'white', lineHeight: 1.0,
            textTransform: 'uppercase', letterSpacing: '0.01em',
            marginBottom: 14,
            textShadow: '0 2px 24px rgba(0,0,0,0.4)',
          }}
        >
          {movie.title}
        </motion.h2>

        {/* Meta */}
        <motion.div
          key={movie.id + '-meta'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Star size={13} fill="#f5c518" color="#f5c518" />
            <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: '#f5c518', fontWeight: 800 }}>
              {movie.rating?.toFixed(1)}
            </span>
          </div>
          {movie.year && (
            <span style={{
              fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.55)',
              padding: '2px 7px', borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              {movie.year}
            </span>
          )}
          {movie.duration && (
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
              {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
            </span>
          )}
        </motion.div>

        {/* Description */}
        {movie.description && (
          <motion.p
            key={movie.id + '-desc'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            style={{
              fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6,
              color: 'rgba(255,255,255,0.65)',
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
              marginBottom: 24,
            }}
          >
            {movie.description}
          </motion.p>
        )}

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ display: 'flex', gap: 10, alignItems: 'center' }}
        >
          {/* Play */}
          <button
            onClick={() => navigate(`/movie/${movie.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '12px 26px', borderRadius: 7,
              background: 'white', border: 'none', cursor: 'pointer',
              fontFamily: FONT_BODY, fontSize: 16, fontWeight: 700, color: 'black',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e2e2'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            <Play size={18} fill="black" /> Xem ngay
          </button>

          {/* More info */}
          <button
            onClick={() => navigate(`/movie/${movie.id}/info`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '12px 22px', borderRadius: 7,
              background: 'rgba(109,109,110,0.7)', border: 'none', cursor: 'pointer',
              fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: 'white',
              backdropFilter: 'blur(8px)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(109,109,110,0.5)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(109,109,110,0.7)'}
          >
            Chi tiết
          </button>

          {/* Favorite */}
          <button
            onClick={e => { e.stopPropagation(); onFavoriteToggle?.(movie); }}
            style={{
              width: 46, height: 46, borderRadius: '50%',
              background: 'rgba(42,42,42,0.7)',
              border: `2px solid ${favorited ? C.accent : 'rgba(255,255,255,0.4)'}`,
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)', transition: 'border-color 0.2s',
            }}
          >
            <Heart size={18} fill={favorited ? C.accent : 'none'} color={favorited ? C.accent : 'white'} />
          </button>
        </motion.div>
      </div>

      {/* Thumbnail strip — bottom right */}
      <div style={{
        position: 'absolute', bottom: 40, right: 48,
        display: 'flex', gap: 8, alignItems: 'center',
      }}>
        {movies.slice(0, 5).map((m, i) => (
          <button
            key={m.id}
            onClick={() => setActiveIdx(i)}
            style={{
              flexShrink: 0,
              width: i === activeIdx ? 70 : 56,
              height: i === activeIdx ? 44 : 36,
              borderRadius: 5, overflow: 'hidden',
              border: `2px solid ${i === activeIdx ? 'white' : 'rgba(255,255,255,0.25)'}`,
              cursor: 'pointer', padding: 0,
              transition: 'all 0.22s ease',
              opacity: i === activeIdx ? 1 : 0.55,
            }}
          >
            {m.posterUrl ? (
              <img src={m.posterUrl} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: C.surfaceHigh, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎬</div>
            )}
          </button>
        ))}
      </div>

      {/* Bottom fade into page bg */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
        background: `linear-gradient(to bottom, transparent, ${C.bg})`,
        pointerEvents: 'none',
      }} />
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// TrendingSection — exported
// ══════════════════════════════════════════════════════════════════════════════
export default function TrendingSection({ movies = [], isFavorited, onFavoriteToggle }) {
  if (!movies.length) return null;

  return (
    <section>
      {/* Hero spotlight */}
      <HeroSpotlight
        movies={movies.slice(0, 5)}
        isFavorited={isFavorited}
        onFavoriteToggle={onFavoriteToggle}
      />

      {/* Trending row — slightly overlapping hero bottom */}
      <div style={{ position: 'relative', marginTop: -20, zIndex: 2, padding: '0 48px' }}>
        <MovieRow
          title="Trending Now"
          emoji="🔥"
          movies={movies}
          onFavoriteToggle={onFavoriteToggle}
          isFavorited={isFavorited}
        />
      </div>
    </section>
  );
}