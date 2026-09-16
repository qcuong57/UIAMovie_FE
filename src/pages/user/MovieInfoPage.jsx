// src/pages/MovieInfoPage.jsx
// Trang thông tin chi tiết phim — hiển thị trước khi vào xem phim
// Route: /movie/:id/info → /movie/:id (player)

import React, { useState, useEffect, useCallback } from "react";
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

// ── Loading screen (full-page) ────────────────────────────────────
import LoadingScreen from "../../components/ui/LoadingScreen";
import { useToast } from "../../components/common/Toast";

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function MovieInfoPage() {
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [directorsFromMovie, setDirectorsFromMovie] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  
  // ── Favorite state ──
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("cast");
  const [imgLoaded, setImgLoaded] = useState(false);

  // ── Premium gate state ──
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  const [currentUser] = useState(() => getCurrentUser());

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
      const [movieRes, favRes] = await Promise.all([
        movieService.getMovieById(id),
        movieService.getFavorites().catch(() => []),
      ]);
      const raw = movieRes?.movie || movieRes?.data || movieRes;

      // Đồng bộ trạng thái yêu thích ban đầu
      const rawFavs = Array.isArray(favRes)
        ? favRes
        : favRes?.data || favRes?.favorites || favRes?.items || [];
      const favorited = rawFavs.some(
        (f) => String(f.movieId ?? f.id ?? f.movie?.id) === String(id)
      );
      setIsFav(favorited);

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
        isPremium: raw.isPremium ?? false,
        trailerKey:
          raw.trailerKey ||
          extractYoutubeKey(
            raw.videos?.find((v) => v.videoType === "trailer")?.videoUrl,
          ),
        trailerVideoUrl:
          raw.trailerVideoUrl ||
          raw.videos?.find((v) => v.videoType === "trailer_upload")?.videoUrl ||
          null,
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

  // ── Logic Toggle Favorite ──
  const handleToggleFav = useCallback(async () => {
    if (favLoading) return;

    if (!getCurrentUser()) {
      toast?.warning?.("Bạn cần đăng nhập để thêm vào Yêu thích");
      return;
    }

    setFavLoading(true);
    const nextState = !isFav;
    setIsFav(nextState);

    try {
      if (!nextState) {
        await movieService.removeFavorite(id);
        toast?.info?.(`"${movie?.title}" đã được bỏ khỏi Yêu thích`);
      } else {
        await movieService.addFavorite(id);
        toast?.success?.(`Đã thêm "${movie?.title}" vào Yêu thích`);
      }
    } catch (err) {
      console.error("[MovieInfoPage] Fav Error:", err);
      setIsFav(!nextState); // Rollback nếu lỗi API
      toast?.error?.("Không thể cập nhật Yêu thích, vui lòng thử lại");
    } finally {
      setFavLoading(false);
    }
  }, [favLoading, isFav, id, movie?.title, toast]);

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

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return <LoadingScreen />;
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