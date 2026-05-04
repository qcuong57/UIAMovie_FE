// src/components/movie/tvshow/TvShowInfoTabs.jsx
// Tab bar + all 4 tab panels (Cast, Seasons, Reviews, Details)

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { C, fmt } from "../ui/movieConstants";
import { toSlug } from "../ui/movieConstants";
import SectionTitle from "../ui/SectionTitle";
import PersonScrollRow from "../Personscrollrow";
import ReviewSection from "../Reviewsection";
import SeasonEpisodeSelector from "./SeasonEpisodeSelector";
import { STATUS_MAP } from "./StatusBadge";
import TabBar from "../ui/TabBar";
import PersonCard from "../ui/PersonCard";
import EmptyState from "../ui/EmptyState";
import DetailInfoGrid from "../ui/DetailInfoGrid";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

// ── TABS config ─────────────────────────────────────────────────────
const TABS = [
  { key: "seasons", label: "Tập phim"       },
  { key: "cast",    label: "Diễn viên"      },
  { key: "reviews", label: "Đánh giá"       },
  { key: "details", label: "Thêm thông tin" },
];

// ── TvShowInfoTabs ──────────────────────────────────────────────────
export default function TvShowInfoTabs({
  isMobile,
  activeTab,
  onTabChange,
  show,
  year,
  genreList,
  creators,
  actors,
  id,
  currentUser,
  selectedSeason,
  selectedEpisode,
  onSelectEpisode,
  seasonEpisodesCache,
  loadingSeasonEpisodes,
  onSeasonSelect,
}) {
  const navigate = useNavigate();
  const hasCast = creators.length > 0 || actors.length > 0;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ delay: 0.2 }}
    >
      <TabBar tabs={TABS} activeTab={activeTab} onChange={onTabChange} isMobile={isMobile} />

      <AnimatePresence mode="wait">

        {/* ── SEASONS ── */}
        {activeTab === "seasons" && (
          <motion.div
            key="seasons"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SeasonEpisodeSelector
              tvShow={show}
              selectedSeason={selectedSeason}
              selectedEpisode={selectedEpisode}
              onSelectEpisode={onSelectEpisode ?? (() => {})}
              seasonEpisodesCache={seasonEpisodesCache ?? {}}
              loadingSeasonEpisodes={loadingSeasonEpisodes ?? false}
              onSeasonSelect={onSeasonSelect}
            />
          </motion.div>
        )}

        {/* ── CAST ── */}
        {activeTab === "cast" && (
          <motion.div
            key="cast"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {!hasCast ? (
              <EmptyState
                icon="🎭"
                title="Chưa có thông tin diễn viên"
                subtitle="Thử import lại từ TMDB để cập nhật."
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
                {creators.length > 0 && (
                  <div>
                    <SectionTitle>Đạo Diễn / Nhà Sản Xuất</SectionTitle>
                    <div style={{ display: "flex", gap: 16 }}>
                      {creators.map((p, i) => (
                        <PersonCard key={i} person={p} isDirector />
                      ))}
                    </div>
                  </div>
                )}
                {actors.length > 0 && (
                  <div>
                    <SectionTitle>Diễn Viên Nổi Bật</SectionTitle>
                    <PersonScrollRow people={actors} />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── REVIEWS ── */}
        {activeTab === "reviews" && (
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
              reviewMode="show"
              movieRating={show?.rating}
              voteCount={show?.voteCount}
              currentUser={currentUser}
            />
          </motion.div>
        )}

        {/* ── DETAILS ── */}
        {activeTab === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SectionTitle>Thông Tin Chi Tiết</SectionTitle>
            <DetailInfoGrid
              isMobile={isMobile}
              rows={[
                ["Thể loại",        genreList.join(", ") || "—"],
                ["Năm ra mắt",      year || "—"],
                ["Lần đầu chiếu",   show?.firstAirDate ? new Date(show.firstAirDate).toLocaleDateString("vi-VN") : "—"],
                ["Kết thúc",        show?.lastAirDate  ? new Date(show.lastAirDate).toLocaleDateString("vi-VN")  : "—"],
                ["Trạng thái",      show?.status ? (STATUS_MAP[show.status]?.label ?? show.status) : "—"],
                ["Số mùa",          show?.numberOfSeasons  ? `${show.numberOfSeasons} mùa`  : "—"],
                ["Tổng số tập",     show?.numberOfEpisodes ? `${show.numberOfEpisodes} tập` : "—"],
                ["Quốc gia",        show?.originCountry || "—"],
                ["Ngôn ngữ gốc",    show?.language?.toUpperCase() || "—"],
                ["Điểm đánh giá",   show?.rating ? `${fmt(show.rating)} / 10` : "—"],
                ["Đạo diễn/Creator", creators.map((d) => d.name).join(", ") || "—"],
                ["Diễn viên chính", actors.slice(0, 3).map((a) => a.name).join(", ") || "—"],
                ...(show?.networks?.length
                  ? [["Kênh phát sóng", show.networks.map((n) => n.name ?? n).join(", ")]]
                  : []),
              ]}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}