import React, { useState } from "react";
import { motion } from "framer-motion";
import { IconMovie, IconStarFilled, IconArrowUpRight, IconPlayerPlay } from "@tabler/icons-react";
import { W, renderMarkdown, parseMarkdownTable } from "../config/aiChatConfig";
import { FONT_BODY } from "../../../context/homeTokens";

export const CompareCard = ({ movieA, movieB, markdownTable, onMovieClick }) => {
  const { header, body } = parseMarkdownTable(markdownTable);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      style={{
        marginTop: 10, borderRadius: 14,
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
              display: "flex", alignItems: "center", gap: 9, padding: "11px 12px",
              borderRight: idx === 0 ? `1px solid ${W.border}` : "none",
              borderBottom: `1px solid ${W.border}`,
              cursor: "pointer",
              background: "transparent",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{
              width: 32, height: 46, borderRadius: 6,
              overflow: "hidden", flexShrink: 0, background: W.surfaceUp,
            }}>
              {movie?.posterUrl ? (
                <img src={movie.posterUrl} alt={movie?.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconMovie size={12} color={W.textDim} />
                </div>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600,
                color: W.text, margin: 0,
                overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
              }}>
                {movie?.title || "—"}
              </p>
              {movie?.rating > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                  <IconStarFilled size={8} color={W.gold} />
                  <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: W.gold, fontWeight: 600 }}>
                    {typeof movie.rating === "number" ? movie.rating.toFixed(1) : movie.rating}
                  </span>
                </div>
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
                    <th key={i} style={{
                      padding: "7px 10px",
                      fontFamily: FONT_BODY, fontSize: 9, fontWeight: 700,
                      color: W.textDim, textAlign: "left",
                      borderBottom: `1px solid ${W.border}`,
                      whiteSpace: "nowrap", letterSpacing: "0.06em", textTransform: "uppercase",
                    }}>
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
                    <td key={ci} style={{
                      padding: "8px 10px",
                      fontFamily: FONT_BODY, fontSize: 11.5,
                      color: ci === 0 ? W.textSub : W.text,
                      fontWeight: ci === 0 ? 600 : 400,
                      verticalAlign: "top", lineHeight: 1.4,
                    }}>
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

export const MovieCard = ({ movie, onClick, index = 0 }) => {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered]   = useState(false);

  const genres = Array.isArray(movie.genres)
    ? movie.genres.slice(0, 2).join(" · ")
    : String(movie.genres || "").split(",").slice(0, 2).join(" · ");
  const rating = typeof movie.rating === "number" ? movie.rating.toFixed(1) : movie.rating;

  return (
    <motion.div
      onClick={() => onClick(movie)}
      // Staggered slide-in: each card delayed by index
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.028)" }}
      style={{
        display: "flex", alignItems: "center", gap: 11, padding: "10px 13px",
        cursor: "pointer", position: "relative",
        transition: "background 0.15s",
      }}
    >
      <div style={{
        width: 40, height: 57, borderRadius: 7,
        overflow: "hidden", flexShrink: 0,
        background: W.surfaceUp,
        boxShadow: "0 3px 10px rgba(0,0,0,0.5)",
      }}>
        {movie.posterUrl && !imgError ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            onError={() => setImgError(true)}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transform: hovered ? "scale(1.07)" : "scale(1)",
              transition: "transform 0.3s ease",
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconMovie size={14} color={W.textDim} />
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600,
          color: hovered ? "#fff" : W.text,
          lineHeight: 1.35, margin: "0 0 3px",
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
          transition: "color 0.15s",
        }}>
          {movie.title}
        </p>
        {genres && (
          <p style={{
            fontFamily: FONT_BODY, fontSize: 9.5, fontWeight: 400,
            color: W.textDim, margin: "0 0 5px",
            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
            letterSpacing: "0.01em",
          }}>
            {genres}
          </p>
        )}
        {rating > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <IconStarFilled size={9} color={W.gold} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700, color: W.gold }}>{rating}</span>
            <span style={{ fontFamily: FONT_BODY, fontSize: 9, color: W.textDim }}>/10</span>
          </div>
        )}
      </div>

      <div style={{
        width: 26, height: 26, borderRadius: 7,
        background: hovered ? W.accentSoft : "transparent",
        border: `1px solid ${hovered ? W.accentGlow : "transparent"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        transition: "all 0.15s",
      }}>
        <IconArrowUpRight size={13} color={hovered ? W.accent : W.textDim} style={{ transition: "color 0.15s" }} />
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 13, right: 13, height: 1, background: W.border }} />
    </motion.div>
  );
};

export const MovieCardsRow = ({ movies, onMovieClick }) => {
  if (!movies || movies.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      style={{
        marginTop: 10, borderRadius: 14,
        overflow: "hidden",
        border: `1px solid ${W.border}`,
        background: W.surface,
      }}
    >
      {/* Header row */}
      <div style={{
        padding: "8px 13px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${W.border}`,
        background: W.surfaceUp,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 16, height: 16, borderRadius: 4,
            background: W.accentSoft,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <IconPlayerPlay size={9} color={W.accent} />
          </div>
          <span style={{
            fontFamily: FONT_BODY, fontSize: 9.5, fontWeight: 600,
            color: W.textSub, letterSpacing: "0.05em", textTransform: "uppercase",
          }}>
            {movies.length} phim phù hợp
          </span>
        </div>
        <span style={{ fontFamily: FONT_BODY, fontSize: 9, color: W.textDim }}>Nhấn để xem</span>
      </div>

      {/* Scrollable list — each MovieCard has its own stagger delay */}
      <div style={{ maxHeight: 220, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none" }}>
        {movies.map((movie, i) => (
          <MovieCard
            key={movie.id || movie.movieId}
            movie={movie}
            onClick={onMovieClick}
            index={i}
          />
        ))}
      </div>
    </motion.div>
  );
};