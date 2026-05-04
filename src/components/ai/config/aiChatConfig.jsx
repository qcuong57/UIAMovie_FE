import React from "react";
import { FONT_BODY } from "../../../context/homeTokens";

// ─── Design tokens ────────────────────────────────────────────────────────────
export const W = {
  bg:        "#080809",
  surface:   "#0f0f11",
  surfaceUp: "#161619",
  surfaceMid:"#1c1c21",
  border:    "rgba(255,255,255,0.055)",
  borderHi:  "rgba(255,255,255,0.10)",
  accent:    "#e5181e",
  accentSoft:"rgba(229,24,30,0.10)",
  accentGlow:"rgba(229,24,30,0.20)",
  text:      "rgba(255,255,255,0.88)",
  textSub:   "rgba(255,255,255,0.42)",
  textDim:   "rgba(255,255,255,0.18)",
  userBg:    "#c8151a",
  gold:      "#f5c518",
  green:     "#22c55e",
  warn:      "#f59e0b",
};

// ─── Constants ────────────────────────────────────────────────────────────────
export const MAX_CHAT_LENGTH = 500;
export const MAX_HISTORY     = 20;
export const GREETING        = "Xin chào! Tôi là trợ lý AI của UIAMovie.\nBạn muốn tìm phim gì hôm nay?";

export const MOODS = [
  { key: "buồn",      label: "Buồn"},
  { key: "vui",       label: "Vui" },
  { key: "hồi hộp",  label: "Hồi hộp"},
  { key: "thư giãn", label: "Thư giãn" },
  { key: "sợ",       label: "Rùng rợn" },
  { key: "lãng mạn", label: "Lãng mạn" },
  { key: "hào hứng", label: "Hào hứng" },
  { key: "muốn khóc",label: "Muốn khóc" },
];

export const INTENT_CHIPS = {
  movie: [
    { label: "Kinh dị hay nhất?"},
    { label: "Bom tấn hành động 2024" },
    { label: "Phim Hàn tâm lý hay"},
    { label: "Sci-Fi đáng xem?" },
  ],
  mood: [
    { label: "Tôi đang buồn"},
    { label: "Muốn xem gì hào hứng"},
    { label: "Thư giãn cuối tuần"},
    { label: "Xem gì lãng mạn?" },
  ],
  compare: [
    { label: "So sánh 2 phim khác" },
    { label: "Avengers vs Endgame" },
    { label: "Phim nào hay hơn?" },
    { label: "Inception vs Interstellar" },
  ],
  review: [
    { label: "Phim này được đánh giá sao?" },
    { label: "Mọi người nói gì về phim?" },
    { label: "Phim có đáng xem không?" },
    { label: "Nhận xét về diễn xuất?" },
  ],
  site: [
    { label: "Gói Premium bao nhiêu?" },
    { label: "Cách đăng ký tài khoản" },
    { label: "Cách thanh toán" },
    { label: "Quên mật khẩu" },
  ],
};

export const PROACTIVE_MESSAGES = {
  "/":       "Hôm nay bạn muốn xem thể loại phim gì?",
  "/movies": "Tìm mãi không ra? Để tôi gợi ý cho bạn!",
  "/movie":  "Bạn muốn biết thêm về phim này không?",
  default:   "Tôi có thể giúp bạn tìm phim phù hợp.",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const renderMarkdown = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ fontWeight: 700, color: "#fff" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

export const parseMarkdownTable = (md) => {
  if (!md) return { header: [], body: [] };
  const lines    = md.trim().split("\n").filter(l => l.trim().startsWith("|"));
  const allRows  = lines.map(l => l.split("|").map(c => c.trim()).filter(Boolean));
  const filtered = allRows.filter(row => !row.every(c => /^[-:]+$/.test(c)));
  return { header: filtered[0] || [], body: filtered.slice(1) };
};