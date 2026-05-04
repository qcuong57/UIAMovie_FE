// src/components/ui/SearchResultItem.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Film, User } from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY, GENRE_VI, GENRE_COLOR } from "../../context/homeTokens";

/**
 * SearchResultItem — một hàng kết quả tìm kiếm phim trong dropdown.
 *
 * @param {{ id, title, posterUrl, releaseDate, rating, imdbRating, genres }} movie
 * @param {() => void} onClick
 */
export const MovieResultItem = ({ movie, onClick }) => {
  const [hov, setHov] = useState(false);

  const year   = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;
  const rating = movie.rating ?? movie.imdbRating;
  const genres = Array.isArray(movie.genres)
    ? movie.genres
        .slice(0, 2)
        .map((g) => (typeof g === "string" ? g : g?.name))
        .filter(Boolean)
    : [];

  const primaryGenre = genres[0];
  const genreColor   = primaryGenre ? (GENRE_COLOR[primaryGenre] ?? C.accent) : C.accent;

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      whileTap={{ scale: 0.98 }}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "8px 16px",
        background: hov ? C.surfaceHigh : "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s ease",
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Left accent line on hover */}
      <div style={{
        position: "absolute",
        left: 0, top: "50%",
        transform: "translateY(-50%)",
        width: 2,
        height: hov ? "70%" : 0,
        background: genreColor,
        borderRadius: 2,
        transition: "height 0.2s ease",
        opacity: 0.8,
      }} />

      {/* Poster */}
      <div style={{
        width: 38,
        height: 54,
        minWidth: 38,
        minHeight: 54,
        borderRadius: 6,
        overflow: "hidden",
        flexShrink: 0,
        alignSelf: "flex-start",
        background: C.surfaceHigh,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${hov ? C.borderMid : C.border}`,
        transition: "border-color 0.15s",
        position: "relative",
      }}>
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <Film size={15} color={C.textDim} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 13,
          color: hov ? C.text : "rgba(240,240,240,0.88)",
          marginBottom: 4,
          transition: "color 0.15s",
          letterSpacing: "-0.01em",
          lineHeight: 1.35,
          wordBreak: "break-word",
        }}>
          {movie.title}
        </p>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}>
          {year && (
            <span style={{
              fontFamily: FONT_BODY,
              fontSize: 11,
              color: C.textSub,
              flexShrink: 0,
            }}>
              {year}
            </span>
          )}

          {rating != null && rating > 0 && (
            <>
              <span style={{ color: C.textDim, fontSize: 10, flexShrink: 0 }}>•</span>
              <span style={{
                fontFamily: FONT_BODY,
                fontSize: 11,
                color: C.gold,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                ★ {Number(rating).toFixed(1)}
              </span>
            </>
          )}

          {genres.length > 0 && (
            <>
              <span style={{ color: C.textDim, fontSize: 10, flexShrink: 0 }}>•</span>
              <span style={{
                fontFamily: FONT_BODY,
                fontSize: 11,
                color: C.textSub,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flexShrink: 1,
                minWidth: 0,
              }}>
                {genres.map((g) => GENRE_VI[g] ?? g).join(" · ")}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.button>
  );
};

/**
 * ActorResultItem — một hàng kết quả diễn viên trong dropdown.
 *
 * @param {{ id, name, profileUrl, character, birthday, placeOfBirth, knownMovies }} actor
 * @param {() => void} onClick
 */
export const ActorResultItem = ({ actor, onClick }) => {
  const [hov, setHov] = useState(false);

  // knownMovies có thể là mảng string tên phim hoặc mảng objects
  const knownTitles = Array.isArray(actor.knownMovies)
    ? actor.knownMovies
        .slice(0, 2)
        .map((m) => (typeof m === "string" ? m : m?.title))
        .filter(Boolean)
    : [];

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      whileTap={{ scale: 0.98 }}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 16px",
        background: hov ? C.surfaceHigh : "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s ease",
        position: "relative",
      }}
    >
      {/* Left accent — red accent matching homeTokens */}
      <div style={{
        position: "absolute",
        left: 0, top: "50%",
        transform: "translateY(-50%)",
        width: 2,
        height: hov ? "70%" : 0,
        background: C.accent,
        borderRadius: 2,
        transition: "height 0.2s ease",
        opacity: 0.8,
      }} />

      {/* Avatar circle */}
      <div style={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        background: C.surfaceHigh,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${hov ? C.borderMid : C.border}`,
        transition: "border-color 0.15s",
      }}>
        {actor.profileUrl ? (
          <img
            src={actor.profileUrl}
            alt={actor.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <User size={15} color={C.textDim} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <p style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 13,
            fontWeight: 700,
            color: hov ? C.text : "rgba(240,240,240,0.88)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            transition: "color 0.15s",
            letterSpacing: "-0.01em",
          }}>
            {actor.name}
          </p>
          {/* Actor badge — red accent */}
          <span style={{
            fontFamily: FONT_BODY,
            fontSize: 9,
            fontWeight: 700,
            color: C.accent,
            background: C.accentSoft,
            padding: "1px 5px",
            borderRadius: 3,
            flexShrink: 0,
            letterSpacing: "0.04em",
          }}>
            DIỄN VIÊN
          </span>
        </div>

        {knownTitles.length > 0 && (
          <p style={{
            fontFamily: FONT_BODY,
            fontSize: 11,
            color: C.textSub,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {knownTitles.join(" · ")}
          </p>
        )}

        {knownTitles.length === 0 && actor.character && (
          <p style={{
            fontFamily: FONT_BODY,
            fontSize: 11,
            color: C.textSub,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            vai {actor.character}
          </p>
        )}
      </div>
    </motion.button>
  );
};

// Default export giữ nguyên tương thích cũ (chỉ movie)
const SearchResultItem = ({ movie, onClick }) => (
  <MovieResultItem movie={movie} onClick={onClick} />
);

export default SearchResultItem;