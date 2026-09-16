// src/components/home/TrailerShowcaseSection.jsx
import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, Clapperboard } from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY } from "../../context/homeTokens";
import { useIsMobile } from "../../hooks/useIsMobile";

// ── Layout tuning ───────────────────────────────────────────────────────────
const CARD_W_DESKTOP = 560;
const SIDE_SPACING_DESKTOP = 300;
const MAX_VISIBLE_SIDE = 2;
const CUP_LIFT = 46;

function slotStyle(offset, isMobile, cardWidthMobile) {
  const spacing = isMobile ? Math.round(cardWidthMobile * 0.55) : SIDE_SPACING_DESKTOP;
  const abs = Math.abs(offset);

  if (abs > MAX_VISIBLE_SIDE) {
    return {
      transform: `translate3d(${offset * spacing}px, 0, -600px) rotateY(${offset > 0 ? -1 : 1}deg)`,
      opacity: 0,
      pointerEvents: "none",
      zIndex: 0,
    };
  }

  const rotate = offset === 0 ? 0 : offset > 0 ? -28 : 28;
  const translateZ = -abs * (isMobile ? 90 : 140);
  const translateX = offset * spacing;
  const translateY = -abs * (isMobile ? 18 : CUP_LIFT);
  const scale = offset === 0 ? 1 : 1 - abs * 0.12;
  const opacity = offset === 0 ? 1 : 1 - abs * 0.4;

  return {
    transform: `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) rotateY(${rotate}deg) scale(${scale})`,
    opacity,
    zIndex: 10 - abs,
    pointerEvents: "auto",
  };
}

// ── Single trailer card ─────────────────────────────────────────────────────
function TrailerCard({ item, offset, isMobile, isActive, onSelect, onNavigate, cardWidthMobile }) {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const hoverTimer = useRef(null);

  // Desktop: Phát khi hover
  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
    if (item.trailerVideoUrl) {
      hoverTimer.current = setTimeout(() => setIsPlaying(true), 300);
    }
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    clearTimeout(hoverTimer.current);
    setIsHovered(false);
    setIsPlaying(false);
    setVideoReady(false);
  };

  // Mobile: Tự động chạy trailer khi card đang ở vị trí trung tâm (isActive)
  useEffect(() => {
    if (isMobile) {
      if (isActive && item.trailerVideoUrl) {
        const timer = setTimeout(() => {
          setIsPlaying(true);
        }, 400);
        return () => clearTimeout(timer);
      } else {
        setIsPlaying(false);
        setVideoReady(false);
      }
    }
  }, [isMobile, isActive, item.trailerVideoUrl]);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  useEffect(() => {
    if (isPlaying && videoRef.current) {
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isPlaying]);

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted((m) => {
      if (videoRef.current) videoRef.current.muted = !m;
      return !m;
    });
  };

  const togglePlayMobile = (e) => {
    e.stopPropagation();
    setIsPlaying((prev) => !prev);
  };

  const handleClick = () => {
    if (isActive) onNavigate(item);
    else onSelect(offset);
  };

  const width = isMobile ? cardWidthMobile : CARD_W_DESKTOP;

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "absolute",
        left: "50%",
        top: 0,
        width,
        aspectRatio: "16 / 9",
        marginLeft: -width / 2,
        borderRadius: isMobile ? 12 : "14px 14px 50% 50% / 14px 14px 34px 34px",
        overflow: "hidden",
        cursor: "pointer",
        background: C.surfaceCard,
        border: `1px solid ${isActive ? C.borderAccent : C.border}`,
        boxShadow: isActive
          ? "0 24px 48px rgba(0,0,0,0.6)"
          : "0 10px 24px rgba(0,0,0,0.35)",
        transition: "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease, box-shadow 0.35s ease, border-color 0.35s ease",
        transformStyle: "preserve-3d",
        ...slotStyle(offset, isMobile, cardWidthMobile),
      }}
    >
      {/* Ảnh nền */}
      {item.backdropUrl ? (
        <img
          src={item.backdropUrl}
          alt={item.title}
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: isPlaying && videoReady ? 0 : 1,
            transition: "opacity 0.4s ease",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: C.surfaceHigh,
          }}
        >
          <Clapperboard size={28} color={C.textDim} />
        </div>
      )}

      {/* Video Trailer */}
      {isPlaying && item.trailerVideoUrl && (
        <video
          ref={videoRef}
          src={item.trailerVideoUrl}
          muted={isMuted}
          playsInline
          loop
          onCanPlay={() => setVideoReady(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      {/* Lớp phủ Gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.25) 45%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Nút bật / tắt tiếng */}
      {isActive && (isPlaying || isMobile) && (
        <button
          onClick={toggleMute}
          aria-label={isMuted ? "Bật tiếng" : "Tắt tiếng"}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 10,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            cursor: "pointer",
          }}
        >
          {isMuted ? <VolumeX size={14} color="#fff" /> : <Volume2 size={14} color="#fff" />}
        </button>
      )}

      {/* Nút Play/Pause trên mobile */}
      {isMobile && isActive && (
        <button
          onClick={togglePlayMobile}
          aria-label={isPlaying ? "Dừng" : "Phát"}
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 10,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            cursor: "pointer",
          }}
        >
          {isPlaying ? <Pause size={13} color="#fff" fill="#fff" /> : <Play size={13} color="#fff" fill="#fff" />}
        </button>
      )}

      {/* Tiêu đề & Thông tin */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: isActive && !isMobile && isHovered ? 48 : (isMobile ? 8 : 14),
          padding: "0 14px",
          textAlign: "center",
          transition: "bottom 0.3s ease",
          zIndex: 5,
        }}
      >
        <p
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: isActive ? (isMobile ? 15 : 22) : 12,
            fontWeight: 800,
            color: C.text,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.title}
        </p>

        {isActive && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 3,
              gap: 6,
              alignItems: "center",
            }}
          >
            {item.year && (
              <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textSub }}>
                {item.year}
              </span>
            )}
            {item.genres?.[0] && (
              <>
                <span style={{ color: C.textDim, fontSize: 9 }}>•</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textSub }}>
                  {typeof item.genres[0] === "string" ? item.genres[0] : item.genres[0]?.name}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Thanh "Xem Chi Tiết" trên Desktop khi Hover */}
      {!isMobile && isActive && isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(item);
          }}
          aria-label="Xem chi tiết"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "11px 0",
            border: "none",
            background: C.accent,
            cursor: "pointer",
            zIndex: 6,
          }}
        >
          <Play size={13} color="#fff" fill="#fff" />
          <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: "#fff" }}>
            Xem Chi Tiết
          </span>
        </button>
      )}
    </div>
  );
}

