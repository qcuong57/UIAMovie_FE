// src/components/player/controls/SubtitleOverlay.jsx
import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function SubtitleOverlay({ cue, visible, controlsShown, isFullscreen, isMobile }) {
  const fontSize = isFullscreen ? "clamp(20px, 2.4vw, 48px)" : isMobile ? 13 : 16;
  return (
    <AnimatePresence>
      {visible && cue && (
        <motion.div
          key={cue.start}
          // Vị trí dọc do CSS quyết định (kể cả fullscreen) → chỉ cần bật/tắt modifier
          className={`vp-subtitle-overlay${controlsShown ? " vp-subtitle-overlay--lifted" : ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          {cue.text.split("\n").map((line, i) => (
            <div key={i} className="vp-subtitle-line" style={{ fontSize }}>
              {line}
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}