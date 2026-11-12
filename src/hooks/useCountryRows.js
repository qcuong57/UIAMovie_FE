// src/hooks/useCountryRows.js
// Hàng "Phim & Series theo quốc gia" — mỗi quốc gia một query riêng (cache + lỗi riêng).
// `enabled` dùng để chỉ tải khi hàng sắp lọt vào màn hình (tránh bắn 8 request ngay lúc vào trang).
import { useQuery } from "@tanstack/react-query";

import movieService from "../services/movieService";
import tvShowService from "../services/tvShowService";
import { queryKeys, STALE } from "../config/queryKeys";
import { normalizeMovie, normalizeTvShow } from "../utils/normalizeMedia";
import { unwrapList } from "../utils/queryHelpers";

export const useCountryRow = (code, enabled = true) =>
  useQuery({
    queryKey: queryKeys.home.country(code),
    enabled,
    staleTime: STALE.medium,
    queryFn: async () => {
      const [m, t] = await Promise.allSettled([
        movieService.getMoviesByCountry(code),
        tvShowService.getTvShows({ originCountry: code, pageSize: 20, sortBy: "rating" }),
      ]);
      // Một nguồn lỗi vẫn hiển thị nguồn còn lại; cả hai lỗi mới coi là lỗi
      if (m.status === "rejected" && t.status === "rejected") throw m.reason;

      const movies =
        m.status === "fulfilled"
          ? unwrapList(m.value, ["movies"]).map(normalizeMovie)
          : [];
      const tvShows =
        t.status === "fulfilled"
          ? unwrapList(t.value, ["tvShows"]).map(normalizeTvShow)
          : [];

      return [...movies, ...tvShows]
        .sort((a, b) => (b.year || 0) - (a.year || 0))
        .slice(0, 20);
    },
  });