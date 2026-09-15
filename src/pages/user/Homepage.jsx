// src/pages/home/HomePage.jsx
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
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
import ContinueWatchingSection from "../../components/home/ContinueWatchingSection";

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
  isPremium: m.isPremium ?? false,
  trailerVideoUrl: m.trailerVideoUrl || null,
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
  isPremium: s.isPremium ?? false,
  trailerVideoUrl: s.trailerVideoUrl || null,
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

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Main HomePage ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const navigate = useNavigate();
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
    let ticking = false;
    const check = () => {
      const next = window.scrollY > window.innerHeight * 0.8;
      setPastBanner((prev) => (prev === next ? prev : next));
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(check);
      }
    };
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

      await authService.refreshPremiumStatus();

      const [
        moviesData,
        tvShowsData,
        genresData,
        favsData,
        tvFavsData,
        historyData,
        tvHistoryData,
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
        tvShowService.getWatchHistory?.().catch(() => []) ??
          Promise.resolve([]),
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

      // BUG CŨ: chỉ lấy lịch sử xem phim lẻ (movieService.getWatchHistory),
      // bỏ sót toàn bộ lịch sử xem phim bộ (tvShowService.getWatchHistory) —
      // vì đây là 2 bảng/endpoint tách biệt ở backend (WatchHistory vs
      // TvShowWatchHistory), không tự gộp cho FE.
      const rawMovieHistory = Array.isArray(historyData)
        ? historyData
        : historyData?.data || historyData?.history || [];
      const rawTvHistory = Array.isArray(tvHistoryData)
        ? tvHistoryData
        : tvHistoryData?.data || tvHistoryData?.history || [];

      // Gắn cờ isTvShow ngay từ đây vì 2 DTO có field hoàn toàn khác nhau
      // (MovieTitle/ProgressMinutes vs TvShowTitle/ProgressSeconds) và không
      // có field isTvShow / object lồng "movie"/"tvShow" nào cả.
      const combinedHistory = [
        ...rawMovieHistory.map((h) => ({ ...h, isTvShow: false })),
        ...rawTvHistory.map((h) => ({ ...h, isTvShow: true })),
      ].sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));

      setWatchHistory(combinedHistory);

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

      fetchForYou(normalized, normalizedTv, combinedHistory);
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
          setForYouLoading(false);
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
      setForYouLoading(false);
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

  // ── Chuẩn hóa danh sách xem tiếp ──────────────────────────────────────────
  // Backend trả 2 DTO phẳng, KHÔNG có object "movie"/"tvShow" lồng bên trong,
  // KHÔNG có field currentTime/duration/progress/remainingMinutes/title/isTvShow
  // như code cũ giả định — nên trước đây item.title luôn undefined và bị
  // filter loại hết (section không bao giờ hiện).
  //   WatchHistoryDTO (phim lẻ):  movieId, movieTitle, posterUrl, progressMinutes
  //   TvShowWatchHistoryDTO (bộ): tvShowId, tvShowTitle, posterUrl,
  //                               seasonNumber, episodeNumber, episodeRuntime (phút),
  //                               progressSeconds
  const continueWatchingList = useMemo(() => {
    const movieMap = new Map(movies.map((m) => [String(m.id), m]));
    const tvMap = new Map(tvShows.map((s) => [String(s.id), s]));

    const mapped = (watchHistory || [])
      .map((item) => {
        const isTv = Boolean(item.isTvShow);
        const id = isTv ? item.tvShowId : item.movieId;
        const meta = isTv ? tvMap.get(String(id)) : movieMap.get(String(id));

        // Quy về cùng đơn vị giây, vì phim lẻ lưu progressMinutes còn phim
        // bộ lưu progressSeconds.
        const currentTime = isTv
          ? item.progressSeconds ?? 0
          : (item.progressMinutes ?? 0) * 60;

        // Tổng thời lượng: phim bộ có sẵn episodeRuntime (phút) trong chính
        // history DTO; phim lẻ phải tra chéo qua danh sách movies đã fetch
        // vì WatchHistoryDTO không trả Duration.
        const durationMinutes = isTv
          ? item.episodeRuntime
          : meta?.duration;
        const duration = durationMinutes ? durationMinutes * 60 : null;

        const progress = duration
          ? Math.min(100, Math.round((currentTime / duration) * 100))
          : null;
        const remainingMinutes = duration
          ? Math.max(0, Math.round((duration - currentTime) / 60))
          : null;

        return {
          id,
          historyId: item.id,
          title: isTv ? item.tvShowTitle : item.movieTitle,
          posterUrl: item.posterUrl || meta?.posterUrl,
          backdropUrl: meta?.backdropUrl || item.posterUrl || meta?.posterUrl,
          isTvShow: isTv,
          episodeId: item.episodeId,
          season: item.seasonNumber,
          episode: item.episodeNumber,
          currentTime,
          duration,
          progress,
          remainingMinutes,
          watchedAt: item.watchedAt,
        };
      })
      .filter((i) => Boolean(i.id && i.title));

    // TvShowWatchHistory trả 1 dòng / tập đã xem, không phải 1 dòng / show —
    // nên 1 show xem nhiều tập sẽ tạo nhiều item trùng tvShowId, gây trùng
    // key "tv-{id}" khi ContinueWatchingSection render. Dedupe theo
    // (isTvShow, id), giữ bản ghi đầu tiên vì watchHistory đã được sort mới
    // nhất trước (combinedHistory sort theo watchedAt desc).
    const seenKeys = new Set();
    return mapped.filter((item) => {
      const dedupeKey = `${item.isTvShow ? "tv" : "mv"}-${item.id}`;
      if (seenKeys.has(dedupeKey)) return false;
      seenKeys.add(dedupeKey);
      return true;
    });
  }, [watchHistory, movies, tvShows]);

  const handleRemoveHistory = useCallback(async (item) => {
    // Xóa lạc quan khỏi UI trước, rollback nếu API lỗi.
    setWatchHistory((prev) =>
      prev.filter((h) => String(h.id) !== String(item.historyId))
    );

    try {
      if (item.isTvShow) {
        await tvShowService.deleteWatchHistory(item.historyId);
      } else {
        await movieService.deleteWatchHistory(item.historyId);
      }
    } catch (err) {
      console.error("Error deleting watch history:", err);
      // Rollback: tải lại lịch sử xem thật từ server thay vì tự chèn lại
      // item cũ (tránh lệch dữ liệu nếu có thay đổi khác xảy ra song song).
      const [historyData, tvHistoryData] = await Promise.all([
        movieService.getWatchHistory().catch(() => []),
        tvShowService.getWatchHistory?.().catch(() => []) ??
          Promise.resolve([]),
      ]);
      const rawMovieHistory = Array.isArray(historyData)
        ? historyData
        : historyData?.data || historyData?.history || [];
      const rawTvHistory = Array.isArray(tvHistoryData)
        ? tvHistoryData
        : tvHistoryData?.data || tvHistoryData?.history || [];
      setWatchHistory(
        [
          ...rawMovieHistory.map((h) => ({ ...h, isTvShow: false })),
          ...rawTvHistory.map((h) => ({ ...h, isTvShow: true })),
        ].sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
      );
    }
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const highlyRated = useMemo(() => byRating(movies).slice(0, 20), [movies]);
  const newest = useMemo(() => byNewest(movies).slice(0, 20), [movies]);
  const reviewMovies = useMemo(() => byRating(movies).slice(0, 6), [movies]);

  const tvTopRated = useMemo(() => byRating(tvShows).slice(0, 20), [tvShows]);
  const tvNewest = useMemo(() => byNewest(tvShows).slice(0, 20), [tvShows]);

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

  if (error) return <ErrorScreen message={error} onRetry={handleRetry} />;

  return (
    <>
      <AnimatePresence>
        {loading && <LoadingScreen key="loading-screen" />}
      </AnimatePresence>

      {!loading && (
        <div
          style={{
            minHeight: "100vh",
            background: C.bg,
            color: C.text,
            overflowX: "hidden",
            position: "relative",
          }}
        >
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
            </motion.div>

            <>
              <div
                style={{
                  padding: isMobile ? "8px 16px 40px" : "8px 48px 56px",
                }}
              >
                {/* ── Tiếp tục xem (Ưu tiên đầu bảng khi có lịch sử xem dở) ── */}
                {continueWatchingList.length > 0 && (
                  <SectionReveal variant="slide-right" divider>
                    <ContinueWatchingSection
                      items={continueWatchingList}
                      onRemoveItem={handleRemoveHistory}
                      onSeeAll={() => navigate("/watch-history")}
                    />
                  </SectionReveal>
                )}

                {/* ── Top 10 ── */}
                <SectionReveal variant="bounce" margin="-120px" divider>
                  <TopRankedRow
                    title="Top 10 Hôm Nay"
                    movies={highlyRated}
                    tvShows={tvTopRated}
                    onFavoriteToggle={toggleFavorite}
                    isFavorited={isFavorited}
                  />
                </SectionReveal>

                {/* ── Trailer Mới Cập Nhật ── */}
                {uploadedTrailers.length > 0 && (
                  <SectionReveal variant="scale-fade" margin="-100px" divider>
                    <TrailerShowcaseSection items={uploadedTrailers} />
                  </SectionReveal>
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
                <SectionReveal variant="slide-right" divider>
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

                {/* ── TV Series Nổi Bật ── */}
                {tvTopRated.length > 0 && (
                  <SectionReveal variant="slide-left" divider>
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
                )}

                {/* ── Phim Mới Ra Mắt ── */}
                <SectionReveal variant="slide-right" divider>
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

                {/* ── Series Mới Nhất ── */}
                {tvNewest.length > 0 && (
                  <SectionReveal variant="slide-left" divider>
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
                )}

                {/* ── Dành Cho Bạn (Showcase Studio Layout) ── */}
                {forYouLoading && forYou.length === 0 ? (
                  <div style={{ marginBottom: 56 }}>
                    {/* Header Skeleton */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.06)",
                        }}
                      />
                      <div
                        style={{
                          height: 24,
                          width: 220,
                          borderRadius: 6,
                          background: "rgba(255,255,255,0.06)",
                        }}
                      />
                    </div>

                    {/* Showcase Container Skeleton */}
                    {!isMobile ? (
                      <div
                        style={{
                          borderRadius: 24,
                          background: "rgba(255,255,255,0.02)",
                          padding: "36px 36px 30px 36px",
                          display: "grid",
                          gridTemplateColumns: "300px 1fr",
                          gap: 40,
                          animation: "pulse 1.6s ease-in-out infinite",
                        }}
                      >
                        {/* Cột trái: Poster đứng 2:3 */}
                        <div
                          style={{
                            width: "100%",
                            aspectRatio: "2 / 3",
                            borderRadius: 20,
                            background: "rgba(255,255,255,0.04)",
                          }}
                        />

                        {/* Cột phải: Content + 5 Card bên dưới */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                marginBottom: 14,
                              }}
                            >
                              <div
                                style={{
                                  height: 22,
                                  width: 150,
                                  borderRadius: 999,
                                  background: "rgba(255,255,255,0.05)",
                                }}
                              />
                              <div
                                style={{
                                  height: 22,
                                  width: 170,
                                  borderRadius: 999,
                                  background: "rgba(255,255,255,0.05)",
                                }}
                              />
                            </div>
                            <div
                              style={{
                                height: 36,
                                width: "65%",
                                borderRadius: 8,
                                background: "rgba(255,255,255,0.06)",
                                marginBottom: 16,
                              }}
                            />
                            <div
                              style={{
                                height: 18,
                                width: "35%",
                                borderRadius: 6,
                                background: "rgba(255,255,255,0.04)",
                                marginBottom: 16,
                              }}
                            />
                            <div
                              style={{
                                height: 14,
                                width: "85%",
                                borderRadius: 4,
                                background: "rgba(255,255,255,0.03)",
                                marginBottom: 8,
                              }}
                            />
                            <div
                              style={{
                                height: 14,
                                width: "70%",
                                borderRadius: 4,
                                background: "rgba(255,255,255,0.03)",
                                marginBottom: 24,
                              }}
                            />
                            <div style={{ display: "flex", gap: 12 }}>
                              <div
                                style={{
                                  height: 42,
                                  width: 130,
                                  borderRadius: 999,
                                  background: "rgba(255,255,255,0.08)",
                                }}
                              />
                              <div
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: "50%",
                                  background: "rgba(255,255,255,0.05)",
                                }}
                              />
                              <div
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: "50%",
                                  background: "rgba(255,255,255,0.05)",
                                }}
                              />
                            </div>
                          </div>

                          {/* Hàng 5 Card mini bên dưới */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(5, 1fr)",
                              gap: 12,
                              marginTop: 24,
                            }}
                          >
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                style={{
                                  height: 104,
                                  borderRadius: 14,
                                  background: "rgba(255,255,255,0.04)",
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Mobile Skeleton */
                      <div
                        style={{
                          borderRadius: 16,
                          background: "rgba(255,255,255,0.03)",
                          padding: 12,
                          display: "flex",
                          gap: 12,
                          animation: "pulse 1.6s ease-in-out infinite",
                        }}
                      >
                        <div
                          style={{
                            width: 90,
                            aspectRatio: "2 / 3",
                            borderRadius: 10,
                            background: "rgba(255,255,255,0.05)",
                          }}
                        />
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              height: 16,
                              width: "45%",
                              borderRadius: 4,
                              background: "rgba(255,255,255,0.05)",
                            }}
                          />
                          <div
                            style={{
                              height: 20,
                              width: "80%",
                              borderRadius: 6,
                              background: "rgba(255,255,255,0.06)",
                            }}
                          />
                          <div
                            style={{
                              height: 14,
                              width: "60%",
                              borderRadius: 4,
                              background: "rgba(255,255,255,0.04)",
                            }}
                          />
                          <div
                            style={{
                              height: 32,
                              width: "100%",
                              borderRadius: 8,
                              background: "rgba(255,255,255,0.06)",
                              marginTop: "auto",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <SectionReveal variant="scale-fade" divider>
                    <RecommendSection
                      subtitle={forYouLabel}
                      items={forYou}
                      onFavoriteToggle={toggleFavorite}
                      isFavorited={isFavorited}
                      favoritedIds={Array.from(favorites)}
                    />
                  </SectionReveal>
                )}

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
                    transition={{
                      duration: 0.35,
                      ease: [0.215, 0.61, 0.355, 1],
                    }}
                    style={{
                      position: "fixed",
                      bottom: 0,
                      right: 0,
                      zIndex: 50,
                    }}
                  >
                    <AiChatWidget />
                  </motion.div>
                )}
              </AnimatePresence>
              <Footer />
            </>
          </div>

          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 0.4; }
              50%       { opacity: 0.8; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}