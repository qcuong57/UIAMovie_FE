// src/components/admin/ads/adContentScopes.js
// Nguồn duy nhất cho "hình thức nội dung" của quảng cáo (dùng ở cả hai modal).
//
// Player chỉ hỏi quảng cáo theo Movie hoặc Episode. "TvShow" là phạm vi CẢ BỘ:
//   - Global Slot phạm vi TvShow  → áp cho mọi tập của mọi bộ
//   - Override loại TvShow        → áp cho mọi tập của đúng bộ đó (tập có override riêng thì ưu tiên tập)
// Rỗng ('') = tất cả hình thức.

export const ALL_SCOPE = "";

const META = {
  Movie: { label: "Phim lẻ", desc: "Chỉ áp cho phim lẻ." },
  Episode: { label: "Tập phim", desc: "Áp cho từng tập của phim bộ." },
  TvShow: {
    label: "Cả bộ phim bộ",
    desc: "Áp cho mọi tập thuộc phim bộ (TV Show).",
  },
};

export const ALL_LABEL = "Tất cả hình thức";
const ALL_DESC = "Áp cho phim lẻ và mọi tập phim.";

export const scopeLabel = (value) =>
  value ? (META[value]?.label ?? value) : ALL_LABEL;
export const scopeDesc = (value) =>
  value ? (META[value]?.desc ?? "") : ALL_DESC;

const opt = (value) => ({
  value,
  label: scopeLabel(value),
  desc: scopeDesc(value),
});

/** Global Slot: tất cả | phim lẻ | tập phim | cả bộ */
export const GLOBAL_SCOPES = [ALL_SCOPE, "Movie", "Episode", "TvShow"].map(opt);

/** Override gắn vào 1 nội dung cụ thể (không có "tất cả") */
export const OVERRIDE_TYPES = ["Movie", "TvShow", "Episode"].map(opt);

/** Xem thử: tất cả (phim lẻ + tập) | phim lẻ | tập phim */
export const PREVIEW_SCOPES = [ALL_SCOPE, "Movie", "Episode"].map((v) =>
  v === ALL_SCOPE
    ? { value: v, label: `${ALL_LABEL} (phim lẻ + tập phim)`, desc: ALL_DESC }
    : opt(v),
);

export const CONTENT_ID_HINT = {
  Movie: "ID của phim lẻ",
  TvShow: "ID của bộ phim (TV Show)",
  Episode: "ID của tập phim",
};

/** Slot có áp cho loại phát `playable` ('Movie' | 'Episode') không? */
export const scopeCovers = (appliesTo, playable) =>
  !appliesTo ||
  appliesTo === playable ||
  (playable === "Episode" && appliesTo === "TvShow");

/** 2 loại player thực sự phát */
export const PLAYABLE_TYPES = ["Movie", "Episode"];
