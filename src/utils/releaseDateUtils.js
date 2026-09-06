// src/utils/releaseDateUtils.js
// ─────────────────────────────────────────────────────────────────
// Logic thuần cho "Phim sắp chiếu" — không đụng UI.
// Nguồn ngày phát hành: movie.releaseDate (movie) | movie.firstAirDate (tv).
// Ưu tiên field IsUpcoming từ backend nếu có (đã tính theo UTC ở server),
// fallback tính lại ở FE để an toàn khi field thiếu / stale cache.
// ─────────────────────────────────────────────────────────────────

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Lấy field ngày phát hành, hỗ trợ cả movie lẫn tvShow */
export const getReleaseDate = (item) => {
  const raw = item?.releaseDate ?? item?.firstAirDate ?? null;
  return raw ? new Date(raw) : null;
};

/** So sánh theo NGÀY (bỏ giờ/phút/giây) để tránh lệch múi giờ gây sai "hôm nay" */
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/**
 * Trạng thái phát hành:
 *  - "upcoming"  : releaseDate > today
 *  - "today"     : releaseDate == today
 *  - "released"  : releaseDate < today (hoặc null → coi như đã phát hành, không hiển thị ở Coming Soon)
 */
export const getReleaseStatus = (item) => {
  // Ưu tiên cờ backend nếu đã có và ngày hôm nay khớp — nhưng vẫn double-check bằng ngày
  // vì IsUpcoming có thể bị cache 30' (xem MovieService.cs GetTrendingMoviesAsync).
  const date = getReleaseDate(item);
  if (!date || isNaN(date.getTime())) return "released";

  const today = startOfDay(new Date());
  const releaseDay = startOfDay(date);
  const diffDays = Math.round((releaseDay - today) / MS_PER_DAY);

  if (diffDays > 0) return "upcoming";
  if (diffDays === 0) return "today";
  return "released";
};

export const isComingSoon = (item) => {
  const status = getReleaseStatus(item);
  return status === "upcoming" || status === "today";
};

/** Số ngày còn lại tới release (0 = hôm nay, âm = đã qua) */
export const getDaysUntilRelease = (item) => {
  const date = getReleaseDate(item);
  if (!date || isNaN(date.getTime())) return null;
  const today = startOfDay(new Date());
  const releaseDay = startOfDay(date);
  return Math.round((releaseDay - today) / MS_PER_DAY);
};

/**
 * Label hiển thị theo khoảng cách tới ngày release — tự nhiên, không kỹ thuật.
 * >7 ngày  → "30 Thg 9, 2026"
 * 2–7 ngày → "Còn 7 ngày"
 * 1 ngày   → "Ngày mai"
 * hôm nay  → "Ra mắt hôm nay"
 */
export const getReleaseLabel = (item) => {
  const days = getDaysUntilRelease(item);
  const date = getReleaseDate(item);
  if (days == null || !date) return "";

  if (days < 0) return formatFullDate(date);
  if (days === 0) return "Ra mắt hôm nay";
  if (days === 1) return "Ngày mai";
  if (days <= 7) return `Còn ${days} ngày`;
  return formatFullDate(date);
};

const formatFullDate = (date) =>
  date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/**
 * Sắp xếp danh sách Coming Soon: gần nhất trước.
 * (today trước upcoming, rồi tăng dần theo ngày)
 */
export const sortComingSoonMovies = (items) =>
  [...items]
    .filter(isComingSoon)
    .sort((a, b) => {
      const da = getDaysUntilRelease(a) ?? Infinity;
      const db = getDaysUntilRelease(b) ?? Infinity;
      return da - db;
    });

/** Đếm ngược realtime dạng object — chỉ dùng cho featured/highlighted movie */
export const getCountdownParts = (item) => {
  const date = getReleaseDate(item);
  if (!date) return null;
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };

  const days = Math.floor(diffMs / MS_PER_DAY);
  const hours = Math.floor((diffMs % MS_PER_DAY) / (60 * 60 * 1000));
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diffMs % (60 * 1000)) / 1000);
  return { days, hours, minutes, seconds, done: false };
};