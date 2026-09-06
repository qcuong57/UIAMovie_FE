// src/components/home/coming-soon/ComingSoonSection.jsx
//
// Data flow (theo yêu cầu #4 / #22 STEP 4):
//   API (movies?isUpcoming=true, tvshows?isUpcoming=true)
//     → sortComingSoonMovies() (gần nhất trước, an toàn ngay cả khi BE trả field lạ)
//     → featured = item đầu tiên
//     → carousel = phần còn lại
//     → UI
//
// Fail-graceful: nếu API lỗi → ẩn hoàn toàn section, KHÔNG crash HomePage
// (component cha chỉ cần render <ComingSoonSection /> mà không cần try/catch riêng).
import React, { useEffect, useState, useCallback } from "react";
import { CalendarClock } from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY } from "../../../context/homeTokens";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { sortComingSoonMovies } from "../../../utils//releaseDateUtils";
import movieService from "../../../services/movieService";
import tvShowService from "../../../services/tvShowService";
import ComingSoonFeatured from "./ComingSoonFeatured";
import ComingSoonCarousel from "./ComingSoonCarousel";

// ── Normalizer — khớp với normalizeMovie/normalizeTvShow trong HomePage.jsx ──
const normalizeMovie = (m) => ({
  id: m.id,
  title: m.title,
  releaseDate: m.releaseDate ?? null,
  rating: m.rating ?? m.imdbRating ?? 0,
  posterUrl: m.posterUrl || null,
  backdropUrl: m.backdropUrl || null,
  genres: m.genres || [],
  description: m.description || "",
  isPremium: m.isPremium ?? false,
  trailerVideoUrl: m.trailerVideoUrl || null,
  isTvShow: false,
});

const normalizeTvShow = (s) => ({
  id: s.id,
  title: s.title ?? s.name,
  firstAirDate: s.firstAirDate ?? null,
  rating: s.rating ?? s.voteAverage ?? 0,
  posterUrl: s.posterUrl || null,
  backdropUrl: s.backdropUrl || null,
  genres: s.genres || [],
  description: s.description || s.overview || "",
  isPremium: s.isPremium ?? false,
  trailerVideoUrl: s.trailerVideoUrl || null,
  isTvShow: true,
});

const extractItems = (data) =>
  Array.isArray(data)
    ? data
    : (data?.items ?? data?.movies ?? data?.tvShows ?? data?.data?.items ?? data?.data ?? []);

// ── Skeleton — đồng bộ theme hiện tại (surfaceHigh + pulse) ──
const Skeleton = ({ isMobile }) => (
  <div>
    <div
      style={{
        borderRadius: isMobile ? 14 : 18,
        overflow: "hidden",
        minHeight: isMobile ? 300 : 420,
        background: C.surfaceHigh,
        marginBottom: isMobile ? 24 : 32,
        animation: "pulse 1.6s ease-in-out infinite",
      }}
    />
    <div style={{ display: "flex", gap: 14 }}>
      {Array.from({ length: isMobile ? 3 : 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            flexShrink: 0,
            width: isMobile ? 130 : 170,
            aspectRatio: "2/3",
            borderRadius: 10,
            background: C.surfaceHigh,
            animation: "pulse 1.6s ease-in-out infinite",
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
    </div>
  </div>
);

export default function ComingSoonSection({ accentColor = C.gold, seeAllPath = "/trending" }) {
  const isMobile = useIsMobile();
  const [status, setStatus] = useState("loading"); // loading | ready | empty | error
  const [featured, setFeatured] = useState(null);
  const [rest, setRest] = useState([]);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [moviesRes, tvRes] = await Promise.all([
        // isUpcoming=true — dùng field FilterMoviesDTO.IsUpcoming đã có sẵn ở backend
        movieService.getMovies({
          isUpcoming: true,
          sortBy: "releaseDate",
          sortDesc: false,
          pageSize: 30,
        }),
        tvShowService
          .getTvShows({ isUpcoming: true, sortBy: "firstAirDate", sortDesc: false, pageSize: 30 })
          .catch(() => []), // TV show không bắt buộc — vẫn hiển thị section nếu chỉ có movie
      ]);

      const movies = extractItems(moviesRes).map(normalizeMovie);
      const tvShows = extractItems(tvRes).map(normalizeTvShow);

      const merged = sortComingSoonMovies([...movies, ...tvShows]);

      if (!merged.length) {
        setStatus("empty");
        return;
      }

      setFeatured(merged[0]);
      setRest(merged.slice(1));
      setStatus("ready");
    } catch (err) {
      console.error("[ComingSoonSection] load error:", err);
      setStatus("error"); // → section tự ẩn, không throw, không crash HomePage
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Fail gracefully: lỗi hoặc trống → ẩn hoàn toàn section (yêu cầu #14 / #15)
  if (status === "error" || status === "empty") return null;

  return (
    <section aria-label="Phim sắp chiếu">
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CalendarClock size={isMobile ? 16 : 18} color={accentColor} strokeWidth={2.5} />
          <h2
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: isMobile ? 15 : 20,
              fontWeight: 700,
              color: C.text,
              letterSpacing: "-0.01em",
              margin: 0,
              borderLeft: `2.5px solid ${accentColor}`,
              paddingLeft: 11,
            }}
          >
            Sắp Chiếu
          </h2>
        </div>

        {status === "ready" && (
          <a
            href={seeAllPath}
            style={{
              fontFamily: FONT_BODY,
              fontSize: 12,
              fontWeight: 700,
              color: C.textSub,
              textDecoration: "none",
            }}
          >
            Xem tất cả →
          </a>
        )}
      </div>

      {status === "loading" && <Skeleton isMobile={isMobile} />}

      {status === "ready" && (
        <>
          <ComingSoonFeatured item={featured} accentColor={accentColor} />
          {rest.length > 0 && <ComingSoonCarousel items={rest} accentColor={accentColor} />}
        </>
      )}
    </section>
  );
}