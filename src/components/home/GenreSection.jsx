// src/components/home/GenreSection.jsx
// ─── Genre cards: refined, elegant — không in hoa, tinh tế hơn ───────────────
import React, { useRef, useState, useEffect } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import {
  C,
  FONT_DISPLAY,
  FONT_BODY,
  GENRE_VI,
  GENRE_COLOR,
} from "../../context/homeTokens";

// ── GenreCard ─────────────────────────────────────────────────────────────────
const GenreCard = ({ genre, onClick, index, movies = [], isMobile = false }) => {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  // Tên tiếng Việt — Title Case, không ALL CAPS
  const rawName = GENRE_VI[genre.name] || genre.name;
  // Chuyển "HÀNH ĐỘNG" → "Hành Động" nếu đang là caps
  const viName = rawName
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  const color = GENRE_COLOR[genre.name] || C.accent;

  const bgMovie = movies.find((m) =>
    m.genres?.some((g) => g.toLowerCase() === genre.name.toLowerCase()),
  );
  const bgImg = bgMovie?.backdropUrl || bgMovie?.posterUrl || null;

  const fontSize = 16; // cố định, không phụ thuộc độ dài tên

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.055,
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      onClick={() => {
        onClick?.();
        navigate(
          `/browse?genre=${genre.id}&name=${encodeURIComponent(viName)}`,
        );
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        width: isMobile ? 160 : 260,
        height: isMobile ? 110 : 148,
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        transition:
          "transform 0.32s cubic-bezier(0.25,0.1,0.25,1), box-shadow 0.32s",
        transform: hovered ? "scale(1.03) translateY(-4px)" : "scale(1)",
        boxShadow: hovered
          ? `0 24px 56px rgba(0,0,0,0.75), 0 0 0 1px ${color}30`
          : "0 2px 12px rgba(0,0,0,0.45)",
      }}
    >
      {/* Background image */}
      {bgImg ? (
        <img
          src={bgImg}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: hovered ? "scale(1.08)" : "scale(1.02)",
            transition: "transform 0.7s cubic-bezier(0.25,0.1,0.25,1)",
            // Tối hơn + desaturate nhẹ để chữ nổi hơn mà không chói
            filter: hovered
              ? "brightness(0.75) saturate(1.1)"
              : "brightness(0.6) saturate(1.0)",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${color}28 0%, #0a0a0a 100%)`,
          }}
        />
      )}

      {/* Subtle color wash — chỉ ở góc, không phủ toàn bộ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 0% 100%, ${color}18 0%, transparent 65%)`,
          opacity: hovered ? 1 : 0.5,
          transition: "opacity 0.4s",
        }}
      />

      {/* Vignette gradient — tạo depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      {/* ── Nội dung chính ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 18px 16px",
        }}
      >
        {/* Tên thể loại — title case, elegant */}
        <motion.p
          animate={{
            y: hovered ? -2 : 0,
            opacity: hovered ? 0.92 : 1,
          }}
          transition={{ duration: 0.25 }}
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 16,
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            color: "white",
            marginBottom: 8,
            userSelect: "none",
          }}
        >
          {viName}
        </motion.p>

        {/* Bottom row: số phim + arrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: FONT_BODY,
              fontSize: 11,
              fontWeight: 500,
              color: "rgba(255,255,255,0.38)",
              letterSpacing: "0.02em",
            }}
          >
            {genre.movieCount > 0 ? `${genre.movieCount} phim` : "Khám phá"}
          </span>

          <motion.div
            animate={{ x: hovered ? 0 : 8, opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.22 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontFamily: FONT_BODY,
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.75)",
              letterSpacing: "0.04em",
            }}
          >
            Xem ngay
            <ArrowRight size={12} strokeWidth={2} />
          </motion.div>
        </div>
      </div>

      {/* Accent line — bottom, mỏng hơn và fade in đẹp hơn */}
      <motion.div
        animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 1.5,
          background: `linear-gradient(to right, ${color}, ${color}55)`,
          transformOrigin: "left",
        }}
      />
    </motion.div>
  );
};

