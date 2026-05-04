// src/components/tvshow/SeasonEpisodeSelector.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Tv, Clock, Star, ChevronDown } from "lucide-react";
import tvShowService from "../../../services/tvShowService";
import {
  C,
  FONT_DISPLAY,
  FONT_BEBAS,
  FONT_BODY,
} from "../../../context/homeTokens";

/* ─── SeasonDropdown ────────────────────────────────────────────── */
function SeasonDropdown({ seasons, activeSeason, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const activeName =
    seasons.find((s) => (s.seasonNumber ?? s.number) === activeSeason)?.name ||
    `Phần ${activeSeason}`;

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "9px 16px",
          width: 200,
          minWidth: 200,
          background: open ? C.surfaceHigh : C.surfaceMid,
          border: `1px solid ${open ? C.borderBright : C.border}`,
          borderRadius: 6,
          cursor: "pointer",
          fontFamily: FONT_DISPLAY,
          fontSize: 14,
          fontWeight: 700,
          color: C.text,
          transition: "all 0.18s",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", textAlign: "left" }}>
          {activeName}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ flexShrink: 0 }}
        >
          <ChevronDown size={15} color={C.textSub} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              minWidth: 180,
              background: "#1a1a1a",
              border: `1px solid ${C.borderMid}`,
              borderRadius: 8,
              overflow: "auto",
              maxHeight: 320,
              zIndex: 200,
              boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
            }}
          >
            {seasons.map((s) => {
              const sNum = s.seasonNumber ?? s.number;
              const isActive = sNum === activeSeason;
              return (
                <button
                  key={sNum}
                  onClick={() => {
                    onChange(sNum);
                    setOpen(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "11px 16px",
                    background: isActive ? C.accentSoft : "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: FONT_BODY,
                    fontSize: 13.5,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? C.accent : C.text,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = C.surfaceHigh;
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {s.name || `Phần ${sNum}`}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── EpisodeCard — Netflix style ──────────────────────────────── */
function EpisodeCard({ ep, sNum, selected, onClick }) {
  const epNum = ep.episodeNumber ?? ep.number;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        padding: "16px 20px",
        borderRadius: 6,
        background: hovered ? C.surfaceHigh : "transparent",
        cursor: "pointer",
        transition: "background 0.15s",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {/* Episode number */}
      <div
        style={{
          flexShrink: 0,
          width: 28,
          textAlign: "center",
          paddingTop: 28,
          fontFamily: FONT_BEBAS,
          fontSize: 22,
          color: selected ? C.accent : C.textSub,
          letterSpacing: "0.04em",
          lineHeight: 1,
        }}
      >
        {epNum}
      </div>

      {/* Thumbnail */}
      <div
        style={{
          width: 130,
          height: 73,
          borderRadius: 4,
          overflow: "hidden",
          background: C.surfaceHigh,
          flexShrink: 0,
          position: "relative",
        }}
      >
        {ep.stillUrl ? (
          <img
            src={ep.stillUrl}
            alt={ep.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transition: "transform 0.3s",
              transform: hovered ? "scale(1.07)" : "scale(1)",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${C.surfaceMid}, ${C.surfaceHigh})`,
            }}
          >
            <Tv size={22} color={C.textDim} />
          </div>
        )}

        {/* Play overlay */}
        <AnimatePresence>
          {(hovered || selected) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: selected ? C.accent : "rgba(255,255,255,0.92)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: selected
                    ? `0 0 18px ${C.accentGlow}`
                    : "0 4px 14px rgba(0,0,0,0.5)",
                }}
              >
                <Play
                  size={14}
                  fill={selected ? "#fff" : "#000"}
                  color={selected ? "#fff" : "#000"}
                  style={{ marginLeft: 2 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Currently playing bar */}
        {selected && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
              background: C.accent,
            }}
          />
        )}
      </div>

      {/* Text info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 14,
                fontWeight: 700,
                color: selected ? C.accent : C.text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              {ep.name || `Tập ${epNum}`}
            </p>
            {ep.originalName && ep.originalName !== ep.name && (
              <p
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 11.5,
                  color: C.textDim,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: 1.4,
                  margin: "2px 0 0",
                  fontStyle: "italic",
                }}
              >
                {ep.originalName}
              </p>
            )}
          </div>
          {ep.runtime && (
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 11.5,
                color: C.textSub,
                flexShrink: 0,
              }}
            >
              {ep.runtime}m
            </span>
          )}
        </div>

        {/* Overview */}
        {ep.overview && (
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: 12.5,
              color: C.textSub,
              lineHeight: 1.6,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              margin: 0,
            }}
          >
            {ep.overview}
          </p>
        )}

        {/* Rating */}
        {ep.voteAverage > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 7,
            }}
          >
            <Star size={10} fill={C.gold} color={C.gold} />
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 11,
                color: C.gold,
                fontWeight: 700,
              }}
            >
              {ep.voteAverage.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Spinner ───────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <motion.div
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          border: `2px solid ${C.border}`,
          borderTopColor: C.accent,
        }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
      />
    </div>
  );
}

/* ─── SeasonEpisodeSelector ─────────────────────────────────────── */
const SeasonEpisodeSelector = ({
  tvShow,
  selectedSeason,
  selectedEpisode,
  onSelectEpisode,
  // Cache & loading state managed by parent (TvShowInfoPage)
  seasonEpisodesCache = {},
  loadingSeasonEpisodes = false,
  onSeasonSelect,
}) => {
  const seasons = tvShow?.seasons ?? [];

  const defaultSeason =
    selectedSeason?.seasonNumber ?? seasons[0]?.seasonNumber ?? 1;
  const [activeSeason, setActiveSeason] = useState(defaultSeason);

  // Trigger initial season load on mount / show change
  useEffect(() => {
    if (seasons.length > 0 && onSeasonSelect) {
      const firstSeasObj = seasons.find(
        (s) => (s.seasonNumber ?? s.number) === defaultSeason
      );
      if (firstSeasObj) onSeasonSelect(firstSeasObj);
    }
  }, [tvShow?.id]);

  const handleSeasonChange = (sNum) => {
    setActiveSeason(sNum);
    if (onSeasonSelect) {
      const seasObj = seasons.find((s) => (s.seasonNumber ?? s.number) === sNum);
      if (seasObj) onSeasonSelect(seasObj);
    }
  };

  const activeSeasObj = seasons.find(
    (s) => (s.seasonNumber ?? s.number) === activeSeason
  );

  // Episodes: use parent cache, fallback to inline season data only as last resort
  const episodes =
    seasonEpisodesCache[activeSeason] ??
    activeSeasObj?.episodes ??
    [];

  // Loading: parent signals loading for current season
  const isLoadingCurrent = loadingSeasonEpisodes && !seasonEpisodesCache[activeSeason];

  const isSelected = (ep) =>
    selectedEpisode?.episodeNumber === (ep.episodeNumber ?? ep.number) &&
    selectedSeason?.seasonNumber === activeSeason;

  if (!seasons.length) {
    return (
      <div
        style={{
          padding: "48px 0",
          textAlign: "center",
          fontFamily: FONT_BODY,
          fontSize: 14,
          color: C.textDim,
        }}
      >
        Chưa có thông tin mùa phim
      </div>
    );
  }

  return (
    <div
      style={{
        background: C.bg,
        borderRadius: 8,
        position: "relative",
      }}
    >
      {/* ── Header — chỉ hiện khi có ≥2 season, hoặc có meta info ── */}
      {(seasons.length > 1 || activeSeasObj) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          {/* Meta: số tập · năm */}
          {activeSeasObj ? (
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 13,
                color: C.textSub,
              }}
            >
              {activeSeasObj.episodeCount ?? episodes.length ?? "?"} tập
              {activeSeasObj.airDate
                ? ` · ${new Date(activeSeasObj.airDate).getFullYear()}`
                : ""}
            </span>
          ) : (
            <span />
          )}

          {/* Season dropdown — chỉ hiện khi ≥2 season */}
          {seasons.length > 1 && (
            <SeasonDropdown
              seasons={seasons}
              activeSeason={activeSeason}
              onChange={handleSeasonChange}
            />
          )}
        </div>
      )}

      {/* ── Episode list ── */}
      <div
        style={{
          maxHeight: 560,
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: `${C.border} transparent`,
        }}
      >
        <AnimatePresence mode="wait">
          {isLoadingCurrent ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Spinner />
            </motion.div>
          ) : episodes.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                padding: "48px 0",
                textAlign: "center",
                fontFamily: FONT_BODY,
                fontSize: 13,
                color: C.textDim,
              }}
            >
              Chưa có tập nào
            </motion.div>
          ) : (
            <motion.div
              key={`season-${activeSeason}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {episodes.map((ep) => (
                <EpisodeCard
                  key={ep.episodeNumber ?? ep.number}
                  ep={ep}
                  sNum={activeSeason}
                  selected={isSelected(ep)}
                  onClick={() =>
                    onSelectEpisode(
                      { seasonNumber: activeSeason, ...activeSeasObj },
                      ep
                    )
                  }
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SeasonEpisodeSelector;