// src/hooks/useSubtitleContent.js
// Nội dung file phụ đề (VTT) cho trình chỉnh sửa — dùng chung cho phim và tập.
// `service` = movieSubtitleService | episodeSubtitleService, `mediaId` = movieId | episodeId.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../config/queryKeys";

/**
 * Chỉ tải khi mở trình chỉnh sửa; KHÔNG tự tải lại khi quay lại tab (đang gõ dở mà dữ liệu đổi
 * dưới chân là mất công sửa). Trả về chuỗi VTT.
 */
export function useSubtitleContent(service, mediaId, subtitleId) {
  return useQuery({
    queryKey: queryKeys.admin.subtitleContent(mediaId, subtitleId),
    queryFn: async () => {
      const dto = await service.getSubtitleContent(mediaId, subtitleId);
      return dto?.content ?? "";
    },
    enabled: !!mediaId && !!subtitleId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/** variables: { subtitle, vtt } — ghi đè file phụ đề cùng ngôn ngữ; xong thì cập nhật cache nội dung + danh sách phụ đề. */
export function useSaveSubtitleContent(service, mediaId) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "saveSubtitleContent", mediaId],
    meta: { silent: true },
    mutationFn: ({ subtitle, vtt }) => {
      const blob = new Blob([vtt], { type: "text/vtt" });
      const file = new File([blob], `${subtitle.languageCode}.vtt`, { type: "text/vtt" });
      return service.uploadSubtitle(
        mediaId,
        file,
        subtitle.languageCode,
        subtitle.languageName || undefined,
        subtitle.isDefault,
      );
    },
    onSuccess: (_d, { subtitle, vtt }) => {
      qc.setQueryData(queryKeys.admin.subtitleContent(mediaId, subtitle.id), vtt);
      // Không biết đây là phim hay tập → làm mới cả hai danh sách (chỉ query đang hiện mới tải lại)
      qc.invalidateQueries({ queryKey: queryKeys.admin.movies.subtitles(mediaId) });
      qc.invalidateQueries({ queryKey: queryKeys.admin.tvShows.subtitles(mediaId) });
    },
  });
}