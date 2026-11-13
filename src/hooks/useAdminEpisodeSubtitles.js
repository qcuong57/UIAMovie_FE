// src/hooks/useAdminEpisodeSubtitles.js
// Subtitle của tập phim (admin TV show) — cùng mẫu với useMovieSubtitles:
// MỘT query tự refetchInterval 3 giây khi còn subtitle đang xử lý và tự dừng khi xong
// (thay cho mỗi dòng tự poll bằng setTimeout).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import episodeSubtitleService from "../services/episodeSubtitleService";
import { queryKeys, STALE } from "../config/queryKeys";

const keys = queryKeys.admin.tvShows;
const POLL_MS = 3000;
const PROCESSING = 1; // khớp STATUS.PROCESSING trong EpisodeSubtitlePanel

// BE có thể trả số (0/1/2) hoặc chuỗi ("Processing")
export const isSubtitleProcessing = (status) =>
  typeof status === "string"
    ? status.toLowerCase() === "processing"
    : status === PROCESSING;

export function useEpisodeSubtitles(episodeId) {
  return useQuery({
    queryKey: keys.subtitles(episodeId),
    queryFn: async () => {
      const data = await episodeSubtitleService.getSubtitles(episodeId);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!episodeId,
    staleTime: STALE.admin,
    refetchInterval: (query) =>
      query.state.data?.some((s) => isSubtitleProcessing(s.status))
        ? POLL_MS
        : false,
  });
}

/** variables: subtitleId */
export function useDeleteEpisodeSubtitle(episodeId) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "tvShows", "deleteSubtitle", episodeId],
    meta: { silent: true },
    mutationFn: (subtitleId) =>
      episodeSubtitleService.deleteSubtitle(episodeId, subtitleId),
    onSuccess: (_d, subtitleId) => {
      qc.setQueryData(keys.subtitles(episodeId), (old) =>
        Array.isArray(old) ? old.filter((s) => s.id !== subtitleId) : old,
      );
    },
  });
}

/** variables: subtitleId — optimistic, lỗi thì lấy lại từ server */
export function useSetDefaultEpisodeSubtitle(episodeId) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "tvShows", "setDefaultSubtitle", episodeId],
    meta: { silent: true },
    mutationFn: (subtitleId) =>
      episodeSubtitleService.setDefault(episodeId, subtitleId),
    onMutate: async (subtitleId) => {
      await qc.cancelQueries({ queryKey: keys.subtitles(episodeId) });
      qc.setQueryData(keys.subtitles(episodeId), (old) =>
        Array.isArray(old)
          ? old.map((s) => ({ ...s, isDefault: s.id === subtitleId }))
          : old,
      );
    },
    onError: () =>
      qc.invalidateQueries({ queryKey: keys.subtitles(episodeId) }),
  });
}

// ── Thêm subtitle (upload / dịch AI / tạo từ text) ───────────────────────────
// Cả ba đều tạo bản ghi mới (AI thì ở trạng thái Processing) → invalidate danh sách;
// refetchInterval của useEpisodeSubtitles tự bật polling khi có dòng đang xử lý.
const invalidateSubtitles = (qc, episodeId) =>
  qc.invalidateQueries({ queryKey: keys.subtitles(episodeId) });

/** variables: { file, languageCode, languageName?, isDefault? } */
export function useUploadEpisodeSubtitle(episodeId) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "tvShows", "uploadSubtitle", episodeId],
    meta: { silent: true },
    mutationFn: ({ file, languageCode, languageName, isDefault = false }) =>
      episodeSubtitleService.uploadSubtitle(
        episodeId,
        file,
        languageCode,
        languageName || undefined,
        isDefault,
      ),
    onSuccess: () => invalidateSubtitles(qc, episodeId),
  });
}

/** variables: { sourceId, targetCode, targetName? } → trả về subtitle mới (Processing) */
export function useTranslateEpisodeSubtitle(episodeId) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "tvShows", "translateSubtitle", episodeId],
    meta: { silent: true },
    mutationFn: ({ sourceId, targetCode, targetName }) =>
      episodeSubtitleService.translateSubtitle(
        episodeId,
        sourceId,
        targetCode,
        targetName || undefined,
      ),
    onSuccess: () => invalidateSubtitles(qc, episodeId),
  });
}

/** variables: { content, sourceCode, targetCode, targetName? } → trả về subtitle mới (Processing) */
export function useAiGenerateEpisodeSubtitle(episodeId) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "tvShows", "aiGenerateSubtitle", episodeId],
    meta: { silent: true },
    mutationFn: ({ content, sourceCode, targetCode, targetName }) =>
      episodeSubtitleService.aiGenerateSubtitle(
        episodeId,
        content,
        sourceCode,
        targetCode,
        targetName || undefined,
      ),
    onSuccess: () => invalidateSubtitles(qc, episodeId),
  });
}