// ── Arrow button ─────────────────────────────────────────────────────────────
function ArrowButton({ direction, onClick, isMobile }) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      aria-label={direction === "left" ? "Trailer trước" : "Trailer tiếp theo"}
      style={{
        position: "absolute",
        top: "50%",
        [direction]: isMobile ? 2 : 8,
        transform: "translateY(-50%)",
        width: isMobile ? 32 : 40,
        height: isMobile ? 32 : 40,
        borderRadius: "50%",
        border: `1px solid ${C.borderMid}`,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 25,
      }}
    >
      <Icon size={isMobile ? 16 : 20} color={C.text} />
    </button>
  );
}

// ── Main Section Wrapper ─────────────────────────────────────────────────────
const MAX_TRAILERS = 10;

export default function TrailerShowcaseSection({ items = [] }) {
  const isMobile = useIsMobile();
  const [activeIndex, setActiveIndex] = useState(0);

  // Kích thước card trên di động
  const [mobileCardWidth, setMobileCardWidth] = useState(300);

  useEffect(() => {
    const updateSize = () => {
      if (typeof window !== "undefined") {
        setMobileCardWidth(Math.min(window.innerWidth - 64, 340));
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const recentItems = useMemo(() => {
    return [...items]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, MAX_TRAILERS);
  }, [items]);

  const count = recentItems.length;

  const goTo = useCallback(
    (delta) => {
      if (!count) return;
      setActiveIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  const handleManualGoTo = useCallback((delta) => goTo(delta), [goTo]);
  const handleManualSetIndex = useCallback((i) => setActiveIndex(i), []);

  // Xử lý vuốt màn hình (Swipe) trên Mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      handleManualGoTo(1); // Vuốt sang trái → xem tiếp
    } else if (diff < -45) {
      handleManualGoTo(-1); // Vuốt sang phải → xem trước
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const slots = useMemo(() => {
    if (!count) return [];
    return recentItems.map((item, i) => {
      let offset = i - activeIndex;
      if (offset > count / 2) offset -= count;
      if (offset < -count / 2) offset += count;
      return { item, offset, index: i };
    });
  }, [recentItems, activeIndex, count]);

  if (!count) return null;

  const handleNavigate = (item) => {
    window.location.href = item.isTvShow ? `/tvshow/${item.id}/info` : `/movie/${item.id}/info`;
  };

  const stageHeight = isMobile
    ? (mobileCardWidth * 9) / 16 + 32
    : (CARD_W_DESKTOP * 9) / 16 + 40 + CUP_LIFT * MAX_VISIBLE_SIDE;

  return (
    <div style={{ marginBottom: isMobile ? 36 : 52 }}>
      <div style={{ textAlign: "center", marginBottom: isMobile ? 16 : 24 }}>
        <h2
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: isMobile ? 20 : 30,
            fontWeight: 800,
            color: C.text,
            margin: 0,
          }}
        >
          Trailer Mới Cập Nhật
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: isMobile ? 12 : 13, color: C.textSub, marginTop: 4 }}>
          Xem trước những bộ phim &amp; series vừa lên trailer
        </p>
      </div>

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          height: stageHeight,
          perspective: isMobile ? 700 : 1400,
          touchAction: "pan-y",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
          }}
        >
          {slots.map(({ item, offset }) => (
            <TrailerCard
              key={`${item.isTvShow ? "tv" : "movie"}-${item.id}`}
              item={item}
              offset={offset}
              isMobile={isMobile}
              isActive={offset === 0}
              cardWidthMobile={mobileCardWidth}
              onSelect={(off) => handleManualGoTo(off)}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        {count > 1 && (
          <>
            <ArrowButton direction="left" isMobile={isMobile} onClick={() => handleManualGoTo(-1)} />
            <ArrowButton direction="right" isMobile={isMobile} onClick={() => handleManualGoTo(1)} />
          </>
        )}
      </div>

      {/* Dots điều hướng */}
      {count > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: isMobile ? 12 : 16 }}>
          {recentItems.map((_, i) => (
            <button
              key={i}
              onClick={() => handleManualSetIndex(i)}
              aria-label={`Đi đến trailer ${i + 1}`}
              style={{
                width: i === activeIndex ? 20 : 6,
                height: 6,
                borderRadius: 3,
                border: "none",
                background: i === activeIndex ? C.accent : C.borderMid,
                cursor: "pointer",
                transition: "width 0.3s ease, background 0.3s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}