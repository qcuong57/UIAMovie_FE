// src/components/common/SeoMeta.jsx
import React from "react";
import { Helmet } from "react-helmet-async";

export default function SeoMeta({
  title = "UIAMovie - Nền tảng xem phim trực tuyến đỉnh cao",
  description = "Xem phim bom tấn chiếu rạp, phim bộ K-Drama, Anime và Series bản quyền chất lượng 4K Ultra HD. Tích hợp trợ lý AI gợi ý phim theo cảm xúc.",
  image = "/favicon.ico",
  url = typeof window !== "undefined" ? window.location.origin : "https://uiamovie.vn",
  siteName = "UIAMovie",
  schemaData = null,
}) {
  return (
    <Helmet>
      {/* ── Thẻ Meta cơ bản ── */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* ── OpenGraph (Facebook, Zalo) ── */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={url} />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* ── Google Schema JSON-LD ── */}
      {schemaData && (
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      )}
    </Helmet>
  );
}