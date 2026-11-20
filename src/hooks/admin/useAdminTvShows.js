// src/hooks/useAdminTvShows.js
// Admin → TV Shows trên TanStack Query — cùng quy ước với useAdminMovies / useAdminUsers.
//   • Query:    useAdminTvShows(filter) (server-side), useAdminTvShow(id), useTvShowSeason(showId, seasonNumber)
//   • Mutation: premium (optimistic từng show), update, create, delete, sync, video, season, episode
// Toàn bộ nằm dưới gốc `admin` → cache tự reset khi đổi tài khoản.

import { useEffect, useMemo } from "react";
import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axiosInstance from "../../config/axios";
import tvShowService from "../../services/tvShowService";
import { queryKeys, STALE, CATALOG_ROOTS } from "../../config/queryKeys";
import { useToast } from "../../components/admin/common/Toast";

const keys = queryKeys.admin.tvShows;
const NO_EPISODES = Object.freeze([]);

// ── Helpers ──────────────────────────────────────────────────────────────────
// Bóc envelope: axios response / { data } / { data: { data } } / object trần.
const unwrap = (res) => {
  const p = res?.data ?? res;
  return p?.data ?? p;
};

const errMsg = (e, fallback) =>
  e?.response?.data?.message ?? e?.message ?? fallback;

const normalizeList = (res) => {
  let data = res?.data ?? res;
  if (data && !Array.isArray(data) && !data.items && data.data) data = data.data; // envelope { success, data: { items } }
  const raw = Array.isArray(data) ? data : (data?.items ?? []);
  const now = Date.now();
  return {
    items: raw.map((s) => ({
      ...s,
      year: s.firstAirDate ? new Date(s.firstAirDate).getFullYear() : null,
      // Ưu tiên cờ từ BE; fallback tự tính để badge luôn đúng
      isUpcoming:
        s.isUpcoming ?? (s.firstAirDate ? new Date(s.firstAirDate).getTime() > now : false),
    })),
    total: data?.totalCount ?? data?.total ?? raw.length,
  };
};

// Làm mới dữ liệu phía người dùng (home, browse, search, coming-soon, tv...).
// Nếu useAdminMovies.js đã export invalidateCatalog thì import dùng lại và xoá bản này.
const invalidateCatalog = (qc) =>
  qc.invalidateQueries({ predicate: (q) => CATALOG_ROOTS.has(q.queryKey[0]) });

// Chỉ đánh dấu stale, không refetch ngay (danh sách đang hiển thị đã được vá trực tiếp trong cache).
const markListsStale = (qc) =>
  qc.invalidateQueries({ queryKey: keys.lists(), refetchType: "none" });

const patchListItem = (qc, id, patch) =>
  qc.setQueriesData({ queryKey: keys.lists() }, (old) =>
    old && Array.isArray(old.items)
      ? {
          ...old,
          items: old.items.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }
      : old,
  );

/** Vá cache chi tiết TV show. patch: object hoặc (old) => object. */
export const patchTvShowDetail = (qc, id, patch) =>
  qc.setQueryData(keys.detail(id), (old) =>
    old
      ? { ...old, ...(typeof patch === "function" ? patch(old) : patch) }
      : old,
  );

/** Vá một tập trong mọi season đang cache của show. */
export const patchTvShowEpisode = (qc, showId, episodeId, patch) =>
  qc.setQueriesData({ queryKey: keys.seasons(showId) }, (old) =>
    Array.isArray(old)
      ? old.map((ep) => (ep.id === episodeId ? { ...ep, ...patch } : ep))
      : old,
  );

// ═════════════════════════════════════════════════════════════════════════════
// QUERIES
// ═════════════════════════════════════════════════════════════════════════════

/** queryOptions dùng chung cho query chính và prefetch trang kế (cùng key). */
export const adminTvShowsOptions = ({
  page = 1,
  pageSize = 15,
  search = "",
  sortBy = "firstairdate",
  sortDir = "desc",
} = {}) =>
  queryOptions({
    queryKey: keys.list({ page, pageSize, search, sortBy, sortDir }),
    // Admin phải thấy CẢ show sắp lên sóng (giống getMoviesIncludingUpcoming bên Movie):
    // BE mặc định ẩn show có FirstAirDate > hôm nay, nên gửi includeUpcoming=true.
    // Gọi axios trực tiếp để chắc chắn tham số này được gửi đi và request cũ bị huỷ qua `signal`.
    queryFn: async ({ signal }) =>
      normalizeList(
        await axiosInstance.get("/tvshows", {
          params: {
            page,
            pageSize,
            search: search || undefined,
            sortBy,
            sortDesc: sortDir === "desc",
            includeUpcoming: true,
          },
          signal,
        }),
      ),
    staleTime: STALE.admin,
    placeholderData: keepPreviousData,
  });

