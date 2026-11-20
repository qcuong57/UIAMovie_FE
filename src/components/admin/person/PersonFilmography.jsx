// src/components/admin/person/PersonFilmography.jsx
//
// Phần "Phim tham gia" cho trang admin — cùng nguồn dữ liệu với PersonPage (user):
// personService.getPersonMovies(personId) → [{ id, mediaType, title, posterUrl, releaseDate, rating, character, roles[] }]
// Giao diện dùng token admin (theme sáng), không dùng MovieCard của user.
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Film, Tv, Star } from "lucide-react";
import { usePersonMovies } from "../../../hooks/admin/useAdminPersons";
import {
  T,
  FONT_BODY as FONT,
  FONT_TITLE,
} from "../../../context/adminTokens";

const ROLE_LABEL = { cast: "Diễn viên", director: "Đạo diễn" };

const filmRating = (f) => Number(f.rating ?? f.voteAverage ?? 0) || 0;
const filmTime = (f) => new Date(f.releaseDate || f.year || 0).getTime();
const fmtYear = (d) => (d ? new Date(d).getFullYear() : null);

const Pill = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: "6px 13px",
      borderRadius: 20,
      cursor: "pointer",
      fontFamily: FONT,
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: "nowrap",
      background: active ? T.accent : T.surface,
      color: active ? "#fff" : T.textSub,
      border: `1px solid ${active ? T.accent : T.border}`,
      transition: "all 0.15s",
    }}
  >
    {children}
  </button>
);

