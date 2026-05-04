// src/components/movie/film/MovieTabsPanel.jsx
// Tab panel: Diễn viên & Đạo diễn | Đánh giá | Thêm thông tin
// Tách ra từ MovieDetailPage — đặt cùng thư mục với MovieInfoHero, MovieInfoTabs
//
// Props:
//   isMobile    – boolean
//   tab         – string (active tab key)
//   onTabChange – (key: string) => void
//   movie       – object
//   year        – number | string
//   dirs        – array (đạo diễn)
//   actors      – array (diễn viên)
//   id          – string (movie/tvshow id, dùng cho ReviewSection)
//   currentUser – object | null

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PersonScrollRow from "../Personscrollrow";
import ReviewSection from "../Reviewsection";
import { C } from "../ui/movieConstants";
import SectionTitle from "../ui/SectionTitle";
import StarRating from "../ui/StarRating";
import TabBar from "../ui/TabBar";
import DetailInfoGrid from "../ui/DetailInfoGrid";
import EmptyState from "../ui/EmptyState";
import PersonCard from "../ui/PersonCard";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const TABS = [
  { key: "cast", label: "Diễn viên & Đạo diễn" },
  { key: "reviews", label: "Đánh giá" },
  { key: "more", label: "Thêm thông tin" },
];

export default function MovieTabsPanel({
  isMobile,
  tab,
  onTabChange,
  movie,
  year,
  dirs = [],
  actors = [],
  id,
  currentUser,
}) {
  const hasCast = dirs.length > 0 || actors.length > 0;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ delay: 0.2 }}
    >
      <TabBar tabs={TABS} activeTab={tab} onChange={onTabChange} isMobile={isMobile} />

      <AnimatePresence mode="wait">
        {/* ── CAST ─────────────────────────────────────────────── */}
        {tab === "cast" && (
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
                {dirs.length > 0 && (
                  <div>
                    <SectionTitle>Đạo Diễn</SectionTitle>
                    <div style={{ display: "flex", gap: 16 }}>
                      {dirs.map((p, i) => (
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

        {/* ── REVIEWS ──────────────────────────────────────────── */}
        {tab === "reviews" && (
          <motion.div
            key="reviews"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ReviewSection
              movieId={id}
              movieRating={movie?.rating}
              voteCount={movie?.voteCount}
              currentUser={currentUser}
            />
          </motion.div>
        )}

        {/* ── MORE ─────────────────────────────────────────────── */}
        {tab === "more" && (
          <motion.div
            key="more"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SectionTitle>Thông Tin Chi Tiết</SectionTitle>

            {movie?.rating && (
              <div style={{ marginBottom: 28 }}>
                <StarRating score={movie.rating} votes={movie?.voteCount} />
              </div>
            )}

            <DetailInfoGrid
              isMobile={isMobile}
              rows={[
                ["Thể loại", movie?.genres?.join(", ") || "—"],
                ["Năm phát hành", year || "—"],
                ["Thời lượng", movie?.duration ? `${movie.duration} phút` : "—"],
                ["Điểm đánh giá", movie?.rating ? `${movie.rating.toFixed(1)} / 10` : "—"],
                ["Đạo diễn", dirs.map((d) => d.name).join(", ") || "—"],
                ["Diễn viên chính", actors.slice(0, 3).map((a) => a.name).join(", ") || "—"],
              ]}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}