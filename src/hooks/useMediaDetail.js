// src/hooks/useMediaDetail.js
// Chi tiết phim / TV show qua React Query.
// MovieInfoPage và MovieDetailPage (cũng như TvShowInfoPage và TvShowDetailPage) dùng CHUNG một cache:
// vào /movie/:id/info rồi bấm "Xem" sang /movie/:id sẽ hiện ngay, không gọi lại API, không loading lại.
// Cũng tự huỷ / bỏ kết quả cũ khi đổi id nhanh (hết race condition của useEffect + async).
import { useQuery } from "@tanstack/react-query";

import movieService from "../services/movieService";
import tvShowService from "../services/tvShowService";
import { queryKeys, STALE } from "../config/queryKeys";

// Bóc DTO từ response. Giữ ĐÚNG cách bóc cũ của các trang để không đổi hành vi.
export const unwrapMovie = (res) => res?.movie || res?.data || res;
export const unwrapTvShow = (res) => {
  const envelope = res?.data ?? res;
  return envelope?.data ?? envelope?.tvShow ?? envelope;
};

/** Trả về DTO phim thô (đã bóc envelope). Chuẩn hoá thêm nằm ở utils/normalizeDetail.js */
export const useMovie = (id, options) =>
  useQuery({
    queryKey: queryKeys.movies.detail(id),
    queryFn: () => movieService.getMovieById(id),
    select: unwrapMovie,
    enabled: Boolean(id),
    staleTime: STALE.list,
    ...options,
  });

/** Trả về DTO TV show thô (đã bóc envelope). */
export const useTvShow = (id, options) =>
  useQuery({
    queryKey: queryKeys.tvShows.detail(id),
    queryFn: () => tvShowService.getTvShowById(id),
    select: unwrapTvShow,
    enabled: Boolean(id),
    staleTime: STALE.list,
    ...options,
  });