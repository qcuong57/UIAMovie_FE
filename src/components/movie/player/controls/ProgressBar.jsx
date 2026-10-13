// src/components/player/controls/ProgressBar.jsx
// Kiểu YouTube: bấm để tua, KÉO để tua liên tục (video chạy theo ngón tay), có nhãn thời gian nổi.
// Dùng Pointer Events + pointer capture → chuột & cảm ứng đều kéo được, kéo ra ngoài thanh vẫn không mất.
import React, { useEffect, useRef, useState } from "react";
import { fmtSecs } from "../../../../utils/playerUtils";

const LIVE_SEEK_MS = 120; // giãn cách tối thiểu giữa 2 lần tua khi đang kéo

export default function ProgressBar({
  progress,
  buffered,
  locked,
  isAd,
  totalSec = 0,
  onSeek,
  onActivity,
}) {
  const wrapRef = useRef(null);
  const draggingRef = useRef(false);
  const lastSeekRef = useRef(0);
  const clearTimerRef = useRef(null);
  // % đang kéo (null = không kéo). Giữ thêm chút sau khi thả để thanh không nhảy lại vị trí cũ.
  const [scrub, setScrub] = useState(null);
  // Vị trí chuột đang rê (chỉ desktop): { pct, px }
  const [hover, setHover] = useState(null);
  const [tipPx, setTipPx] = useState(0);

  useEffect(() => () => clearTimeout(clearTimerRef.current), []);

  const measure = (e) => {
    const r = wrapRef.current.getBoundingClientRect();
    const w = r.width || 1;
    const x = Math.min(w, Math.max(0, e.clientX - r.left));
    return { ratio: x / w, px: x, width: w };
  };

  const handleDown = (e) => {
    if (locked) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    clearTimeout(clearTimerRef.current);
    draggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    const m = measure(e);
    setScrub(m.ratio * 100);
    setTipPx(m.px);
    lastSeekRef.current = Date.now();
    onSeek(m.ratio); // tua ngay khi chạm
    onActivity?.();
  };

  const handleMove = (e) => {
    const m = measure(e);
    if (draggingRef.current) {
      setScrub(m.ratio * 100);
      setTipPx(m.px);
      onActivity?.(); // đang kéo → không tự ẩn controls
      const now = Date.now();
      if (now - lastSeekRef.current >= LIVE_SEEK_MS) {
        lastSeekRef.current = now;
        onSeek(m.ratio); // video chạy theo ngón tay
      }
    } else if (e.pointerType === "mouse" && !locked) {
      setHover({ pct: m.ratio * 100, px: m.px });
    }
  };

  const finish = (e, commit) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (commit) {
      onSeek(measure(e).ratio); // lần tua cuối chính xác tại điểm thả
      clearTimerRef.current = setTimeout(() => setScrub(null), 350);
    } else {
      setScrub(null);
    }
  };

  const dragging = scrub !== null;
  const shown = dragging ? scrub : progress;

  // Nhãn thời gian: khi kéo dùng vị trí kéo, khi rê chuột dùng vị trí chuột
  const tipPct = dragging ? scrub : hover?.pct ?? null;
  const tipX = dragging ? tipPx : hover?.px ?? 0;
  const showTip = !locked && tipPct !== null && totalSec > 0;
  const width = wrapRef.current?.getBoundingClientRect().width ?? 0;
  const tipLeft = width ? Math.min(width - 28, Math.max(28, tipX)) : tipX;

  return (
    <div
      ref={wrapRef}
      className={
        "vp-progress-wrap" +
        (locked ? " vp-progress-wrap--locked" : "") +
        (dragging ? " vp-progress-wrap--dragging" : "")
      }
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={(e) => finish(e, true)}
      onPointerCancel={(e) => finish(e, false)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
    >
      {showTip && (
        <div className="vp-progress-tip" style={{ left: tipLeft }}>
          {fmtSecs(Math.floor((tipPct / 100) * totalSec))}
        </div>
      )}
      <div className="vp-progress-track">
        <div className="vp-progress-buffer" style={{ width: `${buffered}%` }} />
        <div
          className={`vp-progress-fill${isAd ? " vp-progress-fill--ad" : ""}`}
          style={{ width: `${shown}%` }}
        />
        <div className="vp-progress-thumb" style={{ left: `${shown}%` }} />
      </div>
    </div>
  );
}