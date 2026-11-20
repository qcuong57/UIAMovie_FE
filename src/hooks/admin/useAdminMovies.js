// src/hooks/useAdminMovies.js
// TanStack Query cho khu vực ADMIN → Phim (danh sách, chi tiết, thể loại, tìm Person, ghi dữ liệu).
// Quy ước giống phía người dùng: key lấy từ queryKeys.js, queryFn ném lỗi, ghi = mutation.
//   • Danh sách + chi tiết dùng chung cache giữa bảng, DetailPanel, EditModal, VideoUploadPanel
//     → mở "Xem" rồi "Sửa" cùng một phim chỉ tốn MỘT request.
//   • Gốc "admin" không thuộc PUBLIC_QUERY_ROOTS → tự bị reset khi đổi tài khoản.
//   • Sau mỗi thay đổi catalogue: làm mới cache công khai (home / browse / search / movies / coming-soon).
import { useCallback } from "react";
import {
  keepPreviousData,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axiosInstance from "../../config/axios";
import movieService from "../../services/movieService";
import { CATALOG_ROOTS, queryKeys, STALE } from "../../config/queryKeys";
import { unwrapList, unwrapOne } from "../../utils/queryHelpers";
import { useToast } from "../../components/admin/common/Toast";

const errMsg = (e, fallback) => e?.response?.data?.message ?? e?.message ?? fallback;

// Mutation keys (để đếm / theo dõi mutation đang chạy)
const MK = {
  premium: ["admin", "movies", "set-premium"],
  update: ["admin", "movies", "update"],
  create: ["admin", "movies", "create"],
  remove: ["admin", "movies", "delete"],
  uploadVideo: ["admin", "movies", "upload-video"],
  deleteVideo: ["admin", "movies", "delete-video"],
};

// ── Cache helpers ────────────────────────────────────────────────────────────
/** Phim thay đổi → các trang người dùng đang cache phải tải lại. Chỉ query đang hiển thị mới refetch ngay. */
export const invalidateCatalog = (qc) =>
  qc.invalidateQueries({ predicate: (q) => CATALOG_ROOTS.has(q.queryKey[0]) });

const patchListItem = (qc, id, patch) =>
  qc.setQueryData(queryKeys.admin.movies.list(), (old) =>
    Array.isArray(old) ? old.map((m) => (m.id === id ? { ...m, ...patch } : m)) : old,
  );

const patchDetail = (qc, id, patch) =>
  qc.setQueryData(queryKeys.admin.movies.detail(id), (old) => (old ? { ...old, ...patch } : old));

/** Nút "Tải lại" / sau khi import TMDB: làm mới bảng phim + cache công khai. */
export function useRefreshMovies() {
  const qc = useQueryClient();
  return useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.movies.list() });
    invalidateCatalog(qc);
  }, [qc]);
}

// ══════════════════════════════════════════════════════════════════════════════
// QUERIES
// ══════════════════════════════════════════════════════════════════════════════

// Module-level → tham chiếu ổn định, React Query chỉ chạy lại select khi data đổi
const selectMovieRows = (raw) => {
  const now = Date.now();
  return raw.map((m) => ({
    ...m,
    year: m.releaseDate ? new Date(m.releaseDate).getFullYear() : m.year,
    // Ưu tiên cờ từ BE; fallback tự tính từ releaseDate để badge luôn đúng
    isUpcoming: m.isUpcoming ?? (m.releaseDate ? new Date(m.releaseDate).getTime() > now : false),
  }));
};

/**
 * Toàn bộ phim cho bảng admin (lọc / sắp xếp / phân trang phía client).
 * Lấy cả phim đã phát hành lẫn phim sắp chiếu: BE mặc định (IsUpcoming = null) ẩn phim có ReleaseDate > hôm nay.
 */
export const useAdminMovies = () =>
  useQuery({
    queryKey: queryKeys.admin.movies.list(),
    queryFn: async () =>
      unwrapList(
        await movieService.getMoviesIncludingUpcoming({ page: 1, pageSize: 500 }),
        ["movies"],
      ),
    select: selectMovieRows,
    staleTime: STALE.admin,
    refetchOnWindowFocus: true, // nhiều admin cùng thao tác → quay lại tab thì thấy thay đổi của nhau
  });

