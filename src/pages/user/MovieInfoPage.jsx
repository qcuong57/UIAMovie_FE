// src/pages/MovieInfoPage.jsx
// Trang thông tin chi tiết phim — hiển thị trước khi vào xem phim
// Route: /movie/:id/info → /movie/:id (player)

import React, { useState, useEffect } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import movieService from "../../services/movieService";
import BackdropCarousel from "../../components/movie/ui/BackdropCarousel";
import StarRating from "../../components/movie/ui/StarRating";
import TrailerModal from "../../components/movie/ui/TrailerModal";
import Skeleton from "../../components/movie/ui/Skeleton";
import {
  C,
  extractYoutubeKey,
  fmt,
  fmtRuntime,
  GLOBAL_STYLES,
} from "../../components/movie/ui/movieConstants";

// ── Extracted components ──────────────────────────────────────────
import MovieInfoHero from "../../components/movie/film/MovieInfoHero";
import MovieInfoTabs from "../../components/movie/film/MovieInfoTabs";

// ── Premium gate modal ────────────────────────────────────────────
import PremiumGateModal from "../../components/movie/ui/PremiumGateModal";

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════

/**
 * Kiểm tra user hiện tại có gói Premium không.
 * Điều chỉnh theo cách bạn lưu thông tin user (JWT claim, localStorage, context…).
 */
function userHasPremium(user) {
  if (!user) return false;
  // Tuỳ backend: user.isPremium / user.plan === 'premium' / user.subscription?.active
  return (
    user.isPremium === true ||
    user.plan === "premium" ||
    user.subscription?.active === true
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function MovieInfoPage() {
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [directorsFromMovie, setDirectorsFromMovie] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [activeTab, setActiveTab] = useState("cast"); // 'cast' | 'reviews' | 'details'
  const [imgLoaded, setImgLoaded] = useState(false);

  // ── Premium gate state ───────────────────────────────────────────
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  const [currentUser] = useState(() => {
    try {
      const raw = localStorage.getItem("currentUser");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchAll();
  }, [id]);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const movieRes = await movieService.getMovieById(id);
      const raw = movieRes?.movie || movieRes;

      const normalized = {
        id: raw.id,
        title: raw.title,
        tagline: raw.tagline || "",
        description: raw.description || raw.overview || "",
        year: raw.releaseDate
          ? new Date(raw.releaseDate).getFullYear()
          : raw.year,
        releaseDate: raw.releaseDate,
        runtime: raw.duration || raw.runtime,
        rating: raw.rating || raw.voteAverage,
        voteCount: raw.voteCount,
        popularity: raw.popularity,
        genres: raw.genres || [],
        posterUrl: raw.posterUrl,
        backdropUrl: raw.backdropUrl,
        language: raw.language || raw.originalLanguage,
        budget: raw.budget,
        revenue: raw.revenue,
        tmdbId: raw.tmdbId,
        isPremium: raw.isPremium ?? false, // ← giữ lại trường này
        trailerKey:
          raw.trailerKey ||
          extractYoutubeKey(
            raw.videos?.find((v) => v.videoType === "trailer")?.videoUrl,
          ),
        trailers: raw.trailers || [],
        reviews: raw.reviews || [],
        images: raw.images || [],
      };
      setMovie(normalized);
      if (normalized.trailers?.length) setTrailers(normalized.trailers);

      // Directors
      if (raw?.directorDetail) {
        setDirectorsFromMovie([
          {
            id:
              raw.directorDetail.id ??
              raw.directorDetail.personId ??
              raw.directorDetail.tmdbPersonId ??
              null,
            name: raw.directorDetail.name,
            profileUrl: raw.directorDetail.profileUrl,
            biography: raw.directorDetail.biography,
            birthday: raw.directorDetail.birthday,
            placeOfBirth: raw.directorDetail.placeOfBirth,
          },
        ]);
      } else if (raw?.director) {
        setDirectorsFromMovie([{ name: raw.director, profileUrl: null }]);
      }

      // Cast
      if (Array.isArray(raw?.cast) && raw.cast.length > 0) {
        const sorted = [...raw.cast]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((c) => ({
            id: c.id ?? c.personId ?? c.tmdbPersonId ?? null,
            name: c.name,
            character: c.character,
            profileUrl: c.profileUrl,
            biography: c.biography,
            birthday: c.birthday,
            placeOfBirth: c.placeOfBirth,
          }));
        setCast(sorted);
      }
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu phim");
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────
  const directors =
    directorsFromMovie.length > 0
      ? directorsFromMovie
      : cast.filter(
          (p) => p.job === "Director" || p.department === "Directing",
        );

  const actors = cast.filter(
    (p) => p.job !== "Director" && p.department !== "Directing",
  );

  const firstTrailerKey =
    movie?.trailerKey || (trailers.length > 0 ? trailers[0]?.key : null);

  const year = movie?.year;

  const genreList = Array.isArray(movie?.genres)
    ? movie.genres
        .map((g) => (typeof g === "string" ? g : g.name))
        .filter(Boolean)
    : [];

  // ── Premium guard ────────────────────────────────────────────────
  /**
   * Gọi hàm này thay vì navigate trực tiếp.
   * Nếu phim là premium và user chưa có gói → show modal.
   * Ngược lại → vào xem bình thường.
   */
  const handlePlay = () => {
    if (movie?.isPremium && !userHasPremium(currentUser)) {
      setShowPremiumGate(true);
      return;
    }
    navigate(`/movie/${id}`);
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: C.bg,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <style>{GLOBAL_STYLES}</style>
        <div
          style={{
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Skeleton w={90} h={32} r={20} />
        </div>
        <Skeleton w="100%" h={420} r={0} />
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "40px 24px",
            width: "100%",
          }}
        >
          <Skeleton w={340} h={40} r={6} style={{ marginBottom: 16 }} />
          <Skeleton w={200} h={20} r={4} style={{ marginBottom: 32 }} />
          <Skeleton w="100%" h={80} r={8} style={{ marginBottom: 12 }} />
          <Skeleton w="80%" h={80} r={8} />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{GLOBAL_STYLES}</style>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 48,
              fontWeight: 900,
              color: C.accent,
              marginBottom: 12,
            }}
          >
            Oops!
          </p>
          <p
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 14,
              color: C.textSub,
              marginBottom: 24,
            }}
          >
            {error}
          </p>
          <button
            onClick={fetchAll}
            style={{
              padding: "10px 24px",
              borderRadius: 40,
              background: C.accent,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 600,
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
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

      {/* Hero */}
      <MovieInfoHero
        isMobile={isMobile}
        movie={movie}
        year={year}
        genreList={genreList}
        firstTrailerKey={firstTrailerKey}
        isFav={isFav}
        onToggleFav={() => setIsFav((v) => !v)}
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
        {showTrailer && firstTrailerKey && (
          <TrailerModal
            trailerKey={firstTrailerKey}
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