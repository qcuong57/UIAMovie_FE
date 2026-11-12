// src/utils/normalizeDetail.js
// Chuẩn hoá DTO chi tiết phim / TV show cho các trang Info và Detail.
// Trước đây mỗi trang tự viết một khối normalize riêng (và lặp lại giữa Info với Detail).
import { extractYoutubeKey } from "../components/movie/ui/movieConstants";

const EMPTY = [];

const sortByOrder = (list) =>
  [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

// ══════════════════════════════════════════════════════════════
// PHIM
// ══════════════════════════════════════════════════════════════

/** Dùng cho MovieInfoPage → { movie, cast, directors, actors } */
export const normalizeMovieInfo = (raw) => {
  const movie = {
    id: raw.id,
    title: raw.title,
    tagline: raw.tagline || "",
    description: raw.description || raw.overview || "",
    year: raw.releaseDate ? new Date(raw.releaseDate).getFullYear() : raw.year,
    releaseDate: raw.releaseDate,
    runtime: raw.duration || raw.runtime,
    rating: raw.rating || raw.voteAverage,
    voteCount: raw.voteCount,
    popularity: raw.popularity,
    genres: raw.genres || [],
    posterUrl: raw.posterUrl,
    backdropUrl: raw.backdropUrl,
    language: raw.language || raw.originalLanguage,
    budget: raw.budget,
    revenue: raw.revenue,
    tmdbId: raw.tmdbId,
    isPremium: raw.isPremium ?? false,
    trailerKey:
      raw.trailerKey ||
      extractYoutubeKey(
        raw.videos?.find((v) => v.videoType === "trailer")?.videoUrl,
      ),
    trailerVideoUrl:
      raw.trailerVideoUrl ||
      raw.videos?.find((v) => v.videoType === "trailer_upload")?.videoUrl ||
      null,
    trailers: raw.trailers || [],
    reviews: raw.reviews || [],
    images: raw.images || [],
  };

  let directorsFromMovie = EMPTY;
  if (raw.directorDetail) {
    directorsFromMovie = [
      {
        id:
          raw.directorDetail.id ??
          raw.directorDetail.personId ??
          raw.directorDetail.tmdbPersonId ??
          null,
        name: raw.directorDetail.name,
        profileUrl: raw.directorDetail.profileUrl,
        biography: raw.directorDetail.biography,
        birthday: raw.directorDetail.birthday,
        placeOfBirth: raw.directorDetail.placeOfBirth,
      },
    ];
  } else if (raw.director) {
    directorsFromMovie = [{ name: raw.director, profileUrl: null }];
  }

  const cast =
    Array.isArray(raw.cast) && raw.cast.length > 0
      ? sortByOrder(raw.cast).map((c) => ({
          id: c.id ?? c.personId ?? c.tmdbPersonId ?? null,
          name: c.name,
          character: c.character,
          profileUrl: c.profileUrl,
          biography: c.biography,
          birthday: c.birthday,
          placeOfBirth: c.placeOfBirth,
        }))
      : EMPTY;

  const isDirector = (p) => p.job === "Director" || p.department === "Directing";
  const directors = directorsFromMovie.length
    ? directorsFromMovie
    : cast.filter(isDirector);
  const actors = cast.filter((p) => !isDirector(p));

  return { movie, cast, directors, actors };
};

/** Dùng cho MovieDetailPage (trang xem) → { dirs, actors }. `raw` null → rỗng. */
export const normalizeMovieWatch = (raw) => {
  if (!raw) return { dirs: EMPTY, actors: EMPTY };

  let dirs = EMPTY;
  if (raw.directorDetail) {
    dirs = [
      {
        id: raw.directorDetail.id ?? raw.directorDetail.personId ?? null,
        name: raw.directorDetail.name,
        profileUrl: raw.directorDetail.profileUrl,
        biography: raw.directorDetail.biography,
        birthday: raw.directorDetail.birthday,
        placeOfBirth: raw.directorDetail.placeOfBirth,
      },
    ];
  } else if (raw.director) {
    dirs = [{ id: raw.directorId || null, name: raw.director, profileUrl: null }];
  }

  const actors =
    Array.isArray(raw.cast) && raw.cast.length > 0
      ? sortByOrder(raw.cast).map((c) => ({
          id: c.id ?? c.personId ?? c.tmdbPersonId ?? null,
          tmdbPersonId: c.tmdbPersonId ?? c.personId ?? null,
          name: c.name,
          character: c.character,
          profileUrl: c.profileUrl,
          biography: c.biography ?? c.bio ?? null,
          birthday: c.birthday ?? c.dob ?? null,
          deathday: c.deathday ?? null,
          placeOfBirth: c.placeOfBirth ?? null,
          knownFor: c.knownForDepartment ?? c.knownFor ?? null,
          popularity: c.popularity ?? null,
          profileImages: c.profileImages ?? [],
          movies: c.movies ?? c.filmography ?? [],
        }))
      : EMPTY;

  return { dirs, actors };
};

// ══════════════════════════════════════════════════════════════
// TV SHOW
// ══════════════════════════════════════════════════════════════

// BE không luôn trả mảng seasons → dựng từ numberOfSeasons
const buildSeasons = (raw, withPoster) =>
  raw.seasons?.length
    ? raw.seasons
    : Array.from({ length: raw.numberOfSeasons ?? 0 }, (_, i) => ({
        seasonNumber: i + 1,
        name: `Mùa ${i + 1}`,
        episodeCount: null,
        airDate: null,
        ...(withPoster ? { posterUrl: null } : {}),
      }));

/** Dùng cho TvShowInfoPage → { show, cast, creators } */
export const normalizeTvShowInfo = (raw) => {
  const show = {
    id: raw.id,
    title: raw.title ?? raw.name,
    tagline: raw.tagline || "",
    description: raw.description ?? raw.overview ?? "",
    year: raw.firstAirDate
      ? new Date(raw.firstAirDate).getFullYear()
      : (raw.year ?? null),
    firstAirDate: raw.firstAirDate ?? null,
    lastAirDate: raw.lastAirDate ?? null,
    status: raw.status ?? "",
    originCountry: Array.isArray(raw.originCountry)
      ? raw.originCountry.join(", ")
      : (raw.originCountry ?? ""),
    language: raw.language ?? raw.originalLanguage ?? "",
    rating: raw.rating ?? raw.imdbRating ?? 0,
    voteCount: raw.voteCount ?? 0,
    popularity: raw.popularity ?? null,
    numberOfSeasons: raw.numberOfSeasons ?? raw.seasons?.length ?? 0,
    numberOfEpisodes: raw.numberOfEpisodes ?? null,
    genres: raw.genres ?? [],
    posterUrl: raw.posterUrl ?? raw.poster ?? null,
    backdropUrl: raw.backdropUrl ?? raw.backdrop ?? null,
    trailerKey:
      raw.trailerKey ??
      extractYoutubeKey(
        raw.videos?.find((v) => v.videoType === "trailer")?.videoUrl,
      ),
    trailerVideoUrl:
      raw.trailerVideoUrl ||
      raw.videos?.find((v) => v.videoType === "trailer_upload")?.videoUrl ||
      null,
    trailers: raw.trailers ?? [],
    reviews: raw.reviews ?? [],
    images: raw.images ?? [],
    seasons: buildSeasons(raw, true),
    networks: raw.networks ?? [],
  };

  let creatorsFromShow = EMPTY;
  if (raw.createdBy?.length) {
    creatorsFromShow = raw.createdBy.map((p) => ({
      id: p.id ?? p.personId ?? null,
      name: p.name,
      profileUrl: p.profileUrl ?? null,
      biography: p.biography ?? null,
      birthday: p.birthday ?? null,
      placeOfBirth: p.placeOfBirth ?? null,
    }));
  } else if (raw.directorDetail) {
    creatorsFromShow = [
      {
        id: raw.directorDetail.id ?? null,
        name: raw.directorDetail.name,
        profileUrl: raw.directorDetail.profileUrl,
        biography: raw.directorDetail.biography,
        birthday: raw.directorDetail.birthday,
        placeOfBirth: raw.directorDetail.placeOfBirth,
      },
    ];
  } else if (raw.director) {
    creatorsFromShow = [{ name: raw.director, profileUrl: null }];
  }

  const rawCast =
    Array.isArray(raw.cast) && raw.cast.length > 0
      ? raw.cast
      : (raw.seasons ?? []).flatMap((s) => (Array.isArray(s.cast) ? s.cast : []));

  let cast = EMPTY;
  if (rawCast.length > 0) {
    const seen = new Set();
    const deduped = rawCast.filter((c) => {
      const key = c.id ?? c.personId ?? c.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    cast = sortByOrder(deduped).map((c) => ({
      id: c.id ?? c.personId ?? c.tmdbPersonId ?? null,
      name: c.name,
      character: c.character ?? c.roles?.[0]?.character ?? "",
      profileUrl: c.profileUrl ?? null,
      biography: c.biography,
      birthday: c.birthday,
      placeOfBirth: c.placeOfBirth,
    }));
  }

  const creators = creatorsFromShow.length
    ? creatorsFromShow
    : cast.filter((p) => p.job === "Director" || p.department === "Directing");

  return { show, cast, creators };
};

/** Dùng cho TvShowDetailPage (trang xem) → { tvShow, actors }. `raw` null → { tvShow: null }. */
export const normalizeTvShowWatch = (raw) => {
  if (!raw) return { tvShow: null, actors: EMPTY };

  const tvShow = { ...raw, seasons: buildSeasons(raw, false) };

  const actors =
    Array.isArray(raw.cast) && raw.cast.length > 0
      ? sortByOrder(raw.cast).map((c) => ({
          id: c.id ?? c.personId ?? null,
          tmdbPersonId: c.tmdbPersonId ?? c.personId ?? null,
          name: c.name,
          character: c.character,
          profileUrl: c.profileUrl,
          biography: c.biography ?? null,
          birthday: c.birthday ?? null,
          deathday: c.deathday ?? null,
          placeOfBirth: c.placeOfBirth ?? null,
          knownFor: c.knownForDepartment ?? null,
          popularity: c.popularity ?? null,
        }))
      : EMPTY;

  return { tvShow, actors };
};