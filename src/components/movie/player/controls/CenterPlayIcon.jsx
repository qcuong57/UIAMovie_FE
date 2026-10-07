// src/components/player/controls/CenterPlayIcon.jsx
// Nút play/pause giữa màn hình: hiện khi đang dừng hoặc khi flash phản hồi.
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause } from "lucide-react";

export default function CenterPlayIcon({ isAd, playing, centerIcon, onToggle }) {
  const show = !isAd && (!playing || centerIcon);
  const showPlay = centerIcon === "play" || (!centerIcon && !playing);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`vp-center${!playing ? " vp-center--dim" : ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            key={centerIcon ?? (playing ? "play" : "pause")}
            className={`vp-center__btn${centerIcon ? " vp-center__btn--flash" : ""}`}
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.15, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={centerIcon ? undefined : onToggle}
          >
            {showPlay ? (
              <Play size={26} fill="#000" color="#000" style={{ marginLeft: 3 }} />
            ) : (
              <Pause size={26} fill="#000" color="#000" />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}