// src/components/movie/film/MovieVideoPlayer.jsx
// Video player dành riêng cho phim lẻ — tách ra từ MovieDetailPage
// Props: movie (object)

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipForward,
  SkipBack,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import movieService from "../../../services/movieService";
import { C } from "../ui/movieConstants";

// ── Helpers ─────────────────────────────────────────────────────
const fmtSecs = (s) => {
  const h = Math.floor(s / 3600);
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(Math.floor(s % 60)).padStart(2, "0");
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
};

// ══════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function MovieVideoPlayer({ movie }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const timerRef = useRef(null);
  const saveTimerRef = useRef(null);
  const progressRef = useRef(0);
  const hasResumedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [show, setShow] = useState(true);
  const [vol, setVol] = useState(80);
  const [selSrc, setSelSrc] = useState(0);

  const resumeMinutes = location.state?.resumeMinutes ?? 0;

  const videoSources = React.useMemo(() => {
    if (!movie?.videos?.length) return [];
    const main = movie.videos.filter((v) => v.videoType === "main");
    const other = movie.videos.filter((v) => v.videoType !== "main");
    return [...main, ...other];
  }, [movie?.videos]);

  const videoUrl = videoSources[selSrc]?.videoUrl ?? null;
  const totalSec = duration || (movie?.duration ? movie.duration * 60 : 0);

  // Reset khi đổi nguồn
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setPlaying(false);
    setProgress(0);
    hasResumedRef.current = false;
    v.load();
  }, [videoUrl]);

  // Gắn event listeners
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTimeUpdate = () => {
      if (!v.duration) return;
      const pct = (v.currentTime / v.duration) * 100;
      setProgress(pct);
      progressRef.current = pct;
    };
    const onDurationChange = () => setDuration(v.duration || 0);
    const onBufferProgress = () => {
      if (!v.duration || !v.buffered.length) return;
      setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
    };
    const onEnded = () => {
      setPlaying(false);
      setShow(true);
      saveProgress(100, true);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onCanPlay = () => {
      if (hasResumedRef.current) return;
      if (resumeMinutes > 0) v.currentTime = resumeMinutes * 60;
      hasResumedRef.current = true;
    };

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("durationchange", onDurationChange);
    v.addEventListener("progress", onBufferProgress);
    v.addEventListener("ended", onEnded);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("canplay", onCanPlay);

    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("durationchange", onDurationChange);
      v.removeEventListener("progress", onBufferProgress);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("canplay", onCanPlay);
    };
  }, [videoUrl, resumeMinutes]);

  // Âm lượng
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = muted ? 0 : vol / 100;
    v.muted = muted;
  }, [vol, muted]);

  // Auto-hide controls
  const resetTimer = useCallback(() => {
    setShow(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShow(false);
    }, 3500);
  }, []);

  // Lưu tiến độ xem
  const saveProgress = useCallback(
    (pct, forceComplete = false) => {
      if (!movie?.id || pct < 1) return;
      const mins = Math.floor(
        ((pct / 100) * (videoRef.current?.duration ?? totalSec)) / 60,
      );
      movieService
        .updateWatchProgress(movie.id, mins, forceComplete || pct >= 95)
        .catch((e) => console.warn("[MovieVideoPlayer] saveProgress:", e));
    },
    [movie?.id, totalSec],
  );

  // Lưu định kỳ 30s khi đang phát
  useEffect(() => {
    if (!playing) {
      clearInterval(saveTimerRef.current);
      return;
    }
    saveTimerRef.current = setInterval(() => saveProgress(progressRef.current), 30_000);
    return () => clearInterval(saveTimerRef.current);
  }, [playing, saveProgress]);

  // Lưu khi unmount
  useEffect(
    () => () => {
      if (progressRef.current > 1 && movie?.id)
        movieService
          .updateWatchProgress(
            movie.id,
            Math.floor(((progressRef.current / 100) * totalSec) / 60),
            progressRef.current >= 95,
          )
          .catch(() => {});
    },
    [movie?.id],
  );

  // ── Controls ─────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  const seek = (e) => {
    const v = videoRef.current;
    if (!v) return;
    const r = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - r.left) / r.width) * v.duration;
  };

  const skipSec = (sec) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + sec));
  };

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen?.();
  };

  const curSec = Math.floor((progress / 100) * totalSec);

  // ── Empty state ──────────────────────────────────────────────
  if (!videoUrl)
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          borderRadius: 12,
          overflow: "hidden",
          aspectRatio: "16/9",
          background: "#111",
        }}
      >
        {movie?.backdropUrl && (
          <img
            src={movie.backdropUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        )}
      </div>
    );

  // ── Player ───────────────────────────────────────────────────
  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
        aspectRatio: "16/9",
        background: "#000",
        cursor: show ? "default" : "none",
      }}
      onMouseMove={resetTimer}
      onMouseLeave={() => !videoRef.current?.paused && setShow(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        preload="metadata"
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
        onClick={togglePlay}
      />

      {/* Thumbnail backdrop khi chưa phát */}
      {!playing && progress === 0 && movie?.backdropUrl && (
        <img
          src={movie.backdropUrl}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.5,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Nút play trung tâm */}
      <AnimatePresence>
        {!playing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.28)",
              pointerEvents: "none",
            }}
          >
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={togglePlay}
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.95)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                pointerEvents: "all",
              }}
            >
              <Play size={28} fill="#000" color="#000" style={{ marginLeft: 3 }} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls overlay */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "0 20px 16px",
              background: "linear-gradient(transparent, rgba(0,0,0,0.9) 60%)",
            }}
          >
            {/* Seek bar */}
            <div
              style={{
                marginBottom: 12,
                position: "relative",
                height: 4,
                cursor: "pointer",
                paddingTop: 8,
                paddingBottom: 8,
                marginTop: -8,
                boxSizing: "content-box",
              }}
              onClick={seek}
            >
              {/* Track bg */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  right: 0,
                  height: 3,
                  marginTop: -1.5,
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.15)",
                }}
              />
              {/* Buffered */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  height: 3,
                  marginTop: -1.5,
                  width: `${buffered}%`,
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.3)",
                }}
              />
              {/* Progress */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  height: 3,
                  marginTop: -1.5,
                  width: `${progress}%`,
                  borderRadius: 2,
                  background: C.accent,
                }}
              />
              {/* Thumb */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: `${progress}%`,
                  transform: "translate(-50%,-50%)",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "white",
                }}
              />
            </div>

            {/* Bottom controls row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* Left: skip + play + volume */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 10 : 16,
                }}
              >
                <button
                  onClick={() => skipSec(-10)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.7)",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  <SkipBack size={18} />
                </button>

                <button
                  onClick={togglePlay}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "white",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  {playing ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" />}
                </button>

                <button
                  onClick={() => skipSec(10)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.7)",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  <SkipForward size={18} />
                </button>

                {/* Volume */}
                {!isMobile ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => setMuted(!muted)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(255,255,255,0.8)",
                        padding: 0,
                        display: "flex",
                      }}
                    >
                      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={muted ? 0 : vol}
                      onChange={(e) => {
                        setVol(+e.target.value);
                        if (+e.target.value > 0) setMuted(false);
                      }}
                      style={{ width: 72, accentColor: "white", cursor: "pointer" }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setMuted(!muted)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.8)",
                      padding: 0,
                      display: "flex",
                    }}
                  >
                    {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                )}

                <span
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 12,
                    fontFamily: "'Nunito',sans-serif",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmtSecs(curSec)} / {fmtSecs(totalSec)}
                </span>
              </div>

              {/* Right: quality + fullscreen */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {videoSources.length > 1 && (
                  <select
                    value={selSrc}
                    onChange={(e) => setSelSrc(+e.target.value)}
                    style={{
                      background: "rgba(0,0,0,0.6)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "white",
                      borderRadius: 4,
                      fontFamily: "'Nunito',sans-serif",
                      fontSize: 11,
                      padding: "3px 6px",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {videoSources.map((s, i) => (
                      <option key={i} value={i}>
                        {s.quality ?? s.videoType ?? `Nguồn ${i + 1}`}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={toggleFullscreen}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.7)",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  <Maximize size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}