/** Chi tiết đầy đủ (description, cast, director, images, videos...). id falsy → không gọi. */
export const useAdminMovie = (id) =>
  useQuery({
    queryKey: queryKeys.admin.movies.detail(id),
    queryFn: async () => unwrapOne(await movieService.getMovieById(id)),
    enabled: !!id,
    staleTime: STALE.admin,
  });

/** Danh sách thể loại (GenrePickerField + EditModal dùng để match tên → id). */
export const useAdminGenres = () =>
  useQuery({
    queryKey: queryKeys.genres.admin,
    queryFn: async () => unwrapList(await movieService.getGenres()),
    staleTime: STALE.static,
  });

/** Autocomplete Person. Truyền chuỗi ĐÃ debounce. < 2 ký tự → không gọi. */
export const usePersonSearch = (term) => {
  const q = (term ?? "").trim();
  return useQuery({
    queryKey: queryKeys.admin.persons.search(q.toLowerCase()),
    queryFn: async () => unwrapList(await movieService.searchPersons(q)),
    enabled: q.length >= 2,
    staleTime: 5 * 60_000, // gõ lại cùng từ khoá → có ngay
    placeholderData: keepPreviousData, // giữ kết quả cũ khi tải từ khoá mới, không nháy
    meta: { silent: true },
  });
};

// ══════════════════════════════════════════════════════════════════════════════
// MUTATIONS
// ══════════════════════════════════════════════════════════════════════════════

/** Id các phim đang đổi Free/Premium (để khoá đúng nút của dòng đó). */
export const usePendingPremiumIds = () =>
  useMutationState({
    filters: { mutationKey: MK.premium, status: "pending" },
    select: (m) => m.state.variables?.id,
  });

/** Free ↔ Premium: optimistic, rollback riêng từng phim nếu lỗi. */
export function useSetMoviePremium() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationKey: MK.premium,
    mutationFn: ({ id, isPremium }) => movieService.setPremium(id, isPremium),
    onMutate: async ({ id, isPremium }) => {
      await qc.cancelQueries({ queryKey: queryKeys.admin.movies.list() });
      patchListItem(qc, id, { isPremium });
      patchDetail(qc, id, { isPremium });
    },
    onError: (err, { id, isPremium }) => {
      patchListItem(qc, id, { isPremium: !isPremium });
      patchDetail(qc, id, { isPremium: !isPremium });
      toast.error(errMsg(err, "Không đổi được loại nội dung"), "Cập nhật thất bại");
    },
    onSettled: () => {
      // Chỉ đồng bộ lại khi đây là mutation cuối cùng (lúc này nó vẫn còn được đếm)
      // → bấm liên tiếp nhiều dòng không bị giật.
      if (qc.isMutating({ mutationKey: MK.premium }) <= 1) {
        qc.invalidateQueries({ queryKey: queryKeys.admin.movies.list(), refetchType: "none" });
        invalidateCatalog(qc);
      }
    },
  });
}

/**
 * Lưu chỉnh sửa. Gom cả chuỗi API (PUT phim → trailer Youtube → xoá/upload trailer video) vào một mutation.
 * variables: { id, body, trailer: { youtubeUrl, initialYoutubeUrl, youtubeVideoId, removeVideo, videoId, file, onProgress }, patch }
 *   `patch` = các trường hiển thị ở bảng, ghi thẳng vào cache danh sách (khỏi tải lại 500 phim).
 */
