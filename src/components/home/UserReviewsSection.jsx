import { useState, useEffect, useRef, useCallback } from "react";
import {
  C,
  FONT_DISPLAY,
  FONT_BEBAS,
  FONT_BODY,
  GOOGLE_FONTS,
} from "../../context/homeTokens";
import reviewService from "../../services/reviewService";
import movieService from "../../services/movieService";

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const CSS = `
  ${GOOGLE_FONTS}

  .urs-root * { box-sizing: border-box; }

  .urs-card {
    transition: transform 0.55s cubic-bezier(0.34,1.1,0.64,1), opacity 0.55s ease, box-shadow 0.55s ease;
    will-change: transform, opacity;
  }

  .urs-btn {
    transition: background 0.2s, transform 0.15s;
  }
  .urs-btn:hover { background: rgba(255,255,255,0.12) !important; transform: scale(1.08); }
  .urs-btn:active { transform: scale(0.96); }

  @keyframes shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const getInitials = (name = "") => {
  const p = name.trim().split(/\s+/);
  return p.length === 1
    ? p[0].slice(0, 2).toUpperCase()
    : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = Math.floor((Date.now() - new Date(dateStr)) / 86_400_000);
  if (d < 1) return "Hôm nay";
  if (d < 30) return `${d} ngày trước`;
  return `${Math.floor(d / 30)} tháng trước`;
};

const Stars = ({ rating, size = 13 }) => {
  const filled = Math.round((rating / 10) * 5);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", gap: 3 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24">
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill={i < filled ? C.gold : "none"}
              stroke={i < filled ? C.gold : "rgba(255,255,255,0.2)"}
              strokeWidth={i < filled ? 0 : 1.5}
            />
          </svg>
        ))}
      </div>
      <span
        style={{
          fontFamily: FONT_BEBAS,
          fontSize: 15,
          letterSpacing: "0.04em",
          color: C.gold,
          lineHeight: 1,
        }}
      >
        {rating}
        <span style={{ fontSize: 11, color: C.textSub }}>/10</span>
      </span>
    </div>
  );
};

/* ─── Normalize ───────────────────────────────────────────────────────────── */
const normalize = (raw, movie) => ({
  id: raw.id ?? raw.reviewId ?? `${movie?.id}-${Math.random()}`,
  movieId: movie?.id ?? raw.movieId ?? raw.movie?.id ?? null,
  user: raw.userName || raw.user?.name || "Khán giả",
  rating: typeof raw.rating === "number" ? raw.rating : 7,
  text: raw.reviewText || raw.comment || "",
  time: formatTime(raw.createdAt || raw.createdDate),
  movie: {
    // FIX: ưu tiên movie từ movieMap, sau đó fallback qua mọi field có thể có từ API
    title:
      movie?.title ??
      raw.movie?.title ??
      raw.movieTitle ??
      raw.movieName ??
      raw.movie?.name ??
      "Unknown",
    year:
      movie?.year ??
      raw.movie?.year ??
      raw.movie?.releaseYear ??
      raw.releaseYear ??
      null,
    posterUrl:
      movie?.posterUrl ??
      raw.movie?.posterUrl ??
      raw.movie?.poster ??
      raw.movie?.thumbnail ??
      raw.posterUrl ??
      null,
  },
});

function parseReviews(payload) {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.reviews)) return payload.reviews;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.result)) return payload.result;
  if (Array.isArray(payload.records)) return payload.records;
  if (Array.isArray(payload.content)) return payload.content;

  if (payload.data && Array.isArray(payload.data.items)) {
    return payload.data.items;
  }

  return [];
}

function sortReviews(arr) {
  const withText = arr.filter((r) => r.text).sort(() => Math.random() - 0.5);
  const withoutText = arr
    .filter((r) => !r.text)
    .sort(() => Math.random() - 0.5);
  return [...withText, ...withoutText];
}

/**
 * Fetch TẤT CẢ reviews bằng 1 request, sau đó:
 * 1. Join với movies prop (nếu có)
 * 2. FIX: Tự fetch những phim còn thiếu từ movieService
 */
async function fetchAllReviews(movies = []) {
  try {
    // Build lookup map: movieId → movie object
    const movieMap = Object.fromEntries(
      movies.filter(Boolean).map((m) => [String(m.id), m]),
    );

    const res = await reviewService.getAllReviews(1, 20);

    const actual = res?.data?.data ?? res?.data ?? res;
    const raw = parseReviews(actual?.items ?? actual);

    if (!Array.isArray(raw) || raw.length === 0) {
      return [];
    }

    // FIX: Tìm những movieId chưa có trong movieMap
    const missingIds = [
      ...new Set(
        raw
          .map((r) => r.movieId ?? r.movie?.id)
          .filter((id) => id != null && !movieMap[String(id)]),
      ),
    ];

    if (missingIds.length > 0) {
      const results = await Promise.allSettled(
        missingIds.map((id) => movieService.getMovieById(id)),
      );

      results.forEach((result, i) => {
        if (result.status === "fulfilled" && result.value) {
          // movieService trả về response.data (qua axiosInstance interceptor)
          const m = result.value?.data ?? result.value;
          if (m?.id) {
            movieMap[String(missingIds[i])] = m;
          }
        } else {
        }
      });
    }

    const out = raw.map((r) => {
      const movieId = r.movieId ?? r.movie?.id;
      const movie = movieMap[String(movieId)] ?? null;
      return normalize(r, movie);
    });

    return sortReviews(out);
  } catch (error) {
    return [];
  }
}

/* ─── Card config cho 5 cards ─────────────────────────────────────────────── */
const CARD_CONFIG = {
  "-2": { x: -390, scale: 0.7, opacity: 0.22, rotate: -10, zIndex: 1 },
  "-1": { x: -200, scale: 0.84, opacity: 0.5, rotate: -5, zIndex: 3 },
  0: { x: 0, scale: 1.0, opacity: 1.0, rotate: 0, zIndex: 5 },
  1: { x: 200, scale: 0.84, opacity: 0.5, rotate: 5, zIndex: 3 },
  2: { x: 390, scale: 0.7, opacity: 0.22, rotate: 10, zIndex: 1 },
};

/* ─── Card ────────────────────────────────────────────────────────────────── */
function ReviewCard({ item, position, onMovieClick }) {
  const isCenter = position === 0;
  const cfg = CARD_CONFIG[String(position)];
  if (!cfg) return null;

  const handleClick = () => {
    if (isCenter && onMovieClick && item.movieId) onMovieClick(item.movieId);
  };

  return (
    <div
      className="urs-card"
      onClick={handleClick}
      style={{
        position: "absolute",
        width: 340,
        left: "50%",
        marginLeft: -170,
        transform: `translateX(${cfg.x}px) scale(${cfg.scale}) rotate(${cfg.rotate}deg)`,
        opacity: cfg.opacity,
        pointerEvents: isCenter ? "auto" : "none",
        zIndex: cfg.zIndex,
        cursor:
          isCenter && onMovieClick && item.movieId ? "pointer" : "default",
      }}
    >
      <div
        style={{
          background: isCenter ? C.surfaceCard : C.surface,
          border: `1px solid ${isCenter ? C.borderMid : C.border}`,
          borderRadius: 18,
          padding: "20px",
          backdropFilter: "blur(20px)",
          boxShadow: isCenter
            ? `0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px ${C.border}`
            : "0 8px 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* ── Hàng trên: Poster + Review text ── */}
        <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
          {item.movie.posterUrl && (
            <div style={{ flexShrink: 0 }}>
              <img
                src={item.movie.posterUrl}
                alt={item.movie.title}
                style={{
                  width: 60,
                  height: 88,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.45)",
                  display: "block",
                }}
              />
            </div>
          )}

          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Stars rating={item.rating} />
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 13,
                lineHeight: 1.68,
                color: isCenter
                  ? "rgba(240,240,240,0.88)"
                  : "rgba(240,240,240,0.5)",
                fontFamily: FONT_BODY,
                fontWeight: 400,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.text
                ? `"${item.text}"`
                : "Một bộ phim tuyệt vời, rất đáng để xem!"}
            </p>
          </div>
        </div>

        <div style={{ height: 1, background: C.border, marginBottom: 12 }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                flexShrink: 0,
                background: C.surfaceHigh,
                border: `1px solid ${C.borderMid}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 600,
                color: "rgba(240,240,240,0.7)",
                fontFamily: FONT_BODY,
                letterSpacing: "0.03em",
              }}
            >
              {getInitials(item.user)}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: C.text,
                fontFamily: FONT_BODY,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 100,
              }}
            >
              {item.user}
            </div>
          </div>

          <div style={{ textAlign: "right", minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: C.textSub,
                fontFamily: FONT_BODY,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 140,
              }}
            >
              {item.movie.title}
            </div>
            {item.time && (
              <div
                style={{
                  fontSize: 10,
                  color: C.textDim,
                  fontFamily: FONT_BODY,
                  marginTop: 2,
                }}
              >
                {item.time}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 20,
        alignItems: "center",
        height: 220,
      }}
    >
      {[-1, 0, 1].map((p) => (
        <div
          key={p}
          style={{
            width: p === 0 ? 340 : 280,
            height: p === 0 ? 200 : 170,
            borderRadius: 18,
            background: C.surface,
            border: `1px solid ${C.border}`,
            opacity: p === 0 ? 1 : 0.4,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)",
              animation: "shimmer 1.8s infinite",
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function UserReviewsSection({ movies = [], onMovieClick }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchAllReviews(movies)
      .then((data) => {
        console.log(`✅ Component set ${data.length} items`);
        setItems(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("❌ Lỗi trong useEffect:", error);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // FIX: chạy ngay 1 lần, không cần chờ movies.length

  /* auto-play */
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setIndex((i) => (i + 1) % (items.length || 1)),
      5000,
    );
  }, [items.length]);

  useEffect(() => {
    if (items.length > 1) startTimer();
    return () => clearInterval(timerRef.current);
  }, [items.length, startTimer]);

  const go = (dir) => {
    setIndex((i) => (i + dir + items.length) % items.length);
    startTimer();
  };

  const posOf = (i) => {
    if (!items.length) return 99;
    let d = i - index;
    if (d > items.length / 2) d -= items.length;
    if (d < -items.length / 2) d += items.length;
    return d;
  };

  return (
    <section
      className="urs-root"
      style={{
        padding: "96px 24px 104px",
        position: "relative",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <style>{CSS}</style>

      {/* Ambient blob */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: 300,
          background: `radial-gradient(ellipse, ${C.accentGlow.replace("0.35", "0.04")} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <span
          style={{
            display: "inline-block",
            marginBottom: 20,
            fontSize: 10,
            fontFamily: FONT_BODY,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.textSub,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: "5px 14px",
          }}
        >
          Cảm nhận khán giả
        </span>

        <h2
          style={{
            margin: 0,
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(32px, 4.5vw, 54px)",
            lineHeight: 1.1,
            color: C.text,
            fontWeight: 800,
            letterSpacing: "-0.01em",
          }}
        >
          Cảm nhận từ khán giả.
          <br />
          <em
            style={{ fontStyle: "italic", color: C.textSub, fontWeight: 600 }}
          >
            Những đánh giá chân thật từ người đã xem.
          </em>
        </h2>
      </div>

      {/* Carousel — 5 cards visible, cycle qua tất cả */}
      <div style={{ position: "relative", height: 220, marginBottom: 40 }}>
        {loading ? (
          <Skeleton />
        ) : items.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: C.textDim,
              fontFamily: FONT_BODY,
              fontSize: 13,
            }}
          >
            Chưa có đánh giá nào.
          </p>
        ) : (
          items.map((item, i) => {
            const p = posOf(i);
            if (Math.abs(p) > 2) return null;
            return (
              <ReviewCard
                key={item.id}
                item={item}
                position={p}
                onMovieClick={onMovieClick}
              />
            );
          })
        )}
      </div>

      {/* Điều hướng */}
      {!loading && items.length > 1 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          {/* Dots — chỉ hiện tối đa 20 dots để tránh tràn */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              maxWidth: 300,
            }}
          >
            {items.slice(0, 20).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setIndex(i);
                  startTimer();
                }}
                style={{
                  width: i === index ? 18 : 5,
                  height: 5,
                  borderRadius: 3,
                  border: "none",
                  cursor: "pointer",
                  background: i === index ? C.text : C.borderMid,
                  padding: 0,
                  transition: "width 0.3s ease, background 0.3s ease",
                }}
              />
            ))}
          </div>

          {/* Arrows */}
          <div style={{ display: "flex", gap: 10 }}>
            {[-1, 1].map((dir) => (
              <button
                key={dir}
                className="urs-btn"
                onClick={() => go(dir)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: C.surfaceHigh,
                  border: `1px solid ${C.borderMid}`,
                  color: C.textSub,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {dir === -1 ? (
                    <>
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </>
                  ) : (
                    <>
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </>
                  )}
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
