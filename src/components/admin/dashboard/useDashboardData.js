// src/components/admin/dashboard/useDashboardData.js
import { useState, useEffect, useCallback } from "react";
import movieService from "../../../services/movieService";
import tvShowService from "../../../services/tvShowService";
import genreService from "../../../services/genreService";
import userService from "../../../services/userService";
import reviewService from "../../../services/reviewService";
import { toArray } from "../../../helper/format";

const INITIAL_STATE = {
  movies: [],
  tvShows: [],
  trendingMovies: [],
  trendingShows: [],
  genres: [],
  users: [],
  reviews: [],
  loading: true,
  error: null,
};

/**
 * Build a label like "S1E3" from an episode object.
 * Adjust field names to match your actual API shape.
 */
const buildEpisodeLabel = (ep) => {
  if (!ep) return null;
  // Common field patterns — take the first that works
  const s = ep.seasonNumber ?? ep.season ?? ep.seasonNo ?? null;
  const e = ep.episodeNumber ?? ep.episode ?? ep.episodeNo ?? ep.order ?? null;
  if (s != null && e != null) return `S${s}E${e}`;
  if (ep.title) return ep.title; // fallback: episode title
  if (e != null) return `Tập ${e}`; // fallback: just episode number
  return null;
};

/**
 * Fetch episode info for all TV-show reviews that have an episodeId
 * but a null episodeLabel. Results are deduplicated by episodeId.
 */
const enrichEpisodeLabels = async (reviews) => {
  // Collect unique episodeIds that need resolution
  const missingIds = [
    ...new Set(
      reviews
        .filter((r) => r.tvShowId && r.episodeId && !r.episodeLabel)
        .map((r) => r.episodeId),
    ),
  ];

  if (missingIds.length === 0) return reviews;

  // Fetch all in parallel; swallow individual failures
  const fetched = await Promise.allSettled(
    missingIds.map(
      (id) => tvShowService.getEpisodeById(id).catch(() => null),
      // ↑ Replace with your actual episode-fetch method, e.g.:
      //   episodeService.getById(id)
      //   tvShowService.getEpisode(id)
    ),
  );

  // Build episodeId → label map
  const labelMap = {};
  fetched.forEach((result, i) => {
    const ep = result.status === "fulfilled" ? result.value : null;
    labelMap[missingIds[i]] = buildEpisodeLabel(ep);
  });

  // Inject episodeLabel into each matching review
  return reviews.map((r) =>
    r.episodeId && labelMap[r.episodeId]
      ? { ...r, episodeLabel: labelMap[r.episodeId] }
      : r,
  );
};

export const useDashboardData = () => {
  const [data, setData] = useState(INITIAL_STATE);

  const load = useCallback(async () => {
    try {
      const [
        movRes,
        showRes,
        trendMovRes,
        trendShowRes,
        genreRes,
        userRes,
        reviewRes,
      ] = await Promise.allSettled([
        movieService.getMovies({ pageSize: 500 }),
        tvShowService.getTvShows({ pageSize: 500 }),
        movieService.getTrendingMovies().catch(() => []),
        tvShowService
          .getTvShows({ pageSize: 20, sortBy: "rating", sortDesc: true })
          .catch(() => ({ items: [] })),
        genreService.getAllGenres().catch(() => []),
        userService.getAllUsers({ pageSize: 500 }).catch(() => []),
        reviewService.getAllReviews({ pageSize: 500 }).catch(() => []),
      ]);

      const rawReviews = toArray(
        reviewRes.status === "fulfilled" ? reviewRes.value : [],
      );

      // Enrich reviews with resolved episodeLabels
      const enrichedReviews = await enrichEpisodeLabels(rawReviews).catch(
        () => rawReviews,
      );

      setData({
        movies: toArray(movRes.status === "fulfilled" ? movRes.value : []),
        tvShows: toArray(showRes.status === "fulfilled" ? showRes.value : []),
        trendingMovies: toArray(
          trendMovRes.status === "fulfilled" ? trendMovRes.value : [],
        ),
        trendingShows: toArray(
          trendShowRes.status === "fulfilled" ? trendShowRes.value : [],
        ),
        genres: Array.isArray(genreRes.value)
          ? genreRes.value
          : (genreRes.value?.data ?? []),
        users: toArray(userRes.status === "fulfilled" ? userRes.value : []),
        reviews: enrichedReviews, // ← was: toArray(reviewRes...)
        loading: false,
        error: null,
      });
    } catch (e) {
      console.error("[AdminDashboard] load error", e);
      setData((prev) => ({ ...prev, loading: false, error: e }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return data;
};
