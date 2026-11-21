// src/pages/user/TvShowDetailPage.jsx
import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "../../hooks/common/useIsMobile";
import { getStoredUser, subscribeStoredUser } from "../../config/sessionStore";
import { motion, AnimatePresence } from "framer-motion";
import { List } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import tvShowService from "../../services/tvShowService";
import { useTvShow } from "../../hooks/media/useMediaDetail";
import { normalizeTvShowWatch } from "../../utils/normalizeDetail";
import { normalizeTvShow } from "../../utils/normalizeMedia";
import { unwrapList } from "../../utils/queryHelpers";
import { queryKeys, STALE } from "../../config/queryKeys";
import DetailPageError from "../../components/common/DetailPageError";
import PersonScrollRow from "../../components/movie/Personscrollrow";
import ReviewSection from "../../components/movie/Reviewsection";
import BackButton from "../../components/common/BackButton";
import SeoMeta from "../../components/common/SeoMeta";
import { buildTvShowSeo } from "../../config/seo";
import { userHasPremium } from "../../utils/premium";

import { C, GLOBAL_STYLES } from "../../components/movie/ui/movieConstants";
import SectionTitle from "../../components/movie/ui/SectionTitle";
import StarRating from "../../components/movie/ui/StarRating";

// ── Extracted components ──────────────────────────────────────────
import EpisodeVideoPlayer from "../../components/movie/tvshow/EpisodeVideoPlayer";
import SeasonEpisodeSelector from "../../components/movie/tvshow/SeasonEpisodeSelector";
import TvShowSidebar from "../../components/movie/tvshow/TvShowSidebar";
import TvShowTitleBlock from "../../components/movie/tvshow/TvShowTitleBlock";
import PremiumGateModal from "../../components/movie/ui/PremiumGateModal";
import { Crown } from "lucide-react";
import LoadingScreen from "../../components/ui/LoadingScreen";
import Footer from "../../components/layout/Footer";

