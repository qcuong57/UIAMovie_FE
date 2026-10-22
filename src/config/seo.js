// src/config/seo.js
// Nguồn duy nhất cho domain + thông tin thương hiệu dùng trong SEO.
// Khi gắn domain riêng, chỉ cần đặt VITE_SITE_URL trong .env (không cần sửa code).

export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://uiamovie.vercel.app"
).replace(/\/+$/, "");

export const SITE_NAME = "UIAMovie";
export const SITE_ALT_NAMES = ["UIA Movie", "UIA Movie Vietnam"];
export const SITE_LOGO = `${SITE_URL}/logo.png`;
export const SITE_DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

export const SITE_TITLE =
  "UIA Movie (UIAMovie) - Xem Phim Online HD, 4K Vietsub & Trợ Lý AI";
export const SITE_DESCRIPTION =
  "UIA Movie (UIAMovie) là nền tảng xem phim trực tuyến tiếng Việt: phim điện ảnh, series, K-Drama, Anime chất lượng HD/4K, có phụ đề, tiếp tục xem trên mọi thiết bị và trợ lý AI gợi ý phim theo tâm trạng.";

// Biến đường dẫn/ảnh tương đối thành URL tuyệt đối (bắt buộc cho og:image, canonical).
export const absoluteUrl = (pathOrUrl = "/") => {
  if (!pathOrUrl) return SITE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
};

// Schema Organization dùng chung (để Google/AI hiểu "UIAMovie" là một thương hiệu)
export const organizationSchema = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: SITE_ALT_NAMES,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: SITE_LOGO,
    width: 512,
    height: 512,
  },
  description: SITE_DESCRIPTION,
};

// ─────────────────────────────────────────────────────────────────────────────
// SEO cho trang chi tiết phim / phim bộ
// ─────────────────────────────────────────────────────────────────────────────
const toNames = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((g) => (typeof g === "string" ? g : g?.name))
    .filter(Boolean);

const clip = (text, max = 160) => {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
};

// Chỉ xuất aggregateRating khi có điểm VÀ số lượt vote thật (tránh dữ liệu giả)
const ratingNode = (item) => {
  const value = Number(item?.rating);
  const count = Number(item?.voteCount);
  if (!(value > 0) || !(count > 0)) return {};
  return {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: value.toFixed(1),
      bestRating: "10",
      worstRating: "0",
      ratingCount: String(count),
    },
  };
};

const breadcrumb = (items) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: it.url,
  })),
});

export function buildMovieSeo(movie, id) {
  if (!movie?.title) return {};
  const path = `/movie/${id}`;
  const url = absoluteUrl(path);
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : movie.year;
  const genres = toNames(movie.genres);
  const summary = clip(movie.description ?? movie.overview ?? movie.plot);
  const image = absoluteUrl(movie.posterUrl || movie.backdropUrl || SITE_DEFAULT_IMAGE);
  const cast = Array.isArray(movie.cast) ? movie.cast : [];

  return {
    title: `Xem phim ${movie.title}${year ? ` (${year})` : ""} Vietsub HD - ${SITE_NAME}`,
    description:
      summary ||
      `Xem phim ${movie.title}${year ? ` (${year})` : ""} online chất lượng HD/4K, có phụ đề tại ${SITE_NAME}.`,
    image,
    url: path,
    type: "video.movie",
    schemaData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Movie",
          "@id": `${url}#movie`,
          url,
          name: movie.title,
          image,
          inLanguage: "vi-VN",
          ...(summary && { description: summary }),
          ...(movie.releaseDate && { datePublished: String(movie.releaseDate).slice(0, 10) }),
          ...(genres.length && { genre: genres }),
          ...(Number(movie.duration) > 0 && { duration: `PT${Math.round(Number(movie.duration))}M` }),
          ...(movie.director && { director: { "@type": "Person", name: movie.director } }),
          ...(cast.length && {
            actor: cast.slice(0, 8).filter((c) => c?.name).map((c) => ({ "@type": "Person", name: c.name })),
          }),
          ...ratingNode(movie),
        },
        breadcrumb([
          { name: "Trang chủ", url: SITE_URL },
          { name: movie.title, url },
        ]),
      ],
    },
  };
}

export function buildTvShowSeo(rawTvShow, id) {
  const tvShow = rawTvShow ? { ...rawTvShow, title: rawTvShow.title ?? rawTvShow.name } : null;
  if (!tvShow?.title) return {};
  const path = `/tvshow/${id}`;
  const url = absoluteUrl(path);
  const year = tvShow.firstAirDate ? new Date(tvShow.firstAirDate).getFullYear() : tvShow.year;
  const genres = toNames(tvShow.genres);
  const summary = clip(tvShow.description ?? tvShow.overview ?? tvShow.plot);
  const image = absoluteUrl(tvShow.posterUrl || tvShow.backdropUrl || SITE_DEFAULT_IMAGE);
  const cast = Array.isArray(tvShow.cast) ? tvShow.cast : [];

  return {
    title: `Xem phim bộ ${tvShow.title}${year ? ` (${year})` : ""} Vietsub HD - ${SITE_NAME}`,
    description:
      summary ||
      `Xem phim bộ ${tvShow.title}${year ? ` (${year})` : ""} full tập online chất lượng HD/4K, có phụ đề tại ${SITE_NAME}.`,
    image,
    url: path,
    type: "video.tv_show",
    schemaData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "TVSeries",
          "@id": `${url}#tvseries`,
          url,
          name: tvShow.title,
          image,
          inLanguage: "vi-VN",
          ...(summary && { description: summary }),
          ...(tvShow.firstAirDate && { startDate: String(tvShow.firstAirDate).slice(0, 10) }),
          ...(genres.length && { genre: genres }),
          ...(tvShow.numberOfSeasons && { numberOfSeasons: tvShow.numberOfSeasons }),
          ...(tvShow.numberOfEpisodes && { numberOfEpisodes: tvShow.numberOfEpisodes }),
          ...(cast.length && {
            actor: cast.slice(0, 8).filter((c) => c?.name).map((c) => ({ "@type": "Person", name: c.name })),
          }),
          ...ratingNode(tvShow),
        },
        breadcrumb([
          { name: "Trang chủ", url: SITE_URL },
          { name: tvShow.title, url },
        ]),
      ],
    },
  };
}