const FilmCard = ({ film, index }) => {
  const [imgErr, setImgErr] = useState(false);
  const isTv = film.mediaType === "tv";
  const poster = film.posterUrl || film.poster || null;
  const rating = filmRating(film);
  const year = fmtYear(film.releaseDate) || film.year || null;
  const sub =
    film.character ||
    (film.roles?.length > 0
      ? film.roles.map((r) => ROLE_LABEL[r] || r).join(" · ")
      : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.025, duration: 0.25 }}
      style={{ minWidth: 0 }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "2/3",
          borderRadius: 10,
          overflow: "hidden",
          background: T.surfaceAlt,
          border: `1px solid ${T.border}`,
          boxShadow: T.shadow,
        }}
      >
        {poster && !imgErr ? (
          <img
            src={poster}
            alt={film.title}
            loading="lazy"
            onError={() => setImgErr(true)}
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
            {isTv ? (
              <Tv size={26} color={T.textMuted} strokeWidth={1.2} />
            ) : (
              <Film size={26} color={T.textMuted} strokeWidth={1.2} />
            )}
          </div>
        )}

        {isTv && (
          <span
            style={{
              position: "absolute",
              top: 6,
              left: 6,
              padding: "2px 7px",
              borderRadius: 5,
              background: "rgba(255,255,255,0.92)",
              fontFamily: FONT,
              fontSize: 9.5,
              fontWeight: 700,
              color: T.textSub,
            }}
          >
            TV
          </span>
        )}

        {rating > 0 && (
          <span
            style={{
              position: "absolute",
              bottom: 6,
              right: 6,
              display: "flex",
              alignItems: "center",
              gap: 3,
              padding: "2px 7px",
              borderRadius: 5,
              background: "rgba(0,0,0,0.72)",
              fontFamily: FONT,
              fontSize: 10.5,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            <Star size={10} fill="#FBBF24" color="#FBBF24" />
            {rating.toFixed(1)}
          </span>
        )}
      </div>

      <p
        title={film.title}
        style={{
          fontFamily: FONT_TITLE,
          fontSize: 12.5,
          fontWeight: 700,
          color: T.text,
          marginTop: 8,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {film.title}
      </p>
      <p
        style={{
          fontFamily: FONT,
          fontSize: 11,
          color: T.textMuted,
          marginTop: 1,
        }}
      >
        {year || "—"}
      </p>
      {sub && (
        <p
          title={sub}
          style={{
            fontFamily: FONT,
            fontSize: 11,
            color: T.accent,
            fontStyle: "italic",
            marginTop: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {sub}
        </p>
      )}
    </motion.div>
  );
};

const Skeleton = () => (
  <div
    style={{
      aspectRatio: "2/3",
      borderRadius: 10,
      background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.surfaceHov} 50%, ${T.surfaceAlt} 75%)`,
      backgroundSize: "400px 100%",
      animation: "shimmer 1.4s infinite",
    }}
  />
);

/**
 * @param {string} personId  Id nội bộ (Guid) của Person
 */
export default function PersonFilmography({ personId }) {
  const { data, isPending, error: queryError } = usePersonMovies(personId);
  const films = useMemo(() => data ?? [], [data]);
  const loading = !!personId && isPending;
  const error = queryError
    ? (queryError?.response?.data?.message ??
      queryError?.message ??
      "Không thể tải danh sách phim")
    : "";
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Đổi sang người khác → về bộ lọc "Tất cả"
  useEffect(() => {
    setFilter("all");
  }, [personId]);

  const counts = useMemo(
    () => ({
      all: films.length,
      movie: films.filter((f) => f.mediaType !== "tv").length,
      tv: films.filter((f) => f.mediaType === "tv").length,
      cast: films.filter((f) => f.roles?.includes("cast")).length,
      director: films.filter((f) => f.roles?.includes("director")).length,
    }),
    [films],
  );

  const visible = useMemo(() => {
    let list = films;
    if (filter === "movie") list = list.filter((f) => f.mediaType !== "tv");
    else if (filter === "tv") list = list.filter((f) => f.mediaType === "tv");
    else if (filter === "cast")
      list = list.filter((f) => f.roles?.includes("cast"));
    else if (filter === "director")
      list = list.filter((f) => f.roles?.includes("director"));
    return [...list].sort((a, b) =>
      sortBy === "rating"
        ? filmRating(b) - filmRating(a)
        : filmTime(b) - filmTime(a),
    );
  }, [films, filter, sortBy]);

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
    gap: 14,
  };

  return (
    <div style={{ fontFamily: FONT }}>
      <h3
        style={{
          fontFamily: FONT_TITLE,
          fontSize: 14,
          fontWeight: 700,
          color: T.text,
          margin: "0 0 12px",
        }}
      >
        Phim tham gia
        {!loading && (
          <span style={{ color: T.textMuted, fontWeight: 500 }}>
            {" "}
            · {counts.all}
          </span>
        )}
      </h3>

      {!loading && films.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Pill active={filter === "all"} onClick={() => setFilter("all")}>
              Tất cả · {counts.all}
            </Pill>
            {counts.movie > 0 && (
              <Pill active={filter === "movie"} onClick={() => setFilter("movie")}>
                Phim lẻ · {counts.movie}
              </Pill>
            )}
            {counts.tv > 0 && (
              <Pill active={filter === "tv"} onClick={() => setFilter("tv")}>
                TV Show · {counts.tv}
              </Pill>
            )}
            {counts.cast > 0 && counts.director > 0 && (
              <Pill active={filter === "cast"} onClick={() => setFilter("cast")}>
                {ROLE_LABEL.cast} · {counts.cast}
              </Pill>
            )}
            {counts.cast > 0 && counts.director > 0 && (
              <Pill
                active={filter === "director"}
                onClick={() => setFilter("director")}
              >
                {ROLE_LABEL.director} · {counts.director}
              </Pill>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Pill active={sortBy === "newest"} onClick={() => setSortBy("newest")}>
              Mới nhất
            </Pill>
            <Pill active={sortBy === "rating"} onClick={() => setSortBy("rating")}>
              Điểm cao
            </Pill>
          </div>
        </div>
      )}

      {loading ? (
        <div style={grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: "#FEF2F2",
            border: "1px solid rgba(220,38,38,0.25)",
            fontSize: 13,
            color: T.red,
          }}
        >
          {error}
        </div>
      ) : films.length === 0 ? (
        <p
          style={{
            textAlign: "center",
            padding: "40px 0",
            fontSize: 13,
            color: T.textMuted,
          }}
        >
          Chưa có phim nào gắn với người này
        </p>
      ) : visible.length === 0 ? (
        <p
          style={{
            textAlign: "center",
            padding: "32px 0",
            fontSize: 13,
            color: T.textMuted,
          }}
        >
          Không có tác phẩm nào trong mục này
        </p>
      ) : (
        <div style={grid}>
          {visible.map((f, i) => (
            <FilmCard
              key={`${f.mediaType || "movie"}-${f.id || f.movieId || i}`}
              film={f}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}