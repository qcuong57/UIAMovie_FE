// src/components/player/controls/SkipButton.jsx
// Nút "Bỏ qua intro / recap" — một component dùng cho cả hai.
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FastForward } from "lucide-react";

export default function SkipButton({ visible, label, onClick, controlsShown }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          className="vp-skip-btn"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          onClick={onClick}
          style={{ bottom: controlsShown ? 80 : 20 }}
        >
          <FastForward size={14} /> {label}
        </motion.button>
      )}
    </AnimatePresence>
  );
}