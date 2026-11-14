// src/hooks/useAdminDashboard.js
// Admin → Dashboard. Thay cho useDashboardData + useViewStats (useState/useEffect/Promise.allSettled/reloadKey):
// mỗi nguồn dữ liệu là một query riêng theo key → tải song song, cache dùng lại khi đổi tab,
// lỗi một nguồn không làm trắng cả trang, và một nút "Làm mới" chỉ cần invalidate `dashboard.all`.

import { useCallback, useMemo } from "react";
import {
  keepPreviousData,
  useIsFetching,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import movieService from "../services/movieService";
import tvShowService from "../services/tvShowService";
import genreService from "../services/genreService";
import userService from "../services/userService";
import reviewService from "../services/reviewService";
import viewStatsService from "../services/viewStatsService";
import { toArray } from "../helper/format";
import {
  buildContentStats,
  buildEpisodeLabelMap,
  buildReviewStats,
  buildUserStats,
  pickShowsNeedingLabels,
  summarizeViews,
} from "../helper/dashboardStats";
import { queryKeys, STALE } from "../config/queryKeys";
import { fetchShowEpisodes } from "./useAdminReviews";

const keys = queryKeys.admin.dashboard;
const LIST_PAGE_SIZE = 500;
const EMPTY = []; // tham chiếu ổn định cho `data ?? EMPTY` → useMemo không tính lại vô ích

const asArray = (res) => (Array.isArray(res) ? res : []);
const withBase = (options) => ({ staleTime: STALE.admin, ...options });

// ── Query theo nguồn ──────────────────────────────────────────────────────────
// Những query này dùng chung cho nhiều section → cùng key nên chỉ gọi API một lần.
const useMovies = () =>
  useQuery(withBase({
    queryKey: keys.movies,
    queryFn: async () => toArray(await movieService.getMovies({ pageSize: LIST_PAGE_SIZE })),
  }));

const useTvShows = () =>
  useQuery(withBase({
    queryKey: keys.tvShows,
    queryFn: async () => toArray(await tvShowService.getTvShows({ pageSize: LIST_PAGE_SIZE })),
  }));

const useUsers = () =>
  useQuery(withBase({
    queryKey: keys.users,
    queryFn: async () => toArray(await userService.getAllUsers({ pageSize: LIST_PAGE_SIZE })),
  }));

const useReviews = () =>
  useQuery(withBase({
    queryKey: keys.reviews,
    queryFn: async () => toArray(await reviewService.getAllReviews({ pageSize: LIST_PAGE_SIZE })),
  }));

// Gộp trạng thái của các query "chính" của một section.
const summarize = (...queries) => ({
  isPending: queries.some((q) => q.isPending),
  isError: queries.some((q) => q.isError && q.data === undefined),
  refetch: () => queries.forEach((q) => q.isError && q.refetch()),
});

// ── Nội dung ──────────────────────────────────────────────────────────────────
export function useDashboardContent() {
  const moviesQ = useMovies();
  const showsQ = useTvShows();
  // Tổng thật từ BE; endpoint đếm lỗi (vd. chưa deploy BE) → lùi về độ dài danh sách đã tải.
  const movieTotalQ = useQuery(withBase({ queryKey: keys.movieTotal, queryFn: () => movieService.getTotalCount() }));
  const showTotalQ = useQuery(withBase({ queryKey: keys.tvShowTotal, queryFn: () => tvShowService.getTotalCount() }));
  // Trending nội bộ (view hợp lệ, time-decay), cùng nguồn với trang chủ.
  const trendMoviesQ = useQuery(withBase({
    queryKey: keys.trendingMovies,
    queryFn: async () => toArray(await movieService.getTrendingMovies()),
  }));
  const trendShowsQ = useQuery(withBase({
    queryKey: keys.trendingShows,
    queryFn: async () => toArray(await tvShowService.getTrendingTvShows()),
  }));
  const genresQ = useQuery(withBase({
    queryKey: keys.genres,
    queryFn: async () => {
      const res = await genreService.getAllGenres();
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
  }));

  const movies = moviesQ.data ?? EMPTY;
  const tvShows = showsQ.data ?? EMPTY;
  const genres = genresQ.data ?? EMPTY;

  const stats = useMemo(() => buildContentStats({ movies, tvShows, genres }), [movies, tvShows, genres]);

  return {
    ...stats,
    movieCount: movies.length,
    showCount: tvShows.length,
    movies,
    tvShows,
    totalMovies: movieTotalQ.data ?? movies.length,
    totalTvShows: showTotalQ.data ?? tvShows.length,
    trendingMovies: trendMoviesQ.data ?? EMPTY,
    trendingShows: trendShowsQ.data ?? EMPTY,
    ...summarize(moviesQ, showsQ),
  };
}

// ── Người dùng ────────────────────────────────────────────────────────────────
export function useDashboardUsers() {
  const usersQ = useUsers();
  const users = usersQ.data ?? EMPTY;
  const stats = useMemo(() => buildUserStats(users), [users]);
  return { ...stats, ...summarize(usersQ) };
}

// ── Đánh giá ──────────────────────────────────────────────────────────────────
// combine ở mức module → tham chiếu ổn định, chỉ chạy lại khi kết quả query đổi.
const combineEpisodeLabels = (results) => buildEpisodeLabelMap(results.map((r) => r.data));

export function useDashboardReviews() {
  const reviewsQ = useReviews();
  const moviesQ = useMovies(); // dùng để gắn tên + poster, cùng cache với section Nội dung
  const showsQ = useTvShows();

  const reviews = reviewsQ.data ?? EMPTY;

  // BE không có endpoint "tập theo id" → lấy tập theo show. Dùng đúng key của trang Đánh giá
  // (queryKeys.admin.reviews.episodes) nên hai trang chia sẻ cache; show lỗi thì bỏ qua.
  const showIds = useMemo(() => pickShowsNeedingLabels(reviews), [reviews]);
  const labelMap = useQueries({
    queries: showIds.map((id) => ({
      queryKey: queryKeys.admin.reviews.episodes(id),
      queryFn: () => fetchShowEpisodes(id),
      staleTime: STALE.admin,
      retry: 1,
    })),
    combine: combineEpisodeLabels,
  });

  const movies = moviesQ.data ?? EMPTY;
  const tvShows = showsQ.data ?? EMPTY;
  const stats = useMemo(
    () => buildReviewStats({ reviews, movies, tvShows, labelMap }),
    [reviews, movies, tvShows, labelMap],
  );

  return { ...stats, ...summarize(reviewsQ) };
}

// ── Lượt xem ──────────────────────────────────────────────────────────────────
// keepPreviousData: đổi Ngày/Tuần/Tháng… không nháy skeleton, biểu đồ cũ mờ đi tới khi có dữ liệu mới.
const viewQuery = (options) => withBase({ placeholderData: keepPreviousData, ...options });

export function useViewOverview({ granularity, contentType }) {
  const params = { granularity, contentType };
  const q = useQuery(viewQuery({
    queryKey: keys.viewStats.overview(params),
    queryFn: () => viewStatsService.getOverview(params),
  }));
  const summary = useMemo(() => summarizeViews(q.data), [q.data]);
  return { ...summary, isPending: q.isPending, isError: q.isError, isPlaceholder: q.isPlaceholderData, refetch: q.refetch };
}

export function useViewTop({ contentType }) {
  const params = { contentType };
  const q = useQuery(viewQuery({
    queryKey: keys.viewStats.top(params),
    queryFn: async () => asArray(await viewStatsService.getTop({ ...params, take: 10 })),
  }));
  return { top: q.data ?? EMPTY, isPending: q.isPending, isError: q.isError, refetch: q.refetch };
}

export function useViewGenres({ contentType }) {
  const params = { contentType };
  const q = useQuery(viewQuery({
    queryKey: keys.viewStats.genres(params),
    queryFn: async () => asArray(await viewStatsService.getGenres(params)),
  }));
  return { genres: q.data ?? EMPTY, isPending: q.isPending, isError: q.isError, refetch: q.refetch };
}

// ── Làm mới toàn dashboard ────────────────────────────────────────────────────
export function useDashboardRefresh() {
  const qc = useQueryClient();
  const fetching = useIsFetching({ queryKey: keys.all });

  // Query đang hiển thị được refetch ngay; section ở tab khác chỉ bị đánh dấu stale rồi tải khi mở.
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: keys.all }), [qc]);

  // Mốc cập nhật mới nhất; tính lại mỗi khi một đợt fetch bắt đầu/kết thúc.
  const updatedAt = useMemo(
    () =>
      Math.max(
        0,
        ...qc.getQueryCache().findAll({ queryKey: keys.all }).map((q) => q.state.dataUpdatedAt),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qc, fetching],
  );

  return { refresh, isRefreshing: fetching > 0, updatedAt };
}
