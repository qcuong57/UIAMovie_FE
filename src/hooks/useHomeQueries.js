// src/hooks/useHomeQueries.js
// Toàn bộ dữ liệu của Trang chủ: mỗi nguồn là một query độc lập (cache riêng, lỗi riêng).
// Yêu thích nằm ở ./useFavorites (re-export bên dưới để import cũ vẫn chạy).
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import movieService from "../services/movieService";
import tvShowService from "../services/tvShowService";
import genreService from "../services/genreService";
import reviewService from "../services/reviewService";
import { useIsLoggedIn } from "./useStoredUser";
import { queryKeys, STALE } from "../config/queryKeys";
import { normalizeMovie, normalizeTvShow } from "../utils/normalizeMedia";
import { unwrapList, ignoreMissingEndpoint } from "../utils/queryHelpers";

export { useFavorites } from "./useFavorites";

const EMPTY = [];

// select ở mức module → tham chiếu ổn định, không tính lại vô ích
const selectMovies = (d) => unwrapList(d, ["movies"]).map(normalizeMovie);
const selectTvShows = (d) => unwrapList(d, ["tvShows"]).map(normalizeTvShow);
const selectGenres = (d) => unwrapList(d, ["genres"]);

// ── Nội dung công khai ───────────────────────────────────────────────────────
// Mọi hook nhận `options` (vd. { enabled }) để nơi gọi điều phối thứ tự tải.
export const useTrendingMovies = (options) =>
  useQuery({
    queryKey: queryKeys.home.trendingMovies,
    queryFn: () => movieService.getTrendingMovies(),
    select: selectMovies,
    staleTime: STALE.list,
    ...options,
  });

export const useTopTvShows = (options) =>
  useQuery({
    queryKey: queryKeys.home.topTvShows,
    queryFn: () => tvShowService.getTvShows({ pageSize: 60, sortBy: "rating", sortDesc: true }),
    select: selectTvShows,
    staleTime: STALE.list,
    ...options,
  });

export const useLatestMovies = (options) =>
  useQuery({
    queryKey: queryKeys.home.latestMovies,
    queryFn: () =>
      movieService.getMovies({ page: 1, pageSize: 100, sortBy: "releaseDate", sortDesc: true }),
    select: selectMovies,
    staleTime: STALE.list,
    ...options,
  });

export const useLatestTvShows = (options) =>
  useQuery({
    queryKey: queryKeys.home.latestTvShows,
    queryFn: () =>
      tvShowService.getTvShows({ page: 1, pageSize: 100, sortBy: "firstAirDate", sortDesc: true }),
    select: selectTvShows,
    staleTime: STALE.list,
    ...options,
  });

export const useGenres = (options) =>
  useQuery({
    queryKey: queryKeys.genres.all,
    queryFn: () => genreService.getAllGenres(),
    select: selectGenres,
    staleTime: STALE.static,
    ...options,
  });

// ── Lịch sử xem (chỉ khi đã đăng nhập) ───────────────────────────────────────
export const useWatchHistory = () => {
  const loggedIn = useIsLoggedIn();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.me.watchHistory,
    enabled: loggedIn,
    staleTime: STALE.user,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const [movies, tvShows] = await Promise.all([
        movieService.getWatchHistory(),
        ignoreMissingEndpoint(tvShowService.getWatchHistory?.()),
      ]);
      return [
        ...unwrapList(movies, ["history"]).map((h) => ({ ...h, isTvShow: false })),
        ...unwrapList(tvShows, ["history"]).map((h) => ({ ...h, isTvShow: true })),
      ].sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
    },
  });
  // Trả object mới nhỏ gọn (không spread cả query) → chỉ re-render khi 3 trường này đổi
  return useMemo(
    () => ({ data: data ?? EMPTY, isLoading, isError }),
    [data, isLoading, isError],
  );
};

const REMOVE_HISTORY_KEY = ["me", "watch-history", "remove"];

/** Xoá một mục lịch sử: cập nhật UI ngay, lỗi thì hoàn tác, xong thì đồng bộ lại với server. */
export const useRemoveWatchHistory = () => {
  const qc = useQueryClient();
  const key = queryKeys.me.watchHistory;

  return useMutation({
    mutationKey: REMOVE_HISTORY_KEY,
    mutationFn: (item) =>
      item.isTvShow
        ? tvShowService.deleteWatchHistory(item.historyId)
        : movieService.deleteWatchHistory(item.historyId),

    onMutate: async (item) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData(key);
      qc.setQueryData(key, (old = []) =>
        old.filter(
          (h) =>
            !(
              String(h.id) === String(item.historyId) &&
              Boolean(h.isTvShow) === Boolean(item.isTvShow)
            ),
        ),
      );
      return { previous };
    },

    onError: (err, _item, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },

    onSettled: () => {
      if (qc.isMutating({ mutationKey: REMOVE_HISTORY_KEY }) === 1) {
        qc.invalidateQueries({ queryKey: key });
      }
    },
  });
};

// ── Review khán giả (trang chủ) ──────────────────────────────────────────────
const MAX_HOME_REVIEWS = 15;
const REVIEW_LIST_KEYS = ["reviews", "result", "records", "content"];
const unwrapOne = (r) => r?.data?.data ?? r?.data ?? r;
const pick = (r, a, b) => r?.[a] ?? r?.[b] ?? null;

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const formatAgo = (dateStr) => {
  if (!dateStr) return "";
  const d = Math.floor((Date.now() - new Date(dateStr)) / 86_400_000);
  if (d < 1) return "Hôm nay";
  if (d < 30) return `${d} ngày trước`;
  return `${Math.floor(d / 30)} tháng trước`;
};

const toReviewItem = (raw, type, contentId, meta) => ({
  // id ổn định (không dùng Math.random) để React key không đổi giữa các lần render
  id: raw.id ?? raw.reviewId ?? `${type}-${contentId}-${raw.createdAt ?? raw.createdDate ?? ""}`,
  contentType: type,
  movieId: type === "movie" ? contentId : null,
  tvShowId: type === "tvshow" ? contentId : null,
  linkPath: contentId ? `/${type}/${contentId}/info` : null,
  user: raw.userName || raw.user?.name || "Khán giả",
  rating: typeof raw.rating === "number" ? raw.rating : 7,
  text: raw.reviewText || raw.comment || "",
  time: formatAgo(raw.createdAt || raw.createdDate),
  content: {
    title:
      meta?.title ?? raw.movieTitle ?? raw.tvShowTitle ?? raw.movie?.title ?? raw.show?.title ?? "Unknown",
    year: meta?.year ?? null,
    posterUrl: meta?.posterUrl ?? null,
  },
});

async function fetchHomeReviews(qc) {
  // 1. Lấy review, bỏ review theo tập
  const res = await reviewService.getAllReviews(1, 100);
  const raw = unwrapList(unwrapOne(res), REVIEW_LIST_KEYS);

  // 2. Mỗi phim / TV show giữ 1 review có rating cao nhất
  const best = new Map();
  for (const r of raw) {
    if (pick(r, "episodeId", "EpisodeId")) continue;
    const movieId = pick(r, "movieId", "MovieId");
    const tvId = pick(r, "tvShowId", "TvShowId");
    const key = movieId ? `movie:${movieId}` : tvId ? `tvshow:${tvId}` : null;
    if (!key) continue;
    const rating = typeof r.rating === "number" ? r.rating : 0;
    if (!best.has(key) || rating > (best.get(key).rating ?? 0)) best.set(key, r);
  }
  // Giới hạn TRƯỚC khi tra metadata để tránh hàng chục request
  const top = [...best.values()]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, MAX_HOME_REVIEWS);
  if (!top.length) return [];

  // 3. Tra metadata từ cache trang chủ (không cần truyền props → queryKey không lệch)
  const fromCache = (queryKey, extra, normalize) =>
    unwrapList(qc.getQueryData(queryKey), [extra]).map(normalize);

  const movieMap = new Map(
    [
      ...fromCache(queryKeys.home.trendingMovies, "movies", normalizeMovie),
      ...fromCache(queryKeys.home.latestMovies, "movies", normalizeMovie),
    ].map((m) => [String(m.id), m]),
  );
  const tvMap = new Map(
    [
      ...fromCache(queryKeys.home.topTvShows, "tvShows", normalizeTvShow),
      ...fromCache(queryKeys.home.latestTvShows, "tvShows", normalizeTvShow),
    ].map((s) => [String(s.id), s]),
  );

  // 4. Chỉ fetch phần còn thiếu
  const missing = (field, alt, map) => [
    ...new Set(top.map((r) => pick(r, field, alt)).filter(Boolean).map(String)),
  ].filter((id) => !map.has(id));

  await Promise.allSettled([
    ...missing("movieId", "MovieId", movieMap).map((id) =>
      movieService.getMovieById(id).then((resp) => {
        const m = unwrapOne(resp);
        if (m?.id) movieMap.set(String(m.id), normalizeMovie(m));
      }),
    ),
    ...missing("tvShowId", "TvShowId", tvMap).map((id) =>
      tvShowService.getTvShowById(id).then((resp) => {
        const s = unwrapOne(resp);
        if (s?.id) tvMap.set(String(s.id), normalizeTvShow(s));
      }),
    ),
  ]);

  // 5. Dựng item hiển thị; review có chữ lên trước, trong mỗi nhóm xáo ngẫu nhiên
  const items = top.map((r) => {
    const movieId = pick(r, "movieId", "MovieId");
    if (movieId) return toReviewItem(r, "movie", movieId, movieMap.get(String(movieId)));
    const tvId = pick(r, "tvShowId", "TvShowId");
    return toReviewItem(r, "tvshow", tvId, tvMap.get(String(tvId)));
  });
  return [...shuffle(items.filter((i) => i.text)), ...shuffle(items.filter((i) => !i.text))];
}

/** Review khán giả trang chủ. Dùng metadata phim đã có trong cache trang chủ nên chỉ nên mount sau khi trending tải xong. */
export const useHomeReviews = (options) => {
  const qc = useQueryClient();
  return useQuery({
    queryKey: queryKeys.reviews.home,
    queryFn: () => fetchHomeReviews(qc),
    staleTime: STALE.medium,
    ...options,
  });
};