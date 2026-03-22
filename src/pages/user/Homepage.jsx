// src/pages/home/HomePage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import HeroBanner   from '../../components/layout/HeroBanner';
import Footer       from '../../components/layout/Footer';
import movieService from '../../services/movieService';
import genreService from '../../services/genreService';

import { C, FONT_BODY, FONT_DISPLAY, GOOGLE_FONTS } from '../../context/homeTokens';
import { useIsMobile } from '../../hooks/useIsMobile';
import GenreSection      from '../../components/home/GenreSection';
import TopRankedRow      from '../../components/home/TopRankedRow';
import MovieRow          from '../../components/home/MovieRow';
import CountryMovieRows  from '../../components/home/CountryMovieRows';

const normalizeMovie = m => ({
  id:          m.id,
  title:       m.title,
  year:        m.releaseDate ? new Date(m.releaseDate).getFullYear() : null,
  rating:      m.rating ?? m.imdbRating ?? 0,
  posterUrl:   m.posterUrl   || null,
  backdropUrl: m.backdropUrl || null,
  genres:      m.genres      || [],
  description: m.description || '',
  duration:    m.duration    || null,
});

const byRating = arr => [...arr].sort((a, b) => (b.rating || 0) - (a.rating || 0));
const byNewest = arr => [...arr].sort((a, b) => (b.year   || 0) - (a.year   || 0));

