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
          className="vp-subtitle-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          style={{ bottom: controlsShown ? 78 : 24 }}
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