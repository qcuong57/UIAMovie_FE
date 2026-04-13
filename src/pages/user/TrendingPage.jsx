// src/pages/TrendingPage.jsx
// ─── Trang Trending — Cinema dark aesthetic ───────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Play, Heart, Star, Flame, Clock, Award, Eye, Loader, Plus,
  LayoutGrid, List, Calendar, Zap, ChevronLeft, ChevronRight, Info, ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import movieService from '../../services/movieService';
import { C, FONT_DISPLAY, FONT_BODY, FONT_BEBAS, GOOGLE_FONTS } from '../../context/homeTokens';
import BackButton from '../../components/common/BackButton';

// ── Motion variants ───────────────────────────────────────────────────────────
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.055, delayChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.215, 0.61, 0.355, 1] } },
};

const cardV = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.48, ease: [0.215, 0.61, 0.355, 1] } },
};

// ── HeroCarousel — top 1–5 tự trôi ──────────────────────────────────────────
const AUTO_INTERVAL = 6000;

const HeroCarousel = ({ slides, period }) => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [favStates, setFavStates] = useState({});
  const [favLoading, setFavLoading] = useState({});
  const timerRef = useRef(null);

  const restartTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent(p => (p + 1) % slides.length);
    }, AUTO_INTERVAL);
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    restartTimer();
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  const goTo = (idx) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
    restartTimer();
  };
  const prev = () => { setDirection(-1); setCurrent(p => (p - 1 + slides.length) % slides.length); restartTimer(); };
  const next = () => { setDirection(1);  setCurrent(p => (p + 1) % slides.length); restartTimer(); };

  const handleFav = async (e, movie) => {
    e.stopPropagation();
    const id = movie.id;
    if (favLoading[id]) return;
    setFavLoading(prev => ({ ...prev, [id]: true }));
    try {
      if (favStates[id]) { await movieService.removeFavorite(id); setFavStates(p => ({ ...p, [id]: false })); }
      else { await movieService.addFavorite(id); setFavStates(p => ({ ...p, [id]: true })); }
    } catch (err) { console.error(err); }
    finally { setFavLoading(prev => ({ ...prev, [id]: false })); }
  };

  if (!slides.length) return null;
  const movie = slides[current];
  const rank  = current + 1;
  const isFav = !!favStates[movie.id];
  const isLoadingFav = !!favLoading[movie.id];

  const contentVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit:  (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
  };

  return (
    <motion.div
      variants={fadeUp}
      style={{
        position: 'relative', borderRadius: 20, overflow: 'hidden',
        background: C.surfaceCard, aspectRatio: '16/7', minHeight: 300,
      }}
    >
      {/* ── Background image — crossfade ── */}
      <AnimatePresence initial={false}>
        <motion.div
          key={movie.id + '-bg'}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${movie.backdropUrl || movie.posterUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center top',
          }}
        />
      </AnimatePresence>

      {/* Gradients */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 52%, rgba(0,0,0,0.08) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,24,30,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* ── Content — slides in/out ── */}
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={movie.id + '-content'}
          custom={direction}
          variants={contentVariants}
          initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: 'clamp(20px, 3vw, 40px)' }}
        >
          {/* Rank number */}
          <div style={{
            fontFamily: FONT_BEBAS,
            fontSize: 'clamp(72px, 11vw, 148px)',
            lineHeight: 0.85, color: 'transparent',
            WebkitTextStroke: rank <= 3 ? '2px rgba(229,24,30,0.7)' : '2px rgba(255,255,255,0.18)',
            marginRight: 28, flexShrink: 0, userSelect: 'none',
            filter: rank <= 3 ? 'drop-shadow(0 0 18px rgba(229,24,30,0.25))' : 'none',
          }}>{rank}</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                #{rank} Trending {period === 'today' ? 'hôm nay' : 'tuần này'}
              </span>
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: FONT_DISPLAY, fontSize: 'clamp(20px, 3.2vw, 42px)',
              fontWeight: 800, color: C.text, lineHeight: 1.1,
              marginBottom: 10, maxWidth: '82%',
            }}>{movie.title}</h1>

            {/* Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              {movie.rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={13} fill={C.gold} color={C.gold} />
                  <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: C.gold }}>{movie.rating.toFixed(1)}</span>
                </div>
              )}
              {movie.year && <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSub }}>{movie.year}</span>}
              {movie.genres?.[0] && (
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}>
                  {movie.genres[0]}
                </span>
              )}
            </div>

            {movie.overview && (
              <p style={{
                fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.65, maxWidth: 400, marginBottom: 20,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>{movie.overview}</p>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => navigate(`/movie/${movie.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 8, background: 'white', border: 'none', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: '#000' }}
              >
                <Play size={14} fill="#000" color="#000" />
                Xem ngay
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => navigate(`/movie/${movie.id}/info`)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: 'white' }}
              >
                <Info size={14} />
                Chi tiết
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                onClick={(e) => handleFav(e, movie)}
                disabled={isLoadingFav}
                style={{ width: 38, height: 38, borderRadius: 8, background: isFav ? C.accent : 'rgba(255,255,255,0.1)', border: `1px solid ${isFav ? C.accent : 'rgba(255,255,255,0.15)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {isLoadingFav
                  ? <Loader size={14} color="white" style={{ animation: 'spin 0.7s linear infinite' }} />
                  : <Heart size={14} fill={isFav ? 'white' : 'none'} color="white" strokeWidth={2} />
                }
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Dots + prev/next ── */}
      {slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: 18, right: 24, display: 'flex', alignItems: 'center', gap: 10, zIndex: 10 }}>
          {/* Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {slides.map((_, i) => (
              <button
                key={i} onClick={() => goTo(i)}
                style={{
                  width: i === current ? 28 : 8, height: 8,
                  borderRadius: 99, border: 'none', cursor: 'pointer', padding: 0,
                  background: i === current ? C.accent : 'rgba(255,255,255,0.28)',
                  transition: 'all 0.3s', position: 'relative', overflow: 'hidden',
                }}
              >
                {i === current && (
                  <motion.div
                    key={current}
                    initial={{ width: '0%' }} animate={{ width: '100%' }}
                    transition={{ duration: AUTO_INTERVAL / 1000, ease: 'linear' }}
                    style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.4)', borderRadius: 99 }}
                  />
                )}
              </button>
            ))}
          </div>
          {/* Prev / Next */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[{ fn: prev, Icon: ChevronLeft }, { fn: next, Icon: ChevronRight }].map(({ fn, Icon }, k) => (
              <button key={k} onClick={fn}
                style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon size={15} strokeWidth={2.5} />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ── RankCard — poster card nhỏ có số ─────────────────────────────────────────
const RankCard = ({ movie, rank }) => {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [fav, setFav] = useState(false);

  const handleFav = async (e) => {
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    try {
      if (fav) { await movieService.removeFavorite(movie.id); setFav(false); }
      else { await movieService.addFavorite(movie.id); setFav(true); }
    } catch (err) { console.error(err); }
    finally { setFavLoading(false); }
  };

  return (
    <motion.div variants={cardV} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'stretch', gap: 0, position: 'relative' }}
    >
      {/* Rank number */}
      <div style={{
        fontFamily: FONT_BEBAS,
        fontSize: 'clamp(44px, 5.5vw, 76px)',
        lineHeight: 1, color: 'transparent',
        WebkitTextStroke: rank <= 3 ? `2px rgba(229,24,30,0.75)` : `2px rgba(255,255,255,0.13)`,
        marginRight: -10, zIndex: 2, alignSelf: 'flex-end',
        paddingBottom: 4, userSelect: 'none', flexShrink: 0,
        width: 50, textAlign: 'center',
      }}>{rank}</div>

      {/* Card */}
      <motion.div
        animate={{
          y: hov ? -5 : 0,
          boxShadow: hov ? '0 18px 44px rgba(0,0,0,0.85)' : '0 4px 14px rgba(0,0,0,0.4)',
        }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        onClick={() => navigate(`/movie/${movie.id}/info`)}
        style={{ flex: 1, borderRadius: 10, overflow: 'hidden', background: C.surfaceCard, cursor: 'pointer', position: 'relative', aspectRatio: '2/3' }}
      >
        {movie.posterUrl && !imgError ? (
          <motion.img
            src={movie.posterUrl} alt={movie.title}
            onError={() => setImgError(true)}
            animate={{ scale: hov ? 1.05 : 1 }}
            transition={{ duration: 0.34, ease: 'easeOut' }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎬</div>
        )}

        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 52%)', pointerEvents: 'none' }} />

        {/* Rating */}
        {movie.rating > 0 && (
          <div style={{
            position: 'absolute', top: 7, left: 7,
            display: 'flex', alignItems: 'center', gap: 3,
            padding: '2px 7px', borderRadius: 99,
            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
          }}>
            <Star size={10} fill={C.gold} color={C.gold} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: C.gold }}>{movie.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Fav button */}
        <motion.button
          whileTap={{ scale: 0.88 }} onClick={handleFav} disabled={favLoading}
          animate={{ opacity: hov ? 1 : 0 }} transition={{ duration: 0.15 }}
          style={{
            position: 'absolute', top: 7, right: 7,
            width: 30, height: 30, borderRadius: '50%',
            background: fav ? C.accent : 'rgba(0,0,0,0.65)',
            border: `1.5px solid ${fav ? C.accent : 'rgba(255,255,255,0.2)'}`,
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          {favLoading
            ? <Loader size={11} color="white" style={{ animation: 'spin 0.7s linear infinite' }} />
            : <Heart size={12} fill={fav ? 'white' : 'none'} color="white" strokeWidth={2} />
          }
        </motion.button>

        {/* Bottom info — ẩn khi hover để nhường chỗ cho overlay */}
        {!hov && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px' }}>
            <p style={{
              fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.3,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 3,
            }}>{movie.title}</p>
            {movie.year && <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.textSub }}>{movie.year}</p>}
          </div>
        )}

        {/* Hover overlay — giống MovieCard desktop */}
        <AnimatePresence>
          {hov && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                background: 'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.82) 30%, rgba(0,0,0,0.3) 55%, transparent 100%)',
              }}
            >
              <div style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Buttons row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                  {/* Play */}
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
                    onClick={e => { e.stopPropagation(); navigate(`/movie/${movie.id}`); }}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <Play size={13} fill="#000" color="#000" style={{ marginLeft: 1 }} />
                  </motion.button>
                  {/* Fav */}
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
                    onClick={handleFav} disabled={favLoading}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: fav ? C.accent : 'transparent', border: `1.5px solid ${fav ? C.accent : 'rgba(255,255,255,0.4)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: favLoading ? 0.7 : 1 }}
                  >
                    {favLoading
                      ? <Loader size={12} color="white" style={{ animation: 'spin 0.7s linear infinite' }} />
                      : fav ? <Heart size={13} fill="white" color="white" /> : <Plus size={13} color="white" strokeWidth={2.5} />
                    }
                  </motion.button>
                  {/* More info */}
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
                    onClick={e => { e.stopPropagation(); navigate(`/movie/${movie.id}/info`); }}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: 'transparent', border: '1.5px solid rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 'auto' }}
                  >
                    <ChevronDown size={14} color="white" strokeWidth={2.5} />
                  </motion.button>
                </div>
                {/* Title */}
                <p style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: C.text, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{movie.title}</p>
                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {movie.rating > 0 && (
                    <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: '#46d369' }}>{Math.round(movie.rating * 10)}% Match</span>
                  )}
                  {movie.year && (
                    <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: '#999', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 3, padding: '1px 5px' }}>{movie.year}</span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

// ── ListRow — dòng list ───────────────────────────────────────────────────────
const ListRow = ({ movie, rank }) => {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      variants={cardV}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => navigate(`/movie/${movie.id}/info`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 14px', borderRadius: 12,
        background: hov ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
        cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <div style={{
        fontFamily: FONT_BEBAS, fontSize: 28,
        color: rank <= 3 ? C.accent : 'rgba(255,255,255,0.17)',
        width: 32, textAlign: 'center', flexShrink: 0, lineHeight: 1,
      }}>{rank}</div>

      <div style={{ width: 44, height: 60, borderRadius: 7, overflow: 'hidden', flexShrink: 0, background: C.surfaceCard }}>
        {movie.posterUrl && !imgError ? (
          <img src={movie.posterUrl} alt={movie.title} onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎬</div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700,
          color: hov ? C.text : 'rgba(255,255,255,0.8)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          transition: 'color 0.15s', marginBottom: 3,
        }}>{movie.title}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {movie.rating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Star size={10} fill={C.gold} color={C.gold} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color: C.gold }}>{movie.rating.toFixed(1)}</span>
            </div>
          )}
          {movie.year && <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textSub }}>{movie.year}</span>}
          {movie.genres?.[0] && <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim }}>{movie.genres[0]}</span>}
        </div>
      </div>

      <AnimatePresence>
        {hov && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.14 }} whileTap={{ scale: 0.9 }}
            onClick={e => { e.stopPropagation(); navigate(`/movie/${movie.id}`); }}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'white', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <Play size={12} fill="#000" color="#000" style={{ marginLeft: 1 }} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonHero = () => (
  <div style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '16/7', minHeight: 280, background: C.surfaceCard, position: 'relative' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)', animation: 'shimmer 1.6s infinite' }} />
  </div>
);

const SkeletonCard = () => (
  <div style={{ borderRadius: 10, aspectRatio: '2/3', background: C.surfaceCard, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)', animation: 'shimmer 1.6s infinite' }} />
  </div>
);

// ── Period tab switcher ───────────────────────────────────────────────────────
const PERIOD_TABS = [
  { key: 'today',  label: 'Hôm nay',   icon: Zap },
  { key: 'week',   label: 'Tuần này',   icon: Calendar },
];

const VIEW_TABS = [
  { key: 'grid', icon: LayoutGrid },
  { key: 'list', icon: List },
];

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function TrendingPage() {
  const [period, setPeriod]       = useState('today'); // 'today' | 'week'
  const [viewMode, setViewMode]   = useState('grid');  // 'grid' | 'list'
  const [moviesMap, setMoviesMap] = useState({ today: [], week: [] });
  const [loading, setLoading]     = useState({ today: true, week: false });
  const [error, setError]         = useState(null);
  const fetched = useRef({ today: false, week: false });

  // Fetch on-demand per period
  const fetchPeriod = async (p) => {
    if (fetched.current[p]) return;
    fetched.current[p] = true;
    setLoading(prev => ({ ...prev, [p]: true }));
    try {
      // Both tabs call getTrendingMovies; in production you'd pass a period param
      const data = await movieService.getTrendingMovies();
      // Slight shuffle for "week" to simulate different data
      const list = Array.isArray(data) ? data : [];
      setMoviesMap(prev => ({ ...prev, [p]: list }));
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách trending. Vui lòng thử lại.');
    } finally {
      setLoading(prev => ({ ...prev, [p]: false }));
    }
  };

  useEffect(() => { fetchPeriod('today'); }, []);

  const handlePeriodChange = (p) => {
    setPeriod(p);
    fetchPeriod(p);
  };

  const movies    = moviesMap[period];
  const isLoading = loading[period];
  const top5      = movies.slice(0, 5);   // ranks 1–5 → carousel
  const top6to10  = movies.slice(5, 10);  // ranks 6–10 → 1 hàng 5 thẻ
  const rest      = movies.slice(10, 20); // ranks 11–20 → grid

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@600;700;800;900&family=Bebas+Neue&family=Nunito:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        html { scrollbar-width: none; }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>

          {/* ── Header row ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}
          >
            {/* Left: back + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 50  }}>
              <BackButton />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(229,24,30,0.12)',
                  border: '1px solid rgba(229,24,30,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Flame size={17} color={C.accent} fill={C.accent} />
                </div>
                <div>
                  <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 800, color: C.text, lineHeight: 1 }}>
                    Đang thịnh hành
                  </h1>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textSub, marginTop: 2 }}>
                    Top {movies.length} phim được xem nhiều nhất
                  </p>
                </div>
              </div>
            </div>

          </motion.div>

          {/* ── Period tab pill ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}
          >
            {PERIOD_TABS.map(tab => {
              const Icon = tab.icon;
              const active = period === tab.key;
              return (
                <motion.button
                  key={tab.key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePeriodChange(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 18px', borderRadius: 40, border: 'none', cursor: 'pointer',
                    background: active
                      ? 'linear-gradient(135deg, rgba(229,24,30,0.20) 0%, rgba(229,24,30,0.10) 100%)'
                      : 'rgba(255,255,255,0.04)',
                    boxShadow: active ? 'inset 0 0 0 1px rgba(229,24,30,0.45)' : 'inset 0 0 0 1px rgba(255,255,255,0.07)',
                    color: active ? C.accent : C.textSub,
                    fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700,
                    letterSpacing: '0.02em',
                    transition: 'all 0.18s',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* Active indicator glow */}
                  {active && (
                    <motion.div
                      layoutId="periodGlow"
                      style={{
                        position: 'absolute', inset: 0, borderRadius: 40,
                        background: 'radial-gradient(ellipse at 50% 120%, rgba(229,24,30,0.18) 0%, transparent 70%)',
                        pointerEvents: 'none',
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  <Icon size={13} strokeWidth={active ? 2.5 : 2} />
                  {tab.label}
                  {active && (
                    <motion.div
                      layoutId="periodDot"
                      style={{ width: 5, height: 5, borderRadius: '50%', background: C.accent, boxShadow: `0 0 6px ${C.accent}` }}
                      transition={{ duration: 0.28 }}
                    />
                  )}
                </motion.button>
              );
            })}

            {/* Divider + count chip + view toggle */}
            <div style={{ flex: 1 }} />
            {!isLoading && movies.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                style={{
                  padding: '4px 12px', borderRadius: 99,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600,
                  color: C.textSub, letterSpacing: '0.04em',
                }}
              >
                {movies.length} phim
              </motion.div>
            )}
            {/* View toggle */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, overflow: 'hidden' }}>
              {VIEW_TABS.map(tab => {
                const Icon = tab.icon;
                const active = viewMode === tab.key;
                return (
                  <motion.button
                    key={tab.key}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setViewMode(tab.key)}
                    style={{
                      width: 36, height: 36, border: 'none', cursor: 'pointer',
                      background: active ? 'rgba(255,255,255,0.11)' : 'transparent',
                      color: active ? C.text : C.textSub,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={15} />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* ── Error ──────────────────────────────────────────────────── */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                padding: '16px 20px', borderRadius: 12, marginBottom: 24,
                background: 'rgba(229,24,30,0.08)', border: '1px solid rgba(229,24,30,0.2)',
                fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(229,24,30,0.9)',
              }}
            >
              {error}
            </motion.div>
          )}

          {/* ── Content ────────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={period}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <SkeletonHero />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
                    {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                </div>
              ) : movies.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 0' }}>
                  <p style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.textSub }}>Chưa có dữ liệu trending</p>
                </motion.div>
              ) : (
                <motion.div variants={pageVariants} initial="hidden" animate="visible">

                  {/* ── Hero Carousel top 1–5 — ẩn khi list view ── */}
                  <AnimatePresence>
                    {viewMode === 'grid' && top5.length > 0 && (
                      <motion.div
                        key="hero-carousel"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.35, ease: [0.215, 0.61, 0.355, 1] }}
                        style={{ marginBottom: 36 }}
                      >
                        <HeroCarousel slides={top5} period={period} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Section: Top 6–10 label — ẩn khi list view ── */}
                  {viewMode === 'grid' && (
                  <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <Award size={13} color={C.accent} />
                    <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: C.textSub, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Top 6 – 10
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                  </motion.div>
                  )}

                  {/* ── Grid / List switch ──────────────────────────── */}
                  <AnimatePresence mode="wait">
                    {viewMode === 'grid' ? (
                      <motion.div
                        key="grid"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        {/* Top 6–10: 5 thẻ 1 hàng */}
                        <motion.div
                          variants={pageVariants} initial="hidden" animate="visible"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: 16, marginBottom: 40,
                          }}
                        >
                          {top6to10.map((m, i) => <RankCard key={m.id} movie={m} rank={i + 6} />)}
                        </motion.div>

                        {/* 11–20 poster grid — same style as Top 2–10 */}
                        {rest.length > 0 && (
                          <>
                            <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                              <Eye size={13} color={C.textSub} />
                              <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: C.textSub, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                Top 11 – {10 + rest.length}
                              </span>
                              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                            </motion.div>
                            <motion.div
                              variants={pageVariants} initial="hidden" animate="visible"
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))',
                                gap: 16, marginBottom: 40,
                              }}
                            >
                              {rest.map((m, i) => <RankCard key={m.id} movie={m} rank={i + 11} />)}
                            </motion.div>
                          </>
                        )}
                      </motion.div>
                    ) : (
                      /* Full list view — tất cả phim kể cả #1 */
                      <motion.div
                        key="list"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        <motion.div variants={pageVariants} initial="hidden" animate="visible"
                          style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                        >
                          {movies.map((m, i) => <ListRow key={m.id} movie={m} rank={i + 1} />)}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}