// api/og.mjs
// Trả HTML có sẵn thẻ meta riêng của từng phim cho các bot KHÔNG chạy JavaScript
// (Facebook/Messenger, Zalo, Telegram, Twitter, các AI crawler...).
// Người dùng thường vẫn nhận app React bình thường: chỉ bot mới bị rewrite về đây (xem vercel.json).

const SITE_URL = (process.env.SITE_URL || "https://uiamovie.vercel.app").replace(/\/+$/, "");
const API_BASE = (
  [process.env.API_BASE_URL, process.env.VITE_API_URL].find((v) => /^https?:\/\//i.test(v || ""))
)
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const SITE_NAME = "UIAMovie";
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;
const DEFAULT_TITLE = "UIA Movie (UIAMovie) - Xem Phim Online HD, 4K Vietsub & Trợ Lý AI";
const DEFAULT_DESC =
  "UIA Movie (UIAMovie) là nền tảng xem phim trực tuyến tiếng Việt: phim điện ảnh, series, K-Drama, Anime chất lượng HD/4K, có phụ đề và trợ lý AI gợi ý phim theo tâm trạng.";

const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const clip = (t, max = 200) => {
  const s = String(t || "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
};

// Ảnh TMDB "original" rất nặng → dùng bản w1280 cho khung xem trước.
const lightImage = (url) =>
  typeof url === "string" ? url.replace("/t/p/original/", "/t/p/w1280/") : url;

const genresOf = (arr) =>
  (Array.isArray(arr) ? arr : []).map((g) => (typeof g === "string" ? g : g?.name)).filter(Boolean);

async function loadItem(type, id) {
  const resource = type === "tvshow" ? "tvshows" : "movies";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000); // backend "ngủ" → bỏ qua, dùng meta mặc định
  try {
    const res = await fetch(`${API_BASE}/api/${resource}/${id}`, {
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function render({ type, id, item }) {
  const path = `/${type}/${id}/info`;
  const url = SITE_URL + path;

  const rawTitle = item?.title ?? item?.name;
  const date = item?.releaseDate ?? item?.firstAirDate;
  const year = date ? new Date(date).getFullYear() : null;
  const label = type === "tvshow" ? "phim bộ" : "phim";

  const title = rawTitle
    ? `Xem ${label} ${rawTitle}${year ? ` (${year})` : ""} Vietsub HD - ${SITE_NAME}`
    : DEFAULT_TITLE;
  const summary = clip(item?.description ?? item?.overview);
  const description =
    summary ||
    (rawTitle ? `Xem ${label} ${rawTitle} online chất lượng HD/4K, có phụ đề tại ${SITE_NAME}.` : DEFAULT_DESC);
  const image = lightImage(item?.backdropUrl) || item?.posterUrl || DEFAULT_IMAGE;
  const poster = item?.posterUrl || image;
  const genres = genresOf(item?.genres);

  const schema = rawTitle && {
    "@context": "https://schema.org",
    "@type": type === "tvshow" ? "TVSeries" : "Movie",
    "@id": `${url}#${type}`,
    url,
    name: rawTitle,
    image: poster,
    inLanguage: "vi-VN",
    ...(summary && { description: summary }),
    ...(date && { [type === "tvshow" ? "startDate" : "datePublished"]: String(date).slice(0, 10) }),
    ...(genres.length && { genre: genres }),
    ...(type === "movie" && Number(item?.duration) > 0 && { duration: `PT${Math.round(Number(item.duration))}M` }),
  };

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="${type === "tvshow" ? "video.tv_show" : "video.movie"}">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:locale" content="vi_VN">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:alt" content="${esc(rawTitle || SITE_NAME)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">${
    schema ? `\n<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>` : ""
  }
</head>
<body>
<main>
<h1>${esc(rawTitle || DEFAULT_TITLE)}</h1>
${year ? `<p>Năm: ${year}</p>` : ""}${genres.length ? `<p>Thể loại: ${esc(genres.join(", "))}</p>` : ""}
<p>${esc(description)}</p>
${poster ? `<img src="${esc(poster)}" alt="Poster ${esc(label)} ${esc(rawTitle || SITE_NAME)}">` : ""}
<p><a href="${SITE_URL}/">${SITE_NAME} - Trang chủ</a></p>
</main>
</body>
</html>`;
}

export default async function handler(req, res) {
  const type = req.query?.type === "tvshow" ? "tvshow" : "movie";
  const id = String(req.query?.id || "");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Không cache ở CDN: cùng URL còn phải trả app React cho người dùng thường.
  res.setHeader("Cache-Control", "no-store");

  if (!ID_RE.test(id)) {
    res.status(404).send(render({ type, id: "", item: null }).replace(/\/movie\/\/info|\/tvshow\/\/info/g, ""));
    return;
  }

  const item = await loadItem(type, id);
  res.status(200).send(render({ type, id, item }));
}
