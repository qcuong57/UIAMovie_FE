// src/motion-configs/SectionReveal.jsx
// Wrapper animation dùng chung cho các section trong HomePage
// v3 — tôn trọng prefers-reduced-motion, giảm nhẹ trên mobile để giữ FPS

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

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

// Ngưỡng viewport tính là "mobile" cho mục đích làm nhẹ animation
// (khác với prefers-reduced-motion — đây thuần là tối ưu hiệu năng/thẩm mỹ)
const MOBILE_QUERY = "(max-width: 640px)";

export function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * @param {"slide-up"|"slide-right"|"slide-left"|"scale-fade"|"fade"|"bounce"|"tilt-up"} variant
 * @param {number}  delay   — delay trước khi animation bắt đầu (giây)
 * @param {string}  margin  — viewport trigger margin, mặc định "-80px"
 * @param {object}  style   — style bổ sung cho wrapper
 *
 * Performance & accessibility notes:
 * - Tất cả variants chỉ animate opacity + transform (x/y/scale)
 * - Framer Motion tự dùng GPU layer (will-change: transform)
 * - viewport.once = true → chỉ animate 1 lần, không re-trigger khi scroll lên
 * - prefers-reduced-motion: reduce → tự động fallback về fade nhẹ, không
 *   translate/scale, tôn trọng lựa chọn hệ điều hành của người dùng
 * - Trên viewport mobile (<=640px) → rút ngắn duration ~25% để animation
 *   không cảm giác "chậm chạp" khi vuốt nhanh, nhưng vẫn giữ preset gốc
 *   (không hạ cấp trải nghiệm xuống mức tầm thường)
 */
export default function SectionReveal({
  variant  = "slide-up",
  delay    = 0,
  margin   = "-80px",
  style    = {},
  divider  = false, // ✅ true = tự vẽ divider bên dưới, thay cho <SectionDivider/> rời
  spacing  = 40,     // khoảng cách dưới divider (px)
  children,
}) {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobileViewport();

  const basePreset = PRESETS[variant] ?? PRESETS["slide-up"];

  // prefers-reduced-motion thắng mọi thứ: chỉ fade, gần như tức thời
  const activePreset = prefersReducedMotion
    ? { variants: fadeInVariants, transition: { duration: 0.2, ease: "easeOut" } }
    : basePreset;

  const rawTransition = activePreset.transition;
  const transition =
    !prefersReducedMotion && isMobile && typeof rawTransition.duration === "number"
      ? { ...rawTransition, duration: rawTransition.duration * 0.75 }
      : rawTransition;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin }}
      variants={activePreset.variants}
      transition={{ ...transition, delay: prefersReducedMotion ? 0 : delay }}
      style={{ willChange: "transform, opacity", ...style }}
    >
      {children}

      {/* ── Divider tuỳ chọn: gộp vào cùng 1 node thay vì <SectionDivider/> +
             <div height=40/> rời ở ngoài → giảm số phần tử DOM & tránh mỗi
             section cộng thêm 2 node tĩnh không cần animation riêng. ── */}
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