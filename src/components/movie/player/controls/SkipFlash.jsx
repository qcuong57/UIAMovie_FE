// src/components/player/controls/SkipFlash.jsx
// Hiệu ứng mờ tràn nửa trái/phải khi tua ±10s.
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SkipBack, SkipForward } from "lucide-react";

export default function SkipFlash({ skipFlash, isMobile }) {
  const back = skipFlash?.dir === "back";
  const Icon = back ? SkipBack : SkipForward;
  return (
    <AnimatePresence>
      {skipFlash && (
        <motion.div
          key={skipFlash.id}
          className={`vp-flash ${back ? "vp-flash--back" : "vp-flash--forward"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <motion.div
            className="vp-flash__inner"
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <Icon size={isMobile ? 26 : 34} fill="#fff" />
            <span className="vp-flash__label" style={{ fontSize: isMobile ? 13 : 15 }}>
              {back ? "−10 giây" : "+10 giây"}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}