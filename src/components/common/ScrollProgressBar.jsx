// src/components/common/ScrollProgressBar.jsx
// Thanh tiến trình scroll cố định trên đầu trang
// Dùng useScroll + scaleX của Framer Motion — chạy trên compositor thread, không giật

import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";

/**
 * @param {string}  color     — màu thanh, mặc định đỏ accent
 * @param {number}  height    — chiều cao thanh (px), mặc định 3
 * @param {number}  zIndex    — z-index, mặc định 9999
 */
export default function ScrollProgressBar({
  color   = "#e5181e",
  height  = 3,
  zIndex  = 9999,
}) {
  const { scrollYProgress } = useScroll();

  // useSpring làm mượt hơn so với raw scrollYProgress
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{
        position:     "fixed",
        top:          0,
        left:         0,
        right:        0,
        height,
        zIndex,
        scaleX,
        originX:      0,           // mở rộng từ trái sang phải
        background:   color,
        boxShadow:    `0 0 8px ${color}88`,
        pointerEvents: "none",     // không block click
      }}
    />
  );
}