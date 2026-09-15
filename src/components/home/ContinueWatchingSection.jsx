// src/components/home/ContinueWatchingSection.jsx
import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Info,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Trash2,
} from "lucide-react";

import { useIsMobile } from "../../hooks/useIsMobile";
import { C, FONT_DISPLAY, FONT_BODY } from "../../context/homeTokens";

// ── Helpers ────────────────────────────────────────────────────────
// Chuẩn URL: /tvshow/:id hoặc /movie/:id (kèm param thời gian & tập nếu có)
const getPlayerRoute = (item) => {
  const resumeSeconds = Math.max(0, Math.round(item?.currentTime ?? 0));
  const params = new URLSearchParams();

  if (item?.isTvShow) {
    if (item?.episodeId) params.set("episodeId", item.episodeId);
    if (item?.season) params.set("season", String(item.season));
    if (item?.episode) params.set("episode", String(item.episode));
    if (resumeSeconds > 0) params.set("t", String(resumeSeconds));
    const query = params.toString();
    return `/tvshow/${item.id}${query ? `?${query}` : ""}`;
  }

  if (resumeSeconds > 0) params.set("t", String(resumeSeconds));
  const query = params.toString();
  return `/movie/${item.id}${query ? `?${query}` : ""}`;
};

const getInfoRoute = (item) =>
  item?.isTvShow ? `/tvshow/${item.id}/info` : `/movie/${item.id}/info`;

// Định dạng thời lượng còn lại
const formatRemainingTime = (item) => {
  if (item?.remainingText) return item.remainingText;

  const remainingMinutes =
    item?.remainingMinutes ??
    (item?.duration && item?.currentTime
      ? Math.max(0, Math.round((item.duration - item.currentTime) / 60))
      : null);

  let timeString = "";
  if (remainingMinutes !== null && remainingMinutes !== undefined) {
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    timeString = hours > 0 ? `${hours}g ${mins}p còn lại` : `${mins} phút còn lại`;
  }

  if (item?.isTvShow) {
    const season = String(item.season || 1).padStart(2, "0");
    const episode = String(item.episode || 1).padStart(2, "0");
    return timeString ? `T${season}:Tập ${episode} • ${timeString}` : `T${season}:Tập ${episode}`;
  }

  return timeString || "Tiếp tục xem";
};

// ── Card Component ─────────────────────────────────────────────────
function ContinueWatchingCard({ item, onRemove }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const progressPercent = useMemo(() => {
    if (typeof item.progress === "number") return Math.min(100, Math.max(0, item.progress));
    if (item.currentTime && item.duration) {
      return Math.min(100, Math.max(0, Math.round((item.currentTime / item.duration) * 100)));
    }
    return 50;
  }, [item]);

  const handleCardClick = () => {
    navigate(getPlayerRoute(item));
  };

  const handleInfoClick = (e) => {
    e.stopPropagation();
    navigate(getInfoRoute(item));
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onRemove?.(item);
  };

  return (
    <motion.div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        flexShrink: 0,
        width: "clamp(260px, 21vw, 320px)",
        cursor: "pointer",
        userSelect: "none",
        position: "relative",
      }}
    >
      {/* 16:9 Backdrop Canvas */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 12,
          overflow: "hidden",
          background: "#121214",
          boxShadow: isHovered
            ? "0 18px 40px -8px rgba(0, 0, 0, 0.9)"
            : "0 6px 18px rgba(0, 0, 0, 0.45)",
          transition: "box-shadow 0.3s ease",
        }}
      >
        <img
          src={item.backdropUrl || item.posterUrl}
          alt={item.title}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: isHovered ? "brightness(1.08)" : "brightness(0.92)",
            transition: "filter 0.3s ease",
            display: "block",
          }}
        />

        {/* Cinematic Vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isHovered
              ? "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.85) 100%)"
              : "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.7) 100%)",
            transition: "background 0.3s ease",
          }}
        />

        {/* Nút Play trung tâm */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <motion.div
            animate={{
              scale: isHovered ? 1.08 : 0.96,
              backgroundColor: isHovered ? C.accent : "rgba(0, 0, 0, 0.6)",
            }}
            transition={{ duration: 0.18 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isHovered ? `0 8px 24px ${C.accent}66` : "none",
            }}
          >
            <Play size={18} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
          </motion.div>
        </div>

        {/* Action Buttons */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
                zIndex: 4,
              }}
            >
              <button
                onClick={handleInfoClick}
                title="Thông tin chi tiết"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  background: "rgba(10, 10, 12, 0.72)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  cursor: "pointer",
                  transition: "transform 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.08)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.background = "rgba(10, 10, 12, 0.72)";
                }}
              >
                <Info size={15} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((prev) => !prev);
                }}
                title="Tùy chọn khác"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  background: "rgba(10, 10, 12, 0.72)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  cursor: "pointer",
                  transition: "transform 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.08)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.background = "rgba(10, 10, 12, 0.72)";
                }}
              >
                <MoreVertical size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: 46,
                right: 10,
                background: "rgba(18, 18, 22, 0.96)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 8,
                padding: "4px",
                zIndex: 10,
                boxShadow: "0 12px 28px rgba(0, 0, 0, 0.75)",
                minWidth: 164,
              }}
            >
              <button
                onClick={handleRemove}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: "transparent",
                  color: "#ff5252",
                  fontFamily: FONT_BODY,
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 82, 82, 0.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Trash2 size={13} />
                <span>Xóa khỏi danh sách</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thanh tiến độ */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3.5,
            background: "rgba(255, 255, 255, 0.22)",
            zIndex: 3,
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${C.accent}, #ff3b30)`,
            }}
          />
        </div>
      </div>

      {/* Tên phim & Thời gian còn lại */}
      <div style={{ paddingTop: 10, paddingLeft: 2 }}>
        <h4
          style={{
            fontFamily: FONT_BODY,
            fontSize: 13.5,
            fontWeight: 700,
            color: C.text,
            margin: "0 0 3px 0",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: 1.3,
          }}
        >
          {item.title}
        </h4>
        <p
          style={{
            fontFamily: FONT_BODY,
            fontSize: 11.5,
            color: "rgba(255, 255, 255, 0.5)",
            margin: 0,
            fontWeight: 500,
          }}
        >
          {formatRemainingTime(item)}
        </p>
      </div>
    </motion.div>
  );
}

