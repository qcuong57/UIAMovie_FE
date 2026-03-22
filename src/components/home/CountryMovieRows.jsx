// src/components/home/CountryMovieRows.jsx
// Phong cách Netflix — tinh tế, sang trọng, dark luxury

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import movieService from '../../services/movieService';
import MovieCard from '../movie/MovieCard';
import { FONT_BODY, FONT_DISPLAY } from '../../context/homeTokens';

// ── Quốc gia config ───────────────────────────────────────────
const COUNTRIES = [
  {
    code:    'KR',
    label:   'Hàn Quốc',
    flag:    '🇰🇷',
    tagline: 'K-Drama & Cinema',
    accent:  '#e8c97e',   // gold warm
    glow:    'rgba(232,201,126,0.12)',
  },
  {
    code:    'CN',
    label:   'Trung Quốc',
    flag:    '🇨🇳',
    tagline: 'C-Drama & Wuxia',
    accent:  '#e87e7e',   // rose
    glow:    'rgba(232,126,126,0.12)',
  },
  {
    code:    'US',
    label:   'Hollywood',
    flag:    '🇺🇸',
    tagline: 'Blockbuster & Series',
    accent:  '#7eaee8',   // cool blue
    glow:    'rgba(126,174,232,0.12)',
  },
  {
    code:    'JP',
    label:   'Nhật Bản',
    flag:    '🇯🇵',
    tagline: 'Anime & J-Cinema',
    accent:  '#c47ee8',   // soft violet
    glow:    'rgba(196,126,232,0.12)',
  },
];

// ── Normalize ─────────────────────────────────────────────────
const normalize = m => ({
  id:          m.id,
  title:       m.title,
  year:        m.releaseDate ? new Date(m.releaseDate).getFullYear() : m.year ?? null,
  rating:      m.rating ?? m.imdbRating ?? 0,
  posterUrl:   m.posterUrl   ?? null,
  backdropUrl: m.backdropUrl ?? null,
  genres:      m.genres      ?? [],
  description: m.description ?? '',
  duration:    m.duration    ?? null,
});

// ── Shimmer skeleton ──────────────────────────────────────────
const Skeleton = () => (
  <div style={{
    width: '100%', aspectRatio: '2/3', borderRadius: 8,
    background: 'linear-gradient(110deg, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 70%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.8s ease-in-out infinite',
  }} />
);

