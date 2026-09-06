// src/pages/home/HomePage.jsx
// v2 — bỏ ScrollProgressBar (JS overhead) → dùng CSS scrollbar kiểu Netflix
// Import NetflixScrollbar.css vào index.css hoặc App.css là xong

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, CalendarDays, Tv } from "lucide-react";
import HeroBanner from "../../components/layout/HeroBanner";
import Footer from "../../components/layout/Footer";
import movieService from "../../services/movieService";
import tvShowService from "../../services/tvShowService";
import genreService from "../../services/genreService";
import aiService from "../../services/aiService";
import authService from "../../services/authService";
import AiChatWidget from "../../components/ai/AiChatWidget";

import {
  C,
  FONT_BODY,
  FONT_DISPLAY,
  GOOGLE_FONTS,
} from "../../context/homeTokens";
import { useIsMobile } from "../../hooks/useIsMobile";
import GenreSection from "../../components/home/GenreSection";
import TopRankedRow from "../../components/home/TopRankedRow";
import MovieRow from "../../components/home/MovieRow";
import CountryMovieRows from "../../components/home/CountryMovieRows";
import TrailerShowcaseSection from "../../components/home/TrailerShowcaseSection";
import UserReviewsSection from "../../components/home/UserReviewsSection";
import RecommendSection from "../../components/home/RecommendSection";
import SectionReveal from "../../motion-configs/SectionReveal";
import { LoadingScreen } from "../../components/ui";
// ✅ ScrollProgressBar đã bỏ → dùng CSS scrollbar trong NetflixScrollbar.css

// ─── Normalize movie ──────────────────────────────────────────────────────────
const normalizeMovie = (m) => ({
  id: m.id,
  title: m.title,
  year: m.releaseDate ? new Date(m.releaseDate).getFullYear() : null,
  rating: m.rating ?? m.imdbRating ?? 0,
  posterUrl: m.posterUrl || null,
  backdropUrl: m.backdropUrl || null,
  genres: m.genres || [],
  description: m.description || "",
  duration: m.duration || null,
  isPremium: m.isPremium ?? false, // ← FIX: map field premium
  trailerVideoUrl: m.trailerVideoUrl || null, // trailer tự upload lên Cloudinary
  isTvShow: false,
});

const normalizeTvShow = (s) => ({
  id: s.id,
  title: s.title ?? s.name,
  year: s.firstAirDate ? new Date(s.firstAirDate).getFullYear() : null,
  rating: s.rating ?? s.voteAverage ?? 0,
  posterUrl: s.posterUrl || null,
  backdropUrl: s.backdropUrl || null,
  genres: s.genres || [],
  description: s.description || s.overview || "",
  isPremium: s.isPremium ?? false, // ← FIX: map field premium
  trailerVideoUrl: s.trailerVideoUrl || null, // trailer tự upload lên Cloudinary
  isTvShow: true,
});

const byRating = (arr) =>
  [...arr].sort((a, b) => (b.rating || 0) - (a.rating || 0));
const byNewest = (arr) =>
  [...arr].sort((a, b) => (b.year || 0) - (a.year || 0));

// ─── Client-side fallback recommend ──────────────────────────────────────────
const buildForYouFallback = (allItems, watchHistory, highlyRated) => {
  if (!allItems.length) return [];

  const watchedIds = new Set(watchHistory.map((h) => String(h.movieId)));
  const top10Ids = new Set(highlyRated.slice(0, 10).map((m) => String(m.id)));

  if (!watchedIds.size) {
    return byRating(allItems)
      .filter((m) => !top10Ids.has(String(m.id)))
      .slice(0, 20);
  }

  const genreFreq = {};
  allItems
    .filter((m) => watchedIds.has(String(m.id)))
    .forEach((m) => {
      (m.genres || []).forEach((g) => {
        const key =
          typeof g === "string"
            ? g.toLowerCase()
            : (g?.name || g?.id || "").toLowerCase();
        if (key) genreFreq[key] = (genreFreq[key] || 0) + 1;
      });
    });

  const hasGenreData = Object.keys(genreFreq).length > 0;
  const candidates = allItems.filter((m) => !watchedIds.has(String(m.id)));
  const scored = candidates.map((m) => ({
    ...m,
    _score: hasGenreData
      ? (m.genres || []).reduce((acc, g) => {
          const key =
            typeof g === "string"
              ? g.toLowerCase()
              : (g?.name || g?.id || "").toLowerCase();
          return acc + (genreFreq[key] || 0);
        }, 0)
      : 0,
  }));

  scored.sort((a, b) =>
    b._score !== a._score
      ? b._score - a._score
      : (b.rating || 0) - (a.rating || 0),
  );

  const meaningful = scored.filter((m) => m._score > 0);
  if (meaningful.length < 8) {
    const usedIds = new Set(meaningful.map((m) => String(m.id)));
    const filler = byRating(candidates)
      .filter((m) => !usedIds.has(String(m.id)))
      .slice(0, 20 - meaningful.length);
    return [...meaningful, ...filler].slice(0, 20);
  }

  return scored.slice(0, 20);
};

