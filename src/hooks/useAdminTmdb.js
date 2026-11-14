// src/hooks/useAdminTmdb.js
// Admin → Import từ TMDB. Tìm kiếm và preview chỉ đọc → cache theo từ khoá / id;
// import là mutation, xong thì làm mới bảng phim / TV show, diễn viên và catalogue người dùng.

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axiosInstance from "../config/axios";
import { queryKeys, STALE, CATALOG_ROOTS } from "../config/queryKeys";

const keys = queryKeys.admin.tmdb;
const base = (kind) => (kind === "movie" ? "/movies/tmdb" : "/tvshows/tmdb");
const unwrap = (res) => {
  const envelope = res?.data ?? res;
  return envelope?.data ?? envelope;
};

/** kind: 'movie' | 'tv'. Trả về { results, totalPages, totalResults }. */
export function useTmdbSearch(kind, query, page = 1) {
  const q = query.trim();
  return useQuery({
    queryKey: keys.search(kind, q, page),
    queryFn: async ({ signal }) => {
      const res = await axiosInstance.get(
        `${base(kind)}/search?query=${encodeURIComponent(q)}&page=${page}`,
        { signal },
      );
      const data = res?.data ?? res;
      return {
        results: data?.results ?? [],
        totalPages: data?.totalPages ?? 0,
        totalResults: data?.totalResults ?? 0,
      };
    },
    enabled: q.length > 0,
    staleTime: STALE.medium,
    placeholderData: keepPreviousData,
  });
}

/** Dữ liệu TMDB trước khi import. */
export function useTmdbPreview(kind, tmdbId) {
  return useQuery({
    queryKey: keys.preview(kind, tmdbId),
    queryFn: async () => unwrap(await axiosInstance.get(`${base(kind)}/${tmdbId}`)),
    enabled: !!tmdbId,
    staleTime: STALE.static,
  });
}

/**
 * variables: tmdbId → kết quả import { castCount, imageCount, seasonCount, ... }.
 * 409 (đã import) là lỗi bình thường: trang tự xử lý, không làm mới gì.
 */
export function useImportTmdb(kind) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["admin", "tmdb", "import", kind],
    meta: { silent: true },
    mutationFn: async (tmdbId) => {
      const res = await axiosInstance.post(`${base(kind)}/${tmdbId}/import`);
      const body = res?.data ?? res;
      return body?.data ?? body ?? null;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey:
          kind === "movie"
            ? queryKeys.admin.movies.all
            : queryKeys.admin.tvShows.lists(),
      });
      qc.invalidateQueries({ queryKey: queryKeys.admin.persons.lists() }); // cast / đạo diễn mới
      qc.invalidateQueries({ queryKey: queryKeys.genres.all });
      qc.invalidateQueries({
        predicate: (q) => CATALOG_ROOTS.has(q.queryKey[0]),
      });
    },
  });
}