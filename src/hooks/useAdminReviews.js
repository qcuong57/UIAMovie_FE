// src/hooks/useAdminReviews.js
// Admin → Đánh giá. Thay cho ba effect nối nhau (catalogue → tập → đánh giá) và phân trang reply tự quản:
// mỗi tầng là một query riêng theo key, chọn lại phim / show đã xem thì có ngay từ cache.

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import reviewService from "../services/reviewService";
import movieService from "../services/movieService";
import tvShowService from "../services/tvShowService";
import { queryKeys, STALE, CATALOG_ROOTS } from "../config/queryKeys";

const keys = queryKeys.admin.reviews;
export const REPLY_PAGE_SIZE = 10;

// Điểm đánh giá / số reply đổi → làm mới catalogue + đánh giá trang chủ phía người dùng.
const invalidatePublic = (qc) => {
  qc.invalidateQueries({ queryKey: queryKeys.reviews.home });
  qc.invalidateQueries({
    predicate: (q) => CATALOG_ROOTS.has(q.queryKey[0]),
  });
};

const byTitle = (a, b) => (a.title ?? "").localeCompare(b.title ?? "", "vi");

/**
 * Danh sách phim / TV show để chọn, tải HẾT mọi trang.
 * Trước đây gọi getMovies(1, 200) kiểu truyền số nên service (nhận object) dùng mặc định pageSize = 24
 * → dropdown chỉ có 24 mục. Giờ truyền object và lặp qua các trang theo totalCount (BE có thể giới hạn
 * pageSize tối đa nên không dựa vào "trang ít hơn pageSize"). Sắp xếp trên BẢN SAO.
 * kind: 'movie' | 'tvshow'
 */
const CATALOG_PAGE_SIZE = 100;
const CATALOG_MAX_PAGES = 100; // chốt chặn: tối đa 10.000 mục

export function useReviewCatalog(kind) {
  return useQuery({
    queryKey: keys.catalog(kind),
    queryFn: async () => {
      const fetchPage = (page) =>
        kind === "movie"
          ? movieService.getMovies({ page, pageSize: CATALOG_PAGE_SIZE })
          : tvShowService.getTvShows({ page, pageSize: CATALOG_PAGE_SIZE });

      const all = new Map();
      for (let page = 1; page <= CATALOG_MAX_PAGES; page++) {
        const res = await fetchPage(page);
        const data = res?.data ?? res;
        const items = Array.isArray(data) ? data : (data?.items ?? []);
        const before = all.size;
        items.forEach((it) => all.set(it.id, it));
        const total = Array.isArray(data) ? items.length : (data?.totalCount ?? data?.total);
        // Dừng khi: hết dữ liệu, không có mục mới (tránh lặp vô hạn), hoặc đã đủ tổng.
        if (items.length === 0 || all.size === before) break;
        if (total != null && all.size >= total) break;
        if (total == null && Array.isArray(data)) break; // BE trả mảng trần: không có phân trang
      }
      return [...all.values()].sort(byTitle);
    },
    staleTime: STALE.medium,
  });
}

/**
 * Tất cả tập của một show, xếp theo season rồi số tập.
 * Tách riêng queryFn để Dashboard dùng chung key `keys.episodes` → cùng một cache, không gọi lại API.
 */
export async function fetchShowEpisodes(showId) {
  const res = await tvShowService.getEpisodesByTvShow(showId);
  const raw =
    res?.data?.episodes ??
    res?.data?.items ??
    res?.data ??
    (Array.isArray(res) ? res : []);
  return [...raw].sort((a, b) => {
    if (a.seasonNumber !== b.seasonNumber)
      return (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0);
    return (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0);
  });
}

export function useShowEpisodes(showId, { enabled = true } = {}) {
  return useQuery({
    queryKey: keys.episodes(showId),
    queryFn: () => fetchShowEpisodes(showId),
    enabled: !!showId && enabled,
    staleTime: STALE.admin,
  });
}

/**
 * Đánh giá của một đối tượng. target: { kind: 'movie'|'tvshow', targetId, episodeId }
 * (episodeId rỗng = đánh giá cấp show). Trả về { reviews, totalCount }.
 */
