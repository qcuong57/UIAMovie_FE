// src/pages/home/HomePage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  CalendarDays,
  Tv,
  Crown,
  Timer,
  History,
  Flame,
  Heart,
} from "lucide-react";
import UpcomingSection from "../../components/home/UpcomingSection";
import HeroBanner from "../../components/layout/HeroBanner";
import Footer from "../../components/layout/Footer";
import authService from "../../services/authService";
import {
  useTrendingMovies,
  useTopTvShows,
  useLatestMovies,
  useLatestTvShows,
  useGenres,
  useWatchHistory,
  useRemoveWatchHistory,
} from "../../hooks/home/useHomeQueries";
import AiChatWidget from "../../components/ai/AiChatWidget";
import ContinueWatchingSection from "../../components/home/ContinueWatchingSection";
import SeoMeta from "../../components/common/SeoMeta";
import {
  SITE_URL,
  SITE_TITLE,
  SITE_DESCRIPTION,
  SITE_DEFAULT_IMAGE,
  SITE_ALT_NAMES,
  absoluteUrl,
} from "../../config/seo";

import {
  C,
  FONT_BODY,
  FONT_DISPLAY,
  GOOGLE_FONTS,
} from "../../context/homeTokens";
import { useIsMobile } from "../../hooks/common/useIsMobile";
import { mediaKey } from "../../utils/normalizeMedia";
import GenreSection from "../../components/home/GenreSection";
import TopRankedRow from "../../components/home/TopRankedRow";
import MovieRow from "../../components/home/MovieRow";
import CountryMovieRows from "../../components/home/CountryMovieRows";
import TrailerShowcaseSection from "../../components/home/TrailerShowcaseSection";
import UserReviewsSection from "../../components/home/UserReviewsSection";
import RecommendSection from "../../components/home/RecommendSection";
import HomeReveal, { HOME_EASE } from "../../motion-configs/HomeReveal";
import HomeSections from "../../components/home/sections/HomeSections";
import { LoadingScreen } from "../../components/ui";
import { useHomeSections } from "../../hooks/home/useHomeSections";

const EMPTY = [];

// Thời gian tối thiểu hiện loading screen (ms): "UIAMOVIE" 8 ký tự × 90ms ≈ 720ms + nhịp dừng ngắn
const MIN_LOADING_MS = 1100;

const byRating = (arr) =>
  [...arr].sort((a, b) => (b.rating || 0) - (a.rating || 0));
const byNewest = (arr) =>
  [...arr].sort((a, b) => (b.year || 0) - (a.year || 0));

