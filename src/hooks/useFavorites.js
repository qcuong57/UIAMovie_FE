// src/hooks/useFavorites.js
// YÊU THÍCH — một nguồn sự thật duy nhất là cache React Query (queryKeys.me.favoriteIds).
//  • Đọc : useIsFavorite(item) (từng thẻ phim) / useFavorites() (cần cả tập id) / useFavoriteList() (trang Yêu thích: cần bản ghi đầy đủ)
//  • Ghi : useFavoriteToggle(item) / useRemoveFavorite(item) / useFavoriteActions() → mutation cập nhật lạc quan, lỗi thì hoàn tác
//  • KHÔNG tự gọi movieService.addFavorite / removeFavorite ở component: sẽ không đồng bộ cache và dễ gọi trùng.
// Mọi MovieCard / RecommendSection / trang khác tự đồng bộ vì cùng đọc một cache,
// không cần truyền isFavorited / onFavoriteToggle qua từng tầng props nữa.
import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import movieService from "../services/movieService";
import tvShowService from "../services/tvShowService";
import { useIsLoggedIn } from "./useStoredUser";
import { useToast } from "../components/common/Toast";
import { getStoredUser } from "../config/sessionStore";
import { queryKeys, STALE } from "../config/queryKeys";
import { unwrapList, ignoreMissingEndpoint } from "../utils/queryHelpers";
import {
  normalizeFavoriteMovie,
  normalizeFavoriteTvShow,
} from "../utils/normalizeMedia";
import { getApiErrorMessage } from "../utils/apiError";

const EMPTY = [];
const TOGGLE_KEY = ["me", "favorites", "toggle"];

// Phim và TV show có thể trùng id → tách bằng tiền tố, không dồn chung một Set<string> trần.
const keyOf = (id, isTvShow) => `${isTvShow ? "tv" : "mv"}:${id}`;
export const favKey = (item) => keyOf(item?.id, item?.isTvShow);

const applyFavorite = (old = EMPTY, key, add) => {
  const next = new Set(old);
  if (add) next.add(key);
  else next.delete(key);
  return Array.from(next);
};

// ── Query: tập id yêu thích (chỉ khi đã đăng nhập) ───────────────────────────
// Cả hai query (ids + list) dùng chung một hàm gọi API.
const fetchFavoriteRecords = async () => {
  const [movies, tvShows] = await Promise.all([
    movieService.getFavorites(), // lỗi thật → ném ra (retry), KHÔNG cache danh sách rỗng giả
    ignoreMissingEndpoint(tvShowService.getFavorites?.()),
  ]);
  return {
    movies: unwrapList(movies, ["favorites"]),
    tvShows: unwrapList(tvShows, ["favorites"]),
  };
};

const favoriteIdsOptions = (loggedIn) => ({
  queryKey: queryKeys.me.favoriteIds,
  enabled: loggedIn,
  staleTime: STALE.user,
  refetchOnWindowFocus: true, // đồng bộ khi người dùng đổi qua tab khác rồi quay lại
  queryFn: async () => {
    const { movies, tvShows } = await fetchFavoriteRecords();
    return [
      ...movies.map((f) => keyOf(f.movieId ?? f.id, false)),
      ...tvShows.map((f) => keyOf(f.tvShowId ?? f.movieId ?? f.id, true)),
    ];
  },
});

// select ở mức module → tham chiếu ổn định
const selectFavoriteList = (d) => ({
  movies: d.movies.map(normalizeFavoriteMovie),
  tvShows: d.tvShows.map(normalizeFavoriteTvShow),
});

/**
 * Bản ghi yêu thích đã normalize: { movies, tvShows } (dùng cho trang Yêu thích).
 * Trạng thái "còn yêu thích hay không" vẫn lấy từ useFavorites() để bỏ tim là biến mất ngay (lạc quan).
 */
export const useFavoriteList = () => {
  const loggedIn = useIsLoggedIn();
  return useQuery({
    queryKey: queryKeys.me.favoriteList,
    enabled: loggedIn,
    staleTime: STALE.user,
    refetchOnWindowFocus: true,
    queryFn: fetchFavoriteRecords,
    select: selectFavoriteList,
  });
};

/** Một thẻ phim: chỉ re-render khi TRẠNG THÁI CỦA CHÍNH PHIM ĐÓ đổi (nhờ select ra boolean). */
export const useIsFavorite = (item) => {
  const loggedIn = useIsLoggedIn();
  const key = favKey(item);
  const select = useCallback((ids) => ids.includes(key), [key]);
  const { data } = useQuery({ ...favoriteIdsOptions(loggedIn), select });
  return Boolean(data);
};

/**
 * Danh sách id yêu thích + hàm kiểm tra + hàm cập nhật cache cục bộ.
 * isFavorited(id, isTvShow?) — bỏ trống isTvShow thì khớp cả hai loại (tương thích code cũ).
 */
