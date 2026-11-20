// src/pages/MovieDetailPage.jsx
// Trang xem phim lẻ — player + tabs
// Route: /movie/:id
//
// Components con (đặt trong src/components/movie/film/):
//   MovieVideoPlayer  – video player với controls đầy đủ
//   MovieTitleBlock   – tiêu đề, meta pills, mô tả, nút "Thông tin"
//   MovieTabsPanel    – tabs: Diễn viên | Đánh giá | Thêm thông tin

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { useIsMobile } from "../../hooks/common/useIsMobile";
import { getStoredUser, subscribeStoredUser } from "../../config/sessionStore";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useMovie } from "../../hooks/media/useMediaDetail";
import { useTrendingMovies } from "../../hooks/home/useHomeQueries";
import { normalizeMovieWatch } from "../../utils/normalizeDetail";
import DetailPageError from "../../components/common/DetailPageError";
import BackButton from "../../components/common/BackButton";
import SeoMeta from "../../components/common/SeoMeta";
import { buildMovieSeo } from "../../config/seo";
import { userHasPremium } from "../../utils/premium";

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

const EMPTY = [];
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function MovieDetailPage() {
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();

  // ── Dữ liệu: React Query (cache chung với trang thông tin /movie/:id/info) ──
  const { data: movie = null, isPending, isError, error: queryError, refetch, isRefetching } = useMovie(id);
  const { dirs, actors } = useMemo(() => normalizeMovieWatch(movie), [movie]);

  // Phim liên quan: dùng lại cache "trending" của trang chủ; mobile không hiện sidebar nên không tải
  const { data: trending = EMPTY } = useTrendingMovies({ enabled: !isMobile });
  const related = useMemo(
    () => trending.filter((x) => String(x.id) !== String(id)).slice(0, 12),
    [trending, id],
  );

  const [tab,     setTab]     = useState("cast");

  // Đọc hồ sơ từ sessionStore: tự cập nhật khi refreshPremiumStatus(), đăng xuất/đăng nhập ở tab khác.
  const currentUser = useSyncExternalStore(subscribeStoredUser, getStoredUser, () => null);

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

  // ── Loading / Error ──────────────────────────────────────────────
  if (isPending) return <LoadingScreen />;
  if (isError || !movie) {
    return (
      <DetailPageError
        error={queryError}
        onRetry={() => refetch()}
        retrying={isRefetching}
        notFoundMessage="Không tìm thấy phim này."
        fallbackMessage="Không thể tải phim. Vui lòng thử lại."
      />
    );
  }

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
      <SeoMeta {...buildMovieSeo(movie, id)} />

      {/* ── Nav bar ── */}
      <div
        data-site-nav
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
                <MovieVideoPlayer movie={movie} isFreeUser={isFreeUser} isLoggedIn={!!currentUser} />
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