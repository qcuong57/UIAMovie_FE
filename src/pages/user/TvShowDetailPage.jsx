// src/pages/user/TvShowDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { motion, AnimatePresence } from "framer-motion";
import { List } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import tvShowService from "../../services/tvShowService";
import PersonScrollRow from "../../components/movie/Personscrollrow";
import ReviewSection from "../../components/movie/Reviewsection";
import BackButton from "../../components/common/BackButton";

import {
  C,
  GLOBAL_STYLES,
} from "../../components/movie/ui/movieConstants";
import SectionTitle from "../../components/movie/ui/SectionTitle";
import StarRating from "../../components/movie/ui/StarRating";

// ── Extracted components ──────────────────────────────────────────
import EpisodeVideoPlayer from "../../components/movie/tvshow/EpisodeVideoPlayer";
import SeasonEpisodeSelector from "../../components/movie/tvshow/SeasonEpisodeSelector";
import TvShowSidebar from "../../components/movie/tvshow/TvShowSidebar";
import TvShowTitleBlock from "../../components/movie/tvshow/TvShowTitleBlock";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function TvShowDetailPage() {
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [tvShow, setTvShow] = useState(null);
  const [actors, setActors] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("episodes");

  // Episode / season selection — pre-fill from InfoPage if navigated with state
  const [selectedSeason, setSelectedSeason] = useState(
    location.state?.selectedSeason ?? null,
  );
  const [selectedEpisode, setSelectedEpisode] = useState(
    location.state?.selectedEpisode ?? null,
  );
  const [episodeDetail, setEpisodeDetail] = useState(null);
  const [loadingEpisode, setLoadingEpisode] = useState(false);
  // Cache episodes theo season để tránh gọi API nhiều lần
  const [seasonEpisodesCache, setSeasonEpisodesCache] = useState({});

  const [currentUser] = useState(() => {
    try {
      const r = localStorage.getItem("currentUser");
      return r ? JSON.parse(r) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setActors([]);
        setSeasonEpisodesCache({});
        if (!location.state?.selectedSeason) setSelectedSeason(null);
        if (!location.state?.selectedEpisode) setSelectedEpisode(null);
        setEpisodeDetail(null);

        const [tvRes, trendingRes] = await Promise.all([
          tvShowService.getTvShowById(id),
          tvShowService
            .getTvShows({ page: 1, pageSize: 12, sortBy: "rating" })
            .catch(() => ({ items: [] })),
        ]);

        // BE: ApiResponseDTO<TvShowDTO> → axios unwrap → { data: TvShowDTO, message }
        const tvEnvelope = tvRes?.data ?? tvRes;
        const tvData = tvEnvelope?.data ?? tvEnvelope;

        // BE không trả seasons array → generate từ numberOfSeasons
        const patchedSeasons =
          tvData?.seasons?.length
            ? tvData.seasons
            : Array.from({ length: tvData?.numberOfSeasons ?? 0 }, (_, i) => ({
                seasonNumber: i + 1,
                name: `Mùa ${i + 1}`,
                episodeCount: null,
                airDate: null,
              }));
        setTvShow({ ...tvData, seasons: patchedSeasons });

        // Cast
        if (Array.isArray(tvData?.cast) && tvData.cast.length > 0) {
          setActors(
            tvData.cast
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((c) => ({
                id: c.id ?? c.personId ?? null,
                tmdbPersonId: c.tmdbPersonId ?? c.personId ?? null,
                name: c.name,
                character: c.character,
                profileUrl: c.profileUrl,
                biography: c.biography ?? null,
                birthday: c.birthday ?? null,
                deathday: c.deathday ?? null,
                placeOfBirth: c.placeOfBirth ?? null,
                knownFor: c.knownForDepartment ?? null,
                popularity: c.popularity ?? null,
              })),
          );
        }

        // Related
        const tRaw = trendingRes?.data ?? trendingRes;
        const shows = Array.isArray(tRaw)
          ? tRaw
          : (tRaw?.items ?? tRaw?.tvShows ?? []);
        setRelated(
          shows
            .filter((x) => x.id !== id)
            .slice(0, 12)
            .map((x) => ({
              id: x.id,
              title: x.title ?? x.name,
              year: x.firstAirDate
                ? new Date(x.firstAirDate).getFullYear()
                : x.year,
              rating: x.rating ?? x.imdbRating,
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

  // Lazy-load season episodes khi selectedSeason thay đổi (BE không trả episodes trong GET /id)
  useEffect(() => {
    if (!selectedSeason || !tvShow) return;
    const sn = selectedSeason.seasonNumber;
    // Đã có trong cache → không fetch lại
    if (seasonEpisodesCache[sn]) {
      // Nếu có episode đang chọn, fill episodeDetail từ cache
      if (selectedEpisode) {
        const ep = seasonEpisodesCache[sn].find(
          (e) => e.episodeNumber === (selectedEpisode.episodeNumber ?? selectedEpisode.number),
        );
        if (ep) setEpisodeDetail(ep);
      }
      return;
    }
    (async () => {
      try {
        setLoadingEpisode(true);
        const season = await tvShowService.getSeason(id, sn);
        const episodes = season?.episodes ?? [];
        setSeasonEpisodesCache((prev) => ({ ...prev, [sn]: episodes }));
        // Tự động chọn episode đang pending (nếu có) hoặc tập 1
        const targetEp = selectedEpisode
          ? (episodes.find(
              (e) => e.episodeNumber === (selectedEpisode.episodeNumber ?? selectedEpisode.number),
            ) ?? episodes[0] ?? null)
          : (episodes[0] ?? null);

        if (targetEp) {
          // Fetch full episode detail để có videoUrl
          try {
            const full = await tvShowService.getEpisode(
              id,
              sn,
              targetEp.episodeNumber ?? targetEp.number,
            );
            setEpisodeDetail(full ?? targetEp);
          } catch {
            setEpisodeDetail(targetEp);
          }
        } else {
          setEpisodeDetail(null);
        }
      } catch (e) {
        console.error('[TvShowDetailPage] getSeason:', e);
        setEpisodeDetail(selectedEpisode ?? null);
      } finally {
        setLoadingEpisode(false);
      }
    })();
  }, [selectedSeason?.seasonNumber, tvShow?.id]);

  // Khi episode thay đổi trong 1 season đã load → pick từ cache
  useEffect(() => {
    if (!selectedEpisode || !selectedSeason) return;
    const sn = selectedSeason.seasonNumber;
    const cached = seasonEpisodesCache[sn];
    if (!cached) return; // season effect sẽ handle
    const ep = cached.find(
      (e) => e.episodeNumber === (selectedEpisode.episodeNumber ?? selectedEpisode.number),
    );
    if (ep) setEpisodeDetail(ep);
  }, [selectedEpisode?.episodeNumber]);

  const handleSelectEpisode = async (season, episode) => {
    setSelectedSeason(season);
    setSelectedEpisode(episode);
    if (isMobile) window.scrollTo({ top: 0, behavior: "smooth" });
    // Gọi getEpisode để lấy full detail kèm videoUrl (getSeason chỉ trả partial)
    try {
      setLoadingEpisode(true);
      const full = await tvShowService.getEpisode(
        id,
        season.seasonNumber,
        episode.episodeNumber ?? episode.number,
      );
      if (full) setEpisodeDetail(full);
      else setEpisodeDetail(episode);
    } catch (e) {
      console.error('[TvShowDetailPage] getEpisode:', e);
      setEpisodeDetail(episode);
    } finally {
      setLoadingEpisode(false);
    }
  };

  if (loading)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: C.bg,
        }}
      >
        <style>{GLOBAL_STYLES}</style>
        <motion.div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: `3px solid ${C.accent}`,
            borderTopColor: "transparent",
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.85, ease: "linear" }}
        />
      </div>
    );

  const firstAirYear = tvShow?.firstAirDate
    ? new Date(tvShow.firstAirDate).getFullYear()
    : (tvShow?.year ?? "");
  const hasCast = actors.length > 0;

  const TABS = [
    { key: "episodes", label: "Tập phim", icon: List },
    { key: "cast", label: "Diễn viên" },
    { key: "reviews", label: "Đánh giá" },
    { key: "more", label: "Thêm thông tin" },
  ];

  const currentEp = episodeDetail ?? selectedEpisode;

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

      {/* Nav */}
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
          {/* ── LEFT ── */}
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
              {loadingEpisode ? (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    borderRadius: 12,
                    background: "#111",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <motion.div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: `2px solid ${C.accent}`,
                      borderTopColor: "transparent",
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  />
                </div>
              ) : (
                <EpisodeVideoPlayer episode={currentEp} tvShow={tvShow} />
              )}
            </motion.div>

            {/* Title block */}
            <TvShowTitleBlock
              tvShow={tvShow}
              currentEp={currentEp}
              selectedSeason={selectedSeason}
              firstAirYear={firstAirYear}
              isMobile={isMobile}
            />

            {/* ── TABS ── */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.2 }}
            >
              <div
                style={{
                  display: "flex",
                  borderBottom: `1px solid ${C.border}`,
                  marginBottom: 32,
                  overflowX: "auto",
                }}
              >
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    style={{
                      background: "none",
                      border: "none",
                      borderBottom: `2px solid ${tab === t.key ? C.accent : "transparent"}`,
                      padding: isMobile ? "10px 12px" : "12px 20px",
                      cursor: "pointer",
                      fontFamily: "'Nunito',sans-serif",
                      fontSize: isMobile ? 12 : 14,
                      fontWeight: tab === t.key ? 700 : 500,
                      color: tab === t.key ? C.text : C.textSub,
                      transition: "all 0.2s",
                      marginBottom: -1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* EPISODES TAB */}
                {tab === "episodes" && (
                  <motion.div
                    key="episodes"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {!tvShow?.seasons?.length ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          padding: "60px 0",
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            background: C.surfaceMid,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 28,
                          }}
                        >
                          📺
                        </div>
                        <p
                          style={{
                            fontFamily: "'Nunito',sans-serif",
                            fontSize: 16,
                            fontWeight: 600,
                            color: C.textSub,
                          }}
                        >
                          Chưa có dữ liệu tập phim
                        </p>
                        <p
                          style={{
                            fontFamily: "'Nunito',sans-serif",
                            fontSize: 13,
                            color: C.textDim,
                            textAlign: "center",
                            maxWidth: 300,
                            lineHeight: 1.6,
                          }}
                        >
                          Thử import lại từ TMDB để cập nhật.
                        </p>
                      </div>
                    ) : (
                      <SeasonEpisodeSelector
                        tvShow={tvShow}
                        selectedSeason={selectedSeason}
                        selectedEpisode={selectedEpisode}
                        seasonEpisodesCache={seasonEpisodesCache}
                        loadingSeasonEpisodes={loadingEpisode}
                        onSelectEpisode={handleSelectEpisode}
                        onSeasonSelect={(seasObj) => setSelectedSeason(seasObj)}
                      />
                    )}
                  </motion.div>
                )}

                {/* CAST TAB */}
                {tab === "cast" && (
                  <motion.div
                    key="cast"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {!hasCast ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          padding: "60px 0",
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            background: C.surfaceMid,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 28,
                          }}
                        >
                          🎭
                        </div>
                        <p
                          style={{
                            fontFamily: "'Nunito',sans-serif",
                            fontSize: 16,
                            fontWeight: 600,
                            color: C.textSub,
                          }}
                        >
                          Chưa có thông tin diễn viên
                        </p>
                        <p
                          style={{
                            fontFamily: "'Nunito',sans-serif",
                            fontSize: 13,
                            color: C.textDim,
                            textAlign: "center",
                            maxWidth: 300,
                            lineHeight: 1.6,
                          }}
                        >
                          Thử import lại từ TMDB để cập nhật.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
                        <div>
                          <SectionTitle>Diễn Viên Nổi Bật</SectionTitle>
                          <PersonScrollRow people={actors} />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* REVIEWS TAB */}
                {tab === "reviews" && (
                  <motion.div
                    key="reviews"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ReviewSection
                      contentType="tvshow"
                      tvShowId={id}
                      reviewMode="episode"
                      activeEpisodeId={episodeDetail?.id ?? null}
                      episodes={Object.values(seasonEpisodesCache).flat().map((ep) => ({
                        id: ep.id,
                        seasonNumber: ep.seasonNumber ?? ep.season ?? 1,
                        episodeNumber: ep.episodeNumber ?? ep.number,
                        title: ep.title ?? ep.name ?? null,
                      }))}
                      voteCount={tvShow?.voteCount}
                      currentUser={currentUser}
                    />
                  </motion.div>
                )}

                {/* MORE TAB */}
                {tab === "more" && (
                  <motion.div
                    key="more"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SectionTitle>Thông Tin Chi Tiết</SectionTitle>

                    {tvShow?.rating && (
                      <div style={{ marginBottom: 28 }}>
                        <StarRating
                          score={tvShow.rating}
                          votes={tvShow?.voteCount}
                        />
                      </div>
                    )}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                        gap: "12px 40px",
                        maxWidth: 560,
                      }}
                    >
                      {[
                        ["Thể loại", tvShow?.genres?.join(", ") || "—"],
                        ["Năm phát sóng", firstAirYear || "—"],
                        [
                          "Số season",
                          tvShow?.numberOfSeasons
                            ? `${tvShow.numberOfSeasons} mùa`
                            : "—",
                        ],
                        [
                          "Số tập",
                          tvShow?.numberOfEpisodes
                            ? `${tvShow.numberOfEpisodes} tập`
                            : "—",
                        ],
                        [
                          "Điểm đánh giá",
                          tvShow?.rating
                            ? `${tvShow.rating.toFixed(1)} / 10`
                            : "—",
                        ],
                        ["Trạng thái", tvShow?.status || "—"],
                        [
                          "Quốc gia",
                          tvShow?.originCountry ||
                            tvShow?.productionCountries?.join(", ") ||
                            "—",
                        ],
                        [
                          "Diễn viên chính",
                          actors.slice(0, 3).map((a) => a.name).join(", ") || "—",
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          style={{
                            borderBottom: `1px solid ${C.border}`,
                            paddingBottom: 12,
                          }}
                        >
                          <p
                            style={{
                              fontFamily: "'Nunito',sans-serif",
                              fontSize: 11,
                              color: C.textDim,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              marginBottom: 4,
                            }}
                          >
                            {label}
                          </p>
                          <p
                            style={{
                              fontFamily: "'Nunito',sans-serif",
                              fontSize: 14,
                              color: C.text,
                              fontWeight: 500,
                            }}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* ── RIGHT sidebar ── */}
          {!isMobile && (
            <TvShowSidebar tvShow={tvShow} actors={actors} related={related} />
          )}
        </div>
      </div>
    </div>
  );
}