export function useUpdateMovie() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: MK.update,
    meta: { silent: true }, // modal tự báo lỗi bằng toast
    mutationFn: async ({ id, body, trailer }) => {
      await axiosInstance.put(`/movies/${id}`, body);

      const yt = trailer.youtubeUrl.trim();
      const ytInitial = trailer.initialYoutubeUrl.trim();
      if (yt && yt !== ytInitial) {
        await movieService.setTrailerYoutube(id, yt);
      } else if (!yt && ytInitial && trailer.youtubeVideoId) {
        // endpoint /trailer/youtube chỉ để SET → muốn xoá phải xoá video (videoType="trailer") theo id
        await movieService.deleteVideo(trailer.youtubeVideoId);
      }

      if (trailer.removeVideo && !trailer.file && trailer.videoId) {
        await movieService.deleteVideo(trailer.videoId);
      }
      let trailerUploaded = false;
      if (trailer.file) {
        await movieService.uploadTrailerVideo(id, trailer.file, trailer.onProgress);
        trailerUploaded = true;
      }
      return { trailerUploaded };
    },
    onSuccess: (_data, { id, patch }) => {
      if (patch) patchListItem(qc, id, patch);
      qc.invalidateQueries({ queryKey: queryKeys.admin.movies.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.admin.movies.list(), refetchType: "none" });
      invalidateCatalog(qc);
    },
  });
}

/**
 * Tạo phim thủ công (+ upload trailer video nếu có — chỉ upload được sau khi có id).
 * Lỗi upload trailer KHÔNG làm hỏng việc tạo phim → trả về trong `trailerError`.
 * variables: { dto, trailerFile, onTrailerProgress }
 */
export function useCreateMovie() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: MK.create,
    meta: { silent: true },
    mutationFn: async ({ dto, trailerFile, onTrailerProgress }) => {
      const res = await movieService.createMovie(dto);
      const movieId = res?.data?.movieId ?? res?.movieId;
      let trailerError = null;
      if (movieId && trailerFile) {
        try {
          await movieService.uploadTrailerVideo(movieId, trailerFile, onTrailerProgress);
        } catch (e) {
          trailerError = e;
        }
      }
      return { movieId, trailerError };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.movies.list() }); // bảng đang hiển thị → cần phim mới
      invalidateCatalog(qc);
    },
  });
}

/** Xoá phim. variables: id */
export function useDeleteMovie() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: MK.remove,
    meta: { silent: true },
    mutationFn: (id) => axiosInstance.delete(`/movies/${id}`),
    onSuccess: (_d, id) => {
      qc.setQueryData(queryKeys.admin.movies.list(), (old) =>
        Array.isArray(old) ? old.filter((m) => m.id !== id) : old,
      );
      qc.removeQueries({ queryKey: queryKeys.admin.movies.detail(id) });
      qc.removeQueries({ queryKey: queryKeys.admin.movies.subtitles(id) });
      qc.invalidateQueries({ queryKey: queryKeys.admin.movies.list(), refetchType: "none" });
      invalidateCatalog(qc);
    },
  });
}

/** Upload video phim (có tiến trình). variables: { file, videoType, onProgress } */
export function useUploadMovieVideo(movieId) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: MK.uploadVideo,
    meta: { silent: true },
    mutationFn: async ({ file, videoType, onProgress }) => {
      // Tên field viết hoa chữ đầu để khớp C# DTO (UploadMovieVideoDTO)
      const fd = new FormData();
      fd.append("VideoFile", file);
      fd.append("VideoType", videoType);
      const response = await axiosInstance.post(`/movies/${movieId}/videos`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100));
        },
        timeout: 10 * 60 * 1000, // 10 phút cho file lớn
      });
      return response?.data?.data ?? response?.data ?? response;
    },
    // BE có thể chỉ trả { videoUrl } → tải lại chi tiết để danh sách video luôn đúng
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.movies.detail(movieId) });
      invalidateCatalog(qc);
    },
  });
}

/** Xoá 1 video của phim. variables: videoId */
export function useDeleteMovieVideo(movieId) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: MK.deleteVideo,
    meta: { silent: true },
    mutationFn: (videoId) => axiosInstance.delete(`/movies/videos/${videoId}`),
    onSuccess: (_d, videoId) => {
      qc.setQueryData(queryKeys.admin.movies.detail(movieId), (old) =>
        old ? { ...old, videos: (old.videos ?? []).filter((v) => v.id !== videoId) } : old,
      );
      invalidateCatalog(qc);
    },
  });
}