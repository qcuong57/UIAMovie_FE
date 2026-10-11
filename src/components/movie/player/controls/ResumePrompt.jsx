// src/components/player/controls/ResumePrompt.jsx
// Popup hỏi "Xem tiếp hay xem từ đầu" — phủ kín player, chặn mọi thao tác phát cho tới khi chọn.
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";
import { fmtSecs } from "../../../../utils/playerUtils";

export default function ResumePrompt({ open, seconds, onResume, onRestart }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="vp-resume"
          role="dialog"
          aria-modal="true"
          aria-label="Tiếp tục xem"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="vp-resume__card"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            <p className="vp-resume__title">Tiếp tục xem?</p>
            <p className="vp-resume__desc">
              Bạn đã xem đến <b>{fmtSecs(seconds)}</b>
            </p>
            <button className="vp-resume__btn vp-resume__btn--primary" onClick={onResume} autoFocus>
              <Play size={16} fill="currentColor" /> Xem tiếp từ {fmtSecs(seconds)}
            </button>
            <button className="vp-resume__btn" onClick={onRestart}>
              <RotateCcw size={16} /> Xem từ đầu
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}