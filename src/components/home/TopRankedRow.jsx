// src/components/home/TopRankedRow.jsx
// ─── Top 10: 5 phim/trang, không scroll nội bộ, poster xéo, hover đầy đủ ───

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Plus, Heart, ThumbsUp, ChevronDown,
  ChevronLeft, ChevronRight, Star, Loader,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { C, FONT_DISPLAY, FONT_BEBAS, FONT_BODY } from '../../context/homeTokens';
import movieService from '../../services/movieService';

const PER_PAGE = 5;

// ── Màu stroke số rank theo thứ hạng ─────────────────────────────────────────
const rankStroke = rank =>
  rank === 1 ? C.accent :
  rank <= 3  ? 'rgba(255,255,255,0.9)' :
  rank <= 6  ? 'rgba(255,255,255,0.42)' :
               'rgba(255,255,255,0.2)';

// ══════════════════════════════════════════════════════════════════════════════
// RankCard
// ══════════════════════════════════════════════════════════════════════════════
const RankCard = ({ movie, rank, isFavorited, onFavoriteToggle }) => {
  const [hovered,    setHovered]    = useState(false);
  const [imgError,   setImgError]   = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [localFav,   setLocalFav]   = useState(isFavorited?.(movie.id));
  const navigate  = useNavigate();
  const matchPct  = movie.rating ? Math.round(movie.rating * 10) : null;

  // Sync khi parent cập nhật favorites
  useEffect(() => {
    setLocalFav(isFavorited?.(movie.id));
  }, [isFavorited, movie.id]);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    try {
      if (localFav) {
        await movieService.removeFavorite(movie.id);
        setLocalFav(false);
        onFavoriteToggle?.(movie, false);
      } else {
        await movieService.addFavorite(movie.id);
        setLocalFav(true);
        onFavoriteToggle?.(movie, true);
        navigate('/favorites');
      }
    } catch (err) {
      console.error('Favorite toggle error:', err);
    } finally {
      setFavLoading(false);
    }
  };

  // Chiều rộng khoảng lùi cho số rank
  const rankW = rank >= 10 ? 88 : 68;

  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 0,
        paddingLeft: rankW,
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end' }}>

        {/* ── Số rank lớn nằm bên trái poster ── */}
        <div
          style={{
            position: 'absolute',
            left: -rankW,
            bottom: -6,
            lineHeight: 0.8,
            userSelect: 'none',
            zIndex: 0,
            transition: 'transform 0.35s cubic-bezier(.25,.1,.25,1)',
            transform: hovered ? 'scale(1.05) translateX(-2px)' : 'scale(1)',
            transformOrigin: 'bottom left',
          }}
        >
          {/* Lớp shadow */}
          <span style={{
            fontFamily: FONT_BEBAS,
            fontSize: 'clamp(110px, 10.5vw, 158px)',
            fontWeight: 400,
            color: 'transparent',
            WebkitTextStroke: '1px rgba(0,0,0,0.95)',
            position: 'absolute',
            top: 6, left: 6,
            lineHeight: 'inherit',
            pointerEvents: 'none',
          }}>
            {rank}
          </span>
          {/* Số chính (outline stroke) */}
          <span style={{
            fontFamily: FONT_BEBAS,
            fontSize: 'clamp(110px, 10.5vw, 158px)',
            fontWeight: 400,
            color: 'transparent',
            WebkitTextStroke: `2.5px ${rankStroke(rank)}`,
            lineHeight: 'inherit',
            position: 'relative',
            pointerEvents: 'none',
            ...(rank === 1 ? {
              filter: `drop-shadow(0 0 22px ${C.accent}99) drop-shadow(0 0 8px ${C.accent}55)`,
            } : {}),
          }}>
            {rank}
          </span>
        </div>

        {/* ── Poster ── */}
        <motion.div
          animate={{
            y:     hovered ? -14 : 0,
            scale: hovered ? 1.07 : 1,
          }}
          transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
          onClick={() => navigate(`/movie/${movie.id}/info`)}
          style={{
            position: 'relative',
            zIndex: hovered ? 20 : 1,
            width: '100%',
            aspectRatio: '2/3',
            boxShadow: hovered
              ? '0 32px 72px rgba(0,0,0,0.95), 0 10px 28px rgba(0,0,0,0.6)'
              : '0 8px 28px rgba(0,0,0,0.6)',
            transition: 'box-shadow 0.32s ease',
            // ── Cắt xéo góc trên-trái và dưới-phải ──
            borderRadius: 10,
            overflow: 'hidden',
            clipPath: 'polygon(20px 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%)',
            WebkitClipPath: 'polygon(20px 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%)',
          }}
        >
          {/* Poster image */}
          {movie.posterUrl && !imgError ? (
            <motion.img
              src={movie.posterUrl}
              alt={movie.title}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              animate={{ scale: hovered ? 1.09 : 1 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(160deg, #1a1a2e, #0f0f18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: FONT_BEBAS, fontSize: 52, color: 'rgba(255,255,255,0.07)' }}>
                {rank}
              </span>
            </div>
          )}

          {/* Rating badge */}
          {movie.rating && (
            <div style={{
              position: 'absolute', top: 10, right: 14, zIndex: 5,
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '3px 8px', borderRadius: 99,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
            }}>
              <Star size={10} fill="#facc15" color="#facc15" />
              <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: '#facc15' }}>
                {movie.rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Vignette đáy */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)',
          }} />

          {/* ── Hover overlay đầy đủ ── */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{
                  position: 'absolute', inset: 0,
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.82) 32%, rgba(0,0,0,0.28) 58%, transparent 100%)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  padding: '14px 16px',
                }}
              >
                {/* Buttons — click vùng này vẫn bubble lên poster → navigate info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  {/* Play */}
                  <motion.button
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                    onClick={e => { e.stopPropagation(); navigate(`/movie/${movie.id}`); }}
                    style={{
                      width: 36, height: 36, borderRadius: '50%', border: 'none',
                      background: '#fff', cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 14px rgba(0,0,0,0.55)',
                    }}
                  >
                    <Play size={14} fill="#000" color="#000" style={{ marginLeft: 2 }} />
                  </motion.button>

                  {/* Favorite */}
                  <motion.button
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                    onClick={handleFavoriteClick}
                    disabled={favLoading}
                    style={{
                      width: 36, height: 36, borderRadius: '50%', cursor: favLoading ? 'not-allowed' : 'pointer', flexShrink: 0,
                      background: localFav ? C.accent : 'rgba(30,30,30,0.9)',
                      border: `1.5px solid ${localFav ? C.accent : 'rgba(255,255,255,0.32)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: favLoading ? 0.7 : 1,
                    }}
                  >
                    {favLoading
                      ? <Loader size={13} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                      : localFav
                        ? <Heart size={13} fill="white" color="white" />
                        : <Plus  size={14} color="white" strokeWidth={2.5} />}
                  </motion.button>

                  {/* Thumbs up */}
                  <motion.button
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                      width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                      background: 'transparent',
                      border: '1.5px solid rgba(255,255,255,0.32)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <ThumbsUp size={12} color="white" strokeWidth={2.5} />
                  </motion.button>

                  {/* More info */}
                  <motion.button
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                    onClick={e => { e.stopPropagation(); navigate(`/movie/${movie.id}/info`); }}
                    style={{
                      width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                      marginLeft: 'auto',
                      background: 'transparent',
                      border: '1.5px solid rgba(255,255,255,0.32)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <ChevronDown size={14} color="white" strokeWidth={2.5} />
                  </motion.button>
                </div>

                {/* Title */}
                <p style={{
                  fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700,
                  color: '#fff', lineHeight: 1.3, marginBottom: 6,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {movie.title}
                </p>

                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {matchPct && (
                    <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: '#46d369' }}>
                      {matchPct}% Match
                    </span>
                  )}
                  {movie.year && (
                    <span style={{
                      fontFamily: FONT_BODY, fontSize: 10,
                      color: 'rgba(255,255,255,0.55)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 3, padding: '1px 5px',
                    }}>
                      {movie.year}
                    </span>
                  )}
                  {movie.genres?.[0] && (
                    <span style={{
                      fontFamily: FONT_BODY, fontSize: 10,
                      color: 'rgba(255,255,255,0.4)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {movie.genres[0]}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// TopRankedRow — PAGINATED (5 phim/trang, không cuộn nội bộ)
// ══════════════════════════════════════════════════════════════════════════════
export default function TopRankedRow({
  title = 'Top 10 Hôm Nay',
  movies = [],
  isFavorited,
  onFavoriteToggle,
}) {
  const [page,      setPage]      = useState(0);
  const [direction, setDirection] = useState(1);

  const top10  = movies.slice(0, 10);
  const pages  = Math.ceil(top10.length / PER_PAGE);
  const canLeft  = page > 0;
  const canRight = page < pages - 1;

  const go = useCallback(dir => {
    setDirection(dir);
    setPage(p => Math.min(Math.max(p + dir, 0), pages - 1));
  }, [pages]);

  const slice = top10.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  if (!top10.length) return null;

  const slideVariants = {
    enter:  d => ({ x: d * 55, opacity: 0 }),
    center:    ({ x: 0,        opacity: 1 }),
    exit:   d => ({ x: d * -55, opacity: 0 }),
  };

  return (
    <section style={{ marginBottom: 52 }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        {/* Left: title + dot indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 3, height: 20, borderRadius: 99, background: C.accent, flexShrink: 0 }} />
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 800,
            color: C.text, lineHeight: 1, margin: 0,
          }}>
            {title}
          </h2>
          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: 5, marginLeft: 8, alignItems: 'center' }}>
            {Array.from({ length: pages }).map((_, i) => (
              <div
                key={i}
                onClick={() => { setDirection(i > page ? 1 : -1); setPage(i); }}
                style={{
                  width: i === page ? 22 : 6,
                  height: 3, borderRadius: 99, cursor: 'pointer',
                  background: i === page ? C.accent : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Right: Prev / Next buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { dir: -1, icon: <ChevronLeft size={18} strokeWidth={2} />, can: canLeft },
            { dir:  1, icon: <ChevronRight size={18} strokeWidth={2} />, can: canRight },
          ].map(({ dir, icon, can }) => (
            <button
              key={dir}
              onClick={() => can && go(dir)}
              disabled={!can}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(12,12,12,0.88)',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                color: C.text,
                cursor: can ? 'pointer' : 'default',
                opacity: can ? 1 : 0.22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'opacity 0.2s, transform 0.15s',
              }}
              onMouseEnter={e => can && (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/*
        ── Card grid ──
        • Dùng AnimatePresence + slide khi chuyển trang
        • overflow: visible để hover card thoát ra ngoài
        • Không cuộn nội bộ
      */}
      <div style={{ position: 'relative', overflow: 'visible' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.36, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              display: 'flex',
              gap: 0,
              paddingTop: 28,    // Chỗ cho hover scale + y
              paddingBottom: 36,
              overflow: 'visible',
            }}
          >
            {slice.map((movie, i) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.38, ease: [0.215, 0.61, 0.355, 1] }}
                style={{ flex: '1 1 0', minWidth: 0, overflow: 'visible' }}
              >
                <RankCard
                  movie={movie}
                  rank={page * PER_PAGE + i + 1}
                  isFavorited={isFavorited}
                  onFavoriteToggle={onFavoriteToggle}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}