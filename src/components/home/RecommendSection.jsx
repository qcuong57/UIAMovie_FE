// src/components/home/RecommendSection.jsx
// ─── Hỗ trợ cả Movie lẫn TV Show ─────────────────────────────────────────────
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, TrendingUp, CalendarDays, Star,
  Play, Plus, ChevronDown, Heart, Loader,
  ChevronLeft, ChevronRight, Crown,
} from "lucide-react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { C, FONT_DISPLAY, FONT_BODY } from "../../context/homeTokens";
import movieService from "../../services/movieService";
import MovieCardHorizontal from "../movie/tvshow/MovieCardHorizontal";
import PremiumGateModal from "../movie/ui/PremiumGateModal";

// ── Premium helpers ──────────────────────────────────────────────
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("currentUser") || "null"); }
  catch { return null; }
}
function userHasPremium(user) {
  if (!user) return false;
  return user.isPremium === true || user.plan === "premium" || user.subscription?.active === true;
}

// ── Constants ─────────────────────────────────────────────────────
const AUTO_PLAY_INTERVAL = 5000;
const GAP_DESKTOP = 4;
const GRID_COLS = 3;
const GRID_ROWS = 3;
const GRID_TOTAL = GRID_COLS * GRID_ROWS; // 9

const ACCENT      = C.accent;
const ACCENT_GLOW = C.accentGlow;
const GOLD        = C.gold;
const GREEN       = C.green;

const AI_ACCENT        = "#a78bfa";
const AI_ACCENT_SOFT   = "rgba(167,139,250,0.12)";
const AI_ACCENT_BORDER = "rgba(167,139,250,0.35)";

const T_FAST   = { duration: 0.25, ease: "easeOut" };
const T_NORMAL = { duration: 0.5, ease: [0.4, 0, 0.2, 1] };
const T_SPRING = { type: "spring", stiffness: 280, damping: 26 };

// ── Route helper ──────────────────────────────────────────────────
const getRoute     = (item) => item?.isTvShow ? `/tvshow/${item.id}`      : `/movie/${item.id}`;
const getInfoRoute = (item) => item?.isTvShow ? `/tvshow/${item.id}/info` : `/movie/${item.id}/info`;

// ── Badge ──────────────────────────────────────────────────────────
const getBadgeInfo = (subtitle = "") => {
  const s = subtitle.toLowerCase();
  if (s.includes("lịch sử") || s.includes("history"))
    return { icon: TrendingUp, text: "Dựa trên sở thích" };
  if (s.includes("ai") || s.includes("gợi ý ai"))
    return { icon: Sparkles, text: "AI gợi ý" };
  if (s.includes("mới") || s.includes("release"))
    return { icon: CalendarDays, text: "Mới nhất" };
  return { icon: Star, text: "Đánh giá cao" };
};

