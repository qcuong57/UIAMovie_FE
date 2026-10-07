// src/components/player/controls/ProgressBar.jsx
// Kiểu YouTube: vùng bấm rộng, track mảnh, núm chỉ hiện khi hover. Khoá khi đang ad.
import React from "react";

export default function ProgressBar({ progress, buffered, locked, isAd, onSeek }) {
  const handleClick = (e) => {
    if (locked) return;
    const r = e.currentTarget.getBoundingClientRect();
    onSeek((e.clientX - r.left) / r.width);
  };
  return (
    <div
      className={`vp-progress-wrap${locked ? " vp-progress-wrap--locked" : ""}`}
      onClick={handleClick}
    >
      <div className="vp-progress-track">
        <div className="vp-progress-buffer" style={{ width: `${buffered}%` }} />
        <div
          className={`vp-progress-fill${isAd ? " vp-progress-fill--ad" : ""}`}
          style={{ width: `${progress}%` }}
        />
        <div className="vp-progress-thumb" style={{ left: `${progress}%` }} />
      </div>
    </div>
  );
}