// src/components/movie/tvshow/SeasonAccordion.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Tv } from "lucide-react";
import { C } from "../ui/movieConstants";

// ── EpisodeItem ────────────────────────────────────────────────────
function EpisodeItem({ ep, ei, total }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "10px 18px",
        borderBottom: ei < total - 1 ? `1px solid ${C.border}` : "none",
      }}
    >
      {ep.stillUrl && (
        <div
          style={{
            width: 88,
            height: 52,
            borderRadius: 6,
            flexShrink: 0,
            overflow: "hidden",
            background: C.surfaceMid,
          }}
        >
          <img
            src={ep.stillUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: C.text,
            marginBottom: 3,
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          <span style={{ color: C.textDim, marginRight: 6 }}>
            {ep.episodeNumber?.toString().padStart(2, "0")}.
          </span>
          {ep.name || `Tập ${ep.episodeNumber}`}
        </p>
        {ep.overview && (
          <p
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 12,
              color: C.textSub,
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {ep.overview}
          </p>
        )}
        {ep.runtime && (
          <p
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 11,
              color: C.textDim,
              marginTop: 4,
            }}
          >
            {ep.runtime} phút
          </p>
        )}
      </div>
    </div>
  );
}

// ── SeasonItem ─────────────────────────────────────────────────────
function SeasonItem({ season, si, isOpen, onToggle }) {
  const epCount = season.episodes?.length ?? season.episodeCount ?? 0;
  const airYear = season.airDate ? new Date(season.airDate).getFullYear() : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: si * 0.04 }}
      style={{
        borderRadius: 10,
        border: `1px solid ${isOpen ? C.accentGlow : C.border}`,
        background: isOpen ? "rgba(229,24,30,0.04)" : C.card,
        overflow: "hidden",
        transition: "border-color 0.18s, background 0.18s",
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 18px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 44,
            height: 64,
            borderRadius: 6,
            flexShrink: 0,
            overflow: "hidden",
            background: C.surfaceMid,
          }}
        >
          {season.posterUrl ? (
            <img
              src={season.posterUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Tv size={18} color={C.textDim} />
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: C.text,
              marginBottom: 4,
            }}
          >
            {season.name || `Mùa ${season.seasonNumber}`}
          </p>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textDim }}>
            {epCount > 0 ? `${epCount} tập` : "Chưa có tập"}
            {airYear ? ` · ${airYear}` : ""}
          </p>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: C.textDim, flexShrink: 0 }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      {/* Episodes */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="eps"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 0 12px" }}>
              {season.overview && (
                <p
                  style={{
                    padding: "8px 18px 12px",
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: 13,
                    color: C.textSub,
                    lineHeight: 1.6,
                    borderBottom: `1px solid ${C.border}`,
                    marginBottom: 4,
                  }}
                >
                  {season.overview}
                </p>
              )}

              {(season.episodes ?? []).map((ep, ei) => (
                <EpisodeItem
                  key={ep.episodeNumber ?? ei}
                  ep={ep}
                  ei={ei}
                  total={season.episodes?.length ?? 0}
                />
              ))}

              {!season.episodes?.length && (
                <p
                  style={{
                    padding: "12px 18px",
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: 13,
                    color: C.textDim,
                  }}
                >
                  Chưa có thông tin tập phim
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── SeasonAccordion ────────────────────────────────────────────────
export default function SeasonAccordion({ seasons }) {
  const [openSeason, setOpenSeason] = useState(null);

  if (!seasons?.length)
    return (
      <div
        style={{
          padding: "32px 0",
          textAlign: "center",
          color: C.textDim,
          fontFamily: "'Nunito', sans-serif",
          fontSize: 14,
        }}
      >
        Chưa có thông tin mùa phim
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {seasons.map((season, si) => (
        <SeasonItem
          key={season.seasonNumber ?? si}
          season={season}
          si={si}
          isOpen={openSeason === season.seasonNumber}
          onToggle={() =>
            setOpenSeason(openSeason === season.seasonNumber ? null : season.seasonNumber)
          }
        />
      ))}
    </div>
  );
}