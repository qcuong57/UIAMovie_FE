// src/pages/MovieInfoPage.jsx
// Trang thông tin chi tiết phim — hiển thị trước khi vào xem phim
// Route: /movie/:id/info → /movie/:id (player)

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useMovie } from "../../hooks/useMediaDetail";
import { normalizeMovieInfo } from "../../utils/normalizeDetail";
import DetailPageError from "../../components/common/DetailPageError";
import SeoMeta from "../../components/common/SeoMeta";
import { buildMovieSeo } from "../../config/seo";
import BackdropCarousel from "../../components/movie/ui/BackdropCarousel";
import StarRating from "../../components/movie/ui/StarRating";
import TrailerModal from "../../components/movie/ui/TrailerModal";
import Skeleton from "../../components/movie/ui/Skeleton";
import {
  C,
  fmt,
  fmtRuntime,
  GLOBAL_STYLES,
} from "../../components/movie/ui/movieConstants";

// ── Extracted components ──────────────────────────────────────────
import MovieInfoHero from "../../components/movie/film/MovieInfoHero";
import MovieInfoTabs from "../../components/movie/film/MovieInfoTabs";

// ── Premium gate modal ────────────────────────────────────────────
import PremiumGateModal from "../../components/movie/ui/PremiumGateModal";

// ── Loading screen (full-page) ────────────────────────────────────
import LoadingScreen from "../../components/ui/LoadingScreen";
import { useFavoriteToggle } from "../../hooks/useFavorites";
import { userHasPremium } from "../../utils/premium";
import { getStoredUser as getCurrentUser, subscribeStoredUser } from "../../config/sessionStore";

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════

const EMPTY = [];
const EMPTY_INFO = { movie: null, cast: EMPTY, directors: EMPTY, actors: EMPTY };

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function MovieInfoPage() {
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();

  // ── Dữ liệu: React Query. Cùng cache với trang xem /movie/:id → bấm "Xem" là có ngay, không gọi lại API ──
  const { data: rawMovie, isPending, isError, error: queryError, refetch, isRefetching } = useMovie(id);
  const { movie, cast, directors, actors } = useMemo(
    () => (rawMovie ? normalizeMovieInfo(rawMovie) : EMPTY_INFO),
    [rawMovie],
  );
  const trailers = movie?.trailers ?? EMPTY;

  // ── Yêu thích: dùng chung cache React Query (optimistic + rollback + toast nằm trong hook) ──
  const favItem = useMemo(
    () => (movie ? { id: movie.id, title: movie.title, isTvShow: false } : null),
    [movie],
  );
  const { isFav, toggle: handleToggleFav } = useFavoriteToggle(favItem);
  const [showTrailer, setShowTrailer] = useState(false);
  
  // Mở từ thông báo (?reviewId=...) thì vào thẳng tab Đánh giá
  const [searchParams] = useSearchParams();
  const reviewIdParam = searchParams.get("reviewId");
  const [activeTab, setActiveTab] = useState(reviewIdParam ? "reviews" : "cast");
  useEffect(() => {
    if (reviewIdParam) setActiveTab("reviews");
  }, [reviewIdParam]);
  const [imgLoaded, setImgLoaded] = useState(false);

  // ── Premium gate state ──
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  const currentUser = useSyncExternalStore(subscribeStoredUser, getCurrentUser, () => null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  // ── Derived ─────────────────────────────────────────────────────
  // directors / actors đã được normalizeMovieInfo tính sẵn ở trên

  const firstTrailerKey =
    movie?.trailerKey || (trailers.length > 0 ? trailers[0]?.key : null);

  const firstTrailerVideoUrl = movie?.trailerVideoUrl || null;

  const hasTrailer = !!(firstTrailerKey || firstTrailerVideoUrl);

  const year = movie?.year;

  const genreList = Array.isArray(movie?.genres)
    ? movie.genres
        .map((g) => (typeof g === "string" ? g : g.name))
        .filter(Boolean)
    : [];

  const handlePlay = () => {
    if (movie?.isPremium && !userHasPremium(currentUser)) {
      setShowPremiumGate(true);
      return;
    }
    navigate(`/movie/${id}`);
  };

  // ── Loading / Error ──────────────────────────────────────────────
  if (isPending) return <LoadingScreen />;
  if (isError || !movie) {
    return (
      <DetailPageError
        error={queryError}
        onRetry={() => refetch()}
        retrying={isRefetching}
        notFoundMessage="Không tìm thấy phim này."
        fallbackMessage="Không thể tải dữ liệu phim. Vui lòng thử lại."
      />
    );
  }

  // ── Page ─────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        overflowX: "hidden",
        paddingTop: 56,
      }}
    >
      <style>{GLOBAL_STYLES}</style>
      <SeoMeta
        {...buildMovieSeo(
          { ...movie, duration: movie?.runtime, director: directors[0]?.name, cast },
          id,
        )}
      />

      {/* Hero */}
      <MovieInfoHero
        isMobile={isMobile}
        movie={movie}
        year={year}
        genreList={genreList}
        firstTrailerKey={firstTrailerKey}
        firstTrailerVideoUrl={firstTrailerVideoUrl}
        hasTrailer={hasTrailer}
        isFav={isFav}
        onToggleFav={handleToggleFav}
        onPlay={handlePlay}
        onTrailer={() => setShowTrailer(true)}
        imgLoaded={imgLoaded}
        onImgLoad={() => setImgLoaded(true)}
      />

      {/* Content area */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: isMobile ? "0 16px 60px" : "0 28px 80px",
        }}
      >
        {/* Description + Rating */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
            gap: isMobile ? 24 : 48,
            paddingBottom: 40,
            borderBottom: `1px solid ${C.border}`,
            marginBottom: 40,
            alignItems: "start",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 15,
                lineHeight: 1.85,
                color: C.textSub,
                maxWidth: 720,
              }}
            >
              {movie?.description || "Chưa có mô tả."}
            </p>
          </div>
          <div style={{ flexShrink: 0 }}>
            <StarRating score={movie?.rating} votes={movie?.voteCount} />
          </div>
        </motion.div>

        {/* Backdrop carousel */}
        {(() => {
          const backdrops = (movie?.images || []).filter(
            (i) => i.imageType === "backdrop",
          );
          if (!backdrops.length) return null;
          return <BackdropCarousel backdrops={backdrops} />;
        })()}

        {/* Tabs */}
        <MovieInfoTabs
          isMobile={isMobile}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          movie={movie}
          year={year}
          genreList={genreList}
          directors={directors}
          actors={actors}
          id={id}
          currentUser={currentUser}
        />
      </div>

      {/* Trailer Modal */}
      <AnimatePresence>
        {showTrailer && hasTrailer && (
          <TrailerModal
            trailerKey={firstTrailerKey}
            trailerVideoUrl={firstTrailerVideoUrl}
            onClose={() => setShowTrailer(false)}
          />
        )}
      </AnimatePresence>

      {/* Premium Gate Modal */}
      <PremiumGateModal
        open={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        movieTitle={movie?.title}
      />
    </div>
  );
}