export function useAdminTvShows(filter = {}) {
  const qc = useQueryClient();
  const {
    page = 1,
    pageSize = 15,
    search = "",
    sortBy = "firstairdate",
    sortDir = "desc",
  } = filter;
  const query = useQuery(
    adminTvShowsOptions({ page, pageSize, search, sortBy, sortDir }),
  );

  // Prefetch trang kế → bấm "trang sau" có dữ liệu ngay
  const total = query.data?.total ?? 0;
  const hasNext = page * pageSize < total;
  useEffect(() => {
    if (!hasNext || query.isPlaceholderData) return;
    qc.prefetchQuery(
      adminTvShowsOptions({
        page: page + 1,
        pageSize,
        search,
        sortBy,
        sortDir,
      }),
    );
  }, [
    qc,
    hasNext,
    query.isPlaceholderData,
    page,
    pageSize,
    search,
    sortBy,
    sortDir,
  ]);

  return query;
}

/** Chi tiết đầy đủ — DetailPanel và EditModal dùng chung một cache. */
export function useAdminTvShow(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: async () => unwrap(await tvShowService.getTvShowById(id)),
    enabled: !!id && enabled,
    staleTime: STALE.admin,
  });
}

/** Danh sách tập của một season (đã sắp theo số tập). */
export function useTvShowSeason(showId, seasonNumber, { enabled = true } = {}) {
  return useQuery({
    queryKey: keys.season(showId, seasonNumber),
    queryFn: async () => {
      const body = unwrap(await tvShowService.getSeason(showId, seasonNumber));
      const eps = body?.episodes ?? (Array.isArray(body) ? body : NO_EPISODES);
      return [...eps].sort(
        (a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0),
      );
    },
    enabled: !!showId && seasonNumber != null && enabled,
    staleTime: STALE.admin,
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// MUTATIONS — TV show
// ═════════════════════════════════════════════════════════════════════════════

const PREMIUM_KEY = ["admin", "tvShows", "premium"];

/**
 * Toggle Premium: optimistic + rollback RIÊNG từng show, cho bấm nhiều dòng liên tiếp.
 * variables: { id, isPremium, title }
 */
export function useSetTvShowPremium() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationKey: PREMIUM_KEY,
    meta: { silent: true },
    mutationFn: ({ id, isPremium }) => tvShowService.setPremium(id, isPremium),
    onMutate: async ({ id, isPremium }) => {
      await qc.cancelQueries({ queryKey: keys.lists() }); // refetch đang bay không được ghi đè optimistic
      patchListItem(qc, id, { isPremium });
      patchTvShowDetail(qc, id, { isPremium });
    },
    onError: (e, { id, isPremium }) => {
      patchListItem(qc, id, { isPremium: !isPremium });
      patchTvShowDetail(qc, id, { isPremium: !isPremium });
      toast.error(errMsg(e, "Không thể cập nhật trạng thái Premium"));
    },
    onSuccess: (_d, { isPremium, title }) => {
      toast.success(
        isPremium
          ? `Đã đặt "${title}" thành Premium`
          : `Đã chuyển "${title}" về Free`,
      );
      markListsStale(qc);
      invalidateCatalog(qc);
    },
  });
}

/** Tập id các show đang chờ toggle Premium (để hiện spinner đúng dòng). */
export function usePremiumPendingIds() {
  const ids = useMutationState({
    filters: { mutationKey: PREMIUM_KEY, status: "pending" },
    select: (m) => m.state.variables?.id,
  });
  return useMemo(() => new Set(ids), [ids]);
}

/**
 * Lưu chỉnh sửa: PUT show → trailer Youtube → xoá/upload video trailer (tuần tự như cũ).
 * variables: { id, dto, trailer, listPatch }
 *   trailer: { youtubeUrl, initialYoutubeUrl, youtubeTrailerVideoId, removeTrailerVideo,
 *              trailerVideoId, pendingFile, onProgress }
 *   listPatch: các trường tóm tắt để vá thẳng vào bảng (title, rating, isPremium, status, posterUrl, ...)
 * Trả về { trailerUploaded }.
 */