const EMPTY = [];
// Gợi ý "liên quan": một query riêng (lỗi không làm hỏng trang chính)
const RELATED_FILTER = { page: 1, pageSize: 12, sortBy: "rating" };
const selectRelated = (d) => unwrapList(d, ["tvShows"]).map(normalizeTvShow);

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
// ──────────────────────────────────────────────────────────────────────────
// NGUYÊN NHÂN LỖI "treo, không có tập / video cho tới khi đổi tab rồi quay lại":
// khi dữ liệu show đã có sẵn trong cache React Query (đi từ trang /info sang), SeasonEpisodeSelector
// được mount ở LẦN RENDER ĐẦU. React chạy effect của component CON trước effect của component CHA, nên:
//   1. con gọi onSeasonSelect(mùa 1)  → setSelectedSeason(mùa 1)
//   2. cha chạy effect "reset khi đổi id" → setSelectedSeason(null)   ← ghi đè (cùng batch, lệnh sau thắng)
// → selectedSeason = null: không ai tải danh sách tập, không có tập để phát (player đứng im).
// Đổi tab làm selector unmount/mount lại → effect của con chạy lại sau khi cha đã yên → mới hoạt động.
// Cách sửa: (a) bỏ effect reset, dùng key={id} để remount sạch khi đổi show; (b) trang tự chọn mùa đầu.
// ──────────────────────────────────────────────────────────────────────────
function TvShowDetailPageInner() {
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState("episodes");

  // ── Dữ liệu: React Query (cache chung với trang thông tin /tvshow/:id/info) ──
  const { data: rawTvShow, isPending, isError, error: queryError, refetch, isRefetching } = useTvShow(id);
  const { tvShow, actors } = useMemo(() => normalizeTvShowWatch(rawTvShow), [rawTvShow]);

  const { data: relatedList = EMPTY } = useQuery({
    queryKey: queryKeys.tvShows.list(RELATED_FILTER),
    queryFn: () => tvShowService.getTvShows(RELATED_FILTER),
    select: selectRelated,
    staleTime: STALE.list,
    enabled: !isMobile, // mobile không hiện sidebar
  });
  const related = useMemo(
    () => relatedList.filter((x) => String(x.id) !== String(id)).slice(0, 12),
    [relatedList, id],
  );

  // Episode / season selection — pre-fill từ navigation state hoặc sessionStorage (để giữ khi reload)
  const [selectedSeason, setSelectedSeason] = useState(() => {
    if (location.state?.selectedSeason) return location.state.selectedSeason;
    try {
      const saved = sessionStorage.getItem(`tvshow_${id}_season`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [selectedEpisode, setSelectedEpisode] = useState(() => {
    if (location.state?.selectedEpisode) return location.state.selectedEpisode;
    try {
      const saved = sessionStorage.getItem(`tvshow_${id}_episode`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [episodeDetail, setEpisodeDetail] = useState(null);
  const [loadingEpisode, setLoadingEpisode] = useState(false);
  const [seasonFailed, setSeasonFailed] = useState(false);
  // Cache episodes theo season để tránh gọi API nhiều lần
  const [seasonEpisodesCache, setSeasonEpisodesCache] = useState({});

  // Đọc hồ sơ từ sessionStore: tự cập nhật khi refreshPremiumStatus(), đăng xuất/đăng nhập ở tab khác.
  const currentUser = useSyncExternalStore(subscribeStoredUser, getStoredUser, () => null);

  const isFreeUser = currentUser ? !currentUser.isPremium : true;

  // ── Premium guard — chặn xem trực tiếp qua URL nếu series là Premium ──
  const isPremiumLocked = tvShow?.isPremium && !userHasPremium(currentUser);
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    setShowGate(!!isPremiumLocked);
  }, [isPremiumLocked]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  // Tự chọn mùa đầu tiên ngay tại trang (trước đây việc này do SeasonEpisodeSelector làm trong effect lúc mount
  // → bị effect "reset" của trang ghi đè thành null, xem ghi chú ở đầu file). Trang là nơi sở hữu state nên
  // trang phải tự bảo đảm luôn có mùa được chọn, không phụ thuộc component con có đang mount hay không.
  useEffect(() => {
    if (selectedSeason || !tvShow?.seasons?.length) return;
    const first = tvShow.seasons[0];
    setSelectedSeason({ ...first, seasonNumber: first.seasonNumber ?? first.number });
  }, [tvShow, selectedSeason]);

  // Lazy-load season episodes khi selectedSeason thay đổi (BE không trả episodes trong GET /id)
  useEffect(() => {
    if (!selectedSeason || !tvShow) return;
    const sn = selectedSeason.seasonNumber;
    // Đã có trong cache → không fetch lại
    if (seasonEpisodesCache[sn]) {
      setLoadingEpisode(false);
      // Nếu có episode đang chọn, fill episodeDetail từ cache
      if (selectedEpisode) {
        const ep = seasonEpisodesCache[sn].find(
          (e) =>
            e.episodeNumber ===
            (selectedEpisode.episodeNumber ?? selectedEpisode.number),
        );
        if (ep) setEpisodeDetail(ep);
      }
      return;
    }
    // Đổi mùa nhanh / rời trang → bỏ kết quả của lần fetch cũ (tránh ghi đè nhầm tập)
    let cancelled = false;
    (async () => {
      try {
        setSeasonFailed(false);
        setLoadingEpisode(true);
        const season = await tvShowService.getSeason(id, sn);
        if (cancelled) return;
        const episodes = season?.episodes ?? [];
        setSeasonEpisodesCache((prev) => ({ ...prev, [sn]: episodes }));
        // Tự động chọn episode đang pending (nếu có) hoặc tập 1
        const targetEp = selectedEpisode
          ? (episodes.find(
              (e) =>
                e.episodeNumber ===
                (selectedEpisode.episodeNumber ?? selectedEpisode.number),
            ) ??
            episodes[0] ??
            null)
          : (episodes[0] ?? null);

        if (targetEp) {
          // Fetch full episode detail để có videoUrl
          try {
            const full = await tvShowService.getEpisode(
              id,
              sn,
              targetEp.episodeNumber ?? targetEp.number,
            );
            if (cancelled) return;
            setEpisodeDetail(full ?? targetEp);
          } catch {
            if (cancelled) return;
            setEpisodeDetail(targetEp);
          }
        } else {
          setEpisodeDetail(null);
        }
      } catch (e) {
        if (cancelled) return;
        console.error("[TvShowDetailPage] getSeason:", e);
        setSeasonFailed(true);
        setEpisodeDetail(selectedEpisode ?? null);
      } finally {
        if (!cancelled) setLoadingEpisode(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeason?.seasonNumber, tvShow?.id]);

  // Khi episode thay đổi trong 1 season đã load → pick từ cache
  useEffect(() => {
    if (!selectedEpisode || !selectedSeason) return;
    const sn = selectedSeason.seasonNumber;
    const cached = seasonEpisodesCache[sn];
    if (!cached) return; // season effect sẽ handle
    const ep = cached.find(
      (e) =>
        e.episodeNumber ===
        (selectedEpisode.episodeNumber ?? selectedEpisode.number),
    );
    if (ep) setEpisodeDetail(ep);
  }, [selectedEpisode?.episodeNumber]);

  const handleSelectEpisode = async (season, episode) => {
    setSelectedSeason(season);
    setSelectedEpisode(episode);
    // Lưu lại để giữ trạng thái khi reload
    try {
      sessionStorage.setItem(`tvshow_${id}_season`, JSON.stringify(season));
      sessionStorage.setItem(`tvshow_${id}_episode`, JSON.stringify(episode));
    } catch {}
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
      console.error("[TvShowDetailPage] getEpisode:", e);
      setEpisodeDetail(episode);
    } finally {
      setLoadingEpisode(false);
    }
  };

  // ── Tính nextEpisode để truyền vào player ─────────────────────
  // (phải đặt TRƯỚC early return để không vi phạm Rules of Hooks)
  const currentEp = episodeDetail ?? selectedEpisode;

  const nextEpisode = React.useMemo(() => {
    if (!selectedSeason || !currentEp) return null;
    const sn = selectedSeason.seasonNumber;
    const episodes = seasonEpisodesCache[sn] ?? [];
    const currentNum = currentEp.episodeNumber ?? currentEp.number;
    const next = episodes.find(
      (e) => (e.episodeNumber ?? e.number) === currentNum + 1,
    );
    if (!next) return null;
    return {
      id: next.id,
      episodeNumber: next.episodeNumber ?? next.number,
      name: next.title ?? next.name ?? null,
      stillUrl: next.stillUrl ?? next.still_path ?? null,
    };
  }, [selectedSeason, currentEp?.id, seasonEpisodesCache]);

  const handleNextEpisode = React.useCallback(() => {
    if (!nextEpisode || !selectedSeason) return;
    const sn = selectedSeason.seasonNumber;
    const episodes = seasonEpisodesCache[sn] ?? [];
    const ep = episodes.find((e) => e.id === nextEpisode.id);
    if (ep) handleSelectEpisode(selectedSeason, ep);
  }, [nextEpisode, selectedSeason, seasonEpisodesCache]);

  if (isPending) return <LoadingScreen />;
  if (isError || !tvShow) {
    return (
      <DetailPageError
        error={queryError}
        onRetry={() => refetch()}
        retrying={isRefetching}
        notFoundMessage="Không tìm thấy TV show này."
        fallbackMessage="Không thể tải TV show. Vui lòng thử lại."
      />
    );
  }

  const firstAirYear = tvShow?.firstAirDate
    ? new Date(tvShow.firstAirDate).getFullYear()
    : (tvShow?.year ?? "");
  const hasCast = actors.length > 0;

  // Chưa có tập để phát: đang chờ danh sách mùa → hiện spinner; đã tải xong mà rỗng / lỗi → báo rõ
  // (trước đây player được dựng với episode=null và đứng im vô thời hạn)
  const hasSeasons = !!tvShow?.seasons?.length;
  const seasonLoaded =
    selectedSeason?.seasonNumber != null && !!seasonEpisodesCache[selectedSeason.seasonNumber];
  const waitingEpisode = hasSeasons && !currentEp && !seasonLoaded && !seasonFailed;
  const noEpisode = hasSeasons && !currentEp && (seasonLoaded || seasonFailed);

  const TABS = [
    { key: "episodes", label: "Tập phim", icon: List },
    { key: "cast", label: "Diễn viên" },
    { key: "reviews", label: "Đánh giá" },
    { key: "more", label: "Thêm thông tin" },
  ];

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
      <SeoMeta {...buildTvShowSeo(tvShow, id)} />

      {/* Nav */}
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
              {loadingEpisode || waitingEpisode ? (
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
                    transition={{
                      repeat: Infinity,
                      duration: 0.8,
                      ease: "linear",
                    }}
                  />
                </div>
              ) : isPremiumLocked ? (
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
                  {tvShow?.posterUrl && (
                    <img
                      src={tvShow.posterUrl}
                      alt={tvShow.title}
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
              ) : noEpisode ? (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    borderRadius: 12,
                    background: "#111",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    color: C.textSub,
                    fontFamily: "'Nunito',sans-serif",
                    textAlign: "center",
                    padding: 16,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                    {seasonFailed ? "Không tải được danh sách tập" : "Mùa này chưa có tập để phát"}
                  </p>
                  <p style={{ margin: 0, fontSize: 12.5, color: C.textDim }}>
                    {seasonFailed ? "Vui lòng tải lại trang hoặc thử lại sau." : "Hãy chọn mùa khác ở danh sách bên dưới."}
                  </p>
                </div>
              ) : (
                <EpisodeVideoPlayer
                  episode={currentEp}
                  tvShow={tvShow}
                  nextEpisode={nextEpisode}
                  onNextEpisode={nextEpisode ? handleNextEpisode : null}
                  isFreeUser={isFreeUser}
                  isLoggedIn={!!currentUser}
                />
              )}
            </motion.div>

            <PremiumGateModal
              open={showGate}
              onClose={() => setShowGate(false)}
              movieTitle={tvShow?.title}
            />

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
                        onSeasonSelect={(seasObj) => {
                          const n = seasObj.seasonNumber ?? seasObj.number;
                          // Giữ nguyên tham chiếu nếu cùng mùa → không render lại thừa
                          setSelectedSeason((prev) =>
                            prev && prev.seasonNumber === n ? prev : { ...seasObj, seasonNumber: n },
                          );
                        }}
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
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 40,
                        }}
                      >
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
                      episodes={Object.values(seasonEpisodesCache)
                        .flat()
                        .map((ep) => ({
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
                          actors
                            .slice(0, 3)
                            .map((a) => a.name)
                            .join(", ") || "—",
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
      <Footer />
    </div>
  );
}

// key={id}: đổi sang show khác → remount toàn bộ trang với state mới tinh (mùa/tập/cache), thay cho effect reset cũ.
export default function TvShowDetailPage() {
  const { id } = useParams();
  return <TvShowDetailPageInner key={id} />;
}