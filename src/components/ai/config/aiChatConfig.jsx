import React from "react";
import { FONT_BODY } from "../../../context/homeTokens";

// ─── Design tokens ────────────────────────────────────────────────────────────
export const W = {
  bg: "#080809",
  surface: "#0f0f11",
  surfaceUp: "#161619",
  surfaceMid: "#1c1c21",
  border: "rgba(255,255,255,0.055)",
  borderHi: "rgba(255,255,255,0.10)",
  accent: "#e5181e",
  accentSoft: "rgba(229,24,30,0.10)",
  accentGlow: "rgba(229,24,30,0.20)",
  text: "rgba(255,255,255,0.88)",
  textSub: "rgba(255,255,255,0.52)",
  textDim: "rgba(255,255,255,0.28)",
  userBg: "#c8151a",
  gold: "#f5c518",
  green: "#22c55e",
  warn: "#f59e0b",
};

export const MAX_CHAT_LENGTH = 500;
export const MAX_HISTORY = 12;
export const GREETING =
  "Xin chào! Tôi là trợ lý của UIAMovie.\nBạn muốn tìm phim gì hôm nay?";

export const MOODS = [
  "Buồn", "Vui", "Hồi hộp", "Thư giãn", "Rùng rợn", "Lãng mạn", "Hào hứng", "Muốn khóc",
];

export const INTENT_CHIPS = {
  movie: [
    { label: "Kinh dị hay nhất?" },
    { label: "Bom tấn hành động 2024" },
    { label: "Phim Hàn tâm lý hay" },
    { label: "Sci-Fi đáng xem?" },
  ],
  mood: [
    { label: "Tôi đang buồn" },
    { label: "Muốn xem gì hào hứng" },
    { label: "Thư giãn cuối tuần" },
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
  tvshow: [
    { label: "Series tâm lý Hàn hay nhất?" },
    { label: "Phim nhiều mùa đáng xem" },
    { label: "Series hành động hấp dẫn" },
    { label: "Show hài giải trí nhẹ nhàng" },
  ],
};

export const PROACTIVE_MESSAGES = {
  "/": "Hôm nay bạn muốn xem thể loại phim gì?",
  "/movies": "Tìm mãi không ra? Để tôi gợi ý cho bạn.",
  "/movie": "Bạn muốn biết thêm về phim này không?",
  "/tv-shows": "Tìm series hay để cày cả tuần? Hỏi tôi nhé.",
  "/tv-show": "Bạn muốn biết thêm về series này không?",
  default: "Tôi có thể giúp bạn tìm phim & series phù hợp.",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Xóa sạch các đoạn bảng markdown | ... | khỏi text hiển thị thông thường
 * để tránh việc người dùng bị nhìn thấy các gạch nối Markdown thô xấu xí.
 */
export const stripMarkdownTable = (text) => {
  if (!text) return "";
  return text
    .split("\n")
    .filter((line) => !line.trim().startsWith("|"))
    .join("\n")
    .trim();
};

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

/**
 * Parser bảng Markdown an toàn, hỗ trợ bóc tách từng hàng thuộc tính
 */
export const parseMarkdownTable = (md) => {
  if (!md) return { header: [], body: [] };
  
  const lines = md
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|") && l.endsWith("|"));

  if (lines.length < 2) return { header: [], body: [] };

  const parsedRows = lines.map((line) =>
    line
      .slice(1, -1)
      .split("|")
      .map((col) => col.trim())
  );

  // Bỏ hàng divider (|---|---|---|)
  const contentRows = parsedRows.filter(
    (row) => !row.every((c) => /^[-:\s]+$/.test(c))
  );

  if (contentRows.length === 0) return { header: [], body: [] };

  return {
    header: contentRows[0] || [],
    body: contentRows.slice(1) || [],
  };
};