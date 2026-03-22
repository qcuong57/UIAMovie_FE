// src/components/HeroBanner.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as variants from '../../motion-configs/variants';
import * as transitions from '../../motion-configs/transitions';
import { useIsMobile } from '../../hooks/useIsMobile';

const AUTO_PLAY_INTERVAL = 6000; // 6 giây mỗi slide

const HeroBanner = ({ movie, movies }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  // Dùng movies[] nếu có, fallback về movie đơn
  // Sắp xếp theo releaseDate mới nhất trước, rồi lấy 5 phim đầu
  const slides = movies
    ? [...movies].sort((a, b) => new Date(b.releaseDate || b.year || 0) - new Date(a.releaseDate || a.year || 0)).slice(0, 5)
    : movie ? [movie] : [];
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = next, -1 = prev

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goTo = (idx) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  };

  const prev = () => {
    setDirection(-1);
    setCurrent((p) => (p - 1 + slides.length) % slides.length);
  };

  const next = () => {
    setDirection(1);
    setCurrent((p) => (p + 1) % slides.length);
  };

  const activeMovie = slides[current];

  const slideVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 80 : -80 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -80 : 80 }),
  };

  if (!activeMovie) return null;

  return (
    <div className="relative bg-cover bg-center flex items-end overflow-hidden" style={{ height: isMobile ? '75vw' : '100vh', minHeight: isMobile ? 320 : 500 }}>

      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          key={activeMovie.id}
          custom={direction}
          variants={{
            enter: (dir) => ({ opacity: 0, scale: 1.08 }),
            center: { opacity: 1, scale: 1 },
            exit: (dir) => ({ opacity: 0, scale: 1 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          className={`absolute inset-0 bg-cover bg-center ${!activeMovie.backdropUrl ? 'bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900' : ''}`}
          style={activeMovie.backdropUrl ? { backgroundImage: `url(${activeMovie.backdropUrl})` } : {}}
        />
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20 pointer-events-none" />
      {/* Side fades */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* ── Content ── */}
      <AnimatePresence custom={direction} initial={false} mode="wait">
        <motion.div
          key={activeMovie.id + '-content'}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 max-w-3xl" style={{ paddingLeft: isMobile ? 16 : 32, paddingRight: isMobile ? 16 : 32, paddingBottom: isMobile ? 48 : 112 }}
        >
          {/* Rating + Year + Duration + Genres — pill badges */}
          <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: isMobile ? 8 : 16, display: 'flex' }}>
            {/* Rating */}
            {(activeMovie.rating) && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 11px', borderRadius: 99,
                background: 'rgba(245,197,24,0.15)',
                border: '1px solid rgba(245,197,24,0.35)',
              }}>
                <Star size={12} style={{ fill: '#f5c518', color: '#f5c518', flexShrink: 0 }} />
                <span style={{ fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#f5c518' }}>
                  {activeMovie.rating}
                </span>
              </div>
            )}
            {/* Năm */}
            {(activeMovie.releaseDate || activeMovie.year) && (
              <span style={{
                fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
                padding: '5px 11px', borderRadius: 99,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}>
                {activeMovie.releaseDate
                  ? new Date(activeMovie.releaseDate).getFullYear()
                  : activeMovie.year}
              </span>
            )}
            {/* Thời lượng — ẩn trên mobile */}
            {activeMovie.duration && !isMobile && (
              <span style={{
                fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
                padding: '5px 11px', borderRadius: 99,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}>
                {Math.floor(activeMovie.duration / 60) > 0
                  ? `${Math.floor(activeMovie.duration / 60)}g ${activeMovie.duration % 60}p`
                  : `${activeMovie.duration} phút`}
              </span>
            )}
            {/* Thể loại — mobile 1, desktop 3 */}
            {activeMovie.genres?.slice(0, isMobile ? 1 : 3).map(g => (
              <span key={g} style={{
                fontSize: isMobile ? 11 : 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                padding: isMobile ? '3px 8px' : '5px 11px', borderRadius: 99,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                maxWidth: isMobile ? 90 : 'none',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {g}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-black mb-3 leading-tight text-white drop-shadow-lg" style={{ fontSize: isMobile ? 'clamp(22px, 6vw, 36px)' : 'clamp(40px, 6vw, 72px)', marginBottom: isMobile ? 8 : 16 }}>
            {activeMovie.title || 'Inception'}
          </h1>

          {/* Description */}
          <p className="text-base text-gray-200 max-w-xl leading-relaxed" style={{ display: 'block', marginBottom: isMobile ? 10 : 32, fontSize: isMobile ? 11 : 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: isMobile ? 2 : 3, WebkitBoxOrient: 'vertical' }}>
            {activeMovie.description || ''}
          </p>

          {/* Buttons */}
          <div className="flex gap-4 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/movie/${activeMovie.id}`)}
              className="bg-white text-black font-bold rounded-lg hover:bg-gray-200 flex items-center gap-2" style={{ padding: isMobile ? '8px 16px' : '12px 32px', fontSize: isMobile ? 13 : 16 }}
            >
              <Play size={20} fill="currentColor" />
              Phát
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/movie/${activeMovie.id}/info`)}
              className="bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 flex items-center gap-2 border border-white/30" style={{ padding: isMobile ? '8px 16px' : '12px 32px', fontSize: isMobile ? 13 : 16 }}
            >
              <Info size={20} />
              Chi tiết
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Dot indicators + prev/next gộp chung ── */}
      {slides.length > 1 && (
        <div className="absolute z-20 flex items-center gap-3" style={{ bottom: isMobile ? 12 : 32, right: isMobile ? 'auto' : 32, left: isMobile ? 16 : 'auto' }}>
          {/* Dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="relative overflow-hidden rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 28 : 8,
                  height: 8,
                  background: i === current ? '#e5181e' : 'rgba(255,255,255,0.3)',
                }}
              >
                {i === current && (
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.4)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: AUTO_PLAY_INTERVAL / 1000, ease: 'linear' }}
                    key={current}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Prev / Next nhỏ gọn */}
          <div className="flex items-center gap-1">
            <button
              onClick={prev}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: '#fff' }}
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <button
              onClick={next}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: '#fff' }}
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroBanner;