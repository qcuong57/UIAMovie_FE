// src/components/movie/MovieCard.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useIsMobile } from '../../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, ThumbsUp, ChevronDown, Heart, Star, Loader, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import movieService  from '../../services/movieService';
import tvShowService from '../../services/tvShowService';
import PremiumGateModal from './ui/PremiumGateModal';
import { useToast } from '../common/Toast';

// ── Route helpers ────────────────────────────────────────────────
const infoPath   = (item) => item.isTvShow ? `/tvshow/${item.id}/info` : `/movie/${item.id}/info`;
const playerPath = (item) => item.isTvShow ? `/tvshow/${item.id}`      : `/movie/${item.id}`;

// ── Premium helpers ──────────────────────────────────────────────
function getCurrentUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function userHasPremium(user) {
  if (!user) return false;
  return (
    user.isPremium === true ||
    user.plan === 'premium' ||
    user.subscription?.active === true
  );
}

// ── Portal wrapper — render modal ra ngoài stacking context của card ──
// Đây là fix chính: motion.div của card tạo ra một stacking context mới
// (vì có transform + zIndex), khiến modal bị kẹp bên trong dù zIndex=9999.
// Dùng Portal để mount modal thẳng vào document.body.
function ModalPortal({ children }) {
  return createPortal(children, document.body);
}

// ── MobileCard ───────────────────────────────────────────────────
const MobileCard = ({ movie, isFavorited, onFavoriteToggle, cardWidth = 'calc(50vw - 20px)', variant = 'movie', accentColor = '#f5c518', releaseLabel }) => {
  const [imgError, setImgError] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [localFav, setLocalFav] = useState(isFavorited);
  const [showGate, setShowGate] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const isComingSoon = variant === 'comingSoon';

  useEffect(() => { setLocalFav(isFavorited); }, [isFavorited]);

  const handleFav = async (e) => {
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    const svc = movie.isTvShow ? tvShowService : movieService;
    try {
      if (localFav) {
        await svc.removeFavorite(movie.id);
        setLocalFav(false);
        onFavoriteToggle?.(movie, false);
        toast.info(`"${movie.title}" đã được bỏ khỏi Yêu thích`);
      } else {
        await svc.addFavorite(movie.id);
        setLocalFav(true);
        onFavoriteToggle?.(movie, true);
        toast.success(`Đã thêm "${movie.title}" vào Yêu thích`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật Yêu thích, vui lòng thử lại');
    } finally {
      setFavLoading(false);
    }
  };

  const handleCardClick = () => {
    if (movie.isPremium && !userHasPremium(getCurrentUser())) {
      setShowGate(true);
      return;
    }
    navigate(infoPath(movie));
  };

  return (
    <div style={{ width: cardWidth }}>
      {/* Poster */}
      <div
        onClick={handleCardClick}
        style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '2/3', background: '#181818', cursor: 'pointer' }}
      >
        {movie.posterUrl && !imgError
          ? <img src={movie.posterUrl} alt={movie.title} onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎬</div>
        }
        {/* Rating badge / Coming Soon badge */}
        {isComingSoon ? (
          <div style={{
            position: 'absolute', top: 6, left: 6,
            padding: '4px 10px 0px 10px', borderRadius: 99,
            fontFamily: "'Nunito',sans-serif", fontSize: 9, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            background: `${accentColor}2e`, border: `1px solid ${accentColor}66`,
            color: accentColor, backdropFilter: 'blur(4px)',
          }}>
            Sắp Chiếu
          </div>
        ) : (
          movie.rating > 0 && (
            <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 99, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}>
              <Star size={10} fill="#f5c518" color="#f5c518" />
              <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: 11, fontWeight: 700, color: '#f5c518' }}>{movie.rating.toFixed(1)}</span>
            </div>
          )
        )}
        {/* Premium badge */}
        {!isComingSoon && movie.isPremium && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            display: 'flex', alignItems: 'center', gap: 3,
            padding: '2px 6px', borderRadius: 99,
            background: 'linear-gradient(135deg, rgba(250,204,21,0.92), rgba(245,158,11,0.92))',
            backdropFilter: 'blur(6px)',
          }}>
            <Crown size={9} fill="#1c1400" color="#1c1400" />
            <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: 9, fontWeight: 800, color: '#1c1400', letterSpacing: '0.04em' }}>PREMIUM</span>
          </div>
        )}
        {/* Fav button — ẩn khi phim chưa chiếu */}
        {!isComingSoon && (
          <button
            onClick={handleFav}
            disabled={favLoading}
            style={{
              position: 'absolute', bottom: 6, right: 6,
              width: 30, height: 30, borderRadius: '50%',
              background: localFav ? '#e5181e' : 'rgba(0,0,0,0.6)',
              border: `1.5px solid ${localFav ? '#e5181e' : 'rgba(255,255,255,0.3)'}`,
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: favLoading ? 'not-allowed' : 'pointer',
              opacity: favLoading ? 0.7 : 1,
            }}
          >
            {favLoading
              ? <Loader size={12} color="white" style={{ animation: 'spin 0.7s linear infinite' }} />
              : <Heart size={14} fill={localFav ? 'white' : 'none'} color="white" strokeWidth={2} />
            }
          </button>
        )}
      </div>

      {/* Title + year/release date */}
      <div style={{ paddingTop: 6 }} onClick={handleCardClick}>
        <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 12, fontWeight: 700, color: '#f0f2f8', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 1, cursor: 'pointer' }}>{movie.title}</p>
        {isComingSoon
          ? (releaseLabel && <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10, color: accentColor, fontWeight: 600 }}>{releaseLabel}</p>)
          : (movie.year && <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10, color: '#525868' }}>{movie.year}</p>)
        }
      </div>

      {/* FIX: Portal để modal không bị stacking context của card kẹp */}
      <ModalPortal>
        <PremiumGateModal
          open={showGate}
          onClose={() => setShowGate(false)}
          movieTitle={movie.title}
        />
      </ModalPortal>
    </div>
  );
};

