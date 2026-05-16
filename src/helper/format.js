// src/helpers/format.js

// ── Currency / Date Formatters ─────────────────────────────────────────────────
export const fmtVnd = (n) => {
  if (n == null) return "—";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B ₫`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M ₫`;
  return n.toLocaleString("vi-VN") + " ₫";
};

export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
      })
    : "—";

export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

/** Chỉ lấy năm từ date string */
export const getYear = (d) => (d ? new Date(d).getFullYear() : null);

// ── Status / Label Maps ────────────────────────────────────────────────────────
export const STATUS_META = {
  success: { label: "Thành công", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  failed:  { label: "Thất bại",   color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  expired: { label: "Hết hạn",    color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  pending: { label: "Chờ xử lý", color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" },
};

export const MONTHS_VI = [
  "T1","T2","T3","T4","T5","T6",
  "T7","T8","T9","T10","T11","T12",
];

export const PLAN_COLORS = {
  monthly_premium: "#1C5F3A",
  yearly_premium:  "#7C3AED",
  default:         "#0891b2",
};

// ── Array / Response Normaliser ────────────────────────────────────────────────
/** Chuẩn hoá mọi kiểu response API về plain array */
export const toArray = (r) => {
  if (!r) return [];
  if (Array.isArray(r)) return r;
  return r.items ?? r.data?.items ?? r.data ?? [];
};

// ── Content / Video Helpers ────────────────────────────────────────────────────
export const hasVideoType = (videos, type) =>
  Array.isArray(videos) &&
  videos.some(v => (v.videoType ?? v.type ?? '').toLowerCase() === type);

export const computeMissingFlags = (item, isShow = false) => ({
  ...item,
  _missingPoster:  !item.posterUrl,
  _missingTrailer: !hasVideoType(item.videos, 'trailer'),
  ...(isShow
    ? { _missingEpisode: !item.numberOfEpisodes }
    : { _missingMain:   !hasVideoType(item.videos, 'main') }),
});

// ── Chart Data Builders ────────────────────────────────────────────────────────
/** Đếm tần suất thể loại từ danh sách phim/show */
export const buildGenreFreq = (items) => {
  const map = {};
  items.forEach(item =>
    (item.genres ?? []).forEach(g => {
      const name = typeof g === 'string' ? g : g.name ?? g.genreName ?? '';
      if (name) map[name] = (map[name] || 0) + 1;
    })
  );
  return map;
};

/** Nhóm reviews theo tháng trong 6 tháng gần nhất */
export const buildMonthlyReviewTrend = (reviews) => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: d.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }),
      year: d.getFullYear(),
      m:    d.getMonth(),
      movie: 0,
      tvshow: 0,
    });
  }
  reviews.forEach(r => {
    const d    = new Date(r.createdAt ?? r.reviewDate ?? Date.now());
    const slot = months.find(m => m.year === d.getFullYear() && m.m === d.getMonth());
    if (!slot) return;
    if (r.contentType === 'TvShow' || r.tvShowId) slot.tvshow++;
    else slot.movie++;
  });
  return months;
};

/** Nhóm user đăng ký theo tháng 6 tháng gần nhất */
export const buildUserGrowth = (users) => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: d.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }),
      year: d.getFullYear(),
      m:    d.getMonth(),
      new:  0,
      cumulative: 0,
    });
  }
  let before = 0;
  users.forEach(u => {
    const d = new Date(u.createdAt ?? u.joinedAt ?? 0);
    const isBeforeWindow =
      months.length > 0 &&
      (d.getFullYear() < months[0].year ||
        (d.getFullYear() === months[0].year && d.getMonth() < months[0].m));
    if (isBeforeWindow) { before++; return; }
    const slot = months.find(m => m.year === d.getFullYear() && m.m === d.getMonth());
    if (slot) slot.new++;
  });
  let cum = before;
  months.forEach(m => { cum += m.new; m.cumulative = cum; });
  return months;
};

/** Phân bố số sao (scale 1–10, nhóm theo range) */
export const buildRatingDist = (reviews) => {
  const ranges = [
    { label: '1–2',  star: 1, min: 1,  max: 2  },
    { label: '3–4',  star: 2, min: 3,  max: 4  },
    { label: '5–6',  star: 3, min: 5,  max: 6  },
    { label: '7–8',  star: 4, min: 7,  max: 8  },
    { label: '9–10', star: 5, min: 9,  max: 10 },
  ];
  const counts = ranges.map(r => ({ ...r, value: 0 }));
  reviews.forEach(r => {
    const s = r.rating ?? r.score ?? r.stars ?? 0;
    const bucket = counts.find(b => s >= b.min && s <= b.max);
    if (bucket) bucket.value++;
  });
  return counts.map(({ label, value, star }) => ({ label, value, star }));
};

/** Gom top reviewed items từ danh sách reviews */
export const buildTopReviewed = (reviews, idKey, titleKey, limit = 5) => {
  const map = {};
  reviews.forEach(r => {
    const id = r[idKey] ?? r.contentId;
    if (!id) return;
    if (!map[id]) map[id] = { id, title: r[titleKey] ?? r.contentTitle ?? id, count: 0, total: 0 };
    map[id].count++;
    map[id].total += (r.rating ?? r.score ?? r.stars ?? 0);
  });
  return Object.values(map)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(m => ({ ...m, avg: m.count > 0 ? (m.total / m.count).toFixed(1) : '—' }));
};