// ─── Error screen ───────────────────────────────────────────────────────────
// (LoadingScreen giờ nằm ở src/components/ui/LoadingScreen.jsx, import ở trên)
const ErrorScreen = ({ message, onRetry }) => (
  <div
    style={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: C.bg,
    }}
  >
    <div
      style={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        alignItems: "center",
      }}
    >
      <p
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 18,
          fontWeight: 700,
          color: C.text,
        }}
      >
        Có lỗi xảy ra
      </p>
      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSub }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        style={{
          padding: "10px 28px",
          borderRadius: 6,
          background: C.accent,
          border: "none",
          cursor: "pointer",
          fontFamily: FONT_BODY,
          fontSize: 13,
          fontWeight: 700,
          color: "white",
        }}
      >
        Thử lại
      </button>
    </div>
  </div>
);

const SectionDivider = () => (
  <div
    style={{
      margin: "0 48px",
      height: 1,
      background:
        "linear-gradient(to right, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 60%, transparent 100%)",
    }}
  />
);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Main HomePage ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [genres, setGenres] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());

  const [trailerSourceMovies, setTrailerSourceMovies] = useState([]);
  const [trailerSourceTvShows, setTrailerSourceTvShows] = useState([]);

  const [forYou, setForYou] = useState([]);
  const [forYouLabel, setForYouLabel] = useState("Khám phá thêm");
  const [forYouLoading, setForYouLoading] = useState(false);

  const isMobile = useIsMobile();
  const [retryCount, setRetryCount] = useState(0);
  const hasFetched = useRef(false);
  const [pastBanner, setPastBanner] = useState(false);

  useEffect(() => {
    const onScroll = () =>
      setPastBanner(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  const handleRetry = useCallback(() => {
    hasFetched.current = false;
    setError(null);
    setRetryCount((c) => c + 1);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Đồng bộ trạng thái Premium từ server vào localStorage trước khi render
      await authService.refreshPremiumStatus();

      const [
        moviesData,
        tvShowsData,
        genresData,
        favsData,
        tvFavsData,
        historyData,
        trailerMoviesData,
        trailerTvShowsData,
      ] = await Promise.all([
        movieService.getTrendingMovies(),
        tvShowService
          .getTvShows({ pageSize: 60, sortBy: "rating", sortDesc: true })
          .catch(() => []),
        genreService.getAllGenres(),
        movieService.getFavorites().catch(() => []),
        tvShowService.getFavorites?.().catch(() => []) ?? Promise.resolve([]),
        movieService.getWatchHistory().catch(() => []),
        // ⚠️ Nguồn RIÊNG cho Trailer section: getTrendingMovies() bị cache server 30'
        // nên trailer mới upload không lên kịp. getMovies() (list thường) KHÔNG cache
        // → luôn thấy trailer mới ngay sau khi upload. pageSize lớn để không bị giới
        // hạn trong top trending/top rated như 2 nguồn phía trên.
        movieService
          .getMovies({
            page: 1,
            pageSize: 100,
            sortBy: "releaseDate",
            sortDesc: true,
          })
          .catch(() => []),
        tvShowService
          .getTvShows({
            page: 1,
            pageSize: 100,
            sortBy: "firstAirDate",
            sortDesc: true,
          })
          .catch(() => []),
      ]);

      const rawMovies = Array.isArray(moviesData)
        ? moviesData
        : moviesData?.movies || [];
      const normalized = rawMovies.map(normalizeMovie);
      setMovies(normalized);

      const rawTvShows = Array.isArray(tvShowsData)
        ? tvShowsData
        : (tvShowsData?.items ??
          tvShowsData?.tvShows ??
          tvShowsData?.data?.items ??
          tvShowsData?.data ??
          []);
      const normalizedTv = rawTvShows.map(normalizeTvShow);
      setTvShows(normalizedTv);

      const rawGenres = Array.isArray(genresData)
        ? genresData
        : genresData?.genres || [];
      setGenres(rawGenres);

      const rawFavs = Array.isArray(favsData)
        ? favsData
        : favsData?.data || favsData?.favorites || [];
      const rawTvFavs = Array.isArray(tvFavsData)
        ? tvFavsData
        : tvFavsData?.data || tvFavsData?.favorites || [];
      setFavorites(
        new Set([
          ...rawFavs.map((f) => String(f.movieId ?? f.id)),
          ...rawTvFavs.map((f) => String(f.tvShowId ?? f.movieId ?? f.id)),
        ]),
      );

      const rawHistory = Array.isArray(historyData)
        ? historyData
        : historyData?.data || historyData?.history || [];
      setWatchHistory(rawHistory);

      // Nguồn riêng cho Trailer section — xem comment ở fetchData phía trên
      const rawTrailerMovies = Array.isArray(trailerMoviesData)
        ? trailerMoviesData
        : trailerMoviesData?.items || trailerMoviesData?.movies || [];
      const rawTrailerTvShows = Array.isArray(trailerTvShowsData)
        ? trailerTvShowsData
        : (trailerTvShowsData?.items ??
          trailerTvShowsData?.tvShows ??
          trailerTvShowsData?.data?.items ??
          trailerTvShowsData?.data ??
          []);
      setTrailerSourceMovies(rawTrailerMovies.map(normalizeMovie));
      setTrailerSourceTvShows(rawTrailerTvShows.map(normalizeTvShow));

      fetchForYou(normalized, normalizedTv, rawHistory);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const fetchForYou = useCallback(
    async (normalizedMovies, normalizedTvShows, rawHistory) => {
      setForYouLoading(true);
      try {
        const aiRec = await aiService.getRecommendations();

        if (Array.isArray(aiRec?.movies) && aiRec.movies.length > 0) {
          setForYou(aiRec.movies.map(normalizeMovie));
          setForYouLabel(aiRec.message || "Gợi ý AI cho bạn");
          return;
        }
      } catch {
        // Fallback nếu chưa đăng nhập (401) hoặc AI lỗi
      }

      const allItems = [...normalizedMovies, ...normalizedTvShows];
      const highlyRated = byRating(allItems).slice(0, 20);
      const fallback = buildForYouFallback(allItems, rawHistory, highlyRated);
      setForYou(fallback);
      setForYouLabel(
        rawHistory.length > 0
          ? "Dựa trên lịch sử xem của bạn"
          : "Khám phá thêm",
      );
    },
    [],
  );

  const toggleFavorite = useCallback((item, isNowFav) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isNowFav === true) {
        next.add(String(item.id));
      } else if (isNowFav === false) {
        next.delete(String(item.id));
      } else {
        next.has(String(item.id))
          ? next.delete(String(item.id))
          : next.add(String(item.id));
      }
      return next;
    });
  }, []);

  const isFavorited = useCallback(
    (id) => favorites.has(String(id)),
    [favorites],
  );

  // ── Derived data ─────────────────────────────────────────────────────────────
  const highlyRated = useMemo(() => byRating(movies).slice(0, 20), [movies]);
  const newest = useMemo(() => byNewest(movies).slice(0, 20), [movies]);
  const reviewMovies = useMemo(() => byRating(movies).slice(0, 6), [movies]);

  const tvTopRated = useMemo(() => byRating(tvShows).slice(0, 20), [tvShows]);
  const tvNewest = useMemo(() => byNewest(tvShows).slice(0, 20), [tvShows]);

  // ── Trailer tự upload (Cloudinary) — movie + tvshow gộp chung, mới nhất trước ──
  // Gộp cả 2 nguồn: (trending/top-rated hiện có) + (nguồn riêng không cache, xem fetchData)
  // rồi khử trùng lặp theo id+loại, để không bỏ lỡ trailer chỉ vì phim chưa lọt top trending.
  const uploadedTrailers = useMemo(() => {
    const all = [
      ...movies,
      ...tvShows,
      ...trailerSourceMovies,
      ...trailerSourceTvShows,
    ].filter((i) => i.trailerVideoUrl);

    const seen = new Set();
    const deduped = all.filter((item) => {
      const key = `${item.isTvShow ? "tv" : "movie"}-${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return byNewest(deduped).slice(0, 15);
  }, [movies, tvShows, trailerSourceMovies, trailerSourceTvShows]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onRetry={handleRetry} />;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/*
        ✅ SCROLLBAR: Không cần component gì thêm.
        Import NetflixScrollbar.css vào index.css hoặc App.css là xong:
          @import './NetflixScrollbar.css';
        CSS thuần → zero JS → mượt hơn ScrollProgressBar
      */}

      <style>{GOOGLE_FONTS}</style>

      {/* Noise texture */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
          opacity: 0.028,
          mixBlendMode: "overlay",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <HeroBanner movie={movies[0]} movies={movies.slice(0, 5)} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <GenreSection
            genres={genres}
            selectedGenre={null}
            onGenreSelect={() => {}}
            movies={movies}
            tvShows={tvShows}
          />

          <div
            style={{ padding: isMobile ? "8px 16px 40px" : "8px 48px 56px" }}
          >
            {/* ── Top 10 ── */}
            {/* ✅ Fix: đổi variant="tilt-up" → "bounce" (cinematic hơn cho Top 10) */}
            <SectionReveal variant="bounce">
              <TopRankedRow
                title="Top 10 Hôm Nay"
                movies={highlyRated}
                tvShows={tvTopRated}
                onFavoriteToggle={toggleFavorite}
                isFavorited={isFavorited}
              />
            </SectionReveal>

            <SectionDivider />
            <div style={{ height: 40 }} />

            {/* ── Trailer Mới Cập Nhật (tự upload lên Cloudinary) ── */}
            {uploadedTrailers.length > 0 && (
              <>
                <SectionReveal variant="scale-fade">
                  <TrailerShowcaseSection items={uploadedTrailers} />
                </SectionReveal>

                <SectionDivider />
                <div style={{ height: 40 }} />
              </>
            )}

            <CountryMovieRows
              favIds={favorites}
              onFavToggle={(item, isNowFav) => {
                setFavorites((prev) => {
                  const next = new Set(prev);
                  isNowFav
                    ? next.add(String(item.id))
                    : next.delete(String(item.id));
                  return next;
                });
              }}
            />

            {/* ── Được Đánh Giá Cao ── */}
            <SectionReveal variant="slide-right">
              <MovieRow
                title="Phim Được Đánh Giá Cao"
                movies={highlyRated}
                onFavoriteToggle={toggleFavorite}
                isFavorited={isFavorited}
                accentColor="#f5c518"
                seeAllSort="rating"
                badge={{ icon: Star, text: "Đánh giá cao" }}
              />
            </SectionReveal>

            <SectionDivider />
            <div style={{ height: 40 }} />

            {/* ── TV Series Nổi Bật ── */}
            {tvTopRated.length > 0 && (
              <>
                <SectionReveal variant="slide-left">
                  <MovieRow
                    title="TV Series Nổi Bật"
                    items={tvTopRated}
                    onFavoriteToggle={toggleFavorite}
                    isFavorited={isFavorited}
                    accentColor="#818cf8"
                    seeAllPath="/browse/tvshows?sort=rating"
                    badge={{ icon: Tv, text: "TV Show" }}
                  />
                </SectionReveal>

                <SectionDivider />
                <div style={{ height: 40 }} />
              </>
            )}

            {/* ── Phim Mới Ra Mắt ── */}
            <SectionReveal variant="slide-right">
              <MovieRow
                title="Phim Mới Ra Mắt"
                movies={newest}
                onFavoriteToggle={toggleFavorite}
                isFavorited={isFavorited}
                accentColor="#38bdf8"
                seeAllSort="releaseDate"
                badge={{ icon: CalendarDays, text: "Mới nhất" }}
              />
            </SectionReveal>

            <SectionDivider />
            <div style={{ height: 40 }} />

            {/* ── Series Mới Nhất ── */}
            {tvNewest.length > 0 && (
              <>
                <SectionReveal variant="slide-left">
                  <MovieRow
                    title="Series Mới Nhất"
                    items={tvNewest}
                    onFavoriteToggle={toggleFavorite}
                    isFavorited={isFavorited}
                    accentColor="#34d399"
                    seeAllPath="/browse/tvshows?sort=firstAirDate"
                    badge={{ icon: CalendarDays, text: "Mới nhất" }}
                  />
                </SectionReveal>

                <SectionDivider />
                <div style={{ height: 40 }} />
              </>
            )}

            {/* ── Dành Cho Bạn ── */}
            {forYouLoading && forYou.length === 0 ? (
              <div style={{ marginBottom: 44 }}>
                <div
                  style={{
                    height: 22,
                    width: 180,
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.06)",
                    marginBottom: 16,
                  }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        flexShrink: 0,
                        width: 160,
                        height: 240,
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.04)",
                        animation: "pulse 1.5s ease-in-out infinite",
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <SectionReveal variant="scale-fade">
                <RecommendSection
                  subtitle={forYouLabel}
                  items={forYou}
                  onFavoriteToggle={toggleFavorite}
                  isFavorited={isFavorited}
                  accentColor="#a78bfa"
                  seeAllSort="rating"
                />
              </SectionReveal>
            )}

            <SectionDivider />
            <div style={{ height: 40 }} />

            {/* ── User Reviews ── */}
            <SectionReveal variant="fade" margin="-60px">
              <UserReviewsSection
                movies={reviewMovies}
                onMovieClick={(movie) => {
                  window.location.href = `/movie/${movie.id}`;
                }}
              />
            </SectionReveal>
          </div>

          <AnimatePresence>
            {pastBanner && (
              <motion.div
                key="ai-chat"
                initial={{ opacity: 0, scale: 0.85, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 16 }}
                transition={{ duration: 0.35, ease: [0.215, 0.61, 0.355, 1] }}
                style={{ position: "fixed", bottom: 0, right: 0, zIndex: 50 }}
              >
                <AiChatWidget />
              </motion.div>
            )}
          </AnimatePresence>
          <Footer />
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}