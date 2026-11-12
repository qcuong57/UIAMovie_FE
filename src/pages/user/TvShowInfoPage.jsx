// src/pages/TvShowInfoPage.jsx
// Trang thông tin chi tiết TV Show — hiển thị trước khi vào xem
// Route: /tvshow/:id/info → /tvshow/:id (player)

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import tvShowService from "../../services/tvShowService";
import { useTvShow } from "../../hooks/useMediaDetail";
import { normalizeTvShowInfo } from "../../utils/normalizeDetail";
import DetailPageError from "../../components/common/DetailPageError";
import SeoMeta from "../../components/common/SeoMeta";
import { buildTvShowSeo } from "../../config/seo";
import BackdropCarousel from "../../components/movie/ui/BackdropCarousel";
import StarRating from "../../components/movie/ui/StarRating";
import TrailerModal from "../../components/movie/ui/TrailerModal";
import Skeleton from "../../components/movie/ui/Skeleton";
import { C, fmt, GLOBAL_STYLES } from "../../components/movie/ui/movieConstants";

// ── Extracted components ──────────────────────────────────────────
import TvShowInfoHero from "../../components/movie/tvshow/TvShowInfoHero";
import TvShowInfoTabs from "../../components/movie/tvshow/TvShowInfoTabs";

// ── Loading screen (full-page) ────────────────────────────────────
import LoadingScreen from "../../components/ui/LoadingScreen";
import { useFavoriteToggle } from "../../hooks/useFavorites";
import { getStoredUser as getCurrentUser, subscribeStoredUser } from "../../config/sessionStore";

const EMPTY = [];
const EMPTY_INFO = { show: null, cast: EMPTY, creators: EMPTY };

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function TvShowInfoPage() {
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();

  // ── Dữ liệu: React Query (cache chung với trang xem /tvshow/:id) ──
  const { data: rawShow, isPending, isError, error: queryError, refetch, isRefetching } = useTvShow(id);
  const { show, cast, creators } = useMemo(
    () => (rawShow ? normalizeTvShowInfo(rawShow) : EMPTY_INFO),
    [rawShow],
  );
  const trailers = show?.trailers ?? EMPTY;

  // ── Yêu thích: dùng chung cache React Query ──
  const favItem = useMemo(
    () => (show ? { id: show.id, title: show.title, isTvShow: true } : null),
    [show],
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
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [seasonEpisodesCache, setSeasonEpisodesCache] = useState({});
  const [loadingSeasonEpisodes, setLoadingSeasonEpisodes] = useState(false);

  const currentUser = useSyncExternalStore(subscribeStoredUser, getCurrentUser, () => null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  // Lazy-load episodes khi user bấm vào season
  const handleSeasonSelect = async (season) => {
    setSelectedSeason(season);
    const sn = season.seasonNumber;
    if (seasonEpisodesCache[sn]) return;
    try {
      setLoadingSeasonEpisodes(true);
      const data = await tvShowService.getSeason(id, sn);
      const episodes = data?.episodes ?? [];
      setSeasonEpisodesCache((prev) => ({ ...prev, [sn]: episodes }));
    } catch (e) {
      console.error('[TvShowInfoPage] getSeason:', e);
    } finally {
      setLoadingSeasonEpisodes(false);
    }
  };

  const actors = cast.filter(
    (p) => p.job !== "Director" && p.department !== "Directing",
  );

  const firstTrailerKey =
    show?.trailerKey || (trailers.length > 0 ? trailers[0]?.key : null);

  const firstTrailerVideoUrl = show?.trailerVideoUrl || null;

  const hasTrailer = !!(firstTrailerKey || firstTrailerVideoUrl);

  const year = show?.year;

  const genreList = Array.isArray(show?.genres)
    ? show.genres.map((g) => (typeof g === "string" ? g : g.name)).filter(Boolean)
    : [];

  // ── Loading / Error ──────────────────────────────────────────────
  if (isPending) return <LoadingScreen />;
  if (isError || !show) {
    return (
      <DetailPageError
        error={queryError}
        onRetry={() => refetch()}
        retrying={isRefetching}
        notFoundMessage="Không tìm thấy TV show này."
        fallbackMessage="Không thể tải dữ liệu TV show. Vui lòng thử lại."
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
      <SeoMeta {...buildTvShowSeo({ ...show, cast }, id)} />

      {/* Hero */}
      <TvShowInfoHero
        isMobile={isMobile}
        show={show}
        year={year}
        genreList={genreList}
        firstTrailerKey={firstTrailerKey}
        firstTrailerVideoUrl={firstTrailerVideoUrl}
        hasTrailer={hasTrailer}
        isFav={isFav}
        onToggleFav={handleToggleFav}
        onPlay={() => navigate(`/tvshow/${id}`)}
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
              {show?.description || "Chưa có mô tả."}
            </p>
          </div>
          <div style={{ flexShrink: 0 }}>
            <StarRating score={show?.rating} votes={show?.voteCount} />
          </div>
        </motion.div>

        {/* Backdrop carousel */}
        {(() => {
          const backdrops = (show?.images || []).filter((i) => i.imageType === "backdrop");
          if (!backdrops.length) return null;
          return <BackdropCarousel backdrops={backdrops} />;
        })()}

        {/* Tabs */}
        <TvShowInfoTabs
          isMobile={isMobile}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          show={show}
          year={year}
          genreList={genreList}
          creators={creators}
          actors={actors}
          id={id}
          currentUser={currentUser}
          selectedSeason={selectedSeason}
          selectedEpisode={selectedEpisode}
          seasonEpisodesCache={seasonEpisodesCache}
          loadingSeasonEpisodes={loadingSeasonEpisodes}
          onSeasonSelect={handleSeasonSelect}
          onSelectEpisode={(season, ep) => {
            setSelectedSeason(season);
            setSelectedEpisode(ep);
            navigate(`/tvshow/${id}`, {
              state: { selectedSeason: season, selectedEpisode: ep },
            });
          }}
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
    </div>
  );
}