// ── Section Container ──────────────────────────────────────────────
export default function ContinueWatchingSection({
  items = [],
  onRemoveItem,
  onSeeAll,
}) {
  const isMobile = useIsMobile();
  const carouselRef = useRef(null);
  const [data, setData] = useState(items);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    setData(items);
  }, [items]);

  const checkScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = carouselRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [data, checkScroll]);

  if (!data || data.length === 0) return null;

  const handleRemove = (item) => {
    setData((prev) => prev.filter((d) => d.id !== item.id));
    onRemoveItem?.(item);
  };

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollOffset = direction === "left" ? -440 : 440;
      carouselRef.current.scrollBy({ left: scrollOffset, behavior: "smooth" });
    }
  };

  return (
    <section
      style={{
        marginBottom: 44,
        position: "relative",
      }}
    >
      {/* ── Section Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        {/* Left: Tiêu đề + Badge Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: isMobile ? 15 : 20,
              fontWeight: 700,
              color: C.text,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              borderLeft: `2.5px solid ${C.accent}`,
              paddingLeft: 11,
              margin: 0,
            }}
          >
            Tiếp Tục Xem
          </h2>

          {!isMobile && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: `${C.accent}18`,
                border: `1px solid ${C.accent}50`,
                borderRadius: 999,
                padding: "3px 10px",
              }}
            >
              <Play size={10} color={C.accent} fill={C.accent} strokeWidth={2.5} />
              <span
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.accent,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Đang xem dở
              </span>
            </div>
          )}
        </div>

        {/* Right: Nút điều hướng (TRÁI) + Xem tất cả (PHẢI) */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: canScrollLeft ? "pointer" : "default",
                  opacity: canScrollLeft ? 1 : 0.25,
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={(e) => {
                  if (canScrollLeft) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
                    e.currentTarget.style.transform = "scale(1.06)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                title="Cuộn sang trái"
              >
                <ChevronLeft size={16} strokeWidth={2.2} />
              </button>

              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: canScrollRight ? "pointer" : "default",
                  opacity: canScrollRight ? 1 : 0.25,
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={(e) => {
                  if (canScrollRight) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
                    e.currentTarget.style.transform = "scale(1.06)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                title="Cuộn sang phải"
              >
                <ChevronRight size={16} strokeWidth={2.2} />
              </button>
            </div>
          )}

          <motion.button
            whileHover={{ gap: 6 }}
            onClick={onSeeAll}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              border: "none",
              background: "transparent",
              fontFamily: FONT_BODY,
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.45)",
              cursor: "pointer",
              transition: "color 0.2s",
              padding: "4px 0",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.45)")}
          >
            <span>Xem tất cả</span>
            <ArrowRight size={13} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>

      {/* ── Carousel Slider ── */}
      <div
        ref={carouselRef}
        style={{
          display: "flex",
          gap: isMobile ? 12 : 16,
          overflowX: "auto",
          paddingBottom: 6,
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          scrollSnapType: isMobile ? "x mandatory" : "none",
        }}
      >
        {data.map((item) => (
          <div
            key={`${item.isTvShow ? "tv" : "mv"}-${item.id}`}
            style={{
              scrollSnapAlign: isMobile ? "start" : "none",
              flexShrink: 0,
            }}
          >
            <ContinueWatchingCard item={item} onRemove={handleRemove} />
          </div>
        ))}
      </div>
    </section>
  );
}