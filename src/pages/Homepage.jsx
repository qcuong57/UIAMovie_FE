// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MovieCarousel } from '../components/movie';
import Navbar from '../components/layout/Navbar';
import HeroBanner from '../components/layout/HeroBanner';
import Footer from '../components/layout/Footer';
import movieService from '../services/movieService';
import genreService from '../services/genreService';

// ── Design tokens ──────────────────────────────────────────────
const C = {
  bg: '#000000',        // pure black
  surface: '#0a0a0a',   // card surfaces
  surfaceHigh: '#111111',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(229,24,30,0.5)',
  accent: '#e5181e',
  accentSoft: 'rgba(229,24,30,0.12)',
  text: '#e8eaf0',
  textMuted: '#555c6e',
  textDim: '#8b909e',
};

// ── Genre icon map ─────────────────────────────────────────────
const GENRE_ICONS = {
  Action: '🔫', Fantasy: '🧙', Comedy: '😂', Drama: '🎭',
  Mystery: '🔍', Romance: '❤️', Horror: '👻', Thriller: '🎯',
  'Sci-Fi': '🚀', Animation: '🎨', Documentary: '📽️', Adventure: '🌍',
};

// ── Genre count labels (mock) ──────────────────────────────────
const GENRE_COUNTS = {
  Action: '1,300+', Fantasy: '800+', Comedy: '1,000+', Drama: '1,500+',
  Mystery: '500+', Romance: '900+', Horror: '750+', Thriller: '500+',
};

// ── Section header ─────────────────────────────────────────────
const SectionHead = ({ label, sub }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-8">
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-[3px] h-6 rounded-full" style={{ background: C.accent }} />
        <h2
          className="text-2xl md:text-3xl font-black uppercase tracking-wider"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.text, letterSpacing: '0.04em' }}
        >
          {label}
        </h2>
      </div>
      {sub && (
        <p
          className="text-sm ml-6 max-w-sm"
          style={{ color: C.textMuted, fontFamily: "'DM Sans', sans-serif" }}
        >
          {sub}
        </p>
      )}
    </div>
  </div>
);

// ── Genre card ─────────────────────────────────────────────────
const GenreCard = ({ genre, isSelected, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const active = isSelected || hovered;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 w-full"
      style={{
        background: active ? C.accentSoft : C.surface,
        border: `1px solid ${active ? C.borderHover : C.border}`,
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      <span className="text-xl leading-none select-none">{GENRE_ICONS[genre.name] || '🎬'}</span>
      <div className="min-w-0">
        <p
          className="font-bold text-[13px] leading-none mb-1 truncate transition-colors"
          style={{ color: active ? C.accent : C.text, fontFamily: "'DM Sans', sans-serif" }}
        >
          {genre.name}
        </p>
        <p
          className="text-[11px] font-medium leading-none"
          style={{ color: C.textMuted, fontFamily: "'DM Sans', sans-serif" }}
        >
          {GENRE_COUNTS[genre.name] || '500+'} Movies
        </p>
      </div>
    </button>
  );
};

// ── Main ───────────────────────────────────────────────────────
export default function HomePage() {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const moviesData = await movieService.getTrendingMovies();
      const raw = Array.isArray(moviesData) ? moviesData : moviesData?.movies || [];
      setTrendingMovies(raw.map((m) => ({
        id: m.id,
        title: m.title,
        year: new Date(m.releaseDate).getFullYear(),
        rating: m.rating || 8.0,
        posterUrl: m.posterUrl || null,
        backdropUrl: m.backdropUrl || null,
        genres: m.genres || [],
        description: m.description,
      })));

      const genresData = await genreService.getAllGenres();
      const rawGenres = Array.isArray(genresData) ? genresData : genresData?.genres || [];
      setGenres(rawGenres.slice(0, 8));
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (movie) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(movie.id) ? next.delete(movie.id) : next.add(movie.id);
      return next;
    });

  const isFavorited = (id) => favorites.has(id);

  const filtered = selectedGenre
    ? trendingMovies.filter((m) => m.genres?.includes(selectedGenre))
    : trendingMovies;

  const sorted = (arr, key, dir = -1) =>
    [...arr].sort((a, b) => dir * ((a[key] || 0) - (b[key] || 0)));

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4" style={{ background: C.bg }}>
        <motion.div
          className="w-9 h-9 rounded-full border-[3px] border-t-transparent"
          style={{ borderColor: `${C.accent} transparent transparent transparent` }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        />
        <p
          className="text-xs uppercase tracking-[0.2em]"
          style={{ color: C.textMuted, fontFamily: "'DM Sans', sans-serif" }}
        >
          Loading
        </p>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="text-center space-y-3">
          <p className="text-sm" style={{ color: C.textMuted }}>Something went wrong</p>
          <p className="text-base" style={{ color: C.accent }}>{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 px-5 py-2 rounded-full text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: C.accent, fontFamily: "'DM Sans', sans-serif" }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* ── Page ── */
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: C.bg, color: C.text }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* <Navbar /> */}
      <HeroBanner movie={trendingMovies[0]} movies={trendingMovies.slice(0, 5)} />

      {/* ── Content ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.55 }}
      >

        {/* ── Trending Carousel ── */}
        <div className="pb-4 px-4 md:px-16">
          <MovieCarousel
            title="Trending Now"
            emoji="🔥"
            movies={trendingMovies}
            onFavoriteToggle={toggleFavorite}
            isFavorited={isFavorited}
          />
        </div>

        {/* ─────────────── Choose Your Genre ─────────────── */}
        {genres.length > 0 && (
          <section className="py-10 px-4 md:px-16" style={{ background: C.surfaceHigh }}>
            <SectionHead
              label="Choose The Type Of Film You Liked"
              sub="We present many films from various main categories, let's choose and search film of you liked"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {genres.map((genre) => (
                <GenreCard
                  key={genre.id}
                  genre={genre}
                  isSelected={selectedGenre === genre.id}
                  onClick={() => setSelectedGenre(selectedGenre === genre.id ? null : genre.id)}
                />
              ))}
            </div>

            {/* Filter indicator */}
            {selectedGenre && (
              <div className="mt-5 flex items-center gap-3">
                <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: C.accentSoft, color: C.accent, fontFamily: "'DM Sans', sans-serif" }}>
                  Filtering: {genres.find((g) => g.id === selectedGenre)?.name}
                </span>
                <button
                  onClick={() => setSelectedGenre(null)}
                  className="text-xs font-medium hover:underline"
                  style={{ color: C.textMuted, fontFamily: "'DM Sans', sans-serif" }}
                >
                  Clear ×
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── More Carousels ── */}
        <div className="pt-10 px-4 md:px-16">
          <MovieCarousel
            title="Highly Rated"
            emoji="⭐"
            movies={sorted(filtered, 'rating')}
            onFavoriteToggle={toggleFavorite}
            isFavorited={isFavorited}
          />

          {/* Divider */}
          <div className="mx-4 md:mx-16 my-2 h-px" style={{ background: C.border }} />

          <MovieCarousel
            title="Drama & Stories"
            emoji="🎭"
            movies={filtered}
            onFavoriteToggle={toggleFavorite}
            isFavorited={isFavorited}
          />

          <div className="mx-4 md:mx-16 my-2 h-px" style={{ background: C.border }} />

          <MovieCarousel
            title="Sci-Fi Adventures"
            emoji="🚀"
            movies={[...filtered].reverse()}
            onFavoriteToggle={toggleFavorite}
            isFavorited={isFavorited}
          />
        </div>

        <Footer />
      </motion.div>
    </div>
  );
}