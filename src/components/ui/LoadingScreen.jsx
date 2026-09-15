// src/components/ui/LoadingScreen.jsx
// Loading screen mở trang — chữ "UIAMOVIE" gõ dần kiểu typewriter, cỡ lớn,
// kèm con trỏ nhấp nháy (blinking cursor) ở cuối. Màu sắc theo đúng logo:
// "UIA" đỏ (accent) + "MOVIE" trắng.
//
// HOÀN TOÀN DỰA VÀO DATA THẬT — không tự đếm giờ rồi tự tắt. Component này
// GÕ CHỮ XONG THÌ GIỮ NGUYÊN (con trỏ nhấp nháy chờ) và ở lại full độ đục
// CHO ĐẾN KHI component cha unmount nó (tức là fetch data xong).
//
// Hiệu ứng thoát: thay vì fade mờ dần, toàn màn hình loading TRƯỢT LÊN
// ("mở màn" kiểu rèm sân khấu/rèm rạp chiếu) để lộ nội dung trang phía dưới.
//
// Cách dùng đúng: bọc trong <AnimatePresence> ở component cha, chỉ render
// khi `loading === true`. AnimatePresence sẽ tự chạy animation `exit` bên
// dưới (trượt lên) ngay khi cha ngừng render nó — không cần onDone/timer gì.
//
//   <AnimatePresence>
//     {loading && <LoadingScreen key="loading" />}
//   </AnimatePresence>
//   {!loading && !error && <ActualPageContent />}

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { C, FONT_DISPLAY, FONT_BODY } from "../../context/homeTokens";

// ── Dùng chung timing/easing từ motion-configs, không hardcode nữa ─────────
import { MOTION } from "../../motion-configs/motionConfig";
import { TRANSITION_SHIMMER } from "../../motion-configs/transitions";
import { useIsMobile } from "../../hooks/useIsMobile";

const UIA = "UIA";
const MOVIE = "MOVIE";

const LoadingScreen = ({
  msPerChar = 90, // tốc độ gõ chữ (desktop)
}) => {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile(640);

  // Mobile gõ nhanh hơn một chút để không cảm giác ì trên màn hình nhỏ
  const effectiveMsPerChar = isMobile ? msPerChar * 0.8 : msPerChar;
  const typeSeconds = reducedMotion
    ? 0.2
    : ((UIA + MOVIE).length * effectiveMsPerChar) / 1000;

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      // "Mở màn" kiểu rèm sân khấu — dùng đúng ease + duration "curtains"
      // đã khai báo trong motionConfig.js thay vì số tự chế
      exit={{ y: "-100%" }}
      transition={{ duration: MOTION.duration.curtain, ease: MOTION.ease.curtains }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        backgroundColor: C.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: isMobile ? 12 : 18,
        padding: "0 20px",
      }}
      aria-hidden="true"
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          fontFamily: FONT_DISPLAY,
          fontWeight: 900,
          // Responsive rõ ràng hơn cho màn hình rất nhỏ, vẫn giữ trần cũ
          fontSize: isMobile
            ? "clamp(1.9rem, 11vw, 2.8rem)"
            : "clamp(2.2rem, 7vw, 4.6rem)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        <motion.span
          initial={{ width: 0 }}
          animate={{ width: "auto" }}
          transition={{ duration: typeSeconds, ease: "linear" }}
          style={{ display: "inline-flex", overflow: "hidden", whiteSpace: "nowrap" }}
        >
          <span style={{ color: C.accent }}>{UIA}</span>
          <span style={{ color: "#ffffff" }}>{MOVIE}</span>
        </motion.span>
        <motion.span
          animate={reducedMotion ? { opacity: 1 } : { opacity: [1, 1, 0, 0] }}
          // Nhịp nhấp nháy lấy từ TRANSITION_SHIMMER (duration chuẩn dùng
          // cho các hiệu ứng lặp "sáng/tắt" trong motion-configs)
          transition={{
            duration: TRANSITION_SHIMMER.duration * 0.45,
            repeat: Infinity,
            times: [0, 0.5, 0.51, 1],
          }}
          style={{
            display: "inline-block",
            width: "0.5ch",
            height: "0.85em",
            marginLeft: 6,
            backgroundColor: C.text,
            transform: "translateY(0.05em)",
          }}
        />
      </div>

      <div
        style={{
          fontFamily: FONT_BODY,
          fontSize: isMobile ? "0.6rem" : "0.68rem",
          fontWeight: 700,
          letterSpacing: isMobile ? "0.22em" : "0.3em",
          textTransform: "uppercase",
          color: C.textDim,
          textAlign: "center",
        }}
      >
        Đang mở khung hình
      </div>
    </motion.div>
  );
};

export default LoadingScreen;