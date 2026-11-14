// src/hooks/useAdminUploads.js
// Thành phần dùng chung của form admin (phim / TV show): danh sách thể loại để chọn và upload ảnh.
// `service` là movieService hoặc tvShowService (cùng chữ ký getGenres / uploadImage).

import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys, STALE } from "../config/queryKeys";

/** Thể loại cho ô chọn: tải một lần, mở form lần sau có ngay từ cache. Trả về mảng. */
export function useGenreOptions(service) {
  return useQuery({
    queryKey: queryKeys.genres.picker,
    queryFn: async () => {
      const res = await service.getGenres();
      const list = res?.data ?? res ?? [];
      return Array.isArray(list) ? list : [];
    },
    staleTime: STALE.static,
  });
}

/** variables: { file, imageType: 'poster' | 'backdrop' } → URL ảnh đã upload (hoặc undefined nếu server không trả). */
export function useUploadAdminImage(service) {
  return useMutation({
    mutationKey: ["admin", "uploadImage"],
    meta: { silent: true },
    mutationFn: async ({ file, imageType }) => {
      const res = await service.uploadImage(file, imageType);
      return res?.data?.url ?? res?.url;
    },
  });
}