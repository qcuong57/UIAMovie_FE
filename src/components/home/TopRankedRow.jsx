// src/components/home/TopRankedRow.jsx
// ─── Top 10 Thịnh Hành — Đồng bộ trực tiếp MovieCard với toàn bộ website ───

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { C, FONT_DISPLAY, FONT_BEBAS } from "../../context/homeTokens";
import movieService from "../../services/movieService";
import tvShowService from "../../services/tvShowService";
import MovieCard from "../movie/MovieCard";

const PER_PAGE = 5;
const TOP_N = 10;
// Ít hơn ngưỡng này item có lượt xem thật thì mới chịu bù thêm item 0 view (tránh row trống ở site ít traffic)
const MIN_SCORED = 5;

const toList = (res) => {
  const list = res?.data ?? res ?? [];
  return Array.isArray(list) ? list : [];
};

// MovieCard dựa vào `isTvShow` để chọn route (/tvshow/... hay /movie/...) và API yêu thích.
// `year` MovieCard cần nhưng DTO trending không có → suy ra từ ngày phát hành.
const tag = (item, isTvShow) => {
  const date = item.releaseDate ?? item.firstAirDate;
  const y = date ? new Date(date).getFullYear() : null;
  return {
    ...item,
    isTvShow: item.isTvShow ?? isTvShow,
    year: item.year ?? (Number.isFinite(y) ? y : undefined),
  };
};

// Thứ tự toàn phần: điểm trending → lượt xem 30 ngày → rating. Item không có điểm xếp sau item có điểm.
const byTrending = (a, b) =>
  (b.trendingScore ?? -1) - (a.trendingScore ?? -1) ||
  (b.views30d ?? 0) - (a.views30d ?? 0) ||
  (Number(b.rating) || 0) - (Number(a.rating) || 0);

const rankStroke = (rank) =>
  rank === 1
    ? C.accent
    : rank <= 3
    ? "rgba(255,255,255,0.9)"
    : rank <= 6
    ? "rgba(255,255,255,0.42)"
    : "rgba(255,255,255,0.2)";

// ══════════════════════════════════════════════════════════════════════════════
// RankedMovieItem — Vỏ bọc số thứ tự xếp hạng quanh MovieCard
// ══════════════════════════════════════════════════════════════════════════════
const RankedMovieItem = ({
  movie,
  rank,
  isFavorited,
  onFavoriteToggle,
  isMobile,
}) => {
  const [hovered, setHovered] = useState(false);

  // ── 1. GIAO DIỆN MOBILE: Dùng MovieCard kèm Badge Rank nổi bật góc trái ──
  if (isMobile) {
    return (
      <div style={{ position: "relative", width: "100%", padding: "0 4px" }}>
        {/* Badge Rank góc trên trái */}
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 10,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 24,
            height: 20,
            padding: "0 6px",
            borderRadius: 6,
            background: rank === 1 ? C.accent : "rgba(0,0,0,0.85)",
            border: `1px solid ${
              rank === 1 ? C.accent : "rgba(255,255,255,0.2)"
            }`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: FONT_BEBAS,
              fontSize: 14,
              color: "#fff",
              lineHeight: 1,
              letterSpacing: "0.05em",
            }}
          >
            #{rank}
          </span>
        </div>

        {/* MovieCard chuẩn của toàn website */}
        <MovieCard
          movie={movie}
          isFavorited={isFavorited}
          onFavoriteToggle={onFavoriteToggle}
          cardWidth="100%"
        />
      </div>
    );
  }

  // ── 2. GIAO DIỆN DESKTOP: Chữ số khổng lồ nằm bên trái/phía sau MovieCard ──
  const rankW = rank >= 10 ? 82 : 64;

  return (
    <div
      style={{
        flex: "0 0 100%",
        minWidth: 0,
        paddingLeft: rankW,
        position: "relative",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        {/* Số Rank lớn bên trái poster */}
        <div
          style={{
            position: "absolute",
            left: -rankW,
            bottom: -6,
            lineHeight: 0.8,
            userSelect: "none",
            zIndex: 0,
            transition: "transform 0.35s cubic-bezier(.25,.1,.25,1)",
            transform: hovered ? "scale(1.05) translateX(-2px)" : "scale(1)",
            transformOrigin: "bottom left",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: FONT_BEBAS,
              fontSize: "clamp(110px, 10.5vw, 158px)",
              fontWeight: 400,
              color: "transparent",
              WebkitTextStroke: "1px rgba(0,0,0,0.95)",
              position: "absolute",
              top: 6,
              left: 6,
              lineHeight: "inherit",
            }}
          >
            {rank}
          </span>
          <span
            style={{
              fontFamily: FONT_BEBAS,
              fontSize: "clamp(110px, 10.5vw, 158px)",
              fontWeight: 400,
              color: "transparent",
              WebkitTextStroke: `2.5px ${rankStroke(rank)}`,
              lineHeight: "inherit",
              position: "relative",
              ...(rank === 1
                ? {
                    filter: `drop-shadow(0 0 22px ${C.accent}99) drop-shadow(0 0 8px ${C.accent}55)`,
                  }
                : {}),
            }}
          >
            {rank}
          </span>
        </div>

        {/* Thẻ MovieCard chuẩn với kích thước co giãn theo cột */}
        <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
          <MovieCard
            movie={movie}
            isFavorited={isFavorited}
            onFavoriteToggle={onFavoriteToggle}
            cardWidth="100%"
          />
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// TopRankedRow
// ══════════════════════════════════════════════════════════════════════════════
export default function TopRankedRow({
  title = "Top 10 Thịnh Hành",
  movies = [],
  tvShows = [],
  isFavorited,
  onFavoriteToggle,
}) {
  const isMobile = useIsMobile();
  const PER_PAGE_RESP = isMobile ? 2 : PER_PAGE;
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const [trendingItems, setTrendingItems] = useState([]);

  // Trang cha không truyền props → tự gọi cả 2 API trending (phim + TV show), một bên lỗi vẫn hiện bên kia
  useEffect(() => {
    if (movies.length > 0 || tvShows.length > 0) return;
    let isMounted = true;

    Promise.allSettled([
      movieService.getTrendingMovies(),
      tvShowService.getTrendingTvShows(),
    ]).then(([m, t]) => {
      if (!isMounted) return;
      if (m.status === "rejected") console.warn("[TopRankedRow] Lỗi tải phim trending:", m.reason);
      if (t.status === "rejected") console.warn("[TopRankedRow] Lỗi tải TV show trending:", t.reason);
      setTrendingItems([
        ...(m.status === "fulfilled" ? toList(m.value).map((x) => tag(x, false)) : []),
        ...(t.status === "fulfilled" ? toList(t.value).map((x) => tag(x, true)) : []),
      ]);
    });

    return () => {
      isMounted = false;
    };
  }, [movies.length, tvShows.length]);

  // Xếp hạng chung phim + TV show theo điểm trending của BE (cùng công thức nên so sánh được)
  const top10 = useMemo(() => {
    const fromApi = trendingItems.length > 0;
    const raw = fromApi
      ? trendingItems
      : [...movies.map((x) => tag(x, false)), ...tvShows.map((x) => tag(x, true))];

    // Khoá gồm loại nội dung để phim và show trùng id (nếu có) không đè nhau
    const uniqueMap = new Map();
    raw.filter(Boolean).forEach((item) => {
      const key = `${item.isTvShow ? "tv" : "movie"}:${item.id}`;
      if (item.id && !uniqueMap.has(key)) uniqueMap.set(key, item);
    });

    const sorted = Array.from(uniqueMap.values()).sort(byTrending);

    // Bỏ các mục BE chỉ "bù chỗ trống" (score = 0) để không gắn hạng cho nội dung chưa có lượt xem;
    // nếu quá ít mục có view thật thì giữ cả danh sách để row không trống.
    const scored = sorted.filter((x) => (x.trendingScore ?? 0) > 0);
    return (fromApi && scored.length >= MIN_SCORED ? scored : sorted).slice(0, TOP_N);
  }, [trendingItems, movies, tvShows]);

  const pages = Math.ceil(top10.length / PER_PAGE_RESP) || 1;
  const canLeft = page > 0;
  const canRight = page < pages - 1;

  useEffect(() => {
    if (page >= pages) {
      setPage(Math.max(0, pages - 1));
    }
  }, [pages, page]);

  const go = useCallback(
    (dir) => {
      setDirection(dir);
      setPage((p) => Math.min(Math.max(p + dir, 0), pages - 1));
    },
    [pages]
  );

  const slice = top10.slice(
    page * PER_PAGE_RESP,
    page * PER_PAGE_RESP + PER_PAGE_RESP
  );

  if (!top10.length) return null;

  const slideVariants = {
    enter: (d) => ({ x: d * 55, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d * -55, opacity: 0 }),
  };

  return (
    <section style={{ marginBottom: isMobile ? 32 : 52 }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isMobile ? 14 : 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 3,
              height: isMobile ? 16 : 20,
              borderRadius: 99,
              background: C.accent,
              flexShrink: 0,
            }}
          />
          <h2
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: isMobile ? 15 : 20,
              fontWeight: 800,
              color: C.text,
              lineHeight: 1,
              margin: 0,
            }}
          >
            {title}
          </h2>
          <Flame size={18} color={C.accent} />

          {/* Dots Indicator */}
          <div
            style={{
              display: "flex",
              gap: 4,
              marginLeft: 6,
              alignItems: "center",
            }}
          >
            {Array.from({ length: pages }).map((_, i) => (
              <div
                key={i}
                onClick={() => {
                  setDirection(i > page ? 1 : -1);
                  setPage(i);
                }}
                style={{
                  width: i === page ? (isMobile ? 16 : 22) : (isMobile ? 5 : 6),
                  height: 3,
                  borderRadius: 99,
                  cursor: "pointer",
                  background: i === page ? C.accent : "rgba(255,255,255,0.2)",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* Buttons Prev/Next */}
        <div style={{ display: "flex", gap: 6 }}>
          {[
            {
              dir: -1,
              icon: <ChevronLeft size={isMobile ? 15 : 18} strokeWidth={2} />,
              can: canLeft,
            },
            {
              dir: 1,
              icon: <ChevronRight size={isMobile ? 15 : 18} strokeWidth={2} />,
              can: canRight,
            },
          ].map(({ dir, icon, can }) => (
            <button
              key={dir}
              onClick={() => can && go(dir)}
              disabled={!can}
              style={{
                width: isMobile ? 32 : 38,
                height: isMobile ? 32 : 38,
                borderRadius: "50%",
                background: "rgba(12,12,12,0.88)",
                border: "1px solid rgba(255,255,255,0.15)",
                backdropFilter: "blur(10px)",
                color: C.text,
                cursor: can ? "pointer" : "default",
                opacity: can ? 1 : 0.22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "opacity 0.2s, transform 0.15s",
              }}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Card grid ── */}
      <div style={{ position: "relative", overflow: "visible" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.36, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              display: "flex",
              gap: isMobile ? 0 : 8,
              paddingTop: isMobile ? 6 : 28,
              paddingBottom: isMobile ? 12 : 36,
              overflow: "visible",
            }}
          >
            {slice.map((item, i) => (
              <motion.div
                key={`${item.isTvShow ? "tv" : "movie"}:${item.id}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: i * 0.06,
                  duration: 0.38,
                  ease: [0.215, 0.61, 0.355, 1],
                }}
                style={{
                  flex: isMobile ? "0 0 50%" : "0 0 20%",
                  width: isMobile ? "50%" : "20%",
                  minWidth: 0,
                  overflow: "visible",
                }}
              >
                <RankedMovieItem
                  movie={item}
                  rank={page * PER_PAGE_RESP + i + 1}
                  isFavorited={isFavorited}
                  onFavoriteToggle={onFavoriteToggle}
                  isMobile={isMobile}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}