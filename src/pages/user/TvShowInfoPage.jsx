// src/pages/TvShowInfoPage.jsx
// Trang thông tin chi tiết TV Show — hiển thị trước khi vào xem
// Route: /tvshow/:id/info → /tvshow/:id (player)

import React, { useState, useEffect, useCallback } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import tvShowService from "../../services/tvShowService";
import BackdropCarousel from "../../components/movie/ui/BackdropCarousel";
import StarRating from "../../components/movie/ui/StarRating";
import TrailerModal from "../../components/movie/ui/TrailerModal";
import Skeleton from "../../components/movie/ui/Skeleton";
import { C, extractYoutubeKey, fmt, GLOBAL_STYLES } from "../../components/movie/ui/movieConstants";

// ── Extracted components ──────────────────────────────────────────
import TvShowInfoHero from "../../components/movie/tvshow/TvShowInfoHero";
import TvShowInfoTabs from "../../components/movie/tvshow/TvShowInfoTabs";

// ── Loading screen (full-page) ────────────────────────────────────
import LoadingScreen from "../../components/ui/LoadingScreen";
import { useToast } from "../../components/common/Toast";

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function TvShowInfoPage() {
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [show, setShow] = useState(null);
  const [cast, setCast] = useState([]);
  const [directorsFromShow, setDirectorsFromShow] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);

  // ── Favorite state ──
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("cast");
  const [imgLoaded, setImgLoaded] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [seasonEpisodesCache, setSeasonEpisodesCache] = useState({});
  const [loadingSeasonEpisodes, setLoadingSeasonEpisodes] = useState(false);

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
      const [res, favRes] = await Promise.all([
        tvShowService.getTvShowById(id),
        tvShowService.getFavorites ? tvShowService.getFavorites().catch(() => []) : Promise.resolve([]),
      ]);
      const envelope = res?.data ?? res;
      const raw = envelope?.data ?? envelope?.tvShow ?? envelope;

      // Đồng bộ trạng thái yêu thích ban đầu
      const rawFavs = Array.isArray(favRes)
        ? favRes
        : favRes?.data || favRes?.favorites || favRes?.items || [];
      const favorited = rawFavs.some(
        (f) => String(f.tvShowId ?? f.id ?? f.tvShow?.id) === String(id)
      );
      setIsFav(favorited);

      const normalized = {
        id: raw.id,
        title: raw.title ?? raw.name,
        tagline: raw.tagline || "",
        description: raw.description ?? raw.overview ?? "",
        year: raw.firstAirDate
          ? new Date(raw.firstAirDate).getFullYear()
          : (raw.year ?? null),
        firstAirDate: raw.firstAirDate ?? null,
        lastAirDate: raw.lastAirDate ?? null,
        status: raw.status ?? "",
        originCountry: Array.isArray(raw.originCountry)
          ? raw.originCountry.join(", ")
          : (raw.originCountry ?? ""),
        language: raw.language ?? raw.originalLanguage ?? "",
        rating: raw.rating ?? raw.imdbRating ?? 0,
        voteCount: raw.voteCount ?? 0,
        popularity: raw.popularity ?? null,
        numberOfSeasons: raw.numberOfSeasons ?? raw.seasons?.length ?? 0,
        numberOfEpisodes: raw.numberOfEpisodes ?? null,
        genres: raw.genres ?? [],
        posterUrl: raw.posterUrl ?? raw.poster ?? null,
        backdropUrl: raw.backdropUrl ?? raw.backdrop ?? null,
        trailerKey:
          raw.trailerKey ??
          extractYoutubeKey(
            raw.videos?.find((v) => v.videoType === "trailer")?.videoUrl,
          ),
        trailerVideoUrl:
          raw.trailerVideoUrl ||
          raw.videos?.find((v) => v.videoType === "trailer_upload")?.videoUrl ||
          null,
        trailers: raw.trailers ?? [],
        reviews: raw.reviews ?? [],
        images: raw.images ?? [],
        seasons: raw.seasons?.length
          ? raw.seasons
          : Array.from({ length: raw.numberOfSeasons ?? 0 }, (_, i) => ({
              seasonNumber: i + 1,
              name: `Mùa ${i + 1}`,
              episodeCount: null,
              airDate: null,
              posterUrl: null,
            })),
        networks: raw.networks ?? [],
      };
      setShow(normalized);
      if (normalized.trailers?.length) setTrailers(normalized.trailers);

      // Directors / creators
      if (raw?.createdBy?.length) {
        setDirectorsFromShow(
          raw.createdBy.map((p) => ({
            id: p.id ?? p.personId ?? null,
            name: p.name,
            profileUrl: p.profileUrl ?? null,
            biography: p.biography ?? null,
            birthday: p.birthday ?? null,
            placeOfBirth: p.placeOfBirth ?? null,
          })),
        );
      } else if (raw?.directorDetail) {
        setDirectorsFromShow([
          {
            id: raw.directorDetail.id ?? null,
            name: raw.directorDetail.name,
            profileUrl: raw.directorDetail.profileUrl,
            biography: raw.directorDetail.biography,
            birthday: raw.directorDetail.birthday,
            placeOfBirth: raw.directorDetail.placeOfBirth,
          },
        ]);
      } else if (raw?.director) {
        setDirectorsFromShow([{ name: raw.director, profileUrl: null }]);
      }

      // Cast
      const rawCast = Array.isArray(raw?.cast) && raw.cast.length > 0
        ? raw.cast
        : (raw?.seasons ?? []).flatMap(s => Array.isArray(s.cast) ? s.cast : []);

      if (rawCast.length > 0) {
        const seen = new Set();
        const deduped = rawCast.filter(c => {
          const key = c.id ?? c.personId ?? c.name;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        const sorted = deduped
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((c) => ({
            id: c.id ?? c.personId ?? c.tmdbPersonId ?? null,
            name: c.name,
            character: c.character ?? c.roles?.[0]?.character ?? "",
            profileUrl: c.profileUrl ?? null,
            biography: c.biography,
            birthday: c.birthday,
            placeOfBirth: c.placeOfBirth,
          }));
        setCast(sorted);
      }
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu TV show");
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
        if (tvShowService.removeFavorite) {
          await tvShowService.removeFavorite(id);
        }
        toast?.info?.(`"${show?.title}" đã được bỏ khỏi Yêu thích`);
      } else {
        if (tvShowService.addFavorite) {
          await tvShowService.addFavorite(id);
        }
        toast?.success?.(`Đã thêm "${show?.title}" vào Yêu thích`);
      }
    } catch (err) {
      console.error("[TvShowInfoPage] Fav Error:", err);
      setIsFav(!nextState); // Rollback nếu lỗi API
      toast?.error?.("Không thể cập nhật Yêu thích, vui lòng thử lại");
    } finally {
      setFavLoading(false);
    }
  }, [favLoading, isFav, id, show?.title, toast]);

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

  const creators =
    directorsFromShow.length > 0
      ? directorsFromShow
      : cast.filter((p) => p.job === "Director" || p.department === "Directing");

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