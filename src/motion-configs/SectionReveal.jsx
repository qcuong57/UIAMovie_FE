// src/motion-configs/SectionReveal.jsx
// Wrapper animation dùng chung cho các section trong HomePage
// v2 — fix bug "tilt-up", tune transitions mượt hơn, reduce jank

import React from "react";
import { motion } from "framer-motion";

import {
  fadeInVariants,
  slideUpVariants,
  slideRightVariants,
  slideLeftVariants,
  scaleUpSmallVariants,
  bounceVariants,
} from "./variants";

import {
  TRANSITION_NORMAL,
  TRANSITION_SLOW,
  TRANSITION_EASE_OUT_CUBIC,
  TRANSITION_SPRING_SMOOTH,
  TRANSITION_SPRING,
} from "./transitions";

// ─── PRESETS ──────────────────────────────────────────────────────────────────
// Tất cả variants đều dùng transform + opacity → GPU composited → mượt

const PRESETS = {
  // Trượt lên nhẹ — baseline
  "slide-up": {
    variants:   slideUpVariants,
    transition: TRANSITION_EASE_OUT_CUBIC,           // 0.6s cubic
  },

  // Trượt vào từ trái (Được Đánh Giá Cao, Phim Mới Ra Mắt)
  "slide-right": {
    variants:   slideRightVariants,
    transition: { ...TRANSITION_NORMAL, duration: 0.45 },
  },

  // Trượt vào từ phải (TV Series)
  "slide-left": {
    variants:   slideLeftVariants,
    transition: { ...TRANSITION_NORMAL, duration: 0.45 },
  },

  // Scale nhẹ — spotlight (Dành Cho Bạn)
  "scale-fade": {
    variants:   scaleUpSmallVariants,
    transition: TRANSITION_SPRING_SMOOTH,            // spring stiffness 200, damping 25
  },

  // Fade thuần — tinh tế cho text-heavy (User Reviews)
  "fade": {
    variants:   fadeInVariants,
    transition: TRANSITION_SLOW,                     // 0.8s easeOut
  },

  // Bounce spring — cinematic (Top 10)
  // ⚠️  damping 20 thay vì 18 → bớt nảy, mượt hơn
  "bounce": {
    variants:   bounceVariants,
    transition: { ...TRANSITION_SPRING, stiffness: 120, damping: 20 },
  },

  // ── Alias fix: "tilt-up" không có → map về "slide-up" ──────────────────
  // HomePage đang dùng variant="tilt-up" cho Top 10 nhưng PRESETS cũ không có
  // → fallback thầm lặng về "slide-up". Giờ khai báo tường minh luôn.
  "tilt-up": {
    variants:   slideUpVariants,
    transition: TRANSITION_EASE_OUT_CUBIC,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * @param {"slide-up"|"slide-right"|"slide-left"|"scale-fade"|"fade"|"bounce"|"tilt-up"} variant
 * @param {number}  delay   — delay trước khi animation bắt đầu (giây)
 * @param {string}  margin  — viewport trigger margin, mặc định "-80px"
 * @param {object}  style   — style bổ sung cho wrapper
 *
 * Performance notes:
 * - Tất cả variants chỉ animate opacity + transform (x/y/scale)
 * - Framer Motion tự dùng GPU layer (will-change: transform)
 * - viewport.once = true → chỉ animate 1 lần, không re-trigger khi scroll lên
 * - Không cần bỏ animation để tăng performance — bottleneck thực sự là
 *   số lượng DOM nodes và image loading, không phải CSS transform
 */
export default function SectionReveal({
  variant  = "slide-up",
  delay    = 0,
  margin   = "-80px",
  style    = {},
  children,
}) {
  const preset = PRESETS[variant] ?? PRESETS["slide-up"];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin }}
      variants={preset.variants}
      transition={{ ...preset.transition, delay }}
      style={{ willChange: "transform, opacity", ...style }}
    >
      {children}
    </motion.div>
  );
}