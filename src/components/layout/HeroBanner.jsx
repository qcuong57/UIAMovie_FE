// src/components/HeroBanner.jsx
// Hỗ trợ cả Movie lẫn TV Show — cùng pattern với CountryMovieRows

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Info,
  Star,
  ChevronLeft,
  ChevronRight,
  Tv,
  Film,
  Crown,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "../../hooks/useIsMobile";
import movieService from "../../services/movieService";
import tvShowService from "../../services/tvShowService";
import { createPortal } from "react-dom";
import PremiumGateModal from "../movie/ui/PremiumGateModal";

// ── Premium helpers ────────────────────────────────────────────────
function getCurrentUser() {
  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function userHasPremium(user) {
  if (!user) return false;
  return (
    user.isPremium === true ||
    user.plan === "premium" ||
    user.subscription?.active === true
  );
}

const AUTO_PLAY_INTERVAL = 6000;

// ── Normalize movie ────────────────────────────────────────────
const normalizeMovie = (m) => ({
  id: m.id,
  title: m.title,
  releaseDate: m.releaseDate ?? null,
  year: m.releaseDate
    ? new Date(m.releaseDate).getFullYear()
    : (m.year ?? null),
  rating: m.rating ?? m.imdbRating ?? 0,
  posterUrl: m.posterUrl ?? null,
  backdropUrl: m.backdropUrl ?? null,
  genres: m.genres ?? [],
  description: m.description ?? "",
  duration: m.duration ?? null,
  isPremium: m.isPremium ?? false,
  isTvShow: false,
});

// ── Normalize TV show ──────────────────────────────────────────
const normalizeTvShow = (s) => ({
  id: s.id,
  title: s.title ?? s.name,
  releaseDate: s.firstAirDate ?? null,
  year: s.firstAirDate
    ? new Date(s.firstAirDate).getFullYear()
    : (s.year ?? null),
  rating: s.rating ?? s.voteAverage ?? 0,
  posterUrl: s.posterUrl ?? null,
  backdropUrl: s.backdropUrl ?? null,
  genres: s.genres ?? [],
  description: s.description ?? s.overview ?? "",
  duration: null,
  isPremium: s.isPremium ?? false,
  isTvShow: true,
});

// ── Helper: extract items từ mọi dạng response ────────────────
const extractItems = (res, normalize) => {
  if (!res) return [];
  let raw = [];
  if (Array.isArray(res)) raw = res;
  else if (Array.isArray(res?.items)) raw = res.items;
  else if (Array.isArray(res?.data?.items)) raw = res.data.items;
  else if (Array.isArray(res?.movies)) raw = res.movies;
  else if (Array.isArray(res?.tvShows)) raw = res.tvShows;
  else if (Array.isArray(res?.data?.movies)) raw = res.data.movies;
  else if (Array.isArray(res?.data?.tvShows)) raw = res.data.tvShows;
  else if (Array.isArray(res?.data)) raw = res.data;
  return raw.map(normalize);
};

// ── Sort key an toàn ──────────────────────────────────────────
// KHÔNG dùng new Date(year) vì new Date(2024) = năm 1970 (milliseconds)!
const sortKey = (item) => {
  if (item.releaseDate) return new Date(item.releaseDate).getTime();
  if (item.year) return item.year; // so sánh số năm trực tiếp
  return 0;
};

// ── Kiểm tra phim/TV show đã phát hành hay chưa ─────────────────
// Chặn phim "sắp chiếu" lọt vào banner dù dữ liệu đến từ props hay
// từ API (phòng trường hợp isUpcoming ở backend không được áp dụng
// đúng, hoặc component được dùng với dữ liệu truyền tay).
const isReleased = (item) => {
  if (!item.releaseDate) return true; // không có ngày → không loại, coi như đã phát hành
  const releaseTime = new Date(item.releaseDate).getTime();
  if (Number.isNaN(releaseTime)) return true; // ngày không hợp lệ → không loại
  return releaseTime <= Date.now();
};

// ─────────────────────────────────────────────────────────────────
const HeroBanner = ({ movie, movies, tvShows }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [fetchedMovies, setFetchedMovies] = useState([]);
  const [fetchedTvShows, setFetchedTvShows] = useState([]);

  // Tự fetch Movies nếu không có prop (đối xứng với TV shows bên dưới)
  // isUpcoming: false → chỉ lấy phim ĐÃ phát hành, khớp với FilterMoviesDTO.IsUpcoming
  useEffect(() => {
    if (movies != null || movie != null) return;
    movieService
      .getMovies({
        pageSize: 10,
        sortBy: "rating",
        sortDesc: true,
        isUpcoming: false,
      })
      .then((res) => setFetchedMovies(extractItems(res, normalizeMovie)))
      .catch(() => setFetchedMovies([]));
  }, [movies, movie]);

  // Tự fetch TV shows nếu không có prop
  useEffect(() => {
    if (tvShows != null) return;
    tvShowService
      .getTvShows({
        pageSize: 10,
        sortBy: "rating",
        sortDesc: true,
        isUpcoming: false,
      })
      .then((res) => setFetchedTvShows(extractItems(res, normalizeTvShow)))
      .catch(() => setFetchedTvShows([]));
  }, [tvShows]);

  const slides = useMemo(() => {
    const normalizedMovies =
      movies != null
        ? extractItems(movies, normalizeMovie)
        : movie
          ? [normalizeMovie(movie)]
          : fetchedMovies;

    const normalizedTvShows =
      tvShows != null ? extractItems(tvShows, normalizeTvShow) : fetchedTvShows;

    console.log(
      "[HeroBanner] raw movies:",
      normalizedMovies.length,
      "raw tvShows:",
      normalizedTvShows.length,
    );

    // Lấy top 3 movies + top 2 TV shows để đảm bảo mix đều
    // Luôn loại phim/TV show "sắp chiếu" (releaseDate > hiện tại) khỏi banner,
    // banner chỉ hiển thị nội dung đang chiếu / đã phát hành.
    const topMovies = normalizedMovies
      .filter((i) => !!i.backdropUrl && isReleased(i))
      .sort((a, b) => sortKey(b) - sortKey(a))
      .slice(0, 3);
    const topTvShows = normalizedTvShows
      .filter((i) => !!i.backdropUrl && isReleased(i))
      .sort((a, b) => sortKey(b) - sortKey(a))
      .slice(0, 2);

    // Xen kẽ: movie, tvshow, movie, tvshow, movie
    const mixed = [];
    const maxLen = Math.max(topMovies.length, topTvShows.length);
    for (let i = 0; i < maxLen; i++) {
      if (topMovies[i]) mixed.push(topMovies[i]);
      if (topTvShows[i]) mixed.push(topTvShows[i]);
    }

    const result = mixed.slice(0, 5);
    console.log(
      "[HeroBanner] slides:",
      result.map((s) => `${s.isTvShow ? "TV" : "MV"} ${s.title} (${s.year})`),
    );
    return result;
  }, [movies, movie, fetchedMovies, tvShows, fetchedTvShows]);

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  useEffect(() => {
    setCurrent(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goTo = (idx) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  };
  const prev = () => {
    setDirection(-1);
    setCurrent((p) => (p - 1 + slides.length) % slides.length);
  };
  const next = () => {
    setDirection(1);
    setCurrent((p) => (p + 1) % slides.length);
  };

  const activeItem = slides[current];

  const slideVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 80 : -80 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -80 : 80 }),
  };

  if (!activeItem) return null;

  const detailPath = activeItem.isTvShow
    ? `/tvshow/${activeItem.id}`
    : `/movie/${activeItem.id}`;
  const infoPath = activeItem.isTvShow
    ? `/tvshow/${activeItem.id}/info`
    : `/movie/${activeItem.id}/info`;

  const isPremiumLocked =
    activeItem.isPremium && !userHasPremium(getCurrentUser());

  const handlePlay = () => {
    if (isPremiumLocked) {
      setShowPremiumGate(true);
      return;
    }
    navigate(detailPath);
  };

  return (
    <>
      <div
        className="relative bg-cover bg-center flex items-end overflow-hidden"
        style={{
          height: isMobile ? "75vh" : "100vh",
          minHeight: isMobile ? 480 : 520,
          maxHeight: isMobile ? 640 : "none",
        }}
      >
        {/* ── Background ── */}
        <AnimatePresence custom={direction} initial={false}>
          <motion.div
            key={activeItem.id}
            variants={{
              enter: () => ({ opacity: 0, scale: 1.08 }),
              center: { opacity: 1, scale: 1 },
              exit: () => ({ opacity: 0, scale: 1 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${activeItem.backdropUrl})` }}
          />
        </AnimatePresence>

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-transparent to-transparent pointer-events-none" />

        {/* ── Content ── */}
        <AnimatePresence custom={direction} initial={false} mode="wait">
          <motion.div
            key={activeItem.id + "-content"}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-10 w-full max-w-3xl"
            style={{
              paddingLeft: isMobile ? 16 : 32,
              paddingRight: isMobile ? 16 : 32,
              paddingBottom: isMobile ? 54 : 112,
            }}
          >
            {/* Type badge & Premium */}
            <div
              style={{
                marginBottom: isMobile ? 6 : 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: isMobile ? "2px 8px" : "4px 10px",
                  borderRadius: 99,
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  background: activeItem.isTvShow
                    ? "rgba(126,174,232,0.2)"
                    : "rgba(229,24,30,0.2)",
                  border: `1px solid ${activeItem.isTvShow ? "rgba(126,174,232,0.4)" : "rgba(229,24,30,0.4)"}`,
                  color: activeItem.isTvShow ? "#7eaee8" : "#ff3b42",
                  lineHeight: 1.4,
                }}
              >
                {activeItem.isTvShow ? (
                  <Tv size={11} strokeWidth={2.5} />
                ) : (
                  <Film size={11} strokeWidth={2.5} />
                )}
                {activeItem.isTvShow ? "TV Series" : "Movie"}
              </span>

              {/* Premium badge */}
              {activeItem.isPremium && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: isMobile ? "2px 8px" : "4px 10px",
                    borderRadius: 99,
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    background:
                      "linear-gradient(135deg, rgba(250,204,21,0.22), rgba(245,158,11,0.22))",
                    border: "1px solid rgba(250,204,21,0.5)",
                    color: "#fbbf24",
                    boxShadow: "0 0 12px rgba(250,204,21,0.18)",
                    lineHeight: 1.4,
                  }}
                >
                  <Crown size={10} fill="#fbbf24" color="#fbbf24" />
                  Premium
                </motion.span>
              )}
            </div>

            {/* Meta pills (Rating, Year, Duration, Genre) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                flexWrap: "wrap",
                marginBottom: isMobile ? 8 : 16,
              }}
            >
              {activeItem.rating > 0 && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: isMobile ? "2px 7px" : "4px 10px",
                    borderRadius: 99,
                    background: "rgba(245,197,24,0.15)",
                    border: "1px solid rgba(245,197,24,0.35)",
                    lineHeight: 1.3,
                  }}
                >
                  <Star
                    size={isMobile ? 11 : 12}
                    style={{ fill: "#f5c518", color: "#f5c518" }}
                  />
                  <span
                    style={{
                      fontSize: isMobile ? 11 : 13,
                      fontWeight: 700,
                      color: "#f5c518",
                    }}
                  >
                    {activeItem.rating}
                  </span>
                </div>
              )}

              {activeItem.year && (
                <span
                  style={{
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.75)",
                    padding: isMobile ? "2px 7px" : "4px 10px",
                    borderRadius: 99,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    lineHeight: 1.3,
                  }}
                >
                  {activeItem.year}
                </span>
              )}

              {activeItem.duration && !isMobile && !activeItem.isTvShow && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.6)",
                    padding: "4px 10px",
                    borderRadius: 99,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  {Math.floor(activeItem.duration / 60) > 0
                    ? `${Math.floor(activeItem.duration / 60)}g ${activeItem.duration % 60}p`
                    : `${activeItem.duration} phút`}
                </span>
              )}

              {activeItem.genres?.slice(0, isMobile ? 2 : 3).map((g) => (
                <span
                  key={g}
                  style={{
                    fontSize: isMobile ? 10.5 : 12,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.8)",
                    padding: isMobile ? "2px 8px" : "4px 10px",
                    borderRadius: 99,
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    lineHeight: 1.3,
                    whiteSpace: "nowrap",
                  }}
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1
              className="font-black leading-tight text-white drop-shadow-lg"
              style={{
                fontSize: isMobile
                  ? "clamp(20px, 5.5vw, 28px)"
                  : "clamp(36px, 5vw, 64px)",
                marginBottom: isMobile ? 6 : 14,
              }}
            >
              {activeItem.title}
            </h1>

            {/* Description */}
            <p
              style={{
                marginBottom: isMobile ? 14 : 28,
                fontSize: isMobile ? 12 : 15,
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.5,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: isMobile ? 2 : 3,
                WebkitBoxOrient: "vertical",
              }}
            >
              {activeItem.description}
            </p>

            {/* Buttons */}
            <div className="flex gap-2.5 md:gap-4 items-center">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handlePlay}
                className="font-bold rounded-lg flex items-center gap-1.5"
                style={{
                  padding: isMobile ? "7px 14px" : "11px 28px",
                  fontSize: isMobile ? 12.5 : 15,
                  background: isPremiumLocked
                    ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                    : "#ffffff",
                  color: isPremiumLocked ? "#1c1400" : "#000000",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: isPremiumLocked
                    ? "0 4px 16px rgba(251,191,36,0.35)"
                    : "none",
                }}
              >
                {isPremiumLocked ? (
                  <>
                    <Crown size={15} fill="#1c1400" color="#1c1400" /> Mở khoá
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" /> Phát
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(infoPath)}
                className="bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 flex items-center gap-1.5 border border-white/30"
                style={{
                  padding: isMobile ? "7px 14px" : "11px 28px",
                  fontSize: isMobile ? 12.5 : 15,
                }}
              >
                <Info size={16} />
                Chi tiết
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Dots + Prev/Next Controls ── */}
        {slides.length > 1 && (
          <div
            className="absolute z-20 flex items-center gap-3"
            style={{
              bottom: isMobile ? 14 : 28,
              right: isMobile ? "auto" : 32,
              left: isMobile ? 16 : "auto",
            }}
          >
            <div className="flex items-center gap-1.5">
              {slides.map((slide, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="relative overflow-hidden rounded-full transition-all duration-300"
                  style={{
                    width: i === current ? (isMobile ? 20 : 28) : 6,
                    height: 6,
                    background:
                      i === current
                        ? slide.isTvShow
                          ? "#7eaee8"
                          : "#e5181e"
                        : "rgba(255,255,255,0.3)",
                  }}
                >
                  {i === current && (
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ background: "rgba(255,255,255,0.4)" }}
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: AUTO_PLAY_INTERVAL / 1000,
                        ease: "linear",
                      }}
                      key={current}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {[
                { fn: prev, Icon: ChevronLeft },
                { fn: next, Icon: ChevronRight },
              ].map(({ fn, Icon }, i) => (
                <button
                  key={i}
                  onClick={fn}
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    backdropFilter: "blur(8px)",
                    color: "#fff",
                  }}
                >
                  <Icon size={14} strokeWidth={2.5} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {createPortal(
        <PremiumGateModal
          open={showPremiumGate}
          onClose={() => setShowPremiumGate(false)}
          movieTitle={activeItem?.title}
        />,
        document.body,
      )}
    </>
  );
};

export default HeroBanner;