// ── Loading ───────────────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <motion.div
        style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${C.accent}`, borderTopColor: 'transparent' }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
      />
      <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.textDim, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        Đang tải
      </p>
    </div>
  </div>
);

// ── Error ─────────────────────────────────────────────────────────────────────
const ErrorScreen = ({ message, onRetry }) => (
  <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
      <p style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: C.text }}>Có lỗi xảy ra</p>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSub }}>{message}</p>
      <button onClick={onRetry} style={{
        padding: '10px 28px', borderRadius: 6, background: C.accent,
        border: 'none', cursor: 'pointer', fontFamily: FONT_BODY,
        fontSize: 13, fontWeight: 700, color: 'white',
      }}>
        Thử lại
      </button>
    </div>
  </div>
);

const SectionDivider = () => (
  <div style={{
    margin: '0 48px', height: 1,
    background: 'linear-gradient(to right, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 60%, transparent 100%)',
  }} />
);

// ── Recommendation engine (client-side) ───────────────────────────────────────
// Input:  movies[]     — trending (đã normalize, có genres[])
//         watchHistory — WatchHistoryDTO[] { movieId, ... }
//         highlyRated  — top 10 (để tránh trùng)
// Output: mảng phim gợi ý, max 20
const buildForYou = (movies, watchHistory, highlyRated) => {
  if (!movies.length) return [];

  const watchedIds    = new Set(watchHistory.map(h => h.movieId));
  const top10Ids      = new Set(highlyRated.slice(0, 10).map(m => m.id));

  // ── Không có history → fallback: rated cao, không trùng top 10 ───────────
  if (!watchedIds.size) {
    return byRating(movies)
      .filter(m => !top10Ids.has(m.id))
      .slice(0, 20);
  }

  // ── Đếm tần suất genre từ lịch sử xem ────────────────────────────────────
  // WatchHistoryDTO không có genres → cross-ref với trending list
  const genreFreq = {};
  movies
    .filter(m => watchedIds.has(m.id))
    .forEach(m => {
      (m.genres || []).forEach(g => {
        // genres có thể là string hoặc object { id, name }
        const key = typeof g === 'string' ? g.toLowerCase() : (g?.name || g?.id || '').toLowerCase();
        if (key) genreFreq[key] = (genreFreq[key] || 0) + 1;
      });
    });

  const hasGenreData = Object.keys(genreFreq).length > 0;

  // ── Score phim chưa xem ───────────────────────────────────────────────────
  const candidates = movies.filter(m => !watchedIds.has(m.id));

  const scored = candidates.map(m => {
    const genreScore = hasGenreData
      ? (m.genres || []).reduce((acc, g) => {
          const key = typeof g === 'string' ? g.toLowerCase() : (g?.name || g?.id || '').toLowerCase();
          return acc + (genreFreq[key] || 0);
        }, 0)
      : 0;
    return { ...m, _score: genreScore };
  });

  // Sort: genre score cao → rating cao
  scored.sort((a, b) =>
    b._score !== a._score
      ? b._score - a._score
      : (b.rating || 0) - (a.rating || 0)
  );

  // Nếu ít hơn 8 phim có genre khớp → bổ sung bằng rated cao
  const meaningful = scored.filter(m => m._score > 0);
  if (meaningful.length < 8) {
    const usedIds = new Set(meaningful.map(m => m.id));
    const filler  = byRating(candidates)
      .filter(m => !usedIds.has(m.id))
      .slice(0, 20 - meaningful.length);
    return [...meaningful, ...filler].slice(0, 20);
  }

  return scored.slice(0, 20);
};

// ══════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const [movies,       setMovies]       = useState([]);
  const [genres,       setGenres]       = useState([]);
  const [watchHistory, setWatchHistory] = useState([]); // WatchHistoryDTO[]
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [favorites,    setFavorites]    = useState(new Set());
  const isMobile = useIsMobile();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const [moviesData, genresData, favsData, historyData] = await Promise.all([
        movieService.getTrendingMovies(),
        genreService.getAllGenres(),
        movieService.getFavorites().catch(() => []),
        // getWatchHistory yêu cầu đăng nhập — không throw nếu 401
        movieService.getWatchHistory().catch(() => []),
      ]);

      const rawMovies = Array.isArray(moviesData) ? moviesData : moviesData?.movies || [];
      setMovies(rawMovies.map(normalizeMovie));

      const rawGenres = Array.isArray(genresData) ? genresData : genresData?.genres || [];
      setGenres(rawGenres);

      const rawFavs = Array.isArray(favsData) ? favsData : favsData?.data || favsData?.favorites || [];
      setFavorites(new Set(rawFavs.map(f => String(f.movieId ?? f.id))));

      // Parse watch history — WatchHistoryDTO shape: { movieId, movieTitle, ... }
      const rawHistory = Array.isArray(historyData)
        ? historyData
        : historyData?.data || historyData?.history || [];
      setWatchHistory(rawHistory);

    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = movie => setFavorites(prev => {
    const next = new Set(prev);
    next.has(String(movie.id)) ? next.delete(String(movie.id)) : next.add(String(movie.id));
    return next;
  });
  const isFavorited = id => favorites.has(String(id));

  const highlyRated = useMemo(() => byRating(movies).slice(0, 20), [movies]);
  const newest      = useMemo(() => byNewest(movies).slice(0, 20), [movies]);

  // "Có Thể Bạn Thích" — genre-based từ watch history
  const forYou = useMemo(
    () => buildForYou(movies, watchHistory, highlyRated),
    [movies, watchHistory, highlyRated]
  );

  if (loading) return <LoadingScreen />;
  if (error)   return <ErrorScreen message={error} onRetry={fetchData} />;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, overflowX: 'hidden', position: 'relative' }}>
      <style>{GOOGLE_FONTS}</style>

      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '256px 256px', opacity: 0.028, mixBlendMode: 'overlay',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeroBanner movie={movies[0]} movies={movies.slice(0, 5)} />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.5 }}>
          <GenreSection
            genres={genres}
            selectedGenre={null}
            onGenreSelect={() => {}}
            movies={movies}
          />

          <div style={{ padding: isMobile ? '8px 16px 40px' : '8px 48px 56px' }}>
            <TopRankedRow
              title="Top 10 Hôm Nay"
              movies={highlyRated}
              onFavoriteToggle={toggleFavorite}
              isFavorited={isFavorited}
            />

            <SectionDivider />
            <div style={{ height: 40 }} />

               {/* Phim mới theo quốc gia */}
            <CountryMovieRows
              favIds={favorites}
              onFavToggle={(movie, isNowFav) => {
                setFavorites(prev => {
                  const next = new Set(prev);
                  isNowFav ? next.add(String(movie.id)) : next.delete(String(movie.id));
                  return next;
                });
              }}
            />

            <MovieRow
              title="Được Đánh Giá Cao"
              subtitle="Khán giả yêu thích nhất"
              movies={highlyRated}
              onFavoriteToggle={toggleFavorite}
              isFavorited={isFavorited}
              accentColor="#f5c518"
              seeAllSort="rating"
            />

            <SectionDivider />
            <div style={{ height: 40 }} />

            <MovieRow
              title="Mới Ra Mắt"
              subtitle="Cập nhật liên tục"
              movies={newest}
              onFavoriteToggle={toggleFavorite}
              isFavorited={isFavorited}
              accentColor="#38bdf8"
              seeAllSort="releaseDate"
            />

            <SectionDivider />
            <div style={{ height: 40 }} />

            <MovieRow
              title="Có Thể Bạn Thích"
              subtitle={watchHistory.length > 0 ? 'Dựa trên lịch sử xem của bạn' : 'Khám phá thêm'}
              movies={forYou}
              onFavoriteToggle={toggleFavorite}
              isFavorited={isFavorited}
              accentColor="#a78bfa"
              seeAllSort="rating"
            />

            <SectionDivider />
            <div style={{ height: 40 }} />
          </div>

          {/* <Footer /> */}
        </motion.div>
      </div>
    </div>
  );
}