// ── MoreCard ──────────────────────────────────────────────────────────────────
const MoreCard = () => {
  const isMobile = useIsMobile();
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate("/browse")}
      style={{
        flexShrink: 0,
        width: 160,
        height: isMobile ? 110 : 148,
        borderRadius: 12,
        cursor: "pointer",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)"}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        transform: hovered ? "scale(1.03) translateY(-4px)" : "scale(1)",
        transition: "all 0.28s ease",
        background: hovered
          ? "rgba(255,255,255,0.04)"
          : "rgba(255,255,255,0.015)",
      }}
    >
      {/* Icon circle */}
      <motion.div
        animate={{ scale: hovered ? 1.08 : 1 }}
        transition={{ duration: 0.25 }}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: `1px solid ${hovered ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: hovered ? "white" : "rgba(255,255,255,0.4)",
          transition: "all 0.25s",
        }}
      >
        <ArrowRight size={15} strokeWidth={1.5} />
      </motion.div>

      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 15,
            fontWeight: 700,
            color: hovered ? "white" : "rgba(255,255,255,0.55)",
            letterSpacing: "-0.01em",
            lineHeight: 1,
            marginBottom: 4,
            transition: "color 0.2s",
          }}
        >
          Tất cả thể loại
        </p>
        <p
          style={{
            fontFamily: FONT_BODY,
            fontSize: 10,
            fontWeight: 500,
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.05em",
          }}
        >
          Xem thêm
        </p>
      </div>
    </motion.div>
  );
};

// ── SectionLabel ──────────────────────────────────────────────────────────────
const SectionLabel = ({ text }) => (
  <div
    style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}
  >
    <h2
      style={{
        fontFamily: FONT_DISPLAY,
        fontSize: 20,
        fontWeight: 700,
        color: C.text,
        letterSpacing: "-0.01em",
        lineHeight: 1,
      }}
    >
      {text}
    </h2>
    <div
      style={{ height: 1, background: "rgba(255,255,255,0.07)", width: 80 }}
    />
  </div>
);

// ── Scroll arrow button ───────────────────────────────────────────────────────
const ArrowBtn = ({ dir, onClick, disabled }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={`absolute z-[70] ${dir === -1 ? "left-10" : "right-10"}
        opacity-0 group-hover/genre:opacity-100
        disabled:opacity-0 disabled:pointer-events-none
        transition-all duration-150`}
      style={{
        top: "50%",
        transform: "translateY(-50%)",
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: hov ? "rgba(20,20,20,0.98)" : "rgba(12,12,12,0.92)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)"}`,
        backdropFilter: "blur(12px)",
        color: hov ? "white" : "rgba(255,255,255,0.6)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s",
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      {dir === -1 ? (
        <ChevronLeft size={16} strokeWidth={2} />
      ) : (
        <ChevronRight size={16} strokeWidth={2} />
      )}
    </button>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
export default function GenreSection({
  genres = [],
  selectedGenre,
  onGenreSelect,
  movies = [],
}) {
  const scrollRef = useRef(null);
  const isMobile = useIsMobile();
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [genres]);

  const scroll = (dir) =>
    scrollRef.current?.scrollBy({
      left: dir * scrollRef.current.clientWidth * 0.7,
      behavior: "smooth",
    });

  if (!genres.length) return null;

  return (
    <section style={{ padding: "44px 0 48px" }} className="group/genre">
      <div style={{ paddingLeft: isMobile ? 16 : 48, paddingRight: isMobile ? 16 : 48 }}>
        <SectionLabel text="Bạn đang quan tâm gì?" />
      </div>

      <div className="relative" style={{ paddingLeft: isMobile ? 16 : 48 }}>
        <ArrowBtn dir={-1}
            onClick={() => scroll(-1)} disabled={!canLeft} />

        <div
          ref={scrollRef}
          style={{
            display: "flex",
            gap: 10,
            paddingRight: isMobile ? 16 : 48,
            paddingTop: 4,
            paddingBottom: 12,
            overflowX: "auto",
            overflowY: "visible",
            scrollbarWidth: "none",
            maskImage: canRight
              ? "linear-gradient(to right, black calc(100% - 80px), transparent 100%)"
              : "none",
            WebkitMaskImage: canRight
              ? "linear-gradient(to right, black calc(100% - 80px), transparent 100%)"
              : "none",
          }}
        >
          {genres.map((genre, i) => (
            <GenreCard
              key={genre.id}
              genre={genre}
              index={i}
              movies={movies}
              isMobile={isMobile}
            onClick={() =>
                onGenreSelect?.(selectedGenre === genre.id ? null : genre.id)
              }
            />
          ))}
          <MoreCard />
        </div>

        <ArrowBtn dir={1}
            onClick={() => scroll(1)} disabled={!canRight} />
      </div>
    </section>
  );
}