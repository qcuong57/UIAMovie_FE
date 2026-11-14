// src/helper/dashboardStats.js
// Toàn bộ phép tính cho Dashboard admin ở dạng hàm THUẦN (không React, không API):
// dễ test, và component chỉ còn việc hiển thị. Hook bọc chúng bằng useMemo.

import {
  buildGenreFreq,
  buildMonthlyReviewTrend,
  buildUserGrowth,
  buildRatingDist,
  buildTopReviewed,
  hasVideoType,
  computeMissingFlags,
} from "./format";
import { PALETTE } from "../context/adminTokens";

const DAY_MS = 24 * 60 * 60 * 1000;
const LIST_LIMIT = 50;
// Điểm đánh giá theo thang 1–10: >= 7 tốt, < 5 tiêu cực, còn lại trung bình.
const POSITIVE_MIN = 7;
const NEGATIVE_BELOW = 5;
// Chỉ tra nhãn tập (S1E3) cho N review mới nhất → giới hạn số lần gọi API theo show.
export const LABEL_SCAN_LIMIT = 100;

// ── Tiện ích chung ────────────────────────────────────────────────────────────
export const nf = (n) => Number(n ?? 0).toLocaleString("vi-VN");

export const pctChange = (cur, prev) =>
  prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0;

const timeOf = (v) => new Date(v ?? 0).getTime();
const colorAt = (i) => PALETTE[i % PALETTE.length];
const sum = (list, pick) => list.reduce((s, x) => s + (pick(x) ?? 0), 0);

const SHOW_STATUS_LABEL = { "Returning Series": "Đang chiếu", Ended: "Đã kết thúc" };
export const showStatusLabel = (status) => SHOW_STATUS_LABEL[status] ?? status;

// ── Nội dung (phim + TV show) ─────────────────────────────────────────────────
export function buildContentStats({ movies, tvShows, genres }) {
  const missingMoviesAll = movies.filter(
    (m) => !m.posterUrl || !hasVideoType(m.videos, "main") || !hasVideoType(m.videos, "trailer"),
  );
  const missingShowsAll = tvShows.filter(
    (s) => !s.posterUrl || !hasVideoType(s.videos, "trailer"),
  );

  // Tần suất thể loại gộp phim + show; nếu chưa có dữ liệu thì lùi về số đếm từ bảng thể loại.
  const freq = { ...buildGenreFreq(movies) };
  Object.entries(buildGenreFreq(tvShows)).forEach(([k, v]) => {
    freq[k] = (freq[k] || 0) + v;
  });
  const source = Object.keys(freq).length
    ? freq
    : Object.fromEntries(genres.map((g) => [g.name ?? String(g), g.movieCount ?? 0]));

  const genreChart = Object.entries(source)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([label, value], i) => ({ label, value, color: colorAt(i) }));

  const statusCount = {};
  tvShows.forEach((s) => {
    const st = s.status ?? "Unknown";
    statusCount[st] = (statusCount[st] || 0) + 1;
  });
  const showStatusChart = Object.entries(statusCount)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({ label: showStatusLabel(label), value, color: colorAt(i) }));

  return {
    missingMovies: missingMoviesAll.slice(0, LIST_LIMIT).map((m) => computeMissingFlags(m, false)),
    missingShows: missingShowsAll.slice(0, LIST_LIMIT).map((s) => computeMissingFlags(s, true)),
    missingMovieCount: missingMoviesAll.length,
    missingShowCount: missingShowsAll.length,
    genreChart,
    donutSlices: genreChart.slice(0, 6),
    showStatusChart,
    moviePremiumCount: movies.filter((m) => m.isPremium).length,
    showPremiumCount: tvShows.filter((s) => s.isPremium).length,
  };
}

// ── Người dùng ────────────────────────────────────────────────────────────────
const lastActiveOf = (u) => u.lastLoginAt ?? u.lastActiveAt;
const joinedOf = (u) => u.createdAt ?? u.joinedAt;

// Số user đăng ký trong tháng (offset 0 = tháng này, 1 = tháng trước) tính đến NGÀY hiện tại của tháng.
// So cùng kỳ → tháng đang diễn ra không bị luôn "giảm" so với một tháng đã đủ ngày.
function joinedSamePeriod(users, offset, now) {
  const ref = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const day = now.getDate();
  return users.filter((u) => {
    const d = new Date(joinedOf(u) ?? 0);
    return (
      d.getFullYear() === ref.getFullYear() &&
      d.getMonth() === ref.getMonth() &&
      d.getDate() <= day
    );
  }).length;
}

export function buildUserStats(users) {
  const now = new Date();
  const newThisMonth = joinedSamePeriod(users, 0, now);
  const newLastMonthSamePeriod = joinedSamePeriod(users, 1, now);
  const premium = users.filter((u) => u.subscriptionType).length;

  return {
    total: users.length,
    premium,
    premiumPct: users.length ? Math.round((premium / users.length) * 100) : 0,
    activeToday: users.filter((u) => {
      const t = lastActiveOf(u);
      return t && now.getTime() - timeOf(t) < DAY_MS;
    }).length,
    newThisMonth,
    newGrowthPct: pctChange(newThisMonth, newLastMonthSamePeriod),
    growth: buildUserGrowth(users),
    recent: [...users].sort((a, b) => timeOf(joinedOf(b)) - timeOf(joinedOf(a))).slice(0, LIST_LIMIT),
    active: users
      .filter((u) => lastActiveOf(u))
      .sort((a, b) => timeOf(lastActiveOf(b)) - timeOf(lastActiveOf(a)))
      .slice(0, LIST_LIMIT),
  };
}

// ── Đánh giá ──────────────────────────────────────────────────────────────────
export const ratingOf = (r) => r.rating ?? r.score ?? r.stars ?? 0;
export const isTvReview = (r) => Boolean(r.tvShowId) || r.contentType === "TvShow";
const reviewTime = (r) => timeOf(r.createdAt ?? r.reviewDate);

/** "S1E3" từ object tập. Chỉnh tên field nếu API đổi. */
const buildEpisodeLabel = (ep) => {
  if (!ep) return null;
  const s = ep.seasonNumber ?? ep.season ?? ep.seasonNo ?? null;
  const e = ep.episodeNumber ?? ep.episode ?? ep.episodeNo ?? ep.order ?? null;
  if (s != null && e != null) return `S${s}E${e}`;
  if (ep.title) return ep.title;
  if (e != null) return `Tập ${e}`;
  return null;
};

/** Gom nhiều danh sách tập (mỗi show một mảng) thành { episodeId: "S1E3" }. */
export function buildEpisodeLabelMap(episodeLists) {
  const map = {};
  episodeLists.forEach((list) =>
    (list ?? []).forEach((ep) => {
      if (ep?.id) map[ep.id] = buildEpisodeLabel(ep);
    }),
  );
  return map;
}

/** Danh sách show cần tra nhãn tập (review mới nhất, có episodeId, chưa có nhãn). */
export function pickShowsNeedingLabels(reviews) {
  const ids = reviews
    .slice()
    .sort((a, b) => reviewTime(b) - reviewTime(a))
    .slice(0, LABEL_SCAN_LIMIT)
    .filter((r) => r.tvShowId && r.episodeId && !r.episodeLabel)
    .map((r) => r.tvShowId);
  return [...new Set(ids)];
}

function enrichReview(r, movieMap, tvMap, labelMap) {
  const withLabel =
    r.episodeId && !r.episodeLabel && labelMap[r.episodeId]
      ? { ...r, episodeLabel: labelMap[r.episodeId] }
      : r;

  const movie = withLabel.movieId && movieMap[withLabel.movieId];
  if (movie) {
    return { ...withLabel, movieTitle: movie.title, posterUrl: withLabel.posterUrl ?? movie.posterUrl };
  }
  const show = withLabel.tvShowId && tvMap[withLabel.tvShowId];
  if (show) {
    return { ...withLabel, tvShowTitle: show.title ?? show.name, posterUrl: withLabel.posterUrl ?? show.posterUrl };
  }
  return withLabel;
}

const withPoster = (tops, list, idKey, byId) =>
  tops.map((item) => ({
    ...item,
    posterUrl:
      list.find((r) => (r[idKey] ?? r.contentId) === item.id)?.posterUrl ??
      byId[item.id]?.posterUrl ??
      null,
  }));

export function buildReviewStats({ reviews, movies, tvShows, labelMap }) {
  const movieMap = Object.fromEntries(movies.map((m) => [m.id, m]));
  const tvMap = Object.fromEntries(tvShows.map((s) => [s.id, s]));

  // Sắp mới → cũ MỘT lần ở đây, các danh sách con thừa hưởng thứ tự.
  const all = reviews
    .map((r) => enrichReview(r, movieMap, tvMap, labelMap))
    .sort((a, b) => reviewTime(b) - reviewTime(a));
  const movieReviews = all.filter((r) => !isTvReview(r));
  const tvReviews = all.filter(isTvReview);

  const total = all.length;
  const positive = all.filter((r) => ratingOf(r) >= POSITIVE_MIN).length;
  const negative = all.filter((r) => ratingOf(r) < NEGATIVE_BELOW).length;
  const avg = (list) => (list.length ? (sum(list, ratingOf) / list.length).toFixed(2) : null);

  return {
    all,
    movieReviews,
    tvReviews,
    total,
    positive,
    negative,
    neutral: total - positive - negative,
    positiveRatio: total ? Math.round((positive / total) * 100) : 0,
    avgMovie: avg(movieReviews),
    avgTv: avg(tvReviews),
    ratingDist: buildRatingDist(all),
    trend: buildMonthlyReviewTrend(all),
    topReviewedMovies: withPoster(buildTopReviewed(movieReviews, "movieId", "movieTitle"), movieReviews, "movieId", movieMap),
    topReviewedShows: withPoster(buildTopReviewed(tvReviews, "tvShowId", "tvShowTitle"), tvReviews, "tvShowId", tvMap),
  };
}

// ── Lượt xem ──────────────────────────────────────────────────────────────────
// "2026-10-08" → "08/10" · "2026-10" → "T10/26" · còn lại giữ nguyên
export const fmtPeriod = (p = "") => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return `${p.slice(8)}/${p.slice(5, 7)}`;
  if (/^\d{4}-\d{2}$/.test(p)) return `T${p.slice(5)}/${p.slice(2, 4)}`;
  return p;
};

export function summarizeViews(overview) {
  const points = (overview?.points ?? []).map((p) => ({ ...p, label: fmtPeriod(p.period) }));

  // Kỳ cuối (hôm nay / tuần này…) chưa kết thúc nên luôn trông như "giảm":
  // so 2 kỳ đã hoàn thành gần nhất; ít hơn 3 kỳ thì không hiện xu hướng.
  const last = points.length >= 3 ? points[points.length - 2] : null;
  const prev = points.length >= 3 ? points[points.length - 3] : null;

  const sessions = sum(points, (p) => p.sessions);
  const guestSessions = sum(points, (p) => p.guestSessions);

  return {
    hasData: Boolean(overview),
    from: overview?.from,
    to: overview?.to,
    points,
    totalViews: overview?.totalViews ?? 0,
    totalWatchHours: overview?.totalWatchHours ?? 0,
    totalUniqueUsers: overview?.totalUniqueUsers ?? 0,
    sessions,
    guestSessions,
    guestPct: sessions ? Math.round((guestSessions / sessions) * 100) : 0,
    viewsTrend: prev ? pctChange(last.views, prev.views) : undefined,
    hoursTrend: prev ? pctChange(last.watchHours, prev.watchHours) : undefined,
    compareNote: prev ? `${last.label} so với ${prev.label}` : null,
  };
}
