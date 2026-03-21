// src/components/movie/MovieCard.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, ThumbsUp, ChevronDown, Heart, Star, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import movieService from '../../services/movieService';

const MovieCard = ({ movie, isFavorited, onFavoriteToggle, onPlay, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [localFav, setLocalFav] = useState(isFavorited);
  const navigate = useNavigate();

  // Sync khi parent cập nhật lại isFavorited
  useEffect(() => {
    setLocalFav(isFavorited);
  }, [isFavorited]);

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

  if (!movie) return null;

  const matchPct = movie.rating ? Math.round(movie.rating * 10) : null;

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer"
      style={{ width: 'clamp(160px, 14vw, 220px)', height: 'clamp(240px, 21vw, 330px)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="absolute inset-0 rounded-[10px] overflow-hidden"
        style={{ zIndex: isHovered ? 50 : 1 }}
        animate={
          isHovered
            ? { scale: 1.06, y: -8, boxShadow: '0 20px 48px -8px rgba(0,0,0,0.9), 0 8px 20px -6px rgba(0,0,0,0.6)' }
            : { scale: 1,    y: 0,  boxShadow: '0 4px 16px rgba(0,0,0,0.45)' }
        }
        transition={{ type: 'spring', stiffness: 270, damping: 25 }}
        onClick={() => navigate(`/movie/${movie.id}/info`)}
      >
        {/* ── Poster image ── */}
        {movie.posterUrl && !imgError ? (
          <motion.img
            src={movie.posterUrl}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover block"
            animate={{ scale: isHovered ? 1.06 : 1 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-5xl"
            style={{ background: 'linear-gradient(135deg,#1c1f26,#0f1117)' }}
          >
            🎬
          </div>
        )}

        {/* ── Rating badge top-left ── */}
        {movie.rating && (
          <div
            className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          >
            <Star size={11} className="fill-yellow-400 text-yellow-400" />
            <span className="text-yellow-400 font-bold text-[11px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {movie.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Persistent bottom vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)' }}
        />

        {/* ── Hover overlay: deep gradient + info panel at bottom ── */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 flex flex-col justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.82) 30%, rgba(0,0,0,0.3) 55%, transparent 100%)',
              }}
            >
              <div className="px-4 pb-4 pt-3 flex flex-col gap-2.5">
                {/* Buttons */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {/* Play */}
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/movie/${movie.id}`); }}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform flex-shrink-0"
                    style={{ background: '#fff' }}
                  >
                    <Play size={15} fill="#000" color="#000" className="ml-0.5" />
                  </button>

                  {/* Add / Favourite */}
                  <button
                    onClick={handleFavoriteClick}
                    disabled={favLoading}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform flex-shrink-0"
                    style={{
                      background: localFav ? '#e5181e' : 'transparent',
                      border: `1.5px solid ${localFav ? '#e5181e' : 'rgba(255,255,255,0.4)'}`,
                      opacity: favLoading ? 0.7 : 1,
                      cursor: favLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {favLoading
                      ? <Loader size={14} color="white" className="animate-spin" />
                      : localFav
                        ? <Heart size={14} fill="white" color="white" />
                        : <Plus size={15} color="white" strokeWidth={2.5} />
                    }
                  </button>

                  {/* Thumbs up */}
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform flex-shrink-0"
                    style={{ border: '1.5px solid rgba(255,255,255,0.4)' }}
                  >
                    <ThumbsUp size={13} color="white" strokeWidth={2.5} />
                  </button>

                  {/* More info */}
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/movie/${movie.id}/info`); }}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform flex-shrink-0 ml-auto"
                    style={{ border: '1.5px solid rgba(255,255,255,0.4)' }}
                  >
                    <ChevronDown size={15} color="white" strokeWidth={2.5} />
                  </button>
                </div>

                {/* Title */}
                <p
                  className="text-white font-bold text-[13px] leading-snug line-clamp-1"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {movie.title}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-2 flex-wrap">
                  {matchPct && (
                    <span className="text-[11px] font-bold" style={{ color: '#46d369' }}>
                      {matchPct}% Match
                    </span>
                  )}
                  {movie.year && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-sm"
                      style={{ color: '#999', border: '1px solid rgba(255,255,255,0.2)', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {movie.year}
                    </span>
                  )}
                  {movie.genres?.[0] && (
                    <span className="text-[10px] truncate" style={{ color: '#666', fontFamily: "'DM Sans', sans-serif" }}>
                      {movie.genres[0]}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default MovieCard;