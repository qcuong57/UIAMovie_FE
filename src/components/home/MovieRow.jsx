// src/components/home/MovieRow.jsx
// ─── Hỗ trợ cả Movie lẫn TV Show ─────────────────────────────────────────────
import React, { useRef, useState, useEffect } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MovieCard from "../movie/MovieCard";
import { C, FONT_DISPLAY, FONT_BODY } from "../../context/homeTokens";

export default function MovieRow({
  title,
  subtitle,
  movies = [],       // backward-compat: chỉ movie
  tvShows = [],      // ← prop mới: chỉ tvShow
  items,             // ← prop mới: mixed array (ưu tiên hơn movies/tvShows nếu truyền)
  onFavoriteToggle,
  isFavorited,
  accentColor,
  seeAllSort,
  seeAllGenreId,
  seeAllGenreName,
  badge, // { icon: LucideIcon, text: string }
  seeAllPath,        // ← override path tuỳ ý (vd: "/browse/tvshows")
}) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // Merge: items > movies+tvShows
  const allItems = items ?? [...movies, ...tvShows];

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
  }, [allItems]);

  const scroll = (dir) =>
    scrollRef.current?.scrollBy({
      left: dir * scrollRef.current.clientWidth * 0.72,
      behavior: "smooth",
    });

  const handleSeeAll = () => {
    if (seeAllPath) { navigate(seeAllPath); return; }
    const p = new URLSearchParams();
    if (seeAllGenreId) p.set("genre", seeAllGenreId);
    if (seeAllGenreName) p.set("name", seeAllGenreName);
    if (seeAllSort) p.set("sort", seeAllSort);
    navigate(`/browse${p.toString() ? `?${p}` : ""}`);
  };

  if (!allItems.length) return null;

  return (
    <section style={{ marginBottom: 44 }} className="group/row">
      {/* ── Header ── */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: title + badge + subtitle */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: isMobile ? 15 : 20,
              fontWeight: 700,
              color: C.text,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              borderLeft: `2.5px solid ${accentColor || C.accent}`,
              paddingLeft: 11,
              margin: 0,
            }}
          >
            {title}
          </h2>

          {/* Badge pill — chỉ desktop, chỉ khi có badge prop */}
          {badge && !isMobile && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: `${accentColor || C.accent}18`,
                border: `1px solid ${accentColor || C.accent}50`,
                borderRadius: 999,
                padding: "3px 10px",
              }}
            >
              <badge.icon
                size={10}
                color={accentColor || C.accent}
                strokeWidth={2.5}
              />
              <span
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 10,
                  fontWeight: 700,
                  color: accentColor || C.accent,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {badge.text}
              </span>
            </div>
          )}

          {subtitle && !isMobile && (
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 12,
                color: "rgba(255,255,255,0.28)",
                letterSpacing: "0.02em",
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* ── Scroll area ── */}
      <div
        className="relative"
        style={{ overflow: isMobile ? "hidden" : "clip" }}
      >
        {/* Nút trái — chỉ desktop */}
        {!isMobile && canLeft && (
          <button
            onClick={() => scroll(-1)}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-[70]
            w-10 h-10 rounded-full flex items-center justify-center
            transition-all duration-150 hover:scale-110 active:scale-95
            opacity-0 group-hover/row:opacity-100"
            style={{
              background: "rgba(0,0,0,0.9)",
              border: "1px solid rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              color: C.text,
            }}
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
        )}

        <div
          ref={scrollRef}
          style={{
            display: "flex",
            gap: isMobile ? 56 : 8,
            paddingTop: isMobile ? 4 : 52,
            paddingBottom: isMobile ? 4 : 52,
            marginTop: isMobile ? 0 : -52,
            marginBottom: isMobile ? 0 : -52,
            overflowX: "auto",
            overflowY: isMobile ? "hidden" : "visible",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            maskImage: !isMobile
              ? `linear-gradient(to right, ${canLeft ? "transparent" : "black"} 0%, black 6%, black 94%, ${canRight ? "transparent" : "black"} 100%)`
              : undefined,
            WebkitMaskImage: !isMobile
              ? `linear-gradient(to right, ${canLeft ? "transparent" : "black"} 0%, black 6%, black 94%, ${canRight ? "transparent" : "black"} 100%)`
              : undefined,
          }}
        >
          {allItems.filter(Boolean).map((item) => (
            <div
              key={`${item.isTvShow ? "tv" : "mv"}-${item.id}`}
              style={{ flexShrink: 0, width: isMobile ? 110 : undefined }}
            >
              <MovieCard
                movie={item}
                isFavorited={isFavorited?.(item.id)}
                onFavoriteToggle={onFavoriteToggle}
                cardWidth={isMobile ? 160 : undefined}
              />
            </div>
          ))}
        </div>

        {/* Nút phải — chỉ desktop */}
        {!isMobile && canRight && (
          <button
            onClick={() => scroll(1)}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-[70]
            w-10 h-10 rounded-full flex items-center justify-center
            transition-all duration-150 hover:scale-110 active:scale-95
            opacity-0 group-hover/row:opacity-100"
            style={{
              background: "rgba(0,0,0,0.9)",
              border: "1px solid rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              color: C.text,
            }}
          >
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        )}
      </div>
    </section>
  );
}