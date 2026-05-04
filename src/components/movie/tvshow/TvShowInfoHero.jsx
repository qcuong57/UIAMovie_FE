// src/components/movie/tvshow/TvShowInfoHero.jsx
// Hero section: backdrop + nav bar + poster + text info + actions

import React from "react";
import { motion } from "framer-motion";
import { Play, Heart, Calendar, Globe, Star, List, Tv, MapPin } from "lucide-react";
import { C } from "../ui/movieConstants";
import { fmt } from "../ui/movieConstants";
import BackButton from "../../common/BackButton";
import StatPill from "../ui/StatPill";
import StatusBadge from "./StatusBadge";

export default function TvShowInfoHero({
  isMobile,
  show,
  year,
  genreList,
  firstTrailerKey,
  isFav,
  onToggleFav,
  onPlay,
  onTrailer,
  imgLoaded,
  onImgLoad,
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: isMobile ? 420 : 560,
        overflow: "hidden",
      }}
    >
      {/* Backdrop */}
      {show?.backdropUrl && (
        <>
          <img
            src={show.backdropUrl}
            alt=""
            onLoad={onImgLoad}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: imgLoaded ? 0.38 : 0,
              transition: "opacity 0.8s ease",
              filter: "saturate(1.1)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, rgba(0,0,0,0.96) 38%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.2) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, #000 0%, transparent 55%)",
            }}
          />
        </>
      )}

      {/* Nav bar */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          padding: isMobile ? "16px" : "20px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <BackButton />

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onToggleFav}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: isFav ? C.accentSoft : "rgba(255,255,255,0.07)",
            border: `1px solid ${isFav ? C.accentGlow : C.border}`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Heart
            size={17}
            style={{
              color: isFav ? C.accent : C.textSub,
              fill: isFav ? C.accent : "none",
              transition: "all 0.2s",
            }}
          />
        </motion.button>
      </div>

      {/* Hero content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 16 : 48,
          padding: isMobile ? "16px 16px 36px" : "24px 48px 72px",
          maxWidth: 1200,
          margin: "0 auto",
          alignItems: "flex-end",
          minHeight: isMobile ? 360 : 460,
        }}
      >
        {/* Poster — desktop only */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{
              flexShrink: 0,
              width: 200,
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)",
              order: 2,
            }}
          >
            {show?.posterUrl ? (
              <img
                src={show.posterUrl}
                alt={show.title}
                style={{ width: "100%", display: "block" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "2/3",
                  background: C.surfaceMid,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                }}
              >
                📺
              </div>
            )}
          </motion.div>
        )}

        {/* Text info */}
        <div style={{ flex: 1 }}>
          {/* Genre chips + status badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 16,
              alignItems: "center",
            }}
          >
            {genreList.map((g) => (
              <span
                key={g}
                style={{
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "'Nunito', sans-serif",
                  background: C.accentSoft,
                  color: C.accent,
                  border: `1px solid ${C.accentGlow}`,
                  letterSpacing: "0.03em",
                }}
              >
                {g}
              </span>
            ))}
            {show?.status && <StatusBadge status={show.status} />}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: isMobile
                ? "clamp(24px, 7vw, 40px)"
                : "clamp(32px, 6vw, 68px)",
              fontWeight: 900,
              color: C.text,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              marginBottom: 14,
              textShadow: "0 4px 30px rgba(0,0,0,0.7)",
            }}
          >
            {show?.title}
          </motion.h1>

          {/* Tagline */}
          {show?.tagline && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.22 }}
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 15,
                color: C.textSub,
                fontStyle: "italic",
                marginBottom: 20,
              }}
            >
              "{show.tagline}"
            </motion.p>
          )}

          {/* Meta pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 24,
              alignItems: "center",
            }}
          >
            {year && <StatPill icon={Calendar} label="Ra mắt" value={year} />}
            {show?.numberOfSeasons > 0 && (
              <StatPill icon={List} label="Mùa" value={`${show.numberOfSeasons} mùa`} />
            )}
            {show?.numberOfEpisodes && (
              <StatPill icon={Tv} label="Tập" value={`${show.numberOfEpisodes} tập`} />
            )}
            {show?.language && (
              <StatPill icon={Globe} label="Ngôn ngữ" value={show.language.toUpperCase()} />
            )}
            {show?.originCountry && (
              <StatPill icon={MapPin} label="Quốc gia" value={show.originCountry} />
            )}
            {show?.rating > 0 && (
              <StatPill icon={Star} label="TMDB" value={`${fmt(show.rating)} / 10`} />
            )}
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onPlay}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 32px",
                borderRadius: 6,
                background: "white",
                color: "black",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 17,
                fontWeight: 700,
              }}
            >
              <Play size={18} fill="black" color="black" />
              Phát
            </motion.button>

            {firstTrailerKey && (
              <motion.button
                whileHover={{ opacity: 0.75 }}
                whileTap={{ scale: 0.97 }}
                onClick={onTrailer}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "13px 4px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Be Vietnam Pro', sans-serif",
                  fontSize: 16,
                  fontWeight: 600,
                  color: C.text,
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                  textDecorationThickness: 1,
                  letterSpacing: "0.01em",
                }}
              >
                <Play size={15} fill={C.text} color={C.text} />
                Xem Trailer
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}