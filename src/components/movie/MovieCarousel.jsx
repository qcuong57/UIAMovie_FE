// src/components/movie/MovieCarousel.jsx
import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import MovieCard from "./MovieCard";

const MovieCarousel = ({
  title,
  emoji,
  movies = [],
  onFavoriteToggle,
  onPlay,
  onClick,
  isFavorited,
}) => {
  const scrollRef = useRef(null);
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
  }, [movies]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "left" ? -el.clientWidth * 0.7 : el.clientWidth * 0.7,
      behavior: "smooth",
    });
  };

  return (
    <section className="mb-16 group/row">
      {/* ── Section header ── */}
      <div className="flex items-center justify-between px-6 md:px-16 mb-5">
        <div className="flex items-center gap-3">
          {/* Red left-bar accent */}
          <div
            className="w-[3px] h-5 rounded-full"
            style={{ background: "#e5181e" }}
          />
          <h2
            className="text-[15px] md:text-[17px] font-bold tracking-wide uppercase"
            style={{
              color: "#e8eaf0",
              fontFamily: "'Barlow', sans-serif",
              letterSpacing: "0.06em",
            }}
          >
            {emoji && <span className="mr-2 text-base">{emoji}</span>}
            {title}
          </h2>
        </div>

        {/* "See all" link */}
        <button
          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest opacity-0 group-hover/row:opacity-100 transition-all duration-200 hover:gap-2.5"
          style={{ color: "#e5181e", fontFamily: "'DM Sans', sans-serif" }}
        >
          See all <ArrowRight size={12} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Scroll area — outer clips X, inner allows Y for hover scale ── */}
      <div className="relative" style={{ overflowX: 'clip' }}>
        {/* Left fade */}
        <div
          className="absolute left-0 top-0 bottom-0 w-16 md:w-20 z-[60] pointer-events-none transition-opacity duration-200"
          style={{
            background: "linear-gradient(to right, #000000 0%, transparent 100%)",
            opacity: canLeft ? 1 : 0,
            visibility: canLeft ? 'visible' : 'hidden',
          }}
        />

        {/* Left nav */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-[70]
            w-10 h-10 rounded-full flex items-center justify-center
            border transition-all duration-150 hover:scale-110 active:scale-95
            group-hover/row:opacity-100 opacity-0
            disabled:opacity-0 disabled:pointer-events-none"
          disabled={!canLeft}
          style={{
            background: "rgba(10,10,12,0.88)",
            borderColor: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
            color: "#e8eaf0",
            pointerEvents: canLeft ? "auto" : "none",
          }}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>

        {/* Cards scroll row */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: '24px',
            paddingLeft: '64px',
            paddingRight: '64px',
            paddingTop: '52px',
            paddingBottom: '52px',
            marginTop: '-52px',
            marginBottom: '-52px',
            overflowX: 'auto',
            overflowY: 'visible',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollSnapType: 'x mandatory',
          }}
        >
          <style>{`div::-webkit-scrollbar{display:none}`}</style>
          {movies.filter(Boolean).map((movie) => (
            <div key={movie.id} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
              <MovieCard
                movie={movie}
                isFavorited={isFavorited?.(movie.id)}
                onFavoriteToggle={onFavoriteToggle}
                onPlay={onPlay}
                onClick={onClick}
              />
            </div>
          ))}
        </div>

        {/* Right fade */}
        <div
          className="absolute right-0 top-0 bottom-0 w-16 md:w-20 z-[60] pointer-events-none transition-opacity duration-200"
          style={{
            background: "linear-gradient(to left, #000000 0%, transparent 100%)",
            opacity: canRight ? 1 : 0,
            visibility: canRight ? 'visible' : 'hidden',
          }}
        />

        {/* Right nav */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-[70]
            w-10 h-10 rounded-full flex items-center justify-center
            border transition-all duration-150 hover:scale-110 active:scale-95
            group-hover/row:opacity-100 opacity-0
            disabled:opacity-0 disabled:pointer-events-none"
          disabled={!canRight}
          style={{
            background: "rgba(10,10,12,0.88)",
            borderColor: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
            color: "#e8eaf0",
            pointerEvents: canRight ? "auto" : "none",
          }}
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </section>
  );
};

export default MovieCarousel;