// src/components/tvshow/EpisodeVideoPlayer.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import tvShowService from "../../../services/tvShowService";
import episodeSubtitleService from "../../../services/episodeSubtitleService";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipForward,
  SkipBack,
  Subtitles,
  Gauge,
  FastForward,
} from "lucide-react";
import { C } from "../ui/movieConstants";
import NextEpisodeCountdown from "./NextEpisodeCountdown";

// ── VTT / SRT parser → cue list [{start, end, text}] ────────────
function parseCues(raw) {
  if (!raw) return [];
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const cues = [];
  let i = 0;
  const timeToSec = (t) => {
    const cleaned = t.replace(",", ".");
    const parts = cleaned.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes("-->")) {
      const [startRaw, endRaw] = line.split("-->").map((s) => s.trim().split(" ")[0]);
      const start = timeToSec(startRaw);
      const end   = timeToSec(endRaw);
      i++;
      const textLines = [];
      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i].trim());
        i++;
      }
      const text = textLines.join("\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\{[^}]+\}/g, "");
      if (text) cues.push({ start, end, text });
    } else { i++; }
  }
  return cues;
}

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

// nextEpisode: { id, episodeNumber, name, stillUrl } | null
// onNextEpisode: callback() khi muốn chuyển sang tập tiếp theo
const EpisodeVideoPlayer = ({ episode, tvShow, nextEpisode = null, onNextEpisode = null }) => {
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Playback speed ──────────────────────────────────────────
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const speedMenuRef = useRef(null);
  const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // ── Skip Intro / Recap ──────────────────────────────────────
  // episode prop có thể có: introStart, introEnd, recapStart, recapEnd (giây)
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipRecap, setShowSkipRecap] = useState(false);

  // ── Keyboard hint toast ─────────────────────────────────────
  const [kbHint, setKbHint] = useState(null);
  const kbHintTimer = useRef(null);
  const showKbHint = useCallback((label) => {
    setKbHint(label);
    clearTimeout(kbHintTimer.current);
    kbHintTimer.current = setTimeout(() => setKbHint(null), 900);
  }, []);

  // ── Center icon flash (play/pause) ──────────────────────────
  const [centerIcon, setCenterIcon] = useState(null); // "play" | "pause"
  const centerIconTimer = useRef(null);
  const flashCenterIcon = useCallback((type) => {
    setCenterIcon(type);
    clearTimeout(centerIconTimer.current);
    centerIconTimer.current = setTimeout(() => setCenterIcon(null), 700);
  }, []);

  // ── Subtitle state ──────────────────────────────────────────
  const [subtitles,   setSubtitles]   = useState([]);   // EpisodeSubtitleDTO[]
  const [selSubId,    setSelSubId]    = useState(null); // null = tắt
  const [cues,        setCues]        = useState([]);   // parsed cues
  const [activeCue,   setActiveCue]   = useState(null); // cue hiện tại
  const [subLoading,  setSubLoading]  = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const subMenuRef = useRef(null);
  const currentTimeRef = useRef(0);

  // ── Next episode countdown ───────────────────────────────────
  // secondsLeft: số giây còn lại của video (Infinity khi chưa có duration)
  const [secondsLeft, setSecondsLeft] = useState(Infinity);

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

  // ── Fetch subtitle list khi episode thay đổi ─────────────────
  useEffect(() => {
    if (!episode?.id) return;
    setSubtitles([]); setSelSubId(null); setCues([]); setActiveCue(null);
    episodeSubtitleService.getSubtitles(episode.id)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const ready = list.filter((s) => s.status === 0);
        setSubtitles(ready);
        const def = ready.find((s) => s.isDefault);
        if (def) setSelSubId(def.id);
      })
      .catch(() => {});
  }, [episode?.id]);

  // ── Load content của subtitle được chọn ─────────────────────
  useEffect(() => {
    if (!selSubId || !episode?.id) { setCues([]); setActiveCue(null); return; }
    setSubLoading(true);
    episodeSubtitleService.getSubtitleContent(episode.id, selSubId)
      .then((dto) => { setCues(parseCues(dto?.content ?? "")); })
      .catch(() => setCues([]))
      .finally(() => setSubLoading(false));
  }, [selSubId, episode?.id]);

  // ── Tìm cue active theo currentTime ─────────────────────────
  useEffect(() => {
    if (!cues.length) { setActiveCue(null); return; }
    const v = videoRef.current;
    if (!v) return;
    // Tính ngay activeCue từ currentTime hiện tại khi cues mới được load
    const t0 = v.currentTime;
    const initial = cues.find((c) => t0 >= c.start && t0 < c.end) ?? null;
    setActiveCue(initial);
    const onTime = () => {
      const t = v.currentTime;
      currentTimeRef.current = t;
      const found = cues.find((c) => t >= c.start && t < c.end) ?? null;
      setActiveCue((prev) => {
        if (prev === found) return prev;
        if (!prev && !found) return prev;
        if (prev?.start === found?.start && prev?.end === found?.end) return prev;
        return found;
      });
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [cues]);

  // ── Đóng sub menu khi click ngoài ───────────────────────────
  useEffect(() => {
    if (!showSubMenu) return;
    const handler = (e) => {
      if (subMenuRef.current && !subMenuRef.current.contains(e.target))
        setShowSubMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSubMenu]);

  // ── Đóng speed menu khi click ngoài ─────────────────────────
  useEffect(() => {
    if (!showSpeedMenu) return;
    const handler = (e) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target))
        setShowSpeedMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSpeedMenu]);

  // ── Track fullscreen state ───────────────────────────────────
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

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
  // FIX: Dùng videoRef.current.duration trực tiếp thay vì totalSec từ closure
  // để tránh stale value khi duration chưa load kịp
  const saveProgress = useCallback(
    (pct, forceComplete = false) => {
      if (!tvShow?.id || !episode?.id || pct < 1) return;
      const dur = videoRef.current?.duration || (episode?.runtime ? episode.runtime * 60 : 0);
      const secs = Math.floor((pct / 100) * dur);
      if (secs < 1) return; // bỏ qua nếu tính ra 0 giây (duration chưa load)
      tvShowService
        .updateWatchProgress({
          tvShowId:        tvShow.id,
          episodeId:       episode.id,
          progressSeconds: secs,
          isCompleted:     forceComplete || pct >= 95,
        })
        .catch((e) => console.warn("[EpisodeVideoPlayer] saveProgress:", e));
    },
    [tvShow?.id, episode?.id, episode?.runtime],
  );

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTimeUpdate = () => {
      if (!v.duration) return;
      const pct = (v.currentTime / v.duration) * 100;
      setProgress(pct);
      progressRef.current = pct;
      // Cập nhật số giây còn lại để NextEpisodeCountdown dùng
      setSecondsLeft(v.duration - v.currentTime);
    };
    const onDurationChange = () => setDuration(v.duration || 0);
    const onProgress = () => {
      if (!v.duration || !v.buffered.length) return;
      setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
    };
    const onEnded = () => {
      setPlaying(false);
      setShow(true);
      setSecondsLeft(0);
      saveProgress(100, true);
    };
    const onPlay = () => setPlaying(true);
    // FIX: Lưu progress khi pause thay vì chỉ update state
    const onPause = () => {
      setPlaying(false);
      saveProgress(progressRef.current);
    };
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

  // Playback rate
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = playbackRate;
  }, [playbackRate]);

  // FIX: Lưu định kỳ 15s (thay vì 30s) khi đang phát
  useEffect(() => {
    if (!playing) {
      clearInterval(saveTimerRef.current);
      return;
    }
    saveTimerRef.current = setInterval(() => saveProgress(progressRef.current), 15_000);
    return () => clearInterval(saveTimerRef.current);
  }, [playing, saveProgress]);

  // FIX: Lưu khi unmount — dùng videoRef.current.duration trực tiếp
  // thay vì totalSec (có thể bị stale nếu không có trong dependency array)
  useEffect(
    () => () => {
      const v = videoRef.current;
      if (progressRef.current > 1 && tvShow?.id && episode?.id) {
        const dur = v?.duration || (episode?.runtime ? episode.runtime * 60 : 0);
        if (dur < 1) return;
        tvShowService
          .updateWatchProgress({
            tvShowId:        tvShow.id,
            episodeId:       episode.id,
            progressSeconds: Math.floor((progressRef.current / 100) * dur),
            isCompleted:     progressRef.current >= 95,
          })
          .catch(() => {});
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tvShow?.id, episode?.id],
  );

  // ── Keyboard shortcuts ───────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      const v = videoRef.current;
      if (!v) return;
      switch (e.code) {
        case "Space":
        case "KeyK":
          e.preventDefault();
          if (v.paused) {
            v.play();
            flashCenterIcon("play");
          } else {
            v.pause();
            flashCenterIcon("pause");
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 10);
          showKbHint("⏪ −10s");
          break;
        case "ArrowRight":
          e.preventDefault();
          v.currentTime = Math.min(v.duration, v.currentTime + 10);
          showKbHint("⏩ +10s");
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          showKbHint("⛶ Fullscreen");
          break;
        case "KeyM":
          e.preventDefault();
          setMuted((m) => !m);
          break;
        case "KeyC":
          e.preventDefault();
          setShowSubMenu((p) => !p);
          showKbHint("💬 Subtitles");
          break;
        default: break;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showKbHint, flashCenterIcon]);

  // ── Skip Intro / Recap visibility ────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      const t = v.currentTime;
      const { introStart, introEnd, recapStart, recapEnd } = episode ?? {};
      setShowSkipIntro(!!(introStart != null && introEnd != null && t >= introStart && t < introEnd));
      setShowSkipRecap(!!(recapStart != null && recapEnd != null && t >= recapStart && t < recapEnd));
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [episode]);

  const skipIntro = () => {
    const v = videoRef.current;
    if (!v || episode?.introEnd == null) return;
    v.currentTime = episode.introEnd;
    setShowSkipIntro(false);
  };

  const skipRecap = () => {
    const v = videoRef.current;
    if (!v || episode?.recapEnd == null) return;
    v.currentTime = episode.recapEnd;
    setShowSkipRecap(false);
  };

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
    if (v.paused) {
      v.play();
      flashCenterIcon("play");
    } else {
      v.pause();
      flashCenterIcon("pause");
    }
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
    <>
    <style>{`
      :fullscreen .ep-subtitle-overlay,
      :-webkit-full-screen .ep-subtitle-overlay,
      :-moz-full-screen .ep-subtitle-overlay {
        bottom: 96px !important;
      }
    `}</style>
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

      {/* ── Keyboard hint toast ── */}
      <AnimatePresence>
        {kbHint && (
          <motion.div
            key={kbHint}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(6px)",
              borderRadius: 10,
              padding: "10px 20px",
              color: "#fff",
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 800,
              fontSize: 15,
              pointerEvents: "none",
              zIndex: 30,
              whiteSpace: "nowrap",
            }}
          >
            {kbHint}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Skip Intro button ── */}
      <AnimatePresence>
        {showSkipIntro && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            onClick={skipIntro}
            style={{
              position: "absolute",
              bottom: show ? 80 : 20,
              right: 20,
              background: "rgba(20,20,20,0.88)",
              backdropFilter: "blur(10px)",
              border: "1.5px solid rgba(255,255,255,0.22)",
              borderRadius: 8,
              color: "#fff",
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 800,
              fontSize: 13,
              padding: "8px 18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              zIndex: 20,
              transition: "bottom 0.25s ease",
              letterSpacing: "0.02em",
            }}
          >
            <FastForward size={14} /> Bỏ qua intro
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Skip Recap button ── */}
      <AnimatePresence>
        {showSkipRecap && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            onClick={skipRecap}
            style={{
              position: "absolute",
              bottom: show ? 80 : 20,
              right: 20,
              background: "rgba(20,20,20,0.88)",
              backdropFilter: "blur(10px)",
              border: "1.5px solid rgba(255,255,255,0.22)",
              borderRadius: 8,
              color: "#fff",
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 800,
              fontSize: 13,
              padding: "8px 18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              zIndex: 20,
              transition: "bottom 0.25s ease",
              letterSpacing: "0.02em",
            }}
          >
            <FastForward size={14} /> Bỏ qua recap
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Next episode countdown (Netflix style) ── */}
      {nextEpisode && onNextEpisode && (
        <NextEpisodeCountdown
          nextEpisode={nextEpisode}
          secondsLeft={secondsLeft}
          triggerAt={30}
          countdownSecs={10}
          onNext={onNextEpisode}
          onDismiss={() => {}}
        />
      )}

      {/* ── Subtitle cue overlay ── */}
      <AnimatePresence>
        {activeCue && selSubId && (
          <motion.div
            key={activeCue.start}
            className="ep-subtitle-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "absolute",
              bottom: show ? 78 : 24,
              left: "50%",
              transform: "translateX(-50%)",
              width: "90%",
              maxWidth: "90%",
              textAlign: "center",
              pointerEvents: "none",
              transition: "bottom 0.25s ease",
              zIndex: 10,
            }}
          >
            {activeCue.text.split("\n").map((line, idx) => (
              <div
                key={idx}
                style={{
                  display: "block",
                  width: "100%",
                  color: "#fff",
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: isFullscreen ? "clamp(20px, 2.4vw, 48px)" : (isMobile ? 13 : 16),
                  fontWeight: 700,
                  lineHeight: 1.5,
                  textShadow:
                    "0 1px 0 #000, 0 -1px 0 #000, 1px 0 0 #000, -1px 0 0 #000, 0 2px 8px rgba(0,0,0,0.85)",
                  letterSpacing: "0.01em",
                  WebkitFontSmoothing: "antialiased",
                }}
              >
                {line}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center play/pause button — hiện khi pause, hoặc khi flash icon (Space/click) */}
      <AnimatePresence>
        {(!playing || centerIcon) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: !playing ? "rgba(0,0,0,0.28)" : "transparent",
              pointerEvents: "none",
            }}
          >
            <motion.div
              key={centerIcon ?? (playing ? "play" : "pause")}
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.15, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.92)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 24px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.3)",
                pointerEvents: centerIcon ? "none" : "all",
                backdropFilter: "blur(4px)",
                cursor: centerIcon ? "default" : "pointer",
              }}
              onClick={centerIcon ? undefined : togglePlay}
            >
              {(centerIcon === "pause" || (!centerIcon && !playing))
                ? <Pause size={26} fill="#000" color="#000" />
                : <Play size={26} fill="#000" color="#000" style={{ marginLeft: 3 }} />
              }
            </motion.div>
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
              background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
              padding: isMobile ? "32px 14px 14px" : "56px 20px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {/* Progress bar */}
            <div
              onClick={seek}
              className="ep-progress-bar"
              style={{
                position: "relative",
                height: 4,
                background: "rgba(255,255,255,0.18)",
                borderRadius: 3,
                cursor: "pointer",
                transition: "height 0.15s ease",
                marginBottom: 2,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.height = "6px"; }}
              onMouseLeave={(e) => { e.currentTarget.style.height = "4px"; }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  width: `${buffered}%`,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.28)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  width: `${progress}%`,
                  borderRadius: 3,
                  background: C.accent,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: `${progress}%`,
                  transform: "translate(-50%,-50%)",
                  width: 13,
                  height: 13,
                  borderRadius: "50%",
                  background: "white",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
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

                {/* ── Speed button + dropdown ── */}
                <div ref={speedMenuRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => { setShowSpeedMenu((p) => !p); setShowSubMenu(false); }}
                    title="Tốc độ phát"
                    style={{
                      background: playbackRate !== 1 ? "rgba(255,255,255,0.18)" : "none",
                      border: playbackRate !== 1 ? "1px solid rgba(255,255,255,0.3)" : "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      color: playbackRate !== 1 ? "#fff" : "rgba(255,255,255,0.65)",
                      padding: "2px 6px",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontFamily: "'Nunito',sans-serif",
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      transition: "all 0.15s",
                    }}
                  >
                    <Gauge size={15} />
                    {playbackRate !== 1 && <span>{playbackRate}x</span>}
                  </button>

                  <AnimatePresence>
                    {showSpeedMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: "absolute",
                          bottom: "calc(100% + 10px)",
                          right: 0,
                          background: "rgba(18,18,18,0.97)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 10,
                          overflow: "hidden",
                          minWidth: 120,
                          boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
                          zIndex: 50,
                        }}
                      >
                        <div style={{ padding: "8px 12px 6px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                          <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            Tốc độ phát
                          </p>
                        </div>
                        {SPEED_OPTIONS.map((rate) => (
                          <button
                            key={rate}
                            onClick={() => { setPlaybackRate(rate); setShowSpeedMenu(false); }}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              width: "100%", padding: "9px 12px",
                              background: playbackRate === rate ? "rgba(255,255,255,0.07)" : "none",
                              border: "none", cursor: "pointer",
                              fontFamily: "'Nunito',sans-serif", fontSize: 13,
                              fontWeight: playbackRate === rate ? 700 : 500,
                              color: playbackRate === rate ? "#fff" : "rgba(255,255,255,0.65)",
                              textAlign: "left", transition: "background 0.12s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = playbackRate === rate ? "rgba(255,255,255,0.07)" : "none"}
                          >
                            {rate === 1 ? "Bình thường" : `${rate}x`}
                            {playbackRate === rate && <span style={{ color: C.accent, fontSize: 11 }}>✓</span>}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── CC button + dropdown ── */}
                {subtitles.length > 0 && (
                  <div ref={subMenuRef} style={{ position: "relative" }}>
                    <button
                      onClick={() => setShowSubMenu((p) => !p)}
                      title="Phụ đề"
                      style={{
                        background: selSubId ? "rgba(255,255,255,0.18)" : "none",
                        border: selSubId ? "1px solid rgba(255,255,255,0.3)" : "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        color: selSubId ? "#fff" : "rgba(255,255,255,0.65)",
                        padding: selSubId ? "2px 6px" : 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        transition: "all 0.15s",
                      }}
                    >
                      <Subtitles size={18} />
                      {subLoading && (
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>…</span>
                      )}
                    </button>

                    {/* Dropdown menu */}
                    <AnimatePresence>
                      {showSubMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            position: "absolute",
                            bottom: "calc(100% + 10px)",
                            right: 0,
                            background: "rgba(18,18,18,0.97)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 10,
                            overflow: "hidden",
                            minWidth: 168,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
                            zIndex: 50,
                          }}
                        >
                          {/* Header */}
                          <div style={{ padding: "8px 12px 6px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                            <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                              Phụ đề
                            </p>
                          </div>

                          {/* Tắt phụ đề */}
                          <button
                            onClick={() => { setSelSubId(null); setCues([]); setActiveCue(null); setShowSubMenu(false); }}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              width: "100%", padding: "9px 12px",
                              background: !selSubId ? "rgba(255,255,255,0.07)" : "none",
                              border: "none", cursor: "pointer",
                              fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: !selSubId ? 700 : 500,
                              color: !selSubId ? "#fff" : "rgba(255,255,255,0.6)",
                              textAlign: "left", transition: "background 0.12s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = !selSubId ? "rgba(255,255,255,0.07)" : "none"}
                          >
                            Tắt phụ đề
                            {!selSubId && <span style={{ color: C.accent, fontSize: 11 }}>✓</span>}
                          </button>

                          {/* Danh sách ngôn ngữ */}
                          {subtitles.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => { setSelSubId(s.id); setShowSubMenu(false); }}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                width: "100%", padding: "9px 12px",
                                background: selSubId === s.id ? "rgba(255,255,255,0.07)" : "none",
                                border: "none", cursor: "pointer",
                                fontFamily: "'Nunito',sans-serif", fontSize: 13,
                                fontWeight: selSubId === s.id ? 700 : 500,
                                color: selSubId === s.id ? "#fff" : "rgba(255,255,255,0.65)",
                                textAlign: "left", gap: 8, transition: "background 0.12s",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = selSubId === s.id ? "rgba(255,255,255,0.07)" : "none"}
                            >
                              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{
                                  fontSize: 10, fontWeight: 800, padding: "1px 5px",
                                  borderRadius: 4, background: "rgba(255,255,255,0.1)",
                                  color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em",
                                }}>
                                  {(s.languageCode ?? "??").toUpperCase()}
                                </span>
                                {s.languageName || s.languageCode}
                              </span>
                              {selSubId === s.id && <span style={{ color: C.accent, fontSize: 11 }}>✓</span>}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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
    </>
  );
};

export default EpisodeVideoPlayer;