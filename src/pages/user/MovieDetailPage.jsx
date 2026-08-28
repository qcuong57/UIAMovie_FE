// src/pages/MovieDetailPage.jsx
// Trang xem phim lẻ — player + tabs
// Route: /movie/:id
//
// Components con (đặt trong src/components/movie/film/):
//   MovieVideoPlayer  – video player với controls đầy đủ
//   MovieTitleBlock   – tiêu đề, meta pills, mô tả, nút "Thông tin"
//   MovieTabsPanel    – tabs: Diễn viên | Đánh giá | Thêm thông tin

import React, { useState, useEffect } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import movieService from "../../services/movieService";
import BackButton from "../../components/common/BackButton";

import { C, GLOBAL_STYLES } from "../../components/movie/ui/movieConstants";
import LoadingScreen from "../../components/ui/LoadingScreen";
import SidebarPersonList from "../../components/movie/ui/SidebarPersonList";
import SidebarRelatedList from "../../components/movie/ui/SidebarRelatedList";

// ── Extracted components ──────────────────────────────────────────
import MovieVideoPlayer from "../../components/movie/film/MovieVideoPlayer";
import MovieTitleBlock from "../../components/movie/film/MovieTitleBlock";
import MovieTabsPanel from "../../components/movie/film/MovieTabsPanel";
import PremiumGateModal from "../../components/movie/ui/PremiumGateModal";
import { Crown } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