// ─── Client-side fallback recommend ──────────────────────────────────────────
const buildForYouFallback = (allItems, watchHistory, highlyRated) => {
  if (!allItems.length) return [];

  // Khoá gồm cả loại (phim / TV show) để id trùng nhau giữa hai loại không bị nhầm
  const watchedIds = new Set(
    watchHistory.map((h) =>
      mediaKey({
        isTvShow: Boolean(h.isTvShow),
        id: h.isTvShow ? h.tvShowId : h.movieId,
      }),
    ),
  );
  const top10Ids = new Set(highlyRated.slice(0, 10).map(mediaKey));

  if (!watchedIds.size) {
    return byRating(allItems)
      .filter((m) => !top10Ids.has(mediaKey(m)))
      .slice(0, 20);
  }

  const genreFreq = {};
  allItems
    .filter((m) => watchedIds.has(mediaKey(m)))
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
  const candidates = allItems.filter((m) => !watchedIds.has(mediaKey(m)));
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
    const usedIds = new Set(meaningful.map(mediaKey));
    const filler = byRating(candidates)
      .filter((m) => !usedIds.has(mediaKey(m)))
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
  const isMobile = useIsMobile();
  const [pastBanner, setPastBanner] = useState(false);

  // ── Dữ liệu (TanStack Query): mỗi nguồn tải độc lập, có cache, quay lại trang là hiện ngay ──
  const trendingQ = useTrendingMovies();
  const tvTopQ = useTopTvShows();
  const genresQ = useGenres();
  // Hai danh sách 100 phần tử chỉ phục vụ phần dưới màn hình (trailer, tra ảnh cho gợi ý):
  // chờ Hero tải xong rồi mới tải để không tranh băng thông với nội dung đầu trang.
  const lowPriority = { enabled: trendingQ.isSuccess || trendingQ.isError };
  const latestMoviesQ = useLatestMovies(lowPriority);
  const latestTvQ = useLatestTvShows(lowPriority);
  const historyQ = useWatchHistory();
  // Các khối admin cấu hình: gọi ngay khi trang mount (song song với trending) để HomeSections
  // đọc từ cache, không phải đợi loading screen tắt mới bắt đầu gọi API.
  const homeSectionsQ = useHomeSections();
  const { mutate: removeHistory } = useRemoveWatchHistory();

  const movies = trendingQ.data ?? EMPTY;
  const tvShows = tvTopQ.data ?? EMPTY;
  const genres = genresQ.data ?? EMPTY;
  const trailerSourceMovies = latestMoviesQ.data ?? EMPTY;
  const trailerSourceTvShows = latestTvQ.data ?? EMPTY;
  const watchHistory = historyQ.data;

  // Loading screen hiện MỖI LẦN vào trang chủ: giữ tối thiểu MIN_LOADING_MS để chữ UIAMOVIE
  // gõ xong rồi mới "kéo rèm", kể cả khi dữ liệu đã có sẵn trong cache.
  // HomePage unmount khi rời trang nên state này tự reset ở lần vào kế tiếp.
  const [minLoadingDone, setMinLoadingDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinLoadingDone(true), MIN_LOADING_MS);
    return () => clearTimeout(t);
  }, []);

  // Chỉ phim thịnh hành là bắt buộc (HeroBanner); các phần còn lại tải xong tới đâu hiện tới đó
  // Chờ cả khối admin để chúng hiện cùng lúc với các hàng khác, không chen vào làm trang bị đẩy xuống
  const loading =
    trendingQ.isLoading || homeSectionsQ.isLoading || !minLoadingDone;
  const error =
    trendingQ.isError && !trendingQ.data
      ? trendingQ.error?.message || "Không thể tải dữ liệu"
      : null;

  // Chỉ trending là bắt buộc → chỉ refetch đúng query đó, các query khác tự lo
  const { refetch: refetchTrending } = trendingQ;
  const handleRetry = useCallback(() => {
    refetchTrending();
  }, [refetchTrending]);

  // Làm mới trạng thái Premium một lần khi vào trang (không chặn việc tải dữ liệu)
  useEffect(() => {
    if (authService.isLoggedIn()) authService.refreshPremiumStatus();
  }, []);

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

  // Gợi ý AI do chính RecommendSection gọi (/recommendation/personalized).
  // Ở đây chỉ dựng danh sách fallback phía client, dùng khi AI chưa có dữ liệu.
  const forYou = useMemo(() => {
    const allItems = [...movies, ...tvShows];
    const topRated = byRating(allItems).slice(0, 20);
    return buildForYouFallback(allItems, watchHistory, topRated);
  }, [movies, tvShows, watchHistory]);

  const forYouLabel =
    watchHistory.length > 0 ? "Dựa trên lịch sử xem của bạn" : "Khám phá thêm";

  const continueWatchingList = useMemo(() => {
    const movieMap = new Map(movies.map((m) => [String(m.id), m]));
    const tvMap = new Map(tvShows.map((s) => [String(s.id), s]));

    const mapped = (watchHistory || [])
      .map((item) => {
        const isTv = Boolean(item.isTvShow);
        const id = isTv ? item.tvShowId : item.movieId;
        const meta = isTv ? tvMap.get(String(id)) : movieMap.get(String(id));

        const currentTime = isTv
          ? (item.progressSeconds ?? 0)
          : (item.progressMinutes ?? 0) * 60;

        const durationMinutes = isTv ? item.episodeRuntime : meta?.duration;
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

    const seenKeys = new Set();
    return mapped.filter((item) => {
      const dedupeKey = mediaKey(item);
      if (seenKeys.has(dedupeKey)) return false;
      seenKeys.add(dedupeKey);
      return true;
    });
  }, [watchHistory, movies, tvShows]);

  const handleRemoveHistory = useCallback(
    (item) => removeHistory(item),
    [removeHistory],
  );

  // ── Derived data ─────────────────────────────────────────────────────────────
  const highlyRated = useMemo(() => byRating(movies).slice(0, 20), [movies]);
  const newest = useMemo(() => byNewest(movies).slice(0, 20), [movies]);

  const tvTopRated = useMemo(() => byRating(tvShows).slice(0, 20), [tvShows]);
  const tvNewest = useMemo(() => byNewest(tvShows).slice(0, 20), [tvShows]);

  // Nguồn tra cứu ảnh/metadata đầy đủ cho RecommendSection (item AI từ BE có thể thiếu ảnh)
  const recommendLookupMovies = useMemo(
    () => [...trailerSourceMovies, ...movies],
    [trailerSourceMovies, movies],
  );
  const recommendLookupTvShows = useMemo(
    () => [...trailerSourceTvShows, ...tvShows],
    [trailerSourceTvShows, tvShows],
  );

  // ── Kho nội dung gộp (đã khử trùng lặp) để dựng các hàng phụ ────────────────
  const pool = useMemo(() => {
    const seen = new Set();
    return [
      ...movies,
      ...tvShows,
      ...trailerSourceMovies,
      ...trailerSourceTvShows,
    ].filter((i) => {
      const k = mediaKey(i);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [movies, tvShows, trailerSourceMovies, trailerSourceTvShows]);

  // Sắp chiếu: gần ngày khởi chiếu nhất đứng trước
  const upcoming = useMemo(
    () =>
      pool
        .filter((i) => i.isUpcoming)
        .sort(
          (a, b) =>
            new Date(a.releaseDate || 0).getTime() -
            new Date(b.releaseDate || 0).getTime(),
        )
        .slice(0, 12),
    [pool],
  );

  // Premium độc quyền
  const premiumPicks = useMemo(
    () =>
      byRating(pool.filter((i) => i.isPremium && !i.isUpcoming)).slice(0, 20),
    [pool],
  );

  // Xem nhanh: phim ≤ 100 phút
  const quickWatch = useMemo(
    () =>
      byRating(
        pool.filter(
          (i) =>
            !i.isTvShow && i.duration > 0 && i.duration <= 100 && !i.isUpcoming,
        ),
      ).slice(0, 20),
    [pool],
  );

  // Đang hot tuần này: theo lượt xem 30 ngày / điểm trending nếu BE có trả về
  const hotThisWeek = useMemo(() => {
    const score = (i) => i.views30d ?? i.trendingScore ?? 0;
    return pool
      .filter((i) => score(i) > 0 && !i.isUpcoming)
      .sort((a, b) => score(b) - score(a))
      .slice(0, 20);
  }, [pool]);

  // Thể loại yêu thích: thể loại xuất hiện nhiều nhất trong lịch sử xem
  const favoriteGenre = useMemo(() => {
    const nameOf = (g) => (typeof g === "string" ? g : g?.name || "");
    const watchedKeys = new Set(continueWatchingList.map(mediaKey));
    const freq = new Map();
    pool
      .filter((i) => watchedKeys.has(mediaKey(i)))
      .forEach((i) =>
        (i.genres || []).forEach((g) => {
          const n = nameOf(g);
          if (n) freq.set(n, (freq.get(n) || 0) + 1);
        }),
      );
    const top = [...freq.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!top) return null;
    const items = byRating(
      pool.filter(
        (i) =>
          !watchedKeys.has(mediaKey(i)) &&
          !i.isUpcoming &&
          (i.genres || []).some((g) => nameOf(g) === top[0]),
      ),
    ).slice(0, 20);
    return items.length >= 4 ? { name: top[0], items } : null;
  }, [continueWatchingList, pool]);

  // "Vì bạn đã xem X": lấy phim xem gần nhất, tìm nội dung cùng thể loại
  const becauseYouWatched = useMemo(() => {
    const last = continueWatchingList[0];
    if (!last) return null;
    const base = pool.find((i) => mediaKey(i) === mediaKey(last));
    const genreKey = (g) =>
      (typeof g === "string" ? g : g?.name || g?.id || "").toLowerCase();
    const baseGenres = new Set(
      (base?.genres || []).map(genreKey).filter(Boolean),
    );
    if (!baseGenres.size) return null;
    const items = byRating(
      pool.filter(
        (i) =>
          mediaKey(i) !== mediaKey(last) &&
          !i.isUpcoming &&
          (i.genres || []).some((g) => baseGenres.has(genreKey(g))),
      ),
    ).slice(0, 20);
    return items.length >= 4 ? { title: last.title, items } : null;
  }, [continueWatchingList, pool]);

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

  // ── Schema JSON-LD cho Trang Chủ (Đồng bộ Domain Vercel) ─────────────────────
  const homeSchema = useMemo(() => {
    const topItems = [...highlyRated, ...tvTopRated].slice(0, 10);

    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          url: SITE_URL,
          name: "UIAMovie",
          alternateName: SITE_ALT_NAMES,
          inLanguage: "vi-VN",
          publisher: { "@id": `${SITE_URL}/#organization` },
          description: SITE_DESCRIPTION,
        },
        {
          "@type": "ItemList",
          "@id": `${SITE_URL}/#trending`,
          name: "Phim & Series Thịnh Hành",
          description:
            "Top phim chiếu rạp và phim bộ được xem nhiều nhất trên UIAMovie",
          numberOfItems: topItems.length,
          itemListElement: topItems.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": item.isTvShow ? "TVSeries" : "Movie",
              name: item.title,
              image: absoluteUrl(item.posterUrl || item.backdropUrl),
              url: `${SITE_URL}/${item.isTvShow ? "tvshow" : "movie"}/${item.id}`,
            },
          })),
        },
      ],
    };
  }, [highlyRated, tvTopRated]);

  // Ảnh đại diện OpenGraph cho Vercel preview
  const ogImage = useMemo(() => {
    return movies[0]?.backdropUrl || movies[0]?.posterUrl || SITE_DEFAULT_IMAGE;
  }, [movies]);

  if (error) return <ErrorScreen message={error} onRetry={handleRetry} />;

  return (
    <>
      {/* ── Thẻ SEO Meta & OpenGraph & JSON-LD ── */}
      <SeoMeta
        title={SITE_TITLE}
        description={SITE_DESCRIPTION}
        image={ogImage}
        url="/"
        schemaData={homeSchema}
      />

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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: HOME_EASE }}
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
                {/* ── Tiếp tục xem ── */}
                {continueWatchingList.length > 0 && (
                  <HomeReveal variant="row" divider>
                    <ContinueWatchingSection
                      items={continueWatchingList}
                      onRemoveItem={handleRemoveHistory}
                      onSeeAll={() => navigate("/watch-history")}
                    />
                  </HomeReveal>
                )}
                {/* ── Trailer Mới Cập Nhật ──
                {uploadedTrailers.length > 0 && (
                  <HomeReveal variant="spotlight" divider>
                    <TrailerShowcaseSection items={uploadedTrailers} />
                  </HomeReveal>
                )} */}

                {/* ── Top 10 ── */}
                <HomeReveal variant="feature" divider>
                  <TopRankedRow
                    title="Top 10 Hôm Nay"
                    movies={highlyRated}
                    tvShows={tvTopRated}
                  />
                </HomeReveal>

                {/* ── Các khối do admin cấu hình (Quản lý trang chủ) ── */}
                <HomeSections />

                <CountryMovieRows />

                {/* ── Được Đánh Giá Cao ── */}
                <HomeReveal variant="row" divider>
                  <MovieRow
                    title="Phim Được Đánh Giá Cao"
                    movies={highlyRated}
                    accentColor="#f5c518"
                    seeAllSort="rating"
                    badge={{ icon: Star, text: "Đánh giá cao" }}
                  />
                </HomeReveal>

                {/* ── TV Series Nổi Bật ── */}
                {tvTopRated.length > 0 && (
                  <HomeReveal variant="row" divider>
                    <MovieRow
                      title="TV Series Nổi Bật"
                      items={tvTopRated}
                      accentColor="#818cf8"
                      seeAllPath="/browse/tvshows?sort=rating"
                      badge={{ icon: Tv, text: "TV Show" }}
                    />
                  </HomeReveal>
                )}

                {/* ── Phim Mới Ra Mắt ── */}
                <HomeReveal variant="row" divider>
                  <MovieRow
                    title="Phim Mới Ra Mắt"
                    movies={newest}
                    accentColor="#38bdf8"
                    seeAllSort="releaseDate"
                    badge={{ icon: CalendarDays, text: "Mới nhất" }}
                  />
                </HomeReveal>

                {/* ── Series Mới Nhất ── */}
                {tvNewest.length > 0 && (
                  <HomeReveal variant="row" divider>
                    <MovieRow
                      title="Series Mới Nhất"
                      items={tvNewest}
                      accentColor="#34d399"
                      seeAllPath="/browse/tvshows?sort=firstAirDate"
                      badge={{ icon: CalendarDays, text: "Mới nhất" }}
                    />
                  </HomeReveal>
                )}

                {/* ── Top 10 TV Series ── */}
                {tvTopRated.length >= 3 && (
                  <HomeReveal variant="feature" divider>
                    <TopRankedRow
                      title="Top 10 TV Series"
                      badgeText="Series"
                      items={tvTopRated}
                    />
                  </HomeReveal>
                )}

                {/* ── Đang hot tuần này ── */}
                {hotThisWeek.length >= 5 && (
                  <HomeReveal variant="row" divider>
                    <MovieRow
                      title="Đang Hot Tuần Này"
                      items={hotThisWeek}
                      accentColor="#fb923c"
                      badge={{ icon: Flame, text: "Hot" }}
                    />
                  </HomeReveal>
                )}

                {/* ── Thể loại yêu thích ── */}
                {favoriteGenre && (
                  <HomeReveal variant="row" divider>
                    <MovieRow
                      title={`Vì Bạn Mê ${favoriteGenre.name}`}
                      items={favoriteGenre.items}
                      accentColor="#a78bfa"
                      badge={{ icon: Heart, text: "Gu của bạn" }}
                    />
                  </HomeReveal>
                )}

                {/* ── Vì bạn đã xem ── */}
                {becauseYouWatched && (
                  <HomeReveal variant="row" divider>
                    <MovieRow
                      title={`Vì bạn đã xem "${becauseYouWatched.title}"`}
                      items={becauseYouWatched.items}
                      accentColor="#fb7185"
                      badge={{ icon: History, text: "Cùng thể loại" }}
                    />
                  </HomeReveal>
                )}

                {/* ── Sắp chiếu ── */}
                {upcoming.length > 0 && (
                  <HomeReveal variant="spotlight" divider>
                    <UpcomingSection items={upcoming} />
                  </HomeReveal>
                )}

                {/* ── Premium độc quyền ── */}
                {premiumPicks.length > 0 && (
                  <HomeReveal variant="row" divider>
                    <MovieRow
                      title="Premium Độc Quyền"
                      items={premiumPicks}
                      accentColor="#f5c518"
                      badge={{ icon: Crown, text: "Premium" }}
                    />
                  </HomeReveal>
                )}

                {/* ── Xem nhanh ── */}
                {quickWatch.length > 0 && (
                  <HomeReveal variant="row" divider>
                    <MovieRow
                      title="Xem Nhanh Dưới 100 Phút"
                      items={quickWatch}
                      accentColor="#2dd4bf"
                      badge={{ icon: Timer, text: "Gọn gàng" }}
                    />
                  </HomeReveal>
                )}

                {/* ── Dành Cho Bạn ── */}
                <HomeReveal variant="spotlight" divider>
                  <RecommendSection
                    subtitle={forYouLabel}
                    items={forYou}
                    movies={recommendLookupMovies}
                    tvShows={recommendLookupTvShows}
                  />
                </HomeReveal>

                {/* ── User Reviews ── */}
                <HomeReveal variant="fade">
                  <UserReviewsSection
                    onMovieClick={(id) => navigate(`/movie/${id}`)}
                  />
                </HomeReveal>
              </div>

              {/* ── AI CHAT WIDGET: LUÔN MOUNT ĐỂ BẢO TOÀN LỊCH SỬ TIN NHẮN ── */}
              {/* Widget tự render qua portal (thoát khỏi transform của wrapper,
                  nổi trên bottom nav). `visible` điều khiển hiện/ẩn FAB. */}
              <AiChatWidget visible={pastBanner} />

              <Footer />
            </>
          </div>
        </div>
      )}
    </>
  );
}