// src/components/home/sections/shared/layoutUtils.js
// Hàm nhỏ dùng chung cho mọi layout của trang chủ.
import { C } from '../../../../context/homeTokens';

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// Màu nhấn của section: admin chọn (config.accent) hoặc màu mặc định của site
export const accentOf = (section) => section.config?.accent || C.accent;

// Glow chỉ dựng được khi màu là hex 6 ký tự (thêm alpha); màu khác thì bỏ glow thay vì vỡ CSS
export const withAlpha = (color, alpha) => (/^#[0-9a-f]{6}$/i.test(color) ? `${color}${alpha}` : null);

// key React ổn định cho một phim / TV show (id phim và id TV show có thể trùng nhau)
export const keyOf = (item) => `${item.isTvShow ? 'tv' : 'mv'}-${item.id}`;

// Ảnh ngang (backdrop) ưu tiên, không có thì lấy poster
export const imgOf = (item) => item.backdropUrl || item.posterUrl;

// "2024 · Hành động · Phiêu lưu"
export const metaOf = (item, genres = 1) =>
  [item.year, ...(item.genres ?? []).slice(0, genres)].filter(Boolean).join(' · ');

// Cắt chữ sau n dòng
export const clampLines = (n) => ({
  display: '-webkit-box', WebkitLineClamp: n, WebkitBoxOrient: 'vertical', overflow: 'hidden',
});