// ── Premium helper (đồng bộ với MovieCard.jsx) ────────────────────
function userHasPremium(user) {
  if (!user) return false;
  return (
    user.isPremium === true ||
    user.plan === "premium" ||
    user.subscription?.active === true
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function MovieDetailPage() {
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie,   setMovie]   = useState(null);
  const [dirs,    setDirs]    = useState([]);
  const [actors,  setActors]  = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("cast");

  const [currentUser] = useState(() => {
    try {
      const r = localStorage.getItem("currentUser");
      return r ? JSON.parse(r) : null;
    } catch {
      return null;
    }
  });

  const isFreeUser = currentUser ? !currentUser.isPremium : true;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  // ── Premium guard — chặn xem trực tiếp qua URL nếu phim là Premium ──
  const isPremiumLocked = movie?.isPremium && !userHasPremium(currentUser);
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    setShowGate(!!isPremiumLocked);
  }, [isPremiumLocked]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setDirs([]);
        setActors([]);

        const [movieRes, trendingRes] = await Promise.all([
          movieService.getMovieById(id),
          movieService.getTrendingMovies().catch(() => ({ data: [] })),
        ]);

        const movieData = movieRes?.data ?? movieRes;
        setMovie(movieData);

        // Đạo diễn
        if (movieData?.directorDetail) {
          setDirs([{
            id:           movieData.directorDetail.id ?? movieData.directorDetail.personId ?? null,
            name:         movieData.directorDetail.name,
            profileUrl:   movieData.directorDetail.profileUrl,
            biography:    movieData.directorDetail.biography,
            birthday:     movieData.directorDetail.birthday,
            placeOfBirth: movieData.directorDetail.placeOfBirth,
          }]);
        } else if (movieData?.director) {
          setDirs([{ id: movieData.directorId || null, name: movieData.director, profileUrl: null }]);
        }

        // Diễn viên
        if (Array.isArray(movieData?.cast) && movieData.cast.length > 0) {
          setActors(
            movieData.cast
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((c) => ({
                id:           c.id ?? c.personId ?? c.tmdbPersonId ?? null,
                tmdbPersonId: c.tmdbPersonId ?? c.personId ?? null,
                name:         c.name,
                character:    c.character,
                profileUrl:   c.profileUrl,
                biography:    c.biography ?? c.bio ?? null,
                birthday:     c.birthday ?? c.dob ?? null,
                deathday:     c.deathday ?? null,
                placeOfBirth: c.placeOfBirth ?? null,
                knownFor:     c.knownForDepartment ?? c.knownFor ?? null,
                popularity:   c.popularity ?? null,
                profileImages: c.profileImages ?? [],
                movies:       c.movies ?? c.filmography ?? [],
              })),
          );
        }

        // Phim liên quan
        const tRaw = trendingRes?.data ?? trendingRes;
        const movies = Array.isArray(tRaw) ? tRaw : (tRaw?.movies ?? []);
        setRelated(
          movies
            .filter((x) => x.id !== id)
            .slice(0, 12)
            .map((x) => ({
              id:       x.id,
              title:    x.title,
              year:     x.releaseDate ? new Date(x.releaseDate).getFullYear() : x.year,
              rating:   x.rating,
              posterUrl: x.posterUrl,
            })),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <LoadingScreen />;

  const year = movie?.releaseDate
    ? new Date(movie.releaseDate).getFullYear()
    : (movie?.year ?? "");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        paddingTop: 56,
        overflowX: "hidden",
      }}
    >
      <style>{GLOBAL_STYLES}</style>

      {/* ── Nav bar ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(0,0,0,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${C.border}`,
          padding: isMobile ? "0 16px" : "0 32px",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <BackButton />
        <div style={{ flex: 1 }} />
      </div>

      {/* ── Content ── */}
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: isMobile ? "16px 16px 48px" : "32px 32px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 40,
            alignItems: "flex-start",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          {/* ── LEFT column ── */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              width: isMobile ? "100%" : "auto",
              overflow: "hidden",
            }}
          >
            {/* Video player */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.5 }}
            >
              {isPremiumLocked ? (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "16/9",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#0a0a0a",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 14,
                  }}
                >
                  {movie?.posterUrl && (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: "blur(18px) brightness(0.35)",
                        transform: "scale(1.1)",
                      }}
                    />
                  )}
                  <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, rgba(250,204,21,0.95), rgba(245,158,11,0.95))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Crown size={26} fill="#1c1400" color="#1c1400" />
                    </div>
                    <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>
                      Nội dung dành cho thành viên Premium
                    </p>
                    <button
                      onClick={() => navigate("/premium")}
                      style={{
                        marginTop: 4,
                        padding: "10px 22px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        background: "linear-gradient(135deg, rgba(250,204,21,0.95), rgba(245,158,11,0.95))",
                        color: "#1c1400",
                        fontFamily: "'Nunito',sans-serif",
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      Nâng cấp Premium
                    </button>
                  </div>
                </div>
              ) : (
                <MovieVideoPlayer movie={movie} isFreeUser={isFreeUser} />
              )}
            </motion.div>

            <PremiumGateModal
              open={showGate}
              onClose={() => setShowGate(false)}
              movieTitle={movie?.title}
            />

            {/* Title + meta + description */}
            <MovieTitleBlock movie={movie} year={year} isMobile={isMobile} id={id} />

            {/* Tabs */}
            <MovieTabsPanel
              isMobile={isMobile}
              tab={tab}
              onTabChange={setTab}
              movie={movie}
              year={year}
              dirs={dirs}
              actors={actors}
              id={id}
              currentUser={currentUser}
            />
          </div>

          {/* ── RIGHT sidebar (desktop only) ── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.15 }}
            style={{
              width: isMobile ? "100%" : 280,
              flexShrink: 0,
              display: isMobile ? "none" : "flex",
              flexDirection: "column",
              gap: 28,
            }}
          >
            {movie?.posterUrl && (
              <div style={{ borderRadius: 8, overflow: "hidden" }}>
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  style={{ width: "100%", display: "block" }}
                />
              </div>
            )}

            <SidebarPersonList title="Đạo diễn" people={dirs} showRole="director" />
            <SidebarPersonList title="Diễn viên chính" people={actors} showRole="character" />
            <SidebarRelatedList
              items={related}
              getPath={(m) => `/movie/${m.id}`}
              emptyIcon="🎬"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}