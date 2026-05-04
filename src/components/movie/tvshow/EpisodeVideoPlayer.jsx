// src/components/tvshow/EpisodeVideoPlayer.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import tvShowService from "../../../services/tvShowService";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipForward,
  SkipBack,
} from "lucide-react";
import { C } from "../ui/movieConstants";

// Normalize bất kỳ TMDB size nào → w1280
const tmdbImg = (url) => {
  if (!url) return url;
  return url.replace(/\/t\/p\/[^/]+\//, "/t/p/w1280/");
};

// Helper format seconds → mm:ss hoặc h:mm:ss
const fmtSecs = (s) => {
  const h = Math.floor(s / 3600);
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(Math.floor(s % 60)).padStart(2, "0");
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
};

const EpisodeVideoPlayer = ({ episode, tvShow }) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const timerRef = useRef(null);
  const progressRef = useRef(0);
  const saveTimerRef = useRef(null);
  const hasResumedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [show, setShow] = useState(true);
  const [vol, setVol] = useState(80);
  const [selSrc, setSelSrc] = useState(0);

  // Resume từ WatchHistory — chỉ áp dụng khi đúng episode được resume
  const resumeSeconds =
    location.state?.resumeEpisodeId === episode?.id
      ? (location.state?.resumeSeconds ?? 0)
      : 0;

  const videoSources = React.useMemo(() => {
    // Ưu tiên episode.videos (array) nếu có
    if (episode?.videos?.length) {
      const main = episode.videos.filter((v) => v.videoType === "main");
      const other = episode.videos.filter((v) => v.videoType !== "main");
      return [...main, ...other];
    }
    // Fallback: episode.videoUrl là string đơn (từ SetEpisodeVideoAsync)
    if (episode?.videoUrl) {
      return [{ videoUrl: episode.videoUrl, videoType: "main" }];
    }
    return [];
  }, [episode?.videos, episode?.videoUrl]);

  const videoUrl = videoSources[selSrc]?.videoUrl ?? null;
  const totalSec = duration || (episode?.runtime ? episode.runtime * 60 : 0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setPlaying(false);
    setProgress(0);
    hasResumedRef.current = false;
    v.load();
  }, [videoUrl]);

  // ── Save watch progress ───────────────────────────────────────────
  const saveProgress = useCallback(
    (pct, forceComplete = false) => {
      if (!tvShow?.id || !episode?.id || pct < 1) return;
      const secs = Math.floor((pct / 100) * (videoRef.current?.duration ?? totalSec));
      tvShowService
        .updateWatchProgress({
          tvShowId:        tvShow.id,
          episodeId:       episode.id,
          progressSeconds: secs,
          isCompleted:     forceComplete || pct >= 95,
        })
        .catch((e) => console.warn("[EpisodeVideoPlayer] saveProgress:", e));
    },
    [tvShow?.id, episode?.id, totalSec],
  );

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
    const onProgress = () => {
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
      if (resumeSeconds > 0) v.currentTime = resumeSeconds;
      hasResumedRef.current = true;
    };

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("durationchange", onDurationChange);
    v.addEventListener("progress", onProgress);
    v.addEventListener("ended", onEnded);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("canplay", onCanPlay);

    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("durationchange", onDurationChange);
      v.removeEventListener("progress", onProgress);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("canplay", onCanPlay);
    };
  }, [videoUrl, saveProgress, resumeSeconds]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = muted ? 0 : vol / 100;
    v.muted = muted;
  }, [vol, muted]);

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
      if (progressRef.current > 1 && tvShow?.id && episode?.id)
        tvShowService
          .updateWatchProgress({
            tvShowId:        tvShow.id,
            episodeId:       episode.id,
            progressSeconds: Math.floor((progressRef.current / 100) * totalSec),
            isCompleted:     progressRef.current >= 95,
          })
          .catch(() => {});
    },
    [tvShow?.id, episode?.id],
  );

  const resetTimer = useCallback(() => {
    setShow(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShow(false);
    }, 3500);
  }, []);

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
    document.fullscreenElement
      ? document.exitFullscreen()
      : el.requestFullscreen?.();
  };

  const curSec = Math.floor((progress / 100) * totalSec);
  const backdropUrl = tmdbImg(episode?.stillUrl ?? tvShow?.backdropUrl ?? null);

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
        {backdropUrl && (
          <img
            src={backdropUrl}
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

      {!playing && progress === 0 && backdropUrl && (
        <img
          src={backdropUrl}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Center play button */}
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
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
              padding: isMobile ? "24px 12px 14px" : "40px 20px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {/* Progress bar */}
            <div
              onClick={seek}
              style={{
                position: "relative",
                height: 4,
                background: "rgba(255,255,255,0.2)",
                borderRadius: 2,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  width: `${buffered}%`,
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.3)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  width: `${progress}%`,
                  borderRadius: 2,
                  background: C.accent,
                }}
              />
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16 }}>
                <button
                  onClick={() => skipSec(-10)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 0, display: "flex" }}
                >
                  <SkipBack size={18} />
                </button>
                <button
                  onClick={togglePlay}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "white", padding: 0, display: "flex" }}
                >
                  {playing ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" />}
                </button>
                <button
                  onClick={() => skipSec(10)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 0, display: "flex" }}
                >
                  <SkipForward size={18} />
                </button>

                {!isMobile ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => setMuted(!muted)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.8)", padding: 0, display: "flex" }}
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
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.8)", padding: 0, display: "flex" }}
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
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 0, display: "flex" }}
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
};

export default EpisodeVideoPlayer;