export function useUpdateTvShow() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "tvShows", "update"],
    meta: { silent: true },
    mutationFn: async ({ id, dto, trailer = {} }) => {
      await axiosInstance.put(`/tvshows/${id}`, dto);

      const yt = (trailer.youtubeUrl ?? "").trim();
      const ytInit = (trailer.initialYoutubeUrl ?? "").trim();
      if (yt && yt !== ytInit) {
        await tvShowService.setTrailerYoutube(id, yt);
      } else if (!yt && ytInit && trailer.youtubeTrailerVideoId) {
        await tvShowService.deleteVideo(trailer.youtubeTrailerVideoId);
      }

      if (
        trailer.removeTrailerVideo &&
        !trailer.pendingFile &&
        trailer.trailerVideoId
      ) {
        await tvShowService.deleteVideo(trailer.trailerVideoId);
      }

      let trailerUploaded = false;
      if (trailer.pendingFile) {
        await tvShowService.uploadTrailerVideo(
          id,
          trailer.pendingFile,
          trailer.onProgress,
        );
        trailerUploaded = true;
      }
      return { trailerUploaded };
    },
    onSuccess: (_d, { id, listPatch }) => {
      if (listPatch) patchListItem(qc, id, listPatch);
      // Cast / images / videos đổi sâu → để chi tiết tự refetch lần mở sau (hoặc ngay nếu đang mở).
      qc.invalidateQueries({ queryKey: keys.detail(id) });
      markListsStale(qc);
      invalidateCatalog(qc);
    },
  });
}

/**
 * Tạo TV show (+ upload trailer nếu có). Lỗi upload trailer KHÔNG làm hỏng việc tạo show:
 * trả về { showId, trailerError }.
 * variables: { dto, trailerFile, onProgress }
 */
export function useCreateTvShow() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "tvShows", "create"],
    meta: { silent: true },
    mutationFn: async ({ dto, trailerFile, onProgress }) => {
      const res = await tvShowService.createTvShow(dto);
      const showId = res?.data?.showId ?? res?.showId;
      let trailerError = null;
      if (showId && trailerFile) {
        try {
          await tvShowService.uploadTrailerVideo(
            showId,
            trailerFile,
            onProgress,
          );
        } catch (e) {
          trailerError = e;
        }
      }
      return { showId, trailerError };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.lists() }); // show mới phải hiện ngay (tổng số đổi)
      invalidateCatalog(qc);
    },
  });
}

/** Xoá TV show. variables: id */
export function useDeleteTvShow() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "tvShows", "delete"],
    meta: { silent: true },
    mutationFn: (id) => axiosInstance.delete(`/tvshows/${id}`),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: keys.detail(id) });
      qc.removeQueries({ queryKey: keys.seasons(id) });
      qc.invalidateQueries({ queryKey: keys.lists() }); // tổng số đổi → lấy lại từ server
      invalidateCatalog(qc);
    },
  });
}

/** Đồng bộ tập mới từ TMDB. variables: showId. Trả về payload { message, invalidatedSeasons, ... }. */
export function useSyncTvShowEpisodes() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "tvShows", "sync"],
    meta: { silent: true },
    mutationFn: async (showId) => {
      // BE có thể retry TMDB tới ~60s → timeout FE phải dài hơn (mặc định của axios thường ngắn hơn)
      const res = await axiosInstance.post(`/tvshows/${showId}/sync`, null, {
        timeout: 90 * 1000,
      });
      return res?.data?.data ?? res?.data;
    },
    onSuccess: (_d, showId) => {
      // Season nằm dưới key riêng → season đang mở refetch, season đóng bị đánh dấu stale (thay cho prop `invalidated`).
      qc.invalidateQueries({ queryKey: keys.detail(showId) });
      qc.invalidateQueries({ queryKey: keys.seasons(showId) });
      qc.invalidateQueries({ queryKey: keys.lists() });
      invalidateCatalog(qc);
    },
  });
}

/** Sau khi import TMDB (AdminTmdbSearch chưa chuyển sang hook) — làm mới danh sách + phía user. */
export function useRefreshTvShows() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: keys.lists() });
    invalidateCatalog(qc);
  };
}