export function useAdminReviews({ kind, targetId, episodeId }) {
  return useQuery({
    queryKey: keys.list({ kind, targetId, episodeId: episodeId || "" }),
    queryFn: async () => {
      let res;
      if (kind === "movie") res = await reviewService.getMovieReviews(targetId, 1, 100);
      else if (episodeId) res = await reviewService.getEpisodeReviews(episodeId, 1, 100);
      else res = await reviewService.getTvShowReviews(targetId, 1, 100);
      const data = res?.data;
      const list =
        data?.reviews ?? data?.items ?? (Array.isArray(data) ? data : []);
      return { reviews: list, totalCount: data?.totalCount ?? list.length };
    },
    enabled: !!targetId,
    staleTime: STALE.admin,
  });
}

/** Reply của một review, phân trang theo reply gốc. Trả về { replies, totalRoot }. */
export function useReviewReplies(reviewId, page) {
  return useQuery({
    queryKey: keys.replies(reviewId, page),
    queryFn: async () => {
      const res = await reviewService.getReplies(reviewId, page, REPLY_PAGE_SIZE);
      const data = res?.data;
      const incoming = data?.replies ?? [];
      return {
        replies: [...incoming].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        ),
        totalRoot: data?.totalRootReplies ?? 0,
      };
    },
    enabled: !!reviewId,
    staleTime: STALE.admin,
    placeholderData: keepPreviousData,
  });
}

/** variables: reviewId — bỏ review khỏi mọi danh sách đang cache, giảm tổng. */
export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "reviews", "delete"],
    meta: { silent: true },
    mutationFn: (reviewId) => reviewService.adminDeleteReview(reviewId),
    onSuccess: (_d, reviewId) => {
      qc.setQueriesData({ queryKey: keys.lists() }, (old) =>
        old?.reviews
          ? {
              reviews: old.reviews.filter((r) => r.id !== reviewId),
              totalCount: Math.max(
                0,
                old.totalCount - (old.reviews.some((r) => r.id === reviewId) ? 1 : 0),
              ),
            }
          : old,
      );
      qc.removeQueries({ queryKey: keys.repliesOf(reviewId) });
      invalidatePublic(qc);
    },
  });
}

/**
 * variables: reviewIds[] — xoá nhiều review, một review lỗi không chặn các review còn lại.
 * Trả về { deleted: id[], failed: { id, error }[] }; cache chỉ bỏ những review đã xoá thật.
 */
export function useDeleteReviews() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "reviews", "deleteMany"],
    meta: { silent: true },
    mutationFn: async (reviewIds) => {
      const settled = await Promise.allSettled(
        reviewIds.map((id) => reviewService.adminDeleteReview(id)),
      );
      const deleted = [];
      const failed = [];
      settled.forEach((r, i) =>
        r.status === "fulfilled"
          ? deleted.push(reviewIds[i])
          : failed.push({ id: reviewIds[i], error: r.reason }),
      );
      return { deleted, failed };
    },
    onSuccess: ({ deleted }) => {
      if (deleted.length === 0) return;
      const gone = new Set(deleted);
      qc.setQueriesData({ queryKey: keys.lists() }, (old) =>
        old?.reviews
          ? {
              reviews: old.reviews.filter((r) => !gone.has(r.id)),
              totalCount: Math.max(
                0,
                old.totalCount - old.reviews.filter((r) => gone.has(r.id)).length,
              ),
            }
          : old,
      );
      deleted.forEach((id) => qc.removeQueries({ queryKey: keys.repliesOf(id) }));
      invalidatePublic(qc);
    },
  });
}

/**
 * variables: { replyId, reviewId, removedCount } — xoá reply gốc kéo theo reply con nên
 * `removedCount` = số reply thực sự biến mất; dùng để giảm replyCount của review ngay.
 */
export function useDeleteReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "reviews", "deleteReply"],
    meta: { silent: true },
    mutationFn: ({ replyId }) => reviewService.adminDeleteReply(replyId),
    onSuccess: (_d, { reviewId, removedCount }) => {
      qc.setQueriesData({ queryKey: keys.lists() }, (old) =>
        old?.reviews
          ? {
              ...old,
              reviews: old.reviews.map((r) =>
                r.id === reviewId
                  ? { ...r, replyCount: Math.max(0, (r.replyCount ?? 0) - removedCount) }
                  : r,
              ),
            }
          : old,
      );
      qc.invalidateQueries({ queryKey: keys.repliesOf(reviewId) }); // số trang / tổng khớp server
      invalidatePublic(qc);
    },
  });
}