// src/hooks/useAdminSubtitles.js
// Subtitle của một phim (admin). Thay cho vòng setTimeout poll trong từng SubtitleRow:
// chỉ cần MỘT query, tự refetch mỗi 3s khi còn subtitle đang xử lý và tự dừng khi xong.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import movieSubtitleService from "../services/movieSubtitleService";
import { queryKeys, STALE } from "../config/queryKeys";
import { unwrapList } from "../utils/queryHelpers";

const POLL_MS = 3000;

/**
 * @param {string} movieId
 * @param {{ isProcessing?: (s) => boolean }} opts — vị từ "đang xử lý" (SubtitlePanel truyền STATUS.PROCESSING vào)
 */
export const useMovieSubtitles = (movieId, { isProcessing = () => false } = {}) =>
  useQuery({
    queryKey: queryKeys.admin.movies.subtitles(movieId),
    queryFn: async () => unwrapList(await movieSubtitleService.getSubtitles(movieId)),
    enabled: !!movieId,
    staleTime: STALE.admin,
    refetchInterval: (query) => (query.state.data?.some(isProcessing) ? POLL_MS : false),
  });

export function useDeleteSubtitle(movieId) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "movies", "subtitle-delete"],
    meta: { silent: true },
    mutationFn: (subtitleId) => movieSubtitleService.deleteSubtitle(movieId, subtitleId),
    onSuccess: (_d, subtitleId) =>
      qc.setQueryData(queryKeys.admin.movies.subtitles(movieId), (old) =>
        Array.isArray(old) ? old.filter((s) => s.id !== subtitleId) : old,
      ),
  });
}

export function useSetDefaultSubtitle(movieId) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "movies", "subtitle-default"],
    meta: { silent: true },
    mutationFn: (subtitleId) => movieSubtitleService.setDefault(movieId, subtitleId),
    onSuccess: (_d, subtitleId) =>
      qc.setQueryData(queryKeys.admin.movies.subtitles(movieId), (old) =>
        Array.isArray(old) ? old.map((s) => ({ ...s, isDefault: s.id === subtitleId })) : old,
      ),
  });
}