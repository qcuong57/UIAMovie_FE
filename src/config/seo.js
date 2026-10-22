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