// ── Video của show ───────────────────────────────────────────────────────────
/** variables: { showId, videoId } */
export function useDeleteTvShowVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "tvShows", "deleteVideo"],
    meta: { silent: true },
    mutationFn: ({ videoId }) =>
      axiosInstance.delete(`/tvshows/videos/${videoId}`),
    onSuccess: (_d, { showId, videoId }) => {
      patchTvShowDetail(qc, showId, (old) => ({
        videos: (old.videos ?? []).filter((v) => v.id !== videoId),
      }));
    },
  });
}

// ── Video của tập ────────────────────────────────────────────────────────────
/** variables: { showId, episodeId, file, onProgress } */
export function useUploadEpisodeVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "tvShows", "uploadEpisodeVideo"],
    meta: { silent: true },
    mutationFn: ({ episodeId, file, onProgress }) => {
      const formData = new FormData();
      formData.append("videoFile", file);
      return axiosInstance.post(
        `/tvshows/episodes/${episodeId}/video`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (ev) => {
            if (ev.total)
              onProgress?.(Math.round((ev.loaded * 100) / ev.total));
          },
          timeout: 10 * 60 * 1000, // video tập có thể lớn, upload lên Cloudinary tốn thời gian
        },
      );
    },
    onSuccess: (_d, { showId, episodeId }) => {
      patchTvShowEpisode(qc, showId, episodeId, {
        hasVideo: true,
        videoUrl: null,
      });
    },
  });
}

/** variables: { showId, episodeId } */
export function useDeleteEpisodeVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "tvShows", "deleteEpisodeVideo"],
    meta: { silent: true },
    mutationFn: ({ episodeId }) =>
      axiosInstance.delete(`/tvshows/episodes/${episodeId}/video`),
    onSuccess: (_d, { showId, episodeId }) => {
      patchTvShowEpisode(qc, showId, episodeId, {
        hasVideo: false,
        videoUrl: null,
      });
    },
  });
}

// ── Season / Episode ─────────────────────────────────────────────────────────
/** variables: { showId, seasonNumber, payload, patch } — patch vá vào detail.seasons */
export function useUpdateSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "tvShows", "updateSeason"],
    meta: { silent: true },
    mutationFn: ({ showId, seasonNumber, payload }) =>
      axiosInstance.put(`/tvshows/${showId}/seasons/${seasonNumber}`, payload),
    onSuccess: (_d, { showId, seasonNumber, patch }) => {
      patchTvShowDetail(qc, showId, (old) => ({
        seasons: (old.seasons ?? []).map((s) =>
          s.seasonNumber === seasonNumber ? { ...s, ...patch } : s,
        ),
      }));
    },
  });
}

/** variables: { showId, episodeId, payload, patch } */
export function useUpdateEpisode() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "tvShows", "updateEpisode"],
    meta: { silent: true },
    mutationFn: ({ episodeId, payload }) =>
      axiosInstance.put(`/tvshows/episodes/${episodeId}`, payload),
    onSuccess: (_d, { showId, episodeId, patch }) => {
      patchTvShowEpisode(qc, showId, episodeId, patch);
    },
  });
}

/** variables: { showId, seasonNumber, payload } → trả về tập vừa tạo */
export function useAddEpisode() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "tvShows", "addEpisode"],
    meta: { silent: true },
    mutationFn: ({ showId, seasonNumber, payload }) =>
      tvShowService.addEpisode(showId, seasonNumber, payload),
    onSuccess: (created, { showId, seasonNumber }) => {
      // Season chưa từng tải thì không có gì để vá — lần mở sau sẽ tải đủ danh sách.
      qc.setQueryData(keys.season(showId, seasonNumber), (old) =>
        Array.isArray(old)
          ? [...old, created].sort(
              (a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0),
            )
          : old,
      );
      qc.invalidateQueries({ queryKey: keys.detail(showId) }); // số tập của show/season đổi
      markListsStale(qc);
      invalidateCatalog(qc);
    },
  });
}

/** variables: { showId, episodeId } */
export function useDeleteEpisode() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "tvShows", "deleteEpisode"],
    meta: { silent: true },
    mutationFn: ({ episodeId }) => tvShowService.deleteEpisode(episodeId),
    onSuccess: (_d, { showId, episodeId }) => {
      qc.setQueriesData({ queryKey: keys.seasons(showId) }, (old) =>
        Array.isArray(old) ? old.filter((ep) => ep.id !== episodeId) : old,
      );
      qc.removeQueries({ queryKey: keys.subtitles(episodeId) });
      qc.invalidateQueries({ queryKey: keys.detail(showId) });
      markListsStale(qc);
      invalidateCatalog(qc);
    },
  });
}