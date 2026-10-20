// src/components/common/SeoMeta.jsx
import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import {
  SITE_NAME,
  SITE_TITLE,
  SITE_DESCRIPTION,
  SITE_DEFAULT_IMAGE,
  absoluteUrl,
} from "../../config/seo";

export default function SeoMeta({
  title = SITE_TITLE,
  description = SITE_DESCRIPTION,
  image = SITE_DEFAULT_IMAGE,
  url, // mặc định = canonical của đúng trang hiện tại
  type = "website", // "website" | "video.movie" | "video.tv_show" | "article"
  siteName = SITE_NAME,
  keywords,
  noindex = false, // true cho trang riêng tư: login, profile, admin...
  schemaData = null, // object hoặc mảng object JSON-LD
}) {
  const { pathname } = useLocation();

  // Canonical: bỏ query/hash, giữ đúng path hiện tại (không còn trỏ về trang chủ)
  const canonical = absoluteUrl(url || pathname);
  const ogImage = absoluteUrl(image || SITE_DEFAULT_IMAGE);
  const robots = noindex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  const schemas = schemaData
    ? Array.isArray(schemaData)
      ? schemaData
      : [schemaData]
    : [];

  return (
    <Helmet>
      {/* ── Meta cơ bản ── */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />

      {/* ── OpenGraph (Facebook, Zalo, Messenger) ── */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="vi_VN" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:url" content={canonical} />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* ── JSON-LD ── */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}