// ── Single country block ──────────────────────────────────────
const CountryBlock = ({ country, index, favIds, onFavToggle }) => {
  const navigate = useNavigate();
  const [movies,  setMovies]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(0);
  const rowRef                = useRef(null);

  useEffect(() => {
    movieService.getMoviesByCountry(country.code)
      .then(res => {
        // Backend trả PaginatedDTO: { items: [...], totalCount, pageNumber, pageSize }
        // Axios interceptor có thể đã unwrap data một lần rồi
        let raw = [];

        if (Array.isArray(res)) {
          raw = res;
        } else if (res?.items && Array.isArray(res.items)) {
          // PaginatedDTO đã unwrap: { items: [...] }
          raw = res.items;
        } else if (res?.data?.items && Array.isArray(res.data.items)) {
          // Chưa unwrap: { data: { items: [...] } }
          raw = res.data.items;
        } else if (res?.movies && Array.isArray(res.movies)) {
          raw = res.movies;
        } else if (res?.data?.movies && Array.isArray(res.data.movies)) {
          raw = res.data.movies;
        } else if (res?.data && Array.isArray(res.data)) {
          raw = res.data;
        }
        setMovies(
          raw.map(normalize)
            .sort((a, b) => (b.year || 0) - (a.year || 0))
            .slice(0, 20)
        );
      })
      .catch(err => {
        console.error(`[CountryMovieRows] ${country.code} error:`, err);
        setMovies([]);
      })
      .finally(() => setLoading(false));
  }, [country.code]);

  if (!loading && movies.length === 0) return null;

  const COLS    = 5;
  const maxPage = Math.max(0, Math.ceil(movies.length / COLS) - 1);
  const visible = movies.slice(page * COLS, page * COLS + COLS);
  const canNext = page < maxPage;

  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{ marginBottom: 56 }}
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'space-between', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Thin accent bar */}
          <div style={{
            width: 2, height: 32, borderRadius: 1,
            background: `linear-gradient(to bottom, ${country.accent}, transparent)`,
          }} />

          <div>
            {/* Flag + country label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>{country.flag}</span>
              <span style={{
                fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: country.accent,
              }}>
                {country.label}
              </span>
            </div>

            {/* Big title */}
            <h2 style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 'clamp(18px, 2vw, 24px)',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1,
              letterSpacing: '-0.01em',
              margin: 0,
            }}>
              Mới nhất — {country.tagline}
            </h2>
          </div>
        </div>

        {/* See all */}
        <motion.button
          whileHover={{ gap: 8 }}
          onClick={() => navigate(`/browse?country=${country.code}`)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.04em',
            padding: '6px 0',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
        >
          Xem tất cả
          <ArrowUpRight size={13} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* ── Cards area ── */}
      <div style={{ position: 'relative' }}>

        {/* Subtle glow behind cards */}
        <div style={{
          position: 'absolute', inset: '-20px -40px',
          background: `radial-gradient(ellipse 60% 50% at 40% 60%, ${country.glow}, transparent)`,
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Card grid + next arrow */}
        <div ref={rowRef} style={{ position: 'relative', zIndex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                gap: 4,
              }}
            >
              {loading
                ? Array.from({ length: COLS }).map((_, i) => <Skeleton key={i} />)
                : visible.map((m, i) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.3 }}
                    >
                      <MovieCard
                        movie={m}
                        isFavorited={favIds?.has(String(m.id))}
                        onFavoriteToggle={onFavToggle}
                      />
                    </motion.div>
                  ))
              }
            </motion.div>
          </AnimatePresence>

          {/* Fade + next arrow — chỉ hiện khi còn trang */}
          {!loading && canNext && (
            <div style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 100,
              background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.92))',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              paddingRight: 8, zIndex: 2,
            }}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setPage(p => p + 1)}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  cursor: 'pointer', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                }}
              >
                <ChevronRight size={18} strokeWidth={2} />
              </motion.button>
            </div>
          )}
        </div>

        {/* ── Dot pagination ── */}
        {!loading && maxPage > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 16, paddingLeft: 2 }}>
            {Array.from({ length: maxPage + 1 }).map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setPage(i)}
                animate={{
                  width:   i === page ? 24 : 6,
                  opacity: i === page ? 1  : 0.3,
                  background: i === page ? country.accent : 'rgba(255,255,255,0.5)',
                }}
                transition={{ duration: 0.25 }}
                style={{
                  height: 3, borderRadius: 2,
                  border: 'none', cursor: 'pointer', padding: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom divider */}
      <div style={{
        marginTop: 40, height: 1,
        background: 'linear-gradient(to right, rgba(255,255,255,0.06) 0%, transparent 80%)',
      }} />
    </motion.section>
  );
};

// ── Export ────────────────────────────────────────────────────
export default function CountryMovieRows({ favIds, onFavToggle }) {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: 40 }}
      >
        <p style={{
          fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)', marginBottom: 8,
        }}>
          Cập nhật mới nhất theo khu vực
        </p>
        <h2 style={{
          fontFamily: FONT_DISPLAY, fontSize: 'clamp(22px, 2.5vw, 30px)',
          fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.02em',
        }}>
          Phim Theo Quốc Gia
        </h2>
      </motion.div>

      {COUNTRIES.map((c, i) => (
        <CountryBlock
          key={c.code}
          country={c}
          index={i}
          favIds={favIds}
          onFavToggle={onFavToggle}
        />
      ))}
    </>
  );
}