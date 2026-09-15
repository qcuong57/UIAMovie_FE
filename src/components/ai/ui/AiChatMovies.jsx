import React, { useState } from "react";
import { motion } from "framer-motion";
import { W, renderMarkdown, parseMarkdownTable } from "../config/aiChatConfig";
import { FONT_BODY } from "../../../context/homeTokens";

export const CompareCard = ({ movieA, movieB, markdownTable, onMovieClick }) => {
  const { header, body } = parseMarkdownTable(markdownTable);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        marginTop: 9,
        borderRadius: 12,
        border: `1px solid ${W.border}`,
        background: W.surface,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {[movieA, movieB].map((movie, idx) => (
          <div
            key={idx}
            onClick={() => movie && onMovieClick(movie)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "11px 12px",
              borderRight: idx === 0 ? `1px solid ${W.border}` : "none",
              borderBottom: `1px solid ${W.border}`,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ width: 32, height: 46, borderRadius: 5, overflow: "hidden", flexShrink: 0, background: W.surfaceUp }}>
              {movie?.posterUrl && (
                <img src={movie.posterUrl} alt={movie?.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color: W.text, margin: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                {movie?.title || "—"}
              </p>
              {movie?.rating > 0 && (
                <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: W.gold, fontWeight: 600, margin: "2px 0 0" }}>
                  {typeof movie.rating === "number" ? movie.rating.toFixed(1) : movie.rating} điểm
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {body.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            {header.length > 0 && (
              <thead>
                <tr>
                  {header.map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "7px 10px",
                        fontFamily: FONT_BODY,
                        fontSize: 9.5,
                        fontWeight: 600,
                        color: W.textDim,
                        textAlign: "left",
                        borderBottom: `1px solid ${W.border}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: `1px solid ${W.border}` }}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      style={{
                        padding: "8px 10px",
                        fontFamily: FONT_BODY,
                        fontSize: 11.5,
                        color: ci === 0 ? W.textSub : W.text,
                        fontWeight: ci === 0 ? 600 : 400,
                        verticalAlign: "top",
                        lineHeight: 1.4,
                      }}
                    >
                      {renderMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

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
        gap: 11,
        padding: "10px 13px",
        cursor: "pointer",
        position: "relative",
        background: hovered ? "rgba(255,255,255,0.028)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      <div style={{ width: 38, height: 54, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: W.surfaceUp }}>
        {item.posterUrl && (
          <img
            src={item.posterUrl}
            alt={title}
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: hovered ? "scale(1.06)" : "scale(1)", transition: "transform 0.3s ease" }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: FONT_BODY,
            fontSize: 12.5,
            fontWeight: 600,
            color: hovered ? "#fff" : W.text,
            lineHeight: 1.35,
            margin: "0 0 3px",
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
          <p style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: W.textDim, margin: 0 }}>
            {meta}
          </p>
        )}
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 13, right: 13, height: 1, background: W.border }} />
    </motion.div>
  );
};

const buildMeta = (item, { rating, extra }) => {
  const parts = [];
  if (rating > 0) parts.push(`${typeof rating === "number" ? rating.toFixed(1) : rating} điểm`);
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
      style={{ marginTop: 9, borderRadius: 12, overflow: "hidden", border: `1px solid ${W.border}`, background: W.surface }}
    >
      <div style={{ padding: "8px 13px", borderBottom: `1px solid ${W.border}`, background: W.surfaceUp }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 600, color: W.textSub }}>
          {movies.length} phim phù hợp
        </span>
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none" }}>
        {movies.map((movie, i) => {
          const genres = Array.isArray(movie.genres) ? movie.genres.slice(0, 2).join(", ") : String(movie.genres || "").split(",").slice(0, 2).join(", ");
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
      style={{ marginTop: 9, borderRadius: 12, overflow: "hidden", border: `1px solid ${W.border}`, background: W.surface }}
    >
      <div style={{ padding: "8px 13px", borderBottom: `1px solid ${W.border}`, background: W.surfaceUp }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 600, color: W.textSub }}>
          {tvshows.length} series phù hợp
        </span>
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none" }}>
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