// ── Desktop MovieCard ─────────────────────────────────────────────
const MovieCard = ({ movie, isFavorited, onFavoriteToggle, onPlay, onClick, cardWidth, variant = 'movie', accentColor = '#f5c518', releaseLabel }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [localFav, setLocalFav] = useState(isFavorited);
  const [showGate, setShowGate] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const toast = useToast();
  const isComingSoon = variant === 'comingSoon';

  useEffect(() => {
    setLocalFav(isFavorited);
  }, [isFavorited]);

  // ── Premium guard ────────────────────────────────────────────────
  const isPremiumLocked = movie?.isPremium && !userHasPremium(getCurrentUser());

  const handleNavigateInfo = () => {
    navigate(infoPath(movie));
  };

  const handlePlay = (e) => {
    e.stopPropagation();
    if (isPremiumLocked) {
      setShowGate(true);
      return;
    }
    navigate(playerPath(movie));
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    const svc = movie.isTvShow ? tvShowService : movieService;
    try {
      if (localFav) {
        await svc.removeFavorite(movie.id);
        setLocalFav(false);
        onFavoriteToggle?.(movie, false);
        toast.info(`"${movie.title}" đã được bỏ khỏi Yêu thích`);
      } else {
        await svc.addFavorite(movie.id);
        setLocalFav(true);
        onFavoriteToggle?.(movie, true);
        toast.success(`Đã thêm "${movie.title}" vào Yêu thích`);
      }
    } catch (err) {
      console.error('Favorite toggle error:', err);
      toast.error('Không thể cập nhật Yêu thích, vui lòng thử lại');
    } finally {
      setFavLoading(false);
    }
  };

  if (!movie) return null;

  // Mobile: dùng card đơn giản
  if (isMobile) {
    return (
      <MobileCard
        movie={movie}
        isFavorited={localFav}
        onFavoriteToggle={onFavoriteToggle}
        cardWidth={cardWidth || 'calc(50vw - 20px)'}
        variant={variant}
        accentColor={accentColor}
        releaseLabel={releaseLabel}
      />
    );
  }

  const matchPct = movie.rating ? Math.round(movie.rating * 10) : null;

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer"
      style={{ width: cardWidth ? cardWidth : 'clamp(160px, 14vw, 220px)', height: 'clamp(240px, 21vw, 330px)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="absolute inset-0 rounded-[10px] overflow-hidden"
        style={{ zIndex: isHovered ? 50 : 1 }}
        animate={isMobile ? {} :
          isHovered
            ? { scale: 1.06, y: -8, boxShadow: '0 20px 48px -8px rgba(0,0,0,0.9), 0 8px 20px -6px rgba(0,0,0,0.6)' }
            : { scale: 1,    y: 0,  boxShadow: '0 4px 16px rgba(0,0,0,0.45)' }
        }
        transition={{ type: 'spring', stiffness: 270, damping: 25 }}
        onClick={handleNavigateInfo}
      >
        {/* ── Poster image ── */}
        {movie.posterUrl && !imgError ? (
          <motion.img
            src={movie.posterUrl}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover block"
            animate={isMobile ? {} :{ scale: isHovered ? 1.06 : 1 }}
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

        {/* ── Rating badge top-left / Coming Soon badge ── */}
        {isComingSoon ? (
          <div
            className="absolute top-2 left-2 z-10"
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 10px 0px 10px', borderRadius: 99,
              fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              background: `${accentColor}2e`, border: `1px solid ${accentColor}66`,
              color: accentColor, backdropFilter: 'blur(4px)',
            }}
          >
            Sắp Chiếu
          </div>
        ) : (
          movie.rating && (
            <div
              className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
            >
              <Star size={11} className="fill-yellow-400 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-[11px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {movie.rating.toFixed(1)}
              </span>
            </div>
          )
        )}

        {/* ── Premium badge top-right ── */}
        {!isComingSoon && movie.isPremium && (
          <div
            className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(250,204,21,0.92), rgba(245,158,11,0.92))',
              backdropFilter: 'blur(6px)',
            }}
          >
            <Crown size={9} fill="#1c1400" color="#1c1400" />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 800, color: '#1c1400', letterSpacing: '0.04em' }}>
              PREMIUM
            </span>
          </div>
        )}

        {/* Persistent bottom vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)' }}
        />

        {/* ── Hover overlay ── */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 flex flex-col justify-end"
              initial={{ opacity: 0 }}
              animate={isMobile ? {} :{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.82) 30%, rgba(0,0,0,0.3) 55%, transparent 100%)',
              }}
            >
              <div className="px-4 pb-4 pt-3 flex flex-col gap-2.5">
                {/* Buttons */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {isComingSoon ? (
                    <>
                      {movie.trailerVideoUrl && (
                        <div className="flex items-center gap-1 text-[10px]" style={{ color: '#ccc', fontFamily: "'DM Sans', sans-serif" }}>
                          <Play size={11} color="#ccc" /> Có trailer
                        </div>
                      )}
                      {/* More info */}
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(infoPath(movie)); }}
                        className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform flex-shrink-0 ml-auto"
                        style={{ border: '1.5px solid rgba(255,255,255,0.4)' }}
                      >
                        <ChevronDown size={15} color="white" strokeWidth={2.5} />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Play */}
                      <button
                        onClick={handlePlay}
                        className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform flex-shrink-0"
                        style={{ background: isPremiumLocked ? 'rgba(250,204,21,0.9)' : '#fff' }}
                        title={isPremiumLocked ? 'Nội dung Premium' : 'Phát'}
                      >
                        {isPremiumLocked
                          ? <Crown size={14} fill="#1c1400" color="#1c1400" />
                          : <Play size={15} fill="#000" color="#000" className="ml-0.5" />
                        }
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
                        onClick={(e) => { e.stopPropagation(); navigate(infoPath(movie)); }}
                        className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform flex-shrink-0 ml-auto"
                        style={{ border: '1.5px solid rgba(255,255,255,0.4)' }}
                      >
                        <ChevronDown size={15} color="white" strokeWidth={2.5} />
                      </button>
                    </>
                  )}
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
                  {isComingSoon ? (
                    releaseLabel && (
                      <span className="text-[11px] font-bold" style={{ color: accentColor, fontFamily: "'DM Sans', sans-serif" }}>
                        {releaseLabel}
                      </span>
                    )
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/*
        FIX: Dùng Portal để render modal ra ngoài DOM tree của card.
        Nguyên nhân bug: motion.div bên trên có `transform` + `zIndex` → tạo
        stacking context mới → modal bị kẹp bên trong, không thoát ra được
        dù zIndex=9999. Portal mount thẳng vào document.body nên thoát hoàn toàn.
      */}
      <ModalPortal>
        <PremiumGateModal
          open={showGate}
          onClose={() => setShowGate(false)}
          movieTitle={movie.title}
        />
      </ModalPortal>
    </div>
  );
};

export default MovieCard;