// src/components/ui/LoadingScreen.jsx
// Loading screen dùng kỹ thuật "Fill text" của motion.dev, style theo logo Navbar
// (UIA đỏ + MOVIE trắng): https://motion.dev/examples/js-loading-fill-text
//
// Ý tưởng: chồng 2 lớp text lên nhau — 1 lớp mờ làm nền, 1 lớp sáng bị
// clip-path che dần rồi animate clip-path để "lấp đầy" chữ từ trái sang phải,
// quét tới UIA thì lên màu đỏ, quét tới MOVIE thì lên màu trắng.
//
// Dùng: <LoadingScreen /> (mặc định) hoặc <LoadingScreen loop={false} duration={2} />

import React from "react";
import { motion } from "framer-motion";
import { C, FONT_DISPLAY, FONT_BODY } from "../../context/homeTokens";

const LoadingScreen = ({
  loop = true, // true: chạy đi chạy lại (fill rồi rút lại rồi fill tiếp)
  duration = 1.6,
}) => {
  // Giống logo ở Navbar: "UIA" (đỏ, font-black) + "MOVIE" (trắng, bold) — không cong, thẳng hàng
  const uiaStyle = {
    fontFamily: FONT_DISPLAY,
    fontWeight: 900,
    letterSpacing: "-0.02em",
    fontSize: 34, // to hơn ~30% so với bản trước (26px)
    lineHeight: 1,
  };
  const movieStyle = {
    fontFamily: FONT_DISPLAY,
    fontWeight: 700,
    letterSpacing: "0.06em",
    fontSize: 24, // to hơn ~30% so với bản trước (18px)
    lineHeight: 1,
  };

  const TextRow = ({ opacity, isFillLayer }) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 8,
      }}
    >
      <span style={{ ...uiaStyle, color: C.accent, opacity }}>UIA</span>
      <span style={{ ...movieStyle, color: "#ffffff", opacity }}>MOVIE</span>
    </span>
  );

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.bg,
      }}
    >
      <div style={{ position: "relative" }}>
        {/* Lớp nền mờ (luôn hiển thị, không đổi) */}
        <div aria-hidden style={{ position: "relative" }}>
          <TextRow opacity={0.15} />
        </div>

        {/* Lớp sáng, được clip-path "lấp đầy" dần từ trái sang phải — UIA đỏ, MOVIE trắng */}
        <motion.div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            willChange: "clip-path",
          }}
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{
            duration,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: loop ? "reverse" : "loop",
          }}
        >
          <TextRow opacity={1} />
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;