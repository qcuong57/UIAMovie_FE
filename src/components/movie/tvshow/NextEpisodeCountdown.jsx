// src/components/tvshow/NextEpisodeCountdown.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SkipForward } from "lucide-react";

const NextEpisodeCountdown = ({
  nextEpisode   = null,
  secondsLeft   = Infinity,
  triggerAt     = 30,
  countdownSecs = 10,
  onNext        = () => {},
  onDismiss     = () => {},
}) => {
  const [countdown, setCountdown] = useState(countdownSecs);
  const [dismissed, setDismissed] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const intervalRef = useRef(null);
  const onNextRef   = useRef(onNext);
  onNextRef.current = onNext;

  useEffect(() => {
    clearInterval(intervalRef.current);
    setDismissed(false);
    setTriggered(false);
    setCountdown(countdownSecs);
  }, [nextEpisode?.id, countdownSecs]);

  useEffect(() => {
    if (triggered || dismissed || !nextEpisode) return;
    if (secondsLeft <= triggerAt) setTriggered(true);
  }, [secondsLeft, triggerAt, triggered, dismissed, nextEpisode]);

  useEffect(() => {
    if (!triggered || dismissed) return;
    setCountdown(countdownSecs);
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onNextRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggered, dismissed]);

  const handleDismiss = useCallback(() => {
    clearInterval(intervalRef.current);
    setDismissed(true);
    onDismiss();
  }, [onDismiss]);

  const handleNext = useCallback(() => {
    clearInterval(intervalRef.current);
    onNext();
  }, [onNext]);

  const shouldShow = triggered && !dismissed && !!nextEpisode;

  // SVG progress ring
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - countdown / countdownSecs);

  const episodeLabel = nextEpisode?.episodeNumber != null
    ? `Tập ${nextEpisode.episodeNumber}${nextEpisode.name ? `: ${nextEpisode.name}` : ""}`
    : (nextEpisode?.name ?? "Tập tiếp theo");

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="nec"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{    opacity: 0, y: 12 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            position: "absolute",
            bottom: 80,
            right: 16,
            zIndex: 25,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 8,
          }}
        >
          {/* Dismiss text link — giống Netflix */}
          <button
            onClick={handleDismiss}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.55)",
              fontFamily: "'Netflix Sans', 'Nunito', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "underline",
              padding: "2px 0",
              letterSpacing: "0.01em",
            }}
          >
            Bỏ qua
          </button>

          {/* Card — nhỏ gọn, không thumbnail */}
          <div style={{
            background: "rgba(20,20,20,0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 6,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            minWidth: 260,
            maxWidth: 320,
          }}>
            {/* Text info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
                marginBottom: 3,
              }}>
                Tiếp theo
              </p>
              <p style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {episodeLabel}
              </p>
            </div>

            {/* Play now button */}
            <button
              onClick={handleNext}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#fff",
                color: "#000",
                border: "none",
                borderRadius: 4,
                padding: "8px 14px",
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <SkipForward size={13} fill="#000" />
              Phát ngay
            </button>

            {/* Countdown ring */}
            <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r={r}
                  fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
                <circle cx="22" cy="22" r={r}
                  fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  transform="rotate(-90 22 22)"
                  style={{ transition: "stroke-dashoffset 0.9s linear" }}
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 800,
                fontSize: 14,
                color: "#fff",
              }}>
                {countdown}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NextEpisodeCountdown;