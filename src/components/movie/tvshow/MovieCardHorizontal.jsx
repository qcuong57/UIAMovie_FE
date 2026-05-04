// src/components/movie/MovieCardHorizontal.jsx
/**
 * MovieCardHorizontal — horizontal variant of MovieCard
 *
 * Layout: [Poster 2:3 thumb | Info + actions]
 * Desktop: hover overlay giống MovieCard (Play, Heart/Plus, ThumbsUp, ChevronDown)
 * Mobile : tap poster → /movie/:id/info, nút Heart góc poster như MobileCard
 *
 * Props:
 *  movie           {object}   — required
 *  isFavorited     {boolean}
 *  onFavoriteToggle(movie, bool)
 *  cardWidth       {string}   — CSS width, mặc định "100%"
 *  rank            {number}   — nếu truthy hiển thị số thứ tự ở góc poster
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, ThumbsUp, ChevronDown, Heart, Star, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../../hooks/useIsMobile';
import movieService from '../../../services/movieService';

// ── Design tokens (tự chứa, không cần import context) ─────────────
const T = {
  bg:          '#141414',
  surface:     '#1c1c1c',
  surfaceMid:  '#222',
  border:      'rgba(255,255,255,0.08)',
  borderMid:   'rgba(255,255,255,0.15)',
  text:        '#f0f2f8',
  textSub:     '#888',
  gold:        '#f5c518',
  green:       '#46d369',
  accent:      '#e5181e',
  fontDisplay: "'DM Sans', 'Nunito', sans-serif",
  fontBody:    "'Nunito', 'DM Sans', sans-serif",
};

const SPRING = { type: 'spring', stiffness: 270, damping: 25 };
const EASE   = { duration: 0.22, ease: 'easeOut' };

// ── Shared hook: favorite logic ────────────────────────────────────
function useFavorite(movieId, isFavorited, onFavoriteToggle, movieObj) {
  const [favLoading, setFavLoading] = useState(false);
  const [localFav, setLocalFav] = useState(isFavorited);
  useEffect(() => { setLocalFav(isFavorited); }, [isFavorited]);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    try {
      if (localFav) {
        await movieService.removeFavorite(movieId);
        setLocalFav(false);
        onFavoriteToggle?.(movieObj, false);
      } else {
        await movieService.addFavorite(movieId);
        setLocalFav(true);
        onFavoriteToggle?.(movieObj, true);
      }
    } catch (err) {
      console.error('Favorite toggle error:', err);
    } finally {
      setFavLoading(false);
    }
  };

  return { localFav, favLoading, handleFavoriteClick };
}

// ── MobileHorizontalCard ───────────────────────────────────────────
const MobileHorizontalCard = ({ movie, isFavorited, onFavoriteToggle, cardWidth }) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const { localFav, favLoading, handleFavoriteClick } = useFavorite(
    movie.id, isFavorited, onFavoriteToggle, movie
  );

  const matchPct = movie.rating ? Math.round(movie.rating * 10) : null;
  const genre    = movie.genres?.[0] ?? (Array.isArray(movie.genre) ? movie.genre[0] : movie.genre);

  return (
    <div style={{
      width: cardWidth || '100%',
      display: 'flex', gap: 12, alignItems: 'flex-start',
      padding: '10px 0',
      borderBottom: `1px solid ${T.border}`,
    }}>
      {/* Poster */}
      <div
        onClick={() => navigate(`/movie/${movie.id}/info`)}
        style={{
          position: 'relative', flexShrink: 0,
          width: 64, height: 96, borderRadius: 8,
          overflow: 'hidden', background: T.surfaceMid,
          cursor: 'pointer',
        }}
      >
        {movie.posterUrl && !imgError
          ? <img src={movie.posterUrl} alt={movie.title} onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎬</div>
        }
        {movie.rating > 0 && (
          <div style={{
            position: 'absolute', top: 4, left: 4,
            display: 'flex', alignItems: 'center', gap: 2,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            borderRadius: 999, padding: '1px 5px',
          }}>
            <Star size={8} fill={T.gold} color={T.gold} />
            <span style={{ fontFamily: T.fontBody, fontSize: 9, fontWeight: 700, color: T.gold }}>
              {movie.rating.toFixed(1)}
            </span>
          </div>
        )}
        {/* Heart button */}
        <button
          onClick={handleFavoriteClick}
          disabled={favLoading}
          style={{
            position: 'absolute', bottom: 4, right: 4,
            width: 24, height: 24, borderRadius: '50%',
            background: localFav ? T.accent : 'rgba(0,0,0,0.6)',
            border: `1.5px solid ${localFav ? T.accent : 'rgba(255,255,255,0.3)'}`,
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: favLoading ? 'not-allowed' : 'pointer',
            opacity: favLoading ? 0.7 : 1,
          }}
        >
          {favLoading
            ? <Loader size={9} color="white" style={{ animation: 'spin 0.7s linear infinite' }} />
            : <Heart size={10} fill={localFav ? 'white' : 'none'} color="white" strokeWidth={2} />
          }
        </button>
      </div>

      {/* Info */}
      <div
        style={{ flex: 1, minWidth: 0, paddingTop: 2, cursor: 'pointer' }}
        onClick={() => navigate(`/movie/${movie.id}/info`)}
      >
        <p style={{
          fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 700,
          color: T.text, margin: '0 0 4px',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.35,
        }}>
          {movie.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
          {movie.year && (
            <span style={{ fontFamily: T.fontBody, fontSize: 10, color: T.textSub }}>{movie.year}</span>
          )}
          {matchPct && (
            <span style={{ fontFamily: T.fontBody, fontSize: 10, fontWeight: 700, color: T.green }}>
              {matchPct}% Match
            </span>
          )}
          {genre && (
            <span style={{
              fontFamily: T.fontBody, fontSize: 9, color: T.textSub,
              border: `1px solid ${T.borderMid}`, borderRadius: 3, padding: '1px 5px',
            }}>
              {genre}
            </span>
          )}
        </div>
        {movie.overview && (
          <p style={{
            fontFamily: T.fontBody, fontSize: 11, color: T.textSub,
            margin: 0, lineHeight: 1.45,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {movie.overview}
          </p>
        )}
      </div>
    </div>
  );
};

// ── MovieCardHorizontal (Desktop) ──────────────────────────────────
const MovieCardHorizontal = ({
  movie,
  isFavorited,
  onFavoriteToggle,
  cardWidth,
  rank,
}) => {
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError]   = useState(false);
  const { localFav, favLoading, handleFavoriteClick } = useFavorite(
    movie?.id, isFavorited, onFavoriteToggle, movie
  );

  useEffect(() => {}, [isFavorited]); // localFav handled inside hook

  if (!movie) return null;

  // ── Mobile variant ─────────────────────────────────────────────
  if (isMobile) {
    return (
      <MobileHorizontalCard
        movie={movie}
        isFavorited={isFavorited}
        onFavoriteToggle={onFavoriteToggle}
        cardWidth={cardWidth}
      />
    );
  }

  // ── Desktop variant ────────────────────────────────────────────
  const matchPct = movie.rating ? Math.round(movie.rating * 10) : null;
  const genre    = movie.genres?.[0] ?? (Array.isArray(movie.genre) ? movie.genre[0] : movie.genre);

  // Poster dimensions: portrait 2:3
  const POSTER_W = 80;
  const POSTER_H = 120;

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      animate={isHovered
        ? { scale: 1.025, boxShadow: '0 16px 48px -8px rgba(0,0,0,0.9), 0 6px 20px -6px rgba(0,0,0,0.6)' }
        : { scale: 1,     boxShadow: '0 4px 16px rgba(0,0,0,0.45)' }
      }
      transition={SPRING}
      onClick={() => navigate(`/movie/${movie.id}/info`)}
      style={{
        width: cardWidth || '100%',
        display: 'flex',
        borderRadius: 10,
        overflow: 'hidden',
        background: T.surface,
        border: `1px solid ${isHovered ? T.borderMid : T.border}`,
        cursor: 'pointer',
        position: 'relative',
        zIndex: isHovered ? 10 : 1,
        transition: 'border-color 0.2s',
      }}
    >
      {/* ── Poster ──────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative', flexShrink: 0,
          width: POSTER_W, height: POSTER_H,
          background: T.surfaceMid, overflow: 'hidden',
        }}
      >
        {movie.posterUrl && !imgError
          ? (
            <motion.img
              src={movie.posterUrl}
              alt={movie.title}
              onError={() => setImgError(true)}
              animate={{ scale: isHovered ? 1.06 : 1 }}
              transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg,#1c1f26,#0f1117)', fontSize: 28,
            }}>🎬</div>
          )
        }

        {/* Persistent vignette trên poster */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to right, transparent 60%, rgba(0,0,0,0.35) 100%)',
        }} />

        {/* Rating badge — top left */}
        {movie.rating > 0 && (
          <div style={{
            position: 'absolute', top: 6, left: 6,
            display: 'flex', alignItems: 'center', gap: 3,
            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
            borderRadius: 999, padding: '2px 6px',
          }}>
            <Star size={9} fill={T.gold} color={T.gold} />
            <span style={{ fontFamily: T.fontBody, fontSize: 10, fontWeight: 700, color: T.gold }}>
              {movie.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Rank badge — bottom left */}
        {rank != null && (
          <div style={{
            position: 'absolute', bottom: 6, left: 6,
            fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 900,
            color: 'rgba(255,255,255,0.9)',
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            lineHeight: 1,
          }}>
            #{rank}
          </div>
        )}
        {/* Heart badge — bottom right, hiển thị luôn khi đã tim */}
        {localFav && !isHovered && (
          <div style={{
            position: 'absolute', bottom: 6, right: 6,
            width: 22, height: 22, borderRadius: '50%',
            background: T.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <Heart size={11} fill="white" color="white" />
          </div>
        )}
      </div>

      {/* ── Info panel ──────────────────────────────────────────── */}
      <div
        style={{
          flex: 1, minWidth: 0, padding: '14px 14px 12px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Title */}
        <div>
          <p style={{
            fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 800,
            color: T.text, margin: '0 0 5px', lineHeight: 1.3,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {movie.title}
          </p>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {matchPct && (
              <span style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, color: T.green }}>
                {matchPct}% Match
              </span>
            )}
            {movie.year && (
              <span style={{
                fontFamily: T.fontBody, fontSize: 10, color: T.textSub,
                border: `1px solid ${T.borderMid}`, borderRadius: 3, padding: '1px 5px',
              }}>
                {movie.year}
              </span>
            )}
            {genre && (
              <span style={{ fontFamily: T.fontBody, fontSize: 10, color: T.textSub, flexShrink: 0 }}>
                {genre}
              </span>
            )}
          </div>

          {/* Overview */}
          {movie.overview && (
            <p style={{
              fontFamily: T.fontBody, fontSize: 11, color: T.textSub,
              margin: 0, lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: isHovered ? 1 : 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
              transition: 'opacity 0.2s',
              opacity: isHovered ? 0 : 1,
            }}>
              {movie.overview}
            </p>
          )}
        </div>

        {/* ── Hover action buttons (giống MovieCard) ────────────── */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={EASE}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                position: 'absolute', bottom: 12, left: 14, right: 14,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Play */}
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/movie/${movie.id}`); }}
                style={{
                  width: 32, height: 32, borderRadius: '50%', border: 'none',
                  background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Play size={13} fill="#000" color="#000" style={{ marginLeft: 1 }} />
              </button>

              {/* Add / Favourite */}
              <button
                onClick={handleFavoriteClick}
                disabled={favLoading}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: localFav ? T.accent : 'transparent',
                  border: `1.5px solid ${localFav ? T.accent : 'rgba(255,255,255,0.4)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: favLoading ? 'not-allowed' : 'pointer',
                  flexShrink: 0, opacity: favLoading ? 0.7 : 1,
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => { if (!favLoading) e.currentTarget.style.transform = 'scale(1.12)'; }}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {favLoading
                  ? <Loader size={13} color="white" className="animate-spin" style={{ animation: 'spin 0.7s linear infinite' }} />
                  : localFav
                    ? <Heart size={13} fill="white" color="white" />
                    : <Plus size={14} color="white" strokeWidth={2.5} />
                }
              </button>

              {/* ThumbsUp */}
              <button
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: 32, height: 32, borderRadius: '50%', background: 'transparent',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0, transition: 'transform 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <ThumbsUp size={12} color="white" strokeWidth={2.5} />
              </button>

              {/* More info */}
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/movie/${movie.id}/info`); }}
                style={{
                  width: 32, height: 32, borderRadius: '50%', background: 'transparent',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0, marginLeft: 'auto',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <ChevronDown size={14} color="white" strokeWidth={2.5} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MovieCardHorizontal;