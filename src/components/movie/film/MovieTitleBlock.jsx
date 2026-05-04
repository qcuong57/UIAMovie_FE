// src/components/movie/film/MovieTitleBlock.jsx
// Khối tiêu đề + meta pills + mô tả + nút "Thông tin"
// Tách ra từ MovieDetailPage — đặt cùng thư mục với MovieInfoHero, MovieInfoTabs
//
// Props:
//   movie        – object (dữ liệu phim)
//   year         – number | string
//   isMobile     – boolean
//   id           – string (movie id, dùng để navigate)

import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Info, Star, Calendar, Clock, Award } from "lucide-react";
import { C } from "../ui/movieConstants";
import StatPill from "../ui/StatPill";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function MovieTitleBlock({ movie, year, isMobile, id }) {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.5, delay: 0.1 }}
      style={{ marginTop: 24, marginBottom: 28 }}
    >
      {/* Tiêu đề phim */}
      <h1
        style={{
          fontFamily: "'Be Vietnam Pro',sans-serif",
          fontSize: isMobile ? 22 : 38,
          fontWeight: 900,
          letterSpacing: "0.02em",
          lineHeight: 1.2,
          marginBottom: 16,
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {movie?.title}
      </h1>

      {/* Meta pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        {year && <StatPill icon={Calendar} label="Năm" value={year} />}

        {movie?.duration && (
          <StatPill icon={Clock} label="Thời lượng" value={`${movie.duration} phút`} />
        )}

        {movie?.rating && (
          <StatPill
            icon={Star}
            label="Đánh giá"
            value={`${movie.rating.toFixed(1)} / 10`}
          />
        )}

        {movie?.genres?.slice(0, isMobile ? 1 : 2).map((g) => (
          <StatPill key={g} icon={Award} label="" value={g} />
        ))}
      </div>

      {/* Mô tả */}
      {movie?.description && (
        <p
          style={{
            fontFamily: "'Nunito',sans-serif",
            fontSize: isMobile ? 13 : 14,
            color: C.textSub,
            lineHeight: 1.7,
            maxWidth: 680,
          }}
        >
          {movie.description}
        </p>
      )}

      {/* Nút thông tin */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(`/movie/${id}/info`)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 28px",
            background: "white",
            color: "black",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontFamily: "'Nunito',sans-serif",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          <Info size={18} color="black" /> Thông tin
        </motion.button>
      </div>
    </motion.div>
  );
}