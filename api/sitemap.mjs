// api/sitemap.mjs
// Sitemap động cho UIAMovie — chạy như Vercel Serverless Function, được rewrite từ /sitemap.xml.
// Lấy toàn bộ phim + phim bộ từ API backend (endpoint công khai GET /api/movies, /api/tvshows).
//
// Biến môi trường (Vercel → Settings → Environment Variables):
//   API_BASE_URL   Gốc API backend, ví dụ https://xxx.onrender.com  (có hoặc không có "/api" đều được)
//   SITE_URL       (tuỳ chọn) mặc định https://uiamovie.vercel.app

const SITE_URL = (
  process.env.SITE_URL || "https://uiamovie.vercel.app"
).replace(/\/+$/, "");
const API_BASE = (process.env.API_BASE_URL || process.env.VITE_API_URL || "")
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const PAGE_SIZE = 200;
const MAX_PAGES = 100; // chặn vòng lặp vô hạn
const MAX_URLS = 49000; // giới hạn của 1 sitemap là 50.000 URL

const STATIC_PATHS = [
  "/",
  "/browse",
  "/coming-soon",
  "/announcements",
  "/about-us",
  "/premium",
];

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

async function fetchAll(resource) {
  const items = [];
  const seen = new Set();
  let total = Infinity;

  for (let page = 1; page <= MAX_PAGES && items.length < total; page++) {
    const res = await fetch(
      `${API_BASE}/api/${resource}?page=${page}&pageSize=${PAGE_SIZE}`,
      {
        headers: { Accept: "application/json" },
      },
    );
    if (!res.ok)
      throw new Error(`${resource} page ${page}: HTTP ${res.status}`);

    const json = await res.json();
    const data = json?.data ?? json;
    const batch = Array.isArray(data?.items) ? data.items : [];
    if (typeof data?.totalCount === "number") total = data.totalCount;
    if (batch.length === 0) break;

    let added = 0;
    for (const it of batch) {
      if (it?.id && !seen.has(it.id)) {
        seen.add(it.id);
        items.push(it);
        added++;
      }
    }
    if (added === 0) break; // API trả lại trang cũ → dừng
  }
  return items;
}

function urlNode(path, posterUrl) {
  const image =
    posterUrl && /^https?:\/\//i.test(posterUrl)
      ? `\n    <image:image>\n      <image:loc>${esc(posterUrl)}</image:loc>\n    </image:image>`
      : "";
  return `  <url>\n    <loc>${esc(SITE_URL + path)}</loc>${image}\n  </url>`;
}

export default async function handler(req, res) {
  const nodes = STATIC_PATHS.map((p) => urlNode(p));

  if (API_BASE) {
    try {
      const [movies, shows] = await Promise.all([
        fetchAll("movies"),
        fetchAll("tvshows"),
      ]);
      for (const m of movies)
        nodes.push(urlNode(`/movie/${m.id}/info`, m.posterUrl));
      for (const s of shows)
        nodes.push(urlNode(`/tvshow/${s.id}/info`, s.posterUrl));
    } catch (err) {
      // API lỗi → vẫn trả sitemap các trang tĩnh (hợp lệ), không cache lâu
      console.error("[sitemap] fetch failed:", err);
      res.setHeader("Cache-Control", "s-maxage=300");
    }
  } else {
    console.error("[sitemap] Thiếu biến môi trường API_BASE_URL");
    res.setHeader("Cache-Control", "s-maxage=300");
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
    `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    nodes.slice(0, MAX_URLS).join("\n") +
    `\n</urlset>\n`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  if (!res.getHeader("Cache-Control")) {
    res.setHeader(
      "Cache-Control",
      "s-maxage=3600, stale-while-revalidate=86400",
    );
  }
  res.status(200).send(xml);
}
