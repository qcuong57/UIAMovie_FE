// src/components/HeroBanner.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as variants from '../../motion-configs/variants';
import * as transitions from '../../motion-configs/transitions';

const AUTO_PLAY_INTERVAL = 6000; // 6 giây mỗi slide

const HeroBanner = ({ movie, movies }) => {
  const navigate = useNavigate();
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
    <div className="relative h-screen bg-cover bg-center flex items-end overflow-hidden">

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
          className="relative z-10 px-4 md:px-8 pb-24 md:pb-28 max-w-3xl"
        >
          {/* Rating + Year */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-1 bg-yellow-500/30 px-3 py-1 rounded-full">
              <Star size={16} className="fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-yellow-400 text-base">{activeMovie.rating || 8.8}</span>
            </div>
            <span className="text-gray-400 text-sm">
              {activeMovie.releaseDate
                ? new Date(activeMovie.releaseDate).getFullYear()
                : activeMovie.year || ''}
            </span>
            {activeMovie.genres?.[0] && (
              <span className="text-gray-400 text-sm">{activeMovie.genres[0]}</span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight text-white drop-shadow-lg">
            {activeMovie.title || 'Inception'}
          </h1>

          {/* Description */}
          <p className="text-base text-gray-200 mb-8 max-w-xl leading-relaxed line-clamp-3">
            {activeMovie.description || ''}
          </p>

          {/* Buttons */}
          <div className="flex gap-4 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/movie/${activeMovie.id}`)}
              className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 flex items-center gap-2 text-base"
            >
              <Play size={20} fill="currentColor" />
              Phát
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/movie/${activeMovie.id}/info`)}
              className="px-8 py-3 bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 flex items-center gap-2 border border-white/30 text-base"
            >
              <Info size={20} />
              Chi tiết
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Dot indicators + prev/next gộp chung ── */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 right-8 z-20 flex items-center gap-3">
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