// ── Favorite logic ─────────────────────────────────────────────────
function useFavorite(itemId, isFavorited, onFavoriteToggle, itemObj) {
  const [favLoading, setFavLoading] = useState(false);
  const [localFav, setLocalFav] = useState(isFavorited);
  useEffect(() => { setLocalFav(isFavorited); }, [isFavorited]);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (favLoading) return;
    // TV show: chỉ toggle local, chưa có favorite API
    if (itemObj?.isTvShow) {
      setLocalFav(v => !v);
      onFavoriteToggle?.(itemObj, !localFav);
      return;
    }
    setFavLoading(true);
    try {
      if (localFav) {
        await movieService.removeFavorite(itemId);
        setLocalFav(false);
        onFavoriteToggle?.(itemObj, false);
      } else {
        await movieService.addFavorite(itemId);
        setLocalFav(true);
        onFavoriteToggle?.(itemObj, true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFavLoading(false);
    }
  };
  return { localFav, favLoading, handleFavoriteClick };
}

// ── ProgressDot ────────────────────────────────────────────────────
const ProgressDot = ({ isActive, onClick }) => (
  <button
    onClick={onClick}
    style={{
      position: "relative", overflow: "hidden", borderRadius: 999,
      border: "none", padding: 0, cursor: "pointer",
      width: isActive ? 24 : 6, height: 6,
      background: isActive ? AI_ACCENT : C.borderBright,
      transition: "width 0.3s ease, background 0.3s ease",
      flexShrink: 0,
    }}
  >
    {isActive && (
      <motion.div
        key="progress"
        style={{
          position: "absolute", inset: 0, borderRadius: 999,
          background: "rgba(255,255,255,0.4)", originX: 0,
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: AUTO_PLAY_INTERVAL / 1000, ease: "linear" }}
      />
    )}
  </button>
);

// ── FeaturedCard ───────────────────────────────────────────────────
const FeaturedCard = ({ movie: item, isFavorited, onFavoriteToggle, direction }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const { localFav, favLoading, handleFavoriteClick } = useFavorite(
    item?.id, isFavorited, onFavoriteToggle, item,
  );
  if (!item) return null;
  const matchPct = item.rating ? Math.round(item.rating * 10) : null;
  const isPremiumLocked = item.isPremium && !userHasPremium(getCurrentUser());

  const slideVariants = {
    enter:  (dir) => ({ opacity: 0, x: dir > 0 ? 32 : -32, scale: 1.03 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit:   (dir) => ({ opacity: 0, x: dir > 0 ? -32 : 32, scale: 0.98 }),
  };

  return (
    <motion.div
      key={item.id}
      custom={direction}
      variants={slideVariants}
      initial="enter" animate="center" exit="exit"
      transition={T_NORMAL}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        position: "relative", borderRadius: 14, overflow: "hidden",
        cursor: "default", background: C.surfaceMid, width: "100%",
        border: `1px solid ${C.border}`, boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
      }}
    >
      {/* Image */}
      <motion.div animate={{ scale: isHovered ? 1.04 : 1 }} transition={T_NORMAL} style={{ width: "100%", lineHeight: 0 }}>
        <img
          src={item.posterUrl || item.backdropUrl}
          alt={item.title}
          draggable={false} loading="lazy"
          style={{ width: "100%", height: "auto", display: "block", opacity: isHovered ? 0.5 : 0.88, transition: "opacity 0.3s" }}
        />
      </motion.div>

      {/* Rating */}
      {item.rating > 0 && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          display: "flex", alignItems: "center", gap: 3,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          border: `1px solid rgba(245,197,24,0.35)`, borderRadius: 999, padding: "3px 8px",
        }}>
          <Star size={10} fill={GOLD} color={GOLD} />
          <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: GOLD }}>
            {Number(item.rating).toFixed(1)}
          </span>
        </div>
      )}

      {/* TV badge */}
      {item.isTvShow && (
        <div style={{
          position: "absolute", top: 12, left: 12,
          display: "flex", alignItems: "center", gap: 3,
          background: "rgba(99,102,241,0.85)", backdropFilter: "blur(4px)",
          borderRadius: 99, padding: "2px 8px",
        }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 9, fontWeight: 700, color: "white", letterSpacing: "0.04em" }}>
            TV SHOW
          </span>
        </div>
      )}

      {/* Premium badge */}
      {item.isPremium && (
        <div style={{
          position: "absolute", top: item.isTvShow ? 40 : 12, left: 12,
          display: "flex", alignItems: "center", gap: 3,
          background: "linear-gradient(135deg, rgba(250,204,21,0.92), rgba(245,158,11,0.92))",
          backdropFilter: "blur(6px)", borderRadius: 99, padding: "2px 8px",
        }}>
          <Crown size={9} fill="#1c1400" color="#1c1400" />
          <span style={{ fontFamily: FONT_BODY, fontSize: 9, fontWeight: 800, color: "#1c1400", letterSpacing: "0.04em" }}>
            PREMIUM
          </span>
        </div>
      )}

      {/* Bottom overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.08) 65%, transparent 100%)",
        display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "16px 14px",
      }}>
        <h3 style={{
          fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 800, color: C.text,
          margin: "0 0 4px", lineHeight: 1.25, textShadow: "0 2px 10px rgba(0,0,0,0.9)",
        }}>
          {item.title}
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          {item.year && (
            <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textSub }}>
              {item.year}
            </span>
          )}
          {matchPct && (
            <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: GREEN }}>
              {matchPct}% Match
            </span>
          )}
          {(item.genres?.[0] || item.genre) && (
            <span style={{
              fontFamily: FONT_BODY, fontSize: 10, color: C.textSub,
              border: `1px solid ${C.borderMid}`, borderRadius: 4, padding: "1px 6px",
            }}>
              {item.genres?.[0] ?? (Array.isArray(item.genre) ? item.genre[0] : item.genre)}
            </span>
          )}
        </div>

        {/* Hover buttons */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }} transition={T_FAST}
              style={{ display: "flex", alignItems: "center", gap: 7 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isPremiumLocked) { setShowGate(true); return; }
                  navigate(getRoute(item));
                }}
                style={{
                  height: 34, padding: "0 16px", borderRadius: 999, border: "none",
                  background: isPremiumLocked ? "rgba(250,204,21,0.9)" : "#fff",
                  display: "flex", alignItems: "center", gap: 6,
                  cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700,
                  color: isPremiumLocked ? "#1c1400" : "#000",
                }}
              >
                {isPremiumLocked
                  ? <><Crown size={12} fill="#1c1400" color="#1c1400" /> Premium</>
                  : <><Play size={12} fill="#000" color="#000" style={{ marginLeft: 1 }} /> Xem ngay</>
                }
              </button>
              <button
                onClick={handleFavoriteClick} disabled={favLoading}
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: localFav ? ACCENT : "transparent",
                  border: `1.5px solid ${localFav ? ACCENT : "rgba(255,255,255,0.45)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: favLoading ? "not-allowed" : "pointer", flexShrink: 0, opacity: favLoading ? 0.7 : 1,
                }}
              >
                {favLoading
                  ? <Loader size={13} color="white" style={{ animation: "spin 0.7s linear infinite" }} />
                  : localFav
                    ? <Heart size={13} fill="white" color="white" />
                    : <Plus size={14} color="white" strokeWidth={2.5} />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(getInfoRoute(item)); }}
                style={{
                  width: 34, height: 34, borderRadius: "50%", background: "transparent",
                  border: `1.5px solid rgba(255,255,255,0.45)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0, marginLeft: "auto",
                }}
              >
                <ChevronDown size={14} color="white" strokeWidth={2.5} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Premium Gate Modal */}
      <PremiumGateModal
        open={showGate}
        onClose={() => setShowGate(false)}
        movieTitle={item.title}
      />
    </motion.div>
  );
};

// ── SmallCard ──────────────────────────────────────────────────────
const SmallCard = ({ movie: item, onClick, isFavorited, onFavoriteToggle, isActive = false }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const { localFav, favLoading, handleFavoriteClick } = useFavorite(
    item?.id, isFavorited, onFavoriteToggle, item,
  );
  if (!item) return null;

  const matchPct = item.rating ? Math.round(item.rating * 10) : null;
  const showHoverState = isHovered || isActive;
  const isPremiumLocked = item.isPremium && !userHasPremium(getCurrentUser());

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      animate={
        showHoverState
          ? { scale: 1.04, boxShadow: `0 16px 40px -8px rgba(0,0,0,0.9)` }
          : { scale: 1, boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }
      }
      transition={T_SPRING}
      style={{
        position: "relative", borderRadius: 8, overflow: "hidden",
        width: "100%", background: C.surfaceMid, border: `1px solid ${C.border}`,
        cursor: "pointer", zIndex: showHoverState ? 10 : 1,
      }}
    >
      <motion.img
        src={item.backdropUrl || item.posterUrl}
        alt={item.title}
        draggable={false} loading="lazy"
        animate={{ scale: showHoverState ? 1.05 : 1 }}
        transition={T_NORMAL}
        style={{ width: "100%", height: "auto", display: "block", opacity: showHoverState ? 0.5 : 0.85 }}
      />

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)",
        pointerEvents: "none",
      }} />

      {/* TV badge — góc trên trái */}
      {item.isTvShow && !showHoverState && (
        <div style={{
          position: "absolute", top: 6, left: 6,
          background: "rgba(99,102,241,0.85)", borderRadius: 99, padding: "1px 6px",
        }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 8, fontWeight: 700, color: "white" }}>TV</span>
        </div>
      )}

      {/* Rating */}
      <AnimatePresence>
        {!showHoverState && item.rating > 0 && (
          <motion.div
            initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
            style={{
              position: "absolute", top: 8, right: 8,
              display: "flex", alignItems: "center", gap: 3,
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
              border: `1px solid rgba(245,197,24,0.3)`, borderRadius: 999, padding: "2px 7px",
            }}
          >
            <Star size={9} fill={GOLD} color={GOLD} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: GOLD }}>
              {Number(item.rating).toFixed(1)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover overlay */}
      <AnimatePresence>
        {showHoverState && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end",
              background: "linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.78) 30%, rgba(0,0,0,0.18) 60%, transparent 100%)",
            }}
          >
            <div style={{ padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPremiumLocked) { setShowGate(true); return; }
                    navigate(getRoute(item));
                  }}
                  style={{
                    width: 26, height: 26, borderRadius: "50%", border: "none",
                    background: isPremiumLocked ? "rgba(250,204,21,0.9)" : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", flexShrink: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  title={isPremiumLocked ? "Nội dung Premium" : "Phát"}
                >
                  {isPremiumLocked
                    ? <Crown size={10} fill="#1c1400" color="#1c1400" />
                    : <Play size={10} fill="#000" color="#000" style={{ marginLeft: 1 }} />
                  }
                </button>
                <button
                  onClick={handleFavoriteClick} disabled={favLoading}
                  style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: localFav ? ACCENT : "transparent",
                    border: `1.5px solid ${localFav ? ACCENT : "rgba(255,255,255,0.4)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: favLoading ? "not-allowed" : "pointer", flexShrink: 0, opacity: favLoading ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => { if (!favLoading) e.currentTarget.style.transform = "scale(1.12)"; }}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {favLoading
                    ? <Loader size={11} color="white" style={{ animation: "spin 0.7s linear infinite" }} />
                    : localFav ? <Heart size={11} fill="white" color="white" /> : <Plus size={12} color="white" strokeWidth={2.5} />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(getInfoRoute(item)); }}
                  style={{
                    width: 26, height: 26, borderRadius: "50%", background: "transparent",
                    border: `1.5px solid rgba(255,255,255,0.4)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", flexShrink: 0, marginLeft: "auto",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <ChevronDown size={12} color="white" strokeWidth={2.5} />
                </button>
              </div>

              <p style={{
                fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: C.text,
                margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {item.title}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {matchPct && (
                  <span style={{ fontFamily: FONT_BODY, fontSize: 9, fontWeight: 700, color: GREEN }}>
                    {matchPct}% Match
                  </span>
                )}
                {item.year && (
                  <span style={{
                    fontFamily: FONT_BODY, fontSize: 9, color: C.textSub,
                    border: `1px solid ${C.borderMid}`, borderRadius: 3, padding: "1px 4px",
                  }}>
                    {item.year}
                  </span>
                )}
                {item.isTvShow && (
                  <span style={{
                    fontFamily: FONT_BODY, fontSize: 9, color: "#818cf8",
                    border: "1px solid rgba(129,140,248,0.35)", borderRadius: 3, padding: "1px 4px",
                  }}>
                    TV
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Premium Gate Modal */}
      <PremiumGateModal
        open={showGate}
        onClose={() => setShowGate(false)}
        movieTitle={item.title}
      />
    </motion.div>
  );
};

// ── Main ───────────────────────────────────────────────────────────
export default function RecommendSection({
  movies = [],        // backward-compat
  tvShows = [],       // ← prop mới
  items,              // ← mixed array (ưu tiên)
  subtitle = "",
  onFavoriteToggle,
  isFavorited,
  favoritedIds = [],
}) {
  const checkFav = typeof isFavorited === "function"
    ? isFavorited
    : (id) => favoritedIds?.includes(id) ?? false;

  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const badge = getBadgeInfo(subtitle);
  const BadgeIcon = badge.icon;

  // Merge items
  const allItems = items ?? [...movies, ...tvShows];

  const gridItems = useMemo(() => allItems.slice(0, GRID_TOTAL), [allItems]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // Auto-play
  useEffect(() => {
    if (gridItems.length <= 1 || isMobile) return;
    const timer = setInterval(() => {
      setDirection(1);
      setFeaturedIndex((prev) => (prev + 1) % gridItems.length);
    }, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [gridItems.length, isMobile]);

  const goTo = useCallback((idx) => {
    setDirection(idx > featuredIndex ? 1 : -1);
    setFeaturedIndex(idx);
  }, [featuredIndex]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setFeaturedIndex((p) => (p - 1 + gridItems.length) % gridItems.length);
  }, [gridItems.length]);

  const goNext = useCallback(() => {
    setDirection(1);
    setFeaturedIndex((p) => (p + 1) % gridItems.length);
  }, [gridItems.length]);

  const featuredItem = gridItems[featuredIndex] ?? null;

  if (!allItems.length) return null;

  return (
    <section style={{ marginBottom: 44 }}>
      {/* Header */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontSize: isMobile ? 15 : 20, fontWeight: 700, color: C.text,
            letterSpacing: "-0.01em", lineHeight: 1,
            borderLeft: `2.5px solid ${AI_ACCENT}`, paddingLeft: 11, margin: 0,
          }}>
            Dành Cho Bạn
          </h2>
          {!isMobile && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: AI_ACCENT_SOFT, border: `1px solid ${AI_ACCENT_BORDER}`,
              borderRadius: 999, padding: "3px 10px",
            }}>
              <BadgeIcon size={10} color={AI_ACCENT} strokeWidth={2.5} />
              <span style={{
                fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700,
                color: AI_ACCENT, letterSpacing: "0.06em", textTransform: "uppercase",
              }}>
                {badge.text}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Desktop */}
      {!isMobile ? (
        <div style={{ display: "flex", gap: GAP_DESKTOP, alignItems: "flex-start" }}>
          {/* Left: Featured ~28% */}
          <div style={{ flex: "0 0 calc(28% - 2px)" }}>
            <AnimatePresence mode="wait" custom={direction}>
              {featuredItem && (
                <FeaturedCard
                  key={featuredItem.id}
                  movie={featuredItem}
                  direction={direction}
                  isFavorited={checkFav(featuredItem.id)}
                  onFavoriteToggle={onFavoriteToggle}
                />
              )}
            </AnimatePresence>

            {gridItems.length > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {gridItems.map((_, i) => (
                    <ProgressDot key={i} isActive={i === featuredIndex} onClick={() => goTo(i)} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[{ fn: goPrev, Icon: ChevronLeft }, { fn: goNext, Icon: ChevronRight }].map(({ fn, Icon }, i) => (
                    <button
                      key={i} onClick={fn}
                      style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: "rgba(0,0,0,0.6)", border: `1px solid ${C.borderMid}`,
                        backdropFilter: "blur(6px)", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "transform 0.15s, background 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.12)"; e.currentTarget.style.background = `rgba(167,139,250,0.3)`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "rgba(0,0,0,0.6)"; }}
                    >
                      <Icon size={13} strokeWidth={2.5} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: 3×3 grid ~72% */}
          <div style={{
            flex: "1 1 0", display: "grid",
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gridTemplateRows: "auto", gap: GAP_DESKTOP, alignContent: "start",
          }}>
            {gridItems.map((item, idx) => (
              <SmallCard
                key={item ? `${item.isTvShow ? "tv" : "mv"}-${item.id}-${idx}` : `empty-${idx}`}
                movie={item}
                onClick={() => item && goTo(idx)}
                isActive={idx === featuredIndex}
                isFavorited={item ? checkFav(item.id) : false}
                onFavoriteToggle={onFavoriteToggle}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Mobile — danh sách dọc */
        <div style={{ display: "flex", flexDirection: "column" }}>
          {allItems.slice(0, 10).map((item) => (
            <MovieCardHorizontal
              key={`${item.isTvShow ? "tv" : "mv"}-${item.id}`}
              movie={item}
              isFavorited={checkFav(item.id)}
              onFavoriteToggle={onFavoriteToggle}
            />
          ))}
        </div>
      )}
    </section>
  );
}