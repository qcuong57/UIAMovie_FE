// src/hooks/useAdminTmdb.js
// Admin → TMDB: preview chỉ đọc → cache theo id (tìm kiếm / lọc nằm ở useTmdbDiscover).
// Việc IMPORT chạy nền trong src/stores/tmdbImportStore.js (xem useTmdbImports.js) —
// không còn là mutation gắn với component nên đóng panel không làm mất tiến trình.

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../config/axios";
import { queryKeys, STALE } from "../config/queryKeys";

const keys = queryKeys.admin.tmdb;
const base = (kind) => (kind === "movie" ? "/movies/tmdb" : "/tvshows/tmdb");
const unwrap = (res) => {
  const envelope = res?.data ?? res;
  return envelope?.data ?? envelope;
};

/** Dữ liệu TMDB trước khi import. */
export function useTmdbPreview(kind, tmdbId) {
  return useQuery({
    queryKey: keys.preview(kind, tmdbId),
    queryFn: async () => unwrap(await axiosInstance.get(`${base(kind)}/${tmdbId}`)),
    enabled: !!tmdbId,
    staleTime: STALE.static,
  });
}