// src/components/admin/dashboard/useDashboardData.js
import { useState, useEffect, useCallback } from "react";
import movieService from "../../../services/movieService";
import tvShowService from "../../../services/tvShowService";
import genreService from "../../../services/genreService";
import userService from "../../../services/userService";
import reviewService from "../../../services/reviewService";
import { toArray } from "../../../helper/format";

const LIST_PAGE_SIZE = 500;

const INITIAL_STATE = {
  movies: [],
  tvShows: [],
  // Tổng thật từ BE; danh sách movies/tvShows bên trên chỉ là tối đa LIST_PAGE_SIZE bản ghi.
  totalMovies: 0,
  totalTvShows: 0,
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
 * Gắn episodeLabel ("S1E3") cho review TV show có episodeId nhưng chưa có nhãn.
 *
 * BE không có endpoint "lấy tập theo id", nên lấy toàn bộ tập của từng show liên quan
 * (tvShowService.getEpisodesByTvShow: 1 call show + 1 call/season) rồi tra theo episodeId.
 * Mỗi show chỉ gọi 1 lần dù có nhiều review; show nào lỗi thì bỏ qua, review đó giữ nguyên.
 */
const enrichEpisodeLabels = async (reviews) => {
  const needs = reviews.filter((r) => r.tvShowId && r.episodeId && !r.episodeLabel);
  if (needs.length === 0) return reviews;

  const showIds = [...new Set(needs.map((r) => r.tvShowId))];
  const results = await Promise.allSettled(
    showIds.map((id) => tvShowService.getEpisodesByTvShow(id)),
  );

  // episodeId → label
  const labelMap = {};
  results.forEach((res) => {
    if (res.status !== "fulfilled") return;
    (res.value ?? []).forEach((ep) => {
      if (ep?.id) labelMap[ep.id] = buildEpisodeLabel(ep);
    });
  });

  return reviews.map((r) =>
    r.episodeId && labelMap[r.episodeId]
      ? { ...r, episodeLabel: labelMap[r.episodeId] }
      : r,
  );
};

export const useDashboardData = () => {
  const [data, setData] = useState(INITIAL_STATE);

  const load = useCallback(async () => {
    // Bấm "Làm mới" cũng phải bật loading để nút/skeleton phản hồi (lần đầu đã là true)
    setData((prev) => (prev.loading ? prev : { ...prev, loading: true }));
    try {
      const [
        movRes,
        showRes,
        trendMovRes,
        trendShowRes,
        genreRes,
        userRes,
        reviewRes,
        movieCountRes,
        showCountRes,
      ] = await Promise.allSettled([
        movieService.getMovies({ pageSize: LIST_PAGE_SIZE }),
        tvShowService.getTvShows({ pageSize: LIST_PAGE_SIZE }),
        movieService.getTrendingMovies().catch(() => []),
        // Trending nội bộ (view hợp lệ, time-decay) — cùng nguồn với trang chủ,
        // thay cho cách cũ là lấy top rating rồi gọi nó là trending.
        tvShowService.getTrendingTvShows().catch(() => []),
        genreService.getAllGenres().catch(() => []),
        userService.getAllUsers({ pageSize: 500 }).catch(() => []),
        reviewService.getAllReviews({ pageSize: LIST_PAGE_SIZE }).catch(() => []),
        movieService.getTotalCount(),
        tvShowService.getTotalCount(),
      ]);

      const rawReviews = toArray(
        reviewRes.status === "fulfilled" ? reviewRes.value : [],
      );

      // Enrich reviews with resolved episodeLabels
      const enrichedReviews = await enrichEpisodeLabels(rawReviews).catch(
        () => rawReviews,
      );

      const movies = toArray(movRes.status === "fulfilled" ? movRes.value : []);
      const tvShows = toArray(showRes.status === "fulfilled" ? showRes.value : []);

      setData({
        movies,
        tvShows,
        // Endpoint đếm lỗi (vd. chưa deploy BE) → lùi về độ dài danh sách đã tải.
        totalMovies:
          movieCountRes.status === "fulfilled" ? movieCountRes.value : movies.length,
        totalTvShows:
          showCountRes.status === "fulfilled" ? showCountRes.value : tvShows.length,
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
        reviews: enrichedReviews,
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

  return { ...data, reload: load };
};