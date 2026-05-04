// src/pages/TvShowInfoPage.jsx
// Trang thông tin chi tiết TV Show — hiển thị trước khi vào xem
// Route: /tvshow/:id/info → /tvshow/:id (player)

import React, { useState, useEffect } from "react";
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

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function TvShowInfoPage() {
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [cast, setCast] = useState([]);
  const [directorsFromShow, setDirectorsFromShow] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [activeTab, setActiveTab] = useState("cast");
  const [imgLoaded, setImgLoaded] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  // Cache episodes theo season number (lazy-load từ /seasons/{n})
  const [seasonEpisodesCache, setSeasonEpisodesCache] = useState({});
  const [loadingSeasonEpisodes, setLoadingSeasonEpisodes] = useState(false);

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
      const res = await tvShowService.getTvShowById(id);
      // BE: ApiResponseDTO<TvShowDTO> → axios unwrap → { data: TvShowDTO, message }
      const envelope = res?.data ?? res;
      const raw = envelope?.data ?? envelope?.tvShow ?? envelope;

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
      // Log để debug — xoá sau khi xác nhận hoạt động
      console.debug('[TvShowInfoPage] raw.cast:', raw?.cast);
      console.debug('[TvShowInfoPage] raw.seasons cast sample:', raw?.seasons?.[0]);

      const rawCast = Array.isArray(raw?.cast) && raw.cast.length > 0
        ? raw.cast
        // Fallback: gộp cast từ tất cả seasons nếu root cast rỗng
        : (raw?.seasons ?? []).flatMap(s => Array.isArray(s.cast) ? s.cast : []);

      if (rawCast.length > 0) {
        // Dedup theo id khi gộp từ nhiều seasons
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

  // Lazy-load episodes khi user bấm vào season (BE không kèm episodes trong GET /id)
  const handleSeasonSelect = async (season) => {
    setSelectedSeason(season);
    const sn = season.seasonNumber;
    if (seasonEpisodesCache[sn]) return; // đã có
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

  const year = show?.year;

  const genreList = Array.isArray(show?.genres)
    ? show.genres.map((g) => (typeof g === "string" ? g : g.name)).filter(Boolean)
    : [];

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
        <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 8 }}>
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
      <TvShowInfoHero
        isMobile={isMobile}
        show={show}
        year={year}
        genreList={genreList}
        firstTrailerKey={firstTrailerKey}
        isFav={isFav}
        onToggleFav={() => setIsFav((v) => !v)}
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
        {showTrailer && firstTrailerKey && (
          <TrailerModal
            trailerKey={firstTrailerKey}
            onClose={() => setShowTrailer(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}