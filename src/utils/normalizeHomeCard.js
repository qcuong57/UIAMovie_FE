// src/utils/normalizeHomeCard.js
// Chuyển HomeContentCardDTO (BE) → shape mà MovieRow / TopRankedRow / MovieCard đang dùng
// (id, title, posterUrl, backdropUrl, rating, year, genres, isTvShow, trailerVideoUrl...).
// Nếu normalizeMedia.js của bạn có field khác tên, chỉ cần sửa ở đây.

export function normalizeHomeCard(card) {
  if (!card) return null;
  const isTvShow = card.contentType === 'tvshow';
  const date = card.releaseDate ? new Date(card.releaseDate) : null;

  return {
    id: card.id,
    title: card.title,
    description: card.description,
    posterUrl: card.posterUrl,
    backdropUrl: card.backdropUrl,
    rating: card.rating ?? 0,
    year: date && !Number.isNaN(date.getTime()) ? date.getFullYear() : null,
    releaseDate: card.releaseDate,
    country: card.originCountry,
    genres: card.genres ?? [],
    isTvShow,
    isPremium: Boolean(card.isPremium),
    isUpcoming: Boolean(card.isUpcoming),
    trailerKey: card.trailerKey ?? null,
    trailerVideoUrl: card.trailerVideoUrl ?? null,
    duration: card.duration ?? null,
    numberOfSeasons: card.numberOfSeasons ?? null,
  };
}

/** Link chi tiết — khớp route đang dùng ở HomePage (/movie/:id, /tvshow/:id). */
export const contentPath = (item) => `/${item.isTvShow ? 'tvshow' : 'movie'}/${item.id}`;

/** HomeSectionDTO → section cho FE: items đã normalize, config luôn là object. */
export function normalizeHomeSection(section) {
  return {
    ...section,
    config: section.config ?? {},
    items: (section.items ?? [])
      .map((i) => normalizeHomeCard(i.content))
      .filter(Boolean),
  };
}