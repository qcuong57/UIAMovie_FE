// src/motion-configs/HomeReveal.jsx
// Reveal RIÊNG cho HomePage (streaming-style).
// Không import variants.js / transitions.js và không sửa SectionReveal.jsx
// → các trang/component khác vẫn dùng bộ transition cũ như bình thường.
//
// Nguyên tắc cho web xem phim:
//  1. Nội dung (poster, tiêu đề) phải hiện NHANH — người dùng đang tìm phim,
//     không phải xem hiệu ứng. Không để họ nhìn thấy khoảng trống lúc cuộn.
//  2. Mọi hàng dùng CÙNG một chuyển động (fade + nhích lên rất nhẹ). Bỏ kiểu
//     luân phiên trượt trái/phải và bounce — gây rối mắt, và trượt ngang cả
//     hàng dài dễ giật trên mobile.
//  3. Chỉ 2 khoảnh khắc được "nhấn": Top 10 (feature) và block spotlight
//     (Trailer / Dành cho bạn). Còn lại giữ yên tĩnh.
//  4. Opacity xong trước, chuyển động xong sau → cảm giác nhẹ và mượt.
//  5. Chỉ tween (không spring) → không nảy, không overshoot.

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useIsMobileViewport } from "./SectionReveal"; // chỉ dùng lại hook, không đổi gì ở file gốc

// Ease-out mạnh: bắt đầu nhanh, hạ cánh rất êm (quint-out)
export const HOME_EASE = [0.22, 1, 0.36, 1];

// ─── Presets ─────────────────────────────────────────────────────────────────
// y / scale rất nhỏ → chỉ đủ để mắt thấy "có sinh khí", không gây xao nhãng.
const PRESETS = {
  // Mặc định cho mọi hàng phim (Tiếp tục xem, Được đánh giá cao, TV, Mới ra mắt…)
  row: {
    hidden:  { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
    opacity: { duration: 0.45, ease: "easeOut" },
    motion:  { duration: 0.7, ease: HOME_EASE },
  },

  // Top 10 — hàng quan trọng nhất trang, được nhích xa hơn một chút + chậm hơn
  feature: {
    hidden:  { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
    opacity: { duration: 0.6, ease: "easeOut" },
    motion:  { duration: 0.9, ease: HOME_EASE },
  },

  // Block lớn (Trailer, Dành cho bạn) — phóng nhẹ từ 0.985, như màn hình bật sáng
  spotlight: {
    hidden:  { opacity: 0, y: 16, scale: 0.985 },
    visible: { opacity: 1, y: 0, scale: 1 },
    opacity: { duration: 0.6, ease: "easeOut" },
    motion:  { duration: 0.85, ease: HOME_EASE },
  },

  // Text nhiều (Reviews) — gần như chỉ fade
  fade: {
    hidden:  { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
    opacity: { duration: 0.6, ease: "easeOut" },
    motion:  { duration: 0.7, ease: HOME_EASE },
  },
};

// Tương thích ngược: nếu lỡ còn chỗ dùng tên variant cũ thì map về preset mới
const ALIAS = {
  "slide-up": "row",
  "slide-right": "row",
  "slide-left": "row",
  "scale-fade": "spotlight",
  bounce: "feature",
  "tilt-up": "feature",
};

/**
 * @param {"row"|"feature"|"spotlight"|"fade"} variant
 * @param {number}  delay
 * @param {string}  margin   — rootMargin cho viewport. Mặc định dương ở đáy để
 *                             reveal chạy TRƯỚC khi hàng lọt hẳn vào màn hình,
 *                             tránh cảnh cuộn nhanh thấy khoảng trống.
 * @param {boolean} divider  — vẽ đường kẻ + khoảng cách bên dưới
 * @param {number}  spacing
 */
export default function HomeReveal({
  variant = "row",
  delay = 0,
  margin = "0px 0px 8% 0px",
  style,
  divider = false,
  spacing = 40,
  children,
}) {
  const reduced = useReducedMotion();
  const isMobile = useIsMobileViewport();

  const preset = PRESETS[variant] ?? PRESETS[ALIAS[variant]] ?? PRESETS.row;

  // prefers-reduced-motion: chỉ fade rất nhanh, không dịch chuyển
  const variants = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: preset.hidden,
        visible: preset.visible,
      };

  // Mobile: quãng đường ngắn hơn + nhanh hơn ~25% để khi vuốt nhanh không bị "đợi"
  const mScale = isMobile ? 0.75 : 1;
  const transition = reduced
    ? { duration: 0.2, ease: "easeOut" }
    : {
        delay,
        opacity: { ...preset.opacity, duration: preset.opacity.duration * mScale, delay },
        default: { ...preset.motion, duration: preset.motion.duration * mScale, delay },
      };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      // amount nhỏ: hàng rất cao (Recommend, Trailer) vẫn kích hoạt sớm
      viewport={{ once: true, margin, amount: 0.05 }}
      variants={variants}
      transition={transition}
      style={style}
    >
      {children}

      {divider && (
        <>
          <div
            style={{
              margin: "0 48px",
              height: 1,
              background:
                "linear-gradient(to right, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 60%, transparent 100%)",
            }}
          />
          <div style={{ height: spacing }} />
        </>
      )}
    </motion.div>
  );
}