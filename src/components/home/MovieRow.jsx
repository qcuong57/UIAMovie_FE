// src/components/home/MovieRow.jsx
import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MovieCard from '../movie/MovieCard';
import { C, FONT_DISPLAY, FONT_BODY } from '../../context/homeTokens';

/**
 * @prop {string}   title
 * @prop {string}   subtitle        — dòng phụ nhỏ (optional)
 * @prop {Array}    movies
 * @prop {function} onFavoriteToggle
 * @prop {function} isFavorited
 * @prop {string}   accentColor     — màu thanh dọc trái (optional)
 * @prop {string}   seeAllSort      — sort param cho /browse: 'rating' | 'releaseDate' (optional)
 * @prop {string}   seeAllGenreId   — genre filter cho /browse (optional)
 * @prop {string}   seeAllGenreName — tên genre cho URL (optional)
 */
export default function MovieRow({
  title, subtitle, movies = [],
  onFavoriteToggle, isFavorited, accentColor,
  seeAllSort, seeAllGenreId, seeAllGenreName,
}) {
  const navigate   = useNavigate();
  const scrollRef  = useRef(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [hovSeeAll, setHovSeeAll] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [movies]);

  const scroll = dir => scrollRef.current?.scrollBy({
    left: dir * scrollRef.current.clientWidth * 0.72, behavior: 'smooth',
  });

  const handleSeeAll = () => {
    const p = new URLSearchParams();
    if (seeAllGenreId)   p.set('genre', seeAllGenreId);
    if (seeAllGenreName) p.set('name',  seeAllGenreName);
    if (seeAllSort)      p.set('sort',  seeAllSort);
    navigate(`/browse${p.toString() ? `?${p}` : ''}`);
  };

  const hasSeeAll = !!(seeAllSort || seeAllGenreId);

  if (!movies.length) return null;

  return (
    <section style={{ marginBottom: 44 }} className="group/row">

      {/* ── Header ── */}
      <div style={{
        marginBottom: 16,
        display: 'flex', alignItems: 'baseline',
        justifyContent: 'space-between',
      }}>
        {/* Left: title + subtitle */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700,
            color: C.text, letterSpacing: '-0.01em', lineHeight: 1,
            borderLeft: `2.5px solid ${accentColor || C.accent}`,
            paddingLeft: 11,
          }}>
            {title}
          </h2>
          {subtitle && (
            <span style={{
              fontFamily: FONT_BODY, fontSize: 12,
              color: 'rgba(255,255,255,0.28)',
              letterSpacing: '0.02em',
            }}>
              {subtitle}
            </span>
          )}
        </div>

        {/* Right: "Xem tất cả" — kiểu chữ tinh tế */}
        {hasSeeAll && (
          <button
            onClick={handleSeeAll}
            onMouseEnter={() => setHovSeeAll(true)}
            onMouseLeave={() => setHovSeeAll(false)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 0',
              fontFamily: FONT_DISPLAY,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '-0.005em',
              color: hovSeeAll
                ? 'rgba(255,255,255,0.75)'
                : 'rgba(255,255,255,0.28)',
              transition: 'color 0.18s',
              flexShrink: 0,
            }}
          >
            Xem tất cả
            <span style={{
              display: 'flex',
              transform: hovSeeAll ? 'translateX(2px)' : 'translateX(0)',
              transition: 'transform 0.18s',
              opacity: hovSeeAll ? 1 : 0.6,
            }}>
              <ArrowRight size={13} strokeWidth={2} />
            </span>
          </button>
        )}
      </div>

      {/* ── Scroll area ── */}
      <div className="relative" style={{ overflowX: 'clip' }}>
        <div className="absolute left-0 top-0 bottom-0 w-20 z-[60] pointer-events-none transition-opacity duration-300"
          style={{ background: 'linear-gradient(to right, #080808, transparent)', opacity: canLeft ? 1 : 0 }} />

        <button onClick={() => scroll(-1)} disabled={!canLeft}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-[70]
            w-10 h-10 rounded-full flex items-center justify-center
            transition-all duration-150 hover:scale-110 active:scale-95
            opacity-0 group-hover/row:opacity-100 disabled:opacity-0 disabled:pointer-events-none"
          style={{
            background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)', color: C.text,
            pointerEvents: canLeft ? 'auto' : 'none',
          }}
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>

        <div ref={scrollRef} style={{
          display: 'flex', gap: 8,
          paddingTop: 52, paddingBottom: 52,
          marginTop: -52, marginBottom: -52,
          overflowX: 'auto', overflowY: 'visible',
          scrollbarWidth: 'none',
        }}>
          {movies.filter(Boolean).map(movie => (
            <div key={movie.id} style={{ flexShrink: 0 }}>
              <MovieCard
                movie={movie}
                isFavorited={isFavorited?.(movie.id)}
                onFavoriteToggle={onFavoriteToggle}
              />
            </div>
          ))}
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-20 z-[60] pointer-events-none transition-opacity duration-300"
          style={{ background: 'linear-gradient(to left, #080808, transparent)', opacity: canRight ? 1 : 0 }} />

        <button onClick={() => scroll(1)} disabled={!canRight}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-[70]
            w-10 h-10 rounded-full flex items-center justify-center
            transition-all duration-150 hover:scale-110 active:scale-95
            opacity-0 group-hover/row:opacity-100 disabled:opacity-0 disabled:pointer-events-none"
          style={{
            background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)', color: C.text,
            pointerEvents: canRight ? 'auto' : 'none',
          }}
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>
    </section>
  );
}