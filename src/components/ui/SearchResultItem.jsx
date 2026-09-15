// src/components/ui/SearchResultItem.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Film, User, ArrowUpRight, Star } from "lucide-react";
import {
  C,
  FONT_DISPLAY,
  FONT_BODY,
  GENRE_VI,
  GENRE_COLOR,
} from "../../context/homeTokens";

/* =========================================================
   Shared animation
========================================================= */

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const imageVariants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.055,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

/* =========================================================
   Small utility
========================================================= */

const getYear = (date) => {
  if (!date) return null;

  const year = new Date(date).getFullYear();

  return Number.isFinite(year) ? year : null;
};

const getGenres = (genres = []) => {
  if (!Array.isArray(genres)) return [];

  return genres
    .slice(0, 2)
    .map((genre) => (typeof genre === "string" ? genre : genre?.name))
    .filter(Boolean);
};

/* =========================================================
   Poster
========================================================= */

const MoviePoster = ({ movie, hovered, genreColor }) => {
  return (
    <motion.div
      variants={imageVariants}
      initial="rest"
      animate={hovered ? "hover" : "rest"}
      style={{
        position: "relative",
        width: 48,
        height: 68,
        minWidth: 48,
        borderRadius: 8,
        overflow: "hidden",
        flexShrink: 0,
        background: C.surfaceHigh,
        border: `1px solid ${
          hovered ? `${genreColor}66` : C.border
        }`,
        boxShadow: hovered
          ? `0 8px 24px rgba(0,0,0,0.28)`
          : "0 3px 12px rgba(0,0,0,0.16)",
        transition:
          "border-color 320ms ease, box-shadow 320ms ease",
      }}
    >
      {movie.posterUrl ? (
        <img
          src={movie.posterUrl}
          alt={movie.title || "Movie poster"}
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Film size={18} strokeWidth={1.4} color={C.textDim} />
        </div>
      )}

      {/* Cinematic bottom gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.42) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Tiny genre accent */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: hovered ? "100%" : "0%",
          height: 2,
          background: genreColor,
          transition: "width 360ms cubic-bezier(.22,1,.36,1)",
        }}
      />
    </motion.div>
  );
};

/* =========================================================
   Movie result
========================================================= */

export const MovieResultItem = ({ movie, onClick }) => {
  const [hovered, setHovered] = useState(false);

  const year = getYear(movie?.releaseDate);
  const rating = movie?.rating ?? movie?.imdbRating;
  const genres = getGenres(movie?.genres);

  const primaryGenre = genres[0];

  const genreColor =
    (primaryGenre && GENRE_COLOR?.[primaryGenre]) || C.accent;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      whileTap={{ scale: 0.992 }}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 18px",
        background: hovered
          ? `linear-gradient(
              90deg,
              rgba(255,255,255,0.055),
              rgba(255,255,255,0.025)
            )`
          : "transparent",
        border: "none",
        borderLeft: `1px solid ${
          hovered ? `${genreColor}55` : "transparent"
        }`,
        cursor: "pointer",
        textAlign: "left",
        boxSizing: "border-box",
        overflow: "hidden",
        transition:
          "background 320ms ease, border-color 320ms ease",
      }}
    >
      {/* Subtle hover sweep */}
      <motion.div
        animate={{
          opacity: hovered ? 1 : 0,
          x: hovered ? 0 : -12,
        }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 2,
          background: genreColor,
          boxShadow: `0 0 14px ${genreColor}44`,
        }}
      />

      <MoviePoster
        movie={movie}
        hovered={hovered}
        genreColor={genreColor}
      />

      {/* Information */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          paddingRight: 4,
        }}
      >
        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            minWidth: 0,
            marginBottom: 7,
          }}
        >
          <p
            style={{
              flex: 1,
              minWidth: 0,
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: FONT_DISPLAY,
              fontSize: 14,
              fontWeight: 650,
              lineHeight: 1.25,
              letterSpacing: "-0.015em",
              color: hovered
                ? C.text
                : "rgba(245,245,245,0.92)",
              transition: "color 250ms ease",
            }}
          >
            {movie?.title || "Untitled"}
          </p>

          <motion.div
            animate={{
              opacity: hovered ? 1 : 0,
              x: hovered ? 0 : -4,
            }}
            transition={{ duration: 0.22 }}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.textDim,
            }}
          >
            <ArrowUpRight size={13} strokeWidth={1.7} />
          </motion.div>
        </div>

        {/* Metadata */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            minWidth: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            fontFamily: FONT_BODY,
          }}
        >
          {year && (
            <span
              style={{
                flexShrink: 0,
                fontSize: 10.5,
                fontWeight: 500,
                color: C.textSub,
              }}
            >
              {year}
            </span>
          )}

          {rating != null && Number(rating) > 0 && (
            <>
              <span
                style={{
                  color: C.textDim,
                  opacity: 0.55,
                  fontSize: 9,
                }}
              >
                /
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  flexShrink: 0,
                  fontSize: 10.5,
                  fontWeight: 650,
                  color: C.gold,
                }}
              >
                <Star size={10} fill="currentColor" strokeWidth={0} />
                {Number(rating).toFixed(1)}
              </span>
            </>
          )}

          {genres.length > 0 && (
            <>
              <span
                style={{
                  color: C.textDim,
                  opacity: 0.45,
                  fontSize: 9,
                }}
              >
                /
              </span>

              <span
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 10.5,
                  color: C.textSub,
                }}
              >
                {genres
                  .map((genre) => GENRE_VI?.[genre] ?? genre)
                  .join(" · ")}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.button>
  );
};

/* =========================================================
   Actor avatar
========================================================= */

const ActorAvatar = ({ actor, hovered }) => {
  return (
    <motion.div
      animate={{
        scale: hovered ? 1.035 : 1,
      }}
      transition={{
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        position: "relative",
        width: 46,
        height: 46,
        minWidth: 46,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        background: C.surfaceHigh,
        border: `1px solid ${
          hovered ? `${C.accent}66` : C.border
        }`,
        boxShadow: hovered
          ? "0 7px 20px rgba(0,0,0,0.24)"
          : "0 2px 10px rgba(0,0,0,0.12)",
        transition:
          "border-color 300ms ease, box-shadow 300ms ease",
      }}
    >
      {actor?.profileUrl ? (
        <img
          src={actor.profileUrl}
          alt={actor.name || "Actor"}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={(event) => {
            event.currentTarget.style.display = "none";
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
          }}
        >
          <User
            size={18}
            strokeWidth={1.35}
            color={C.textDim}
          />
        </div>
      )}
    </motion.div>
  );
};

/* =========================================================
   Actor result
========================================================= */

export const ActorResultItem = ({ actor, onClick }) => {
  const [hovered, setHovered] = useState(false);

  const knownTitles = Array.isArray(actor?.knownMovies)
    ? actor.knownMovies
        .slice(0, 2)
        .map((movie) =>
          typeof movie === "string" ? movie : movie?.title
        )
        .filter(Boolean)
    : [];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      whileTap={{ scale: 0.992 }}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 18px",
        background: hovered
          ? `linear-gradient(
              90deg,
              rgba(255,255,255,0.055),
              rgba(255,255,255,0.025)
            )`
          : "transparent",
        border: "none",
        borderLeft: `1px solid ${
          hovered ? `${C.accent}55` : "transparent"
        }`,
        cursor: "pointer",
        textAlign: "left",
        boxSizing: "border-box",
        overflow: "hidden",
        transition:
          "background 320ms ease, border-color 320ms ease",
      }}
    >
      {/* Accent */}
      <motion.div
        animate={{
          opacity: hovered ? 1 : 0,
          x: hovered ? 0 : -12,
        }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 2,
          background: C.accent,
          boxShadow: `0 0 14px ${C.accent}44`,
        }}
      />

      <ActorAvatar actor={actor} hovered={hovered} />

      {/* Info */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
            marginBottom: 5,
          }}
        >
          <p
            style={{
              minWidth: 0,
              flex: 1,
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: FONT_DISPLAY,
              fontSize: 14,
              fontWeight: 650,
              lineHeight: 1.25,
              letterSpacing: "-0.015em",
              color: hovered
                ? C.text
                : "rgba(245,245,245,0.92)",
              transition: "color 250ms ease",
            }}
          >
            {actor?.name || "Unknown actor"}
          </p>

          <span
            style={{
              flexShrink: 0,
              padding: "3px 6px",
              borderRadius: 4,
              fontFamily: FONT_BODY,
              fontSize: 8.5,
              lineHeight: 1,
              fontWeight: 750,
              letterSpacing: "0.075em",
              color: C.accent,
              background: C.accentSoft,
              border: `1px solid ${C.accent}18`,
            }}
          >
            DIỄN VIÊN
          </span>
        </div>

        {knownTitles.length > 0 ? (
          <p
            style={{
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: FONT_BODY,
              fontSize: 10.5,
              lineHeight: 1.35,
              color: C.textSub,
            }}
          >
            {knownTitles.join(" · ")}
          </p>
        ) : actor?.character ? (
          <p
            style={{
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: FONT_BODY,
              fontSize: 10.5,
              lineHeight: 1.35,
              color: C.textSub,
            }}
          >
            vai {actor.character}
          </p>
        ) : (
          <p
            style={{
              margin: 0,
              fontFamily: FONT_BODY,
              fontSize: 10.5,
              color: C.textDim,
            }}
          >
            Khám phá hồ sơ diễn viên
          </p>
        )}
      </div>

      {/* Arrow */}
      <motion.div
        animate={{
          opacity: hovered ? 1 : 0.25,
          x: hovered ? 0 : -3,
        }}
        transition={{ duration: 0.22 }}
        style={{
          flexShrink: 0,
          display: "flex",
          color: C.textDim,
        }}
      >
        <ArrowUpRight size={14} strokeWidth={1.6} />
      </motion.div>
    </motion.button>
  );
};

/* =========================================================
   Default export
========================================================= */

const SearchResultItem = ({ movie, onClick }) => (
  <MovieResultItem movie={movie} onClick={onClick} />
);

export default SearchResultItem;