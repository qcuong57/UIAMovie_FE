// src/components/movie/movie/MovieInfoTabs.jsx
// Tabs section cho MovieInfoPage — Cast / Reviews / Details

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PersonScrollRow from "../Personscrollrow";
import ReviewSection from "../Reviewsection";
import SectionTitle from "../ui/SectionTitle";
import { C, fmt, fmtRuntime } from "../ui/movieConstants";
import TabBar from "../ui/TabBar";
import PersonCard from "../ui/PersonCard";
import EmptyState from "../ui/EmptyState";
import DetailInfoGrid from "../ui/DetailInfoGrid";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const TABS = [
  { key: "cast",    label: "Diễn viên"      },
  { key: "reviews", label: "Đánh giá"       },
  { key: "details", label: "Thêm thông tin" },
];

export default function MovieInfoTabs({
  isMobile,
  activeTab,
  onTabChange,
  movie,
  year,
  genreList,
  directors,
  actors,
  id,
  currentUser,
}) {
  const runtime = fmtRuntime(movie?.runtime);
  const hasCast = directors.length > 0 || actors.length > 0;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ delay: 0.2 }}
    >
      <TabBar tabs={TABS} activeTab={activeTab} onChange={onTabChange} isMobile={isMobile} />

      <AnimatePresence mode="wait">

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
                {directors.length > 0 && (
                  <div>
                    <SectionTitle>Đạo Diễn</SectionTitle>
                    <div style={{ display: "flex", gap: 16 }}>
                      {directors.map((p, i) => (
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
              movieId={id}
              movieRating={movie?.rating}
              voteCount={movie?.voteCount}
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
                ["Năm phát hành",   year || "—"],
                ["Ngày chiếu",      movie?.releaseDate ? new Date(movie.releaseDate).toLocaleDateString("vi-VN") : "—"],
                ["Thời lượng",      runtime || "—"],
                ["Ngôn ngữ gốc",    movie?.language?.toUpperCase() || "—"],
                ["Điểm đánh giá",   movie?.rating ? `${fmt(movie.rating)} / 10` : "—"],
                ["Số đánh giá",     movie?.voteCount ? movie.voteCount.toLocaleString() : "—"],
                ["Đạo diễn",        directors.map((d) => d.name).join(", ") || "—"],
                ["Diễn viên chính", actors.slice(0, 3).map((a) => a.name).join(", ") || "—"],
                ...(movie?.budget  ? [["Ngân sách", `$${(movie.budget  / 1e6).toFixed(0)}M`]] : []),
                ...(movie?.revenue ? [["Doanh thu", `$${(movie.revenue / 1e6).toFixed(0)}M`]] : []),
              ]}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}