export const useFavorites = () => {
  const qc = useQueryClient();
  const loggedIn = useIsLoggedIn();
  const { data, isLoading } = useQuery(favoriteIdsOptions(loggedIn));
  const favorites = data ?? EMPTY;
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const isFavorited = useCallback(
    (id, isTvShow) =>
      isTvShow === undefined
        ? favoriteSet.has(keyOf(id, false)) || favoriteSet.has(keyOf(id, true))
        : favoriteSet.has(keyOf(id, isTvShow)),
    [favoriteSet],
  );

  // Giữ để tương thích: các nơi cũ vẫn gọi onFavoriteToggle(item, isNowFav). Idempotent.
  const toggleFavorite = useCallback(
    (item, isNowFav) => {
      const key = favKey(item);
      qc.setQueryData(queryKeys.me.favoriteIds, (prev = EMPTY) =>
        applyFavorite(prev, key, isNowFav ?? !prev.includes(key)),
      );
    },
    [qc],
  );

  // ready = đã có dữ liệu thật (chưa đăng nhập / đang tải / lỗi → false, nơi gọi đừng lọc theo favoriteSet)
  return {
    favorites,
    favoriteSet,
    isFavorited,
    toggleFavorite,
    ready: data !== undefined,
    isLoading,
  };
};

// ── Mutation: thêm / bỏ yêu thích (optimistic + rollback) ────────────────────
export const useToggleFavorite = () => {
  const qc = useQueryClient();
  const idsKey = queryKeys.me.favoriteIds;

  return useMutation({
    mutationKey: TOGGLE_KEY,
    mutationFn: ({ item, next }) => {
      const svc = item.isTvShow ? tvShowService : movieService;
      return next ? svc.addFavorite(item.id) : svc.removeFavorite(item.id);
    },
    onMutate: async ({ item, next }) => {
      await qc.cancelQueries({ queryKey: idsKey }); // tránh refetch cũ ghi đè trạng thái lạc quan
      qc.setQueryData(idsKey, (old) => applyFavorite(old, favKey(item), next));
    },
    // Hoàn tác ĐÚNG mục này (không khôi phục snapshot cả danh sách → không phá thao tác song song khác)
    onError: (_err, { item, next }) => {
      qc.setQueryData(idsKey, (old) => applyFavorite(old, favKey(item), !next));
    },
    // Chỉ đồng bộ lại với server khi không còn thao tác yêu thích nào đang chạy
    onSettled: () => {
      if (qc.isMutating({ mutationKey: TOGGLE_KEY }) === 1) {
        qc.invalidateQueries({ queryKey: queryKeys.me.favorites });
      }
    },
  });
};

// ── Logic UI dùng chung: kiểm tra đăng nhập + toast + gọi mutation ───────────
const isAuthError = (err) => {
  const status = err?.response?.status ?? err?.status;
  return status === 401 || status === 403;
};

const useRunToggle = () => {
  const toast = useToast();
  const { mutate, isPending } = useToggleFavorite();

  const run = useCallback(
    (item, isFav, onToggled) => {
      if (!item || isPending) return;
      if (!getStoredUser()) {
        toast.warning("Bạn cần đăng nhập để thêm vào Yêu thích");
        return;
      }
      const next = !isFav;
      mutate(
        { item, next },
        {
          onSuccess: () => {
            onToggled?.(item, next);
            if (next) toast.success(`Đã thêm "${item.title}" vào Yêu thích`);
            else toast.info(`Đã bỏ "${item.title}" khỏi Yêu thích`);
          },
          onError: (err) => {
            if (isAuthError(err)) {
              toast.warning(
                "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
              );
            } else {
              toast.error(
                getApiErrorMessage(
                  err,
                  "Không thể cập nhật Yêu thích, vui lòng thử lại",
                ),
              );
            }
          },
        },
      );
    },
    [mutate, isPending, toast],
  );

  return { run, pending: isPending };
};

/** Cho MỘT thẻ phim: { isFav, pending, toggle(e) }. onToggled(item, isNowFav) là callback tuỳ chọn. */
export const useFavoriteToggle = (item, onToggled) => {
  const isFav = useIsFavorite(item);
  const { run, pending } = useRunToggle();
  const toggle = useCallback(
    (e) => {
      e?.stopPropagation?.();
      run(item, isFav, onToggled);
    },
    [run, item, isFav, onToggled],
  );
  return { isFav, pending, toggle };
};

/**
 * Chỉ để GỠ yêu thích (nút thùng rác ở trang Yêu thích): luôn là thao tác "bỏ",
 * không phụ thuộc cache id đã tải xong hay chưa (useFavoriteToggle sẽ đảo trạng thái nên không an toàn ở đây).
 */
export const useRemoveFavorite = (item, onRemoved) => {
  const { run, pending } = useRunToggle();
  const remove = useCallback(
    (e) => {
      e?.stopPropagation?.();
      run(item, true, onRemoved);
    },
    [run, item, onRemoved],
  );
  return { remove, pending };
};

/** Cho component hiển thị NHIỀU phim (vd. RecommendSection): { isFavorited, toggle(item, e), pending }. */
export const useFavoriteActions = () => {
  const { isFavorited } = useFavorites();
  const { run, pending } = useRunToggle();
  const toggle = useCallback(
    (item, e) => {
      e?.stopPropagation?.();
      run(item, isFavorited(item?.id, item?.isTvShow), undefined);
    },
    [run, isFavorited],
  );
  return { isFavorited, toggle, pending };
};
