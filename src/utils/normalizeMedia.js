// src/utils/normalizeMedia.js
// Chuẩn hoá dữ liệu phim / TV show từ API về một dạng chung cho UI.
// ĐÂY LÀ NƠI DUY NHẤT normalize — không viết lại normalizeMovie/normalizeTvShow trong component.

const yearOf = (date, fallback = null) => {
  if (!date) return fallback;
  const y = new Date(date).getFullYear();
  return Number.isFinite(y) ? y : fallback;
};

/** Key ổn định, không đụng id giữa phim và TV show (dùng cho React key / dedupe). */
export const mediaKey = (item) => `${item?.isTvShow ? "tv" : "mv"}-${item?.id}`;

export const normalizeMovie = (m) => ({
  id: m.id,
  title: m.title,
  year: yearOf(m.releaseDate, m.year ?? null),
  rating: m.rating ?? m.imdbRating ?? 0,
  posterUrl: m.posterUrl || m.poster || null,
  backdropUrl: m.backdropUrl || m.backdrop || null,
  genres: m.genres || [],
  description: m.description || "",
  duration: m.duration || null,
  releaseDate: m.releaseDate ?? null,
  originCountry: m.originCountry ?? null,
  isPremium: m.isPremium ?? false,
  trailerVideoUrl: m.trailerVideoUrl || null,
  isTvShow: false,
});

export const normalizeTvShow = (s) => ({
  id: s.id,
  title: s.title ?? s.name,
  year: yearOf(s.firstAirDate, s.year ?? null),
  rating: s.rating ?? s.imdbRating ?? s.voteAverage ?? 0,
  posterUrl: s.posterUrl || s.poster || null,
  backdropUrl: s.backdropUrl || s.backdrop || null,
  genres: s.genres || [],
  description: s.description || s.overview || "",
  releaseDate: s.firstAirDate ?? null, // alias để phim và TV show dùng chung một tên trường
  firstAirDate: s.firstAirDate ?? null,
  originCountry: s.originCountry ?? null,
  isPremium: s.isPremium ?? false,
  trailerVideoUrl: s.trailerVideoUrl || null,
  isTvShow: true,
});

// ── Bản ghi YÊU THÍCH (khác object phim: id là id bản ghi, movieId mới là id phim) ──
export const normalizeFavoriteMovie = (f) => ({
  id: f.id,
  movieId: f.movieId ?? f.id,
  title: f.movieTitle || f.title || "",
  posterUrl: f.posterUrl || null,
  rating: f.rating ? Number(f.rating) : null,
  addedAt: f.addedAt ? new Date(f.addedAt) : null,
  year: f.releaseDate ? new Date(f.releaseDate).getFullYear() : f.year || null,
  genres: f.genres || [],
  duration: f.duration || null,
  isPremium: f.isPremium ?? false,
  isTvShow: false,
});

export const normalizeFavoriteTvShow = (f) => ({
  id: f.id,
  movieId: f.tvShowId ?? f.movieId ?? f.id,
  title: f.tvShowTitle ?? f.title ?? f.name ?? "",
  posterUrl: f.posterUrl || null,
  rating: f.rating ? Number(f.rating) : null,
  addedAt: f.addedAt ? new Date(f.addedAt) : null,
  year: yearOf(f.firstAirDate ?? f.releaseDate, f.year || null),
  genres: f.genres || [],
  duration: null,
  isPremium: f.isPremium ?? false,
  isTvShow: true,
});

export const withMediaMeta = (item, isTvShow) => {
  const date = item.releaseDate ?? item.firstAirDate;
  const y = date ? new Date(date).getFullYear() : null;
  return {
    ...item,
    isTvShow: item.isTvShow ?? isTvShow,
    year: item.year ?? (Number.isFinite(y) ? y : undefined),
  };
};