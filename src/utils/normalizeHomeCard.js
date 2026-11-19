// src/utils/normalizeHomeCard.js
// Chuyển HomeContentCardDTO (BE) → shape mà MovieRow / TopRankedRow / MovieCard đang dùng
// (id, title, posterUrl, backdropUrl, rating, year, genres, isTvShow, trailerVideoUrl...).
// Nếu normalizeMedia.js của bạn có field khác tên, chỉ cần sửa ở đây.

// Chấp nhận cả mã 11 ký tự lẫn link YouTube (watch?v=, youtu.be/, /embed/, /shorts/) → luôn trả về MÃ video,
// vì TrailerPlayer ghép thẳng vào /embed/<mã>: truyền nguyên link thì iframe hỏng và trailer không phát.
const YT_ID = /^[\w-]{11}$/;
function toYoutubeKey(value) {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim();
  if (YT_ID.test(v)) return v;
  const m = v.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/))([\w-]{11})/);
  return m ? m[1] : null;
}

// Trailer có thể nằm ở trường riêng (trailerKey / trailerVideoUrl) hoặc trong mảng videos như DTO chi tiết phim
// (videoType 'trailer' = link YouTube, 'trailer_upload' = file đã upload) → lấy cái nào có.
function pickTrailer(card) {
  const videos = Array.isArray(card.videos) ? card.videos : [];
  const yt = videos.find((v) => v?.videoType === 'trailer')?.videoUrl;
  const up = videos.find((v) => v?.videoType === 'trailer_upload')?.videoUrl;
  return {
    trailerKey: toYoutubeKey(card.trailerKey) ?? toYoutubeKey(yt),
    trailerVideoUrl: card.trailerVideoUrl || up || null,
  };
}

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
    ...pickTrailer(card),
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