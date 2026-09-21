import React, { useState } from "react";
import { motion } from "framer-motion";
import { IconStarFilled, IconChevronRight } from "@tabler/icons-react";
import { W, renderMarkdown, parseMarkdownTable } from "../config/aiChatConfig";
import { FONT_BODY } from "../../../context/homeTokens";

// ─── 1. THẺ SO SÁNH TỐI GIẢN & ĐẬM CHẤT ĐIỆN ẢNH ────────────────────────────
export const CompareCard = ({ movieA, movieB, markdownTable, onMovieClick }) => {
  let parsed = null;
  if (markdownTable) {
    try {
      parsed = typeof markdownTable === "string" ? JSON.parse(markdownTable) : markdownTable;
    } catch {
      parsed = null;
    }
  }

  const criteriaList = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.criteria)
    ? parsed.criteria
    : [];

  const summaryText = parsed && !Array.isArray(parsed) ? parsed.summary : null;
  const highlightA = parsed && !Array.isArray(parsed) ? parsed.highlightA : null;
  const highlightB = parsed && !Array.isArray(parsed) ? parsed.highlightB : null;
  const verdictText = parsed && !Array.isArray(parsed) ? parsed.verdict : null;
  const legacyTable = !parsed ? parseMarkdownTable(markdownTable) : null;

  const titleA = movieA?.title || "Phim A";
  const titleB = movieB?.title || "Phim B";
  const ratingA = Number(movieA?.rating || 0);
  const ratingB = Number(movieB?.rating || 0);

  return (
    <div
      style={{
        marginTop: 10,
        borderRadius: 14,
        background: "#111113",
        border: "1px solid rgba(255, 255, 255, 0.07)",
        overflow: "hidden",
      }}
    >
      {/* ── 2 CỘT TÁC PHẨM SONG SONG ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Cột Phim A */}
        <div
          onClick={() => movieA && onMovieClick(movieA)}
          style={{
            padding: "14px 12px",
            borderRight: "1px solid rgba(255, 255, 255, 0.05)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.01)",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.01)")}
        >
          <div
            style={{
              width: 50,
              height: 72,
              borderRadius: 6,
              overflow: "hidden",
              background: "#1c1c20",
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.5)",
              marginBottom: 8,
            }}
          >
            {movieA?.posterUrl ? (
              <img src={movieA.posterUrl} alt={titleA} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : null}
          </div>

          <span
            style={{
              fontFamily: FONT_BODY,
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
              lineHeight: 1.3,
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {titleA}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 4 }}>
            {ratingA > 0 && (
              <span style={{ fontSize: 11, color: W.gold, display: "inline-flex", alignItems: "center", gap: 2, fontWeight: 600 }}>
                <IconStarFilled size={10} /> {ratingA.toFixed(1)}
              </span>
            )}
          </div>

          {highlightA && (
            <p
              style={{
                fontSize: 11,
                color: "rgba(255, 255, 255, 0.6)",
                lineHeight: 1.4,
                margin: "8px 0 0",
              }}
            >
              {highlightA}
            </p>
          )}
        </div>

        {/* Cột Phim B */}
        <div
          onClick={() => movieB && onMovieClick(movieB)}
          style={{
            padding: "14px 12px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.01)",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.01)")}
        >
          <div
            style={{
              width: 50,
              height: 72,
              borderRadius: 6,
              overflow: "hidden",
              background: "#1c1c20",
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.5)",
              marginBottom: 8,
            }}
          >
            {movieB?.posterUrl ? (
              <img src={movieB.posterUrl} alt={titleB} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : null}
          </div>

          <span
            style={{
              fontFamily: FONT_BODY,
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
              lineHeight: 1.3,
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {titleB}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 4 }}>
            {ratingB > 0 && (
              <span style={{ fontSize: 11, color: W.gold, display: "inline-flex", alignItems: "center", gap: 2, fontWeight: 600 }}>
                <IconStarFilled size={10} /> {ratingB.toFixed(1)}
              </span>
            )}
          </div>

          {highlightB && (
            <p
              style={{
                fontSize: 11,
                color: "rgba(255, 255, 255, 0.6)",
                lineHeight: 1.4,
                margin: "8px 0 0",
              }}
            >
              {highlightB}
            </p>
          )}
        </div>
      </div>

      {/* ── CÁC DÒNG SO SÁNH TRỰC DIỆN (NẾU CÓ) ── */}
      {criteriaList.length > 0 && (
        <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
          {criteriaList.slice(0, 3).map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                padding: "6px 0",
                fontSize: 11,
                lineHeight: 1.4,
                borderBottom: idx < Math.min(criteriaList.length, 3) - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
              }}
            >
              <div style={{ color: "rgba(255,255,255,0.75)" }}>{renderMarkdown(item.movieA)}</div>
              <div style={{ color: "rgba(255,255,255,0.75)" }}>{renderMarkdown(item.movieB)}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── KẾT LUẬN TỰ NHIÊN DẠNG EDITORIAL NOTE ── */}
      {(verdictText || summaryText) && (
        <div
          style={{
            padding: "10px 12px",
            background: "rgba(255, 255, 255, 0.015)",
            fontFamily: FONT_BODY,
            fontSize: 11.5,
            color: "rgba(255, 255, 255, 0.8)",
            lineHeight: 1.5,
          }}
        >
          {verdictText || summaryText}
        </div>
      )}

      {/* ── THANH TRUY CẬP PHIM TỐI GIẢN DƯỚI ĐÁY ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          background: "rgba(0, 0, 0, 0.15)",
        }}
      >
        <button
          onClick={() => movieA && onMovieClick(movieA)}
          style={{
            padding: "9px 8px",
            background: "transparent",
            border: "none",
            borderRight: "1px solid rgba(255, 255, 255, 0.05)",
            color: "rgba(255, 255, 255, 0.65)",
            fontFamily: FONT_BODY,
            fontSize: 11,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.65)")}
        >
          Chi tiết {titleA} <IconChevronRight size={11} opacity={0.6} />
        </button>
        <button
          onClick={() => movieB && onMovieClick(movieB)}
          style={{
            padding: "9px 8px",
            background: "transparent",
            border: "none",
            color: "rgba(255, 255, 255, 0.65)",
            fontFamily: FONT_BODY,
            fontSize: 11,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.65)")}
        >
          Chi tiết {titleB} <IconChevronRight size={11} opacity={0.6} />
        </button>
      </div>
    </div>
  );
};

// ─── 2. CÁC COMPONENT DANH SÁCH GIỮ NGUYÊN ──────────────────────────────────
const MediaRow = ({ item, title, meta, onClick, index }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onClick={() => onClick(item)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, delay: index * 0.05 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 13px",
        cursor: "pointer",
        position: "relative",
        background: hovered ? "rgba(255,255,255,0.04)" : "transparent",
        transition: "background 0.15s",
        minHeight: 66,
      }}
    >
      <div
        style={{
          width: 42,
          height: 60,
          borderRadius: 6,
          overflow: "hidden",
          flexShrink: 0,
          background: W.surfaceUp,
          border: `1px solid ${W.border}`,
          boxShadow: hovered ? `0 4px 12px ${W.accentGlow}` : "none",
          transition: "box-shadow 0.2s",
        }}
      >
        {item.posterUrl && (
          <img
            src={item.posterUrl}
            alt={title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: hovered ? "scale(1.08)" : "scale(1)",
              transition: "transform 0.3s ease",
            }}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: FONT_BODY,
            fontSize: 13,
            fontWeight: 600,
            color: hovered ? "#fff" : W.text,
            lineHeight: 1.35,
            margin: "0 0 4px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            transition: "color 0.15s",
          }}
        >
          {title}
        </p>
        {meta && (
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: 11,
              color: W.textDim,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {meta}
          </p>
        )}
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 13, right: 13, height: 0.5, background: W.border }} />
    </motion.div>
  );
};

const buildMeta = (item, { rating, extra }) => {
  const parts = [];
  if (rating > 0) {
    parts.push(`⭐ ${typeof rating === "number" ? rating.toFixed(1) : rating}`);
  }
  if (extra) parts.push(extra);
  return parts.join(" · ");
};

export const MovieCardsRow = ({ movies, onMovieClick }) => {
  if (!movies || movies.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: 0.06 }}
      style={{
        marginTop: 10,
        borderRadius: 12,
        overflow: "hidden",
        border: `1.5px solid ${W.borderHi}`,
        background: W.surface,
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ padding: "9px 13px", borderBottom: `1px solid ${W.border}`, background: W.surfaceUp }}>
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 10.5,
            fontWeight: 700,
            color: W.textSub,
            letterSpacing: "0.3px",
          }}
        >
          {movies.length} phim phù hợp
        </span>
      </div>

      <div
        style={{
          maxHeight: 250,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "thin",
          scrollbarColor: `${W.border} transparent`,
        }}
      >
        {movies.map((movie, i) => {
          const genres = Array.isArray(movie.genres)
            ? movie.genres.slice(0, 2).join(", ")
            : String(movie.genres || "").split(",").slice(0, 2).join(", ");
          return (
            <MediaRow
              key={movie.id || movie.movieId}
              item={movie}
              title={movie.title}
              meta={buildMeta(movie, { rating: movie.rating, extra: genres })}
              onClick={onMovieClick}
              index={i}
            />
          );
        })}
      </div>
    </motion.div>
  );
};

export const TvShowCardsRow = ({ tvshows, onTvShowClick }) => {
  if (!tvshows || tvshows.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: 0.06 }}
      style={{
        marginTop: 10,
        borderRadius: 12,
        overflow: "hidden",
        border: `1.5px solid ${W.borderHi}`,
        background: W.surface,
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ padding: "9px 13px", borderBottom: `1px solid ${W.border}`, background: W.surfaceUp }}>
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 10.5,
            fontWeight: 700,
            color: W.textSub,
            letterSpacing: "0.3px",
          }}
        >
          {tvshows.length} series phù hợp
        </span>
      </div>

      <div
        style={{
          maxHeight: 250,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "thin",
          scrollbarColor: `${W.border} transparent`,
        }}
      >
        {tvshows.map((show, i) => {
          const seasons = show.numberOfSeasons ?? show.seasons ?? null;
          const extra = seasons != null ? `${seasons} mùa` : "";
          return (
            <MediaRow
              key={show.id || show.tvShowId || show.seriesId || i}
              item={show}
              title={show.title || show.name}
              meta={buildMeta(show, { rating: show.rating, extra })}
              onClick={onTvShowClick}
              index={i}
            />
          );
        })}
      </div>
    </motion.div>
  );
};