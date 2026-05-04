// src/components/tvshow/TvShowTitleBlock.jsx
import React from "react";
import { motion } from "framer-motion";
import { Info, Calendar, Tv, Star, Clock, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { C } from "../ui/movieConstants";
import StatPill from "../ui/StatPill";

const TvShowTitleBlock = ({
  tvShow,
  currentEp,
  selectedSeason,
  firstAirYear,
  isMobile,
}) => {
  const navigate = useNavigate();
  const showTitle = tvShow?.title ?? tvShow?.name ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      style={{ marginTop: 24, marginBottom: 28 }}
    >
      {/* Show title */}
      <h1
        style={{
          fontFamily: "'Be Vietnam Pro',sans-serif",
          fontSize: isMobile ? 22 : 38,
          fontWeight: 900,
          letterSpacing: "0.02em",
          lineHeight: 1.2,
          marginBottom: currentEp ? 8 : 16,
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {showTitle}
      </h1>

      {/* Current episode label */}
      {currentEp && (
        <p
          style={{
            fontFamily: "'Nunito',sans-serif",
            fontSize: isMobile ? 13 : 15,
            color: C.accent,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          Mùa {selectedSeason?.seasonNumber ?? "?"} Tập{" "}
          {currentEp.episodeNumber ?? currentEp.number ?? "?"}
          {currentEp.name ? ` · ${currentEp.name}` : ""}
        </p>
      )}

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
        {firstAirYear && (
          <StatPill icon={Calendar} label="Năm" value={firstAirYear} />
        )}
        {tvShow?.numberOfSeasons && (
          <StatPill
            icon={Tv}
            label="Season"
            value={`${tvShow.numberOfSeasons} mùa`}
          />
        )}
        {tvShow?.rating && (
          <StatPill
            icon={Star}
            label="Đánh giá"
            value={`${tvShow.rating.toFixed(1)} / 10`}
          />
        )}
        {tvShow?.status && (
          <StatPill icon={Clock} label="Trạng thái" value={tvShow.status} />
        )}
        {tvShow?.genres?.slice(0, isMobile ? 1 : 2).map((g) => (
          <StatPill key={g} icon={Award} label="" value={g} />
        ))}
      </div>

      {/* Overview */}
      {(currentEp?.overview || tvShow?.description || tvShow?.overview) && (
        <p
          style={{
            fontFamily: "'Nunito',sans-serif",
            fontSize: isMobile ? 13 : 14,
            color: C.textSub,
            lineHeight: 1.7,
            maxWidth: 680,
          }}
        >
          {currentEp?.overview || tvShow?.description || tvShow?.overview}
        </p>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(`/tvshow/${tvShow?.id}/info`)}
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
};

export default TvShowTitleBlock;