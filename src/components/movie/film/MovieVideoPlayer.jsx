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
  Subtitles,
  Gauge,
  FastForward,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import movieService from "../../../services/movieService";
import movieSubtitleService from "../../../services/movieSubtitleService";
import { C } from "../ui/movieConstants";
import { useAdManager } from "../../../hooks/useAdManager";
import AdOverlay from "../shared/AdOverlay";

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
      const [startRaw, endRaw] = line
        .split("-->")
        .map((s) => s.trim().split(" ")[0]);
      const start = timeToSec(startRaw);
      const end = timeToSec(endRaw);
      i++;
      const textLines = [];
      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i].trim());
        i++;
      }
      const text = textLines
        .join("\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\{[^}]+\}/g, "");
      if (text) cues.push({ start, end, text });
    } else {
      i++;
    }
  }
  return cues;
}

// BE có thể trả status dạng số (0/1/2) hoặc dạng chuỗi ("Ready"/"Processing"/"Failed")
// tuỳ cấu hình serializer. Chuẩn hoá về số để so sánh nhất quán (đồng bộ với EpisodeVideoPlayer).
const SUBTITLE_STATUS_READY = 0;
const normalizeSubtitleStatus = (status) => {
  if (typeof status === "number") return status;
  if (typeof status === "string") {
    const map = { ready: 0, processing: 1, failed: 2 };
    return map[status.toLowerCase()] ?? status;
  }
  return status;
};

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
export default function MovieVideoPlayer({ movie, isFreeUser = false }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const timerRef = useRef(null);
  const saveTimerRef = useRef(null);
  const progressRef = useRef(0);
  const hasResumedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [videoReady, setVideoReady] = useState(false); // true sau khi video fire canplay lần đầu
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [show, setShow] = useState(true);
  const [vol, setVol] = useState(80);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Playback speed ──────────────────────────────────────────
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const speedMenuRef = useRef(null);
  const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // ── Skip Intro / Recap ──────────────────────────────────────
  // movie prop có thể có: introStart, introEnd, recapStart, recapEnd (giây)
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipRecap, setShowSkipRecap] = useState(false);

  // ── Keyboard hint toast ─────────────────────────────────────
  const [kbHint, setKbHint] = useState(null); // { icon, label }
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
  const [subtitles, setSubtitles] = useState([]); // SubtitleInfoDTO[]
  const [selSubId, setSelSubId] = useState(null); // null = tắt
  const [cues, setCues] = useState([]); // parsed cues
  const [activeCue, setActiveCue] = useState(null); // cue hiện tại
  const [subLoading, setSubLoading] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const subMenuRef = useRef(null);
  const currentTimeRef = useRef(0);

  const resumeMinutes = location.state?.resumeMinutes ?? 0;

  // ── videoUrl — hoist lên trước useAdManager (đồng bộ với EpisodeVideoPlayer) ──
  const videoUrl = React.useMemo(() => {
    if (!movie?.videos?.length) return null;
    const main = movie.videos.find((v) => v.videoType === "main");
    return (main ?? movie.videos[0])?.videoUrl ?? null;
  }, [movie?.videos]);

  // ── Ad manager (dùng chung với EpisodeVideoPlayer) ──────────────────
  const adManager = useAdManager({
    isFreeUser,
    contentType: "Movie",
    contentId: movie?.id ?? null,
    parentId: null,
    videoRef,
    videoReady,
    contentUrl: videoUrl,
  });
  const { triggerPostRoll, tryStartPreRoll } = adManager;
  // true khi đang phát quảng cáo — dùng để block seek/skip và đổi màu progress
  const isAd = !!adManager.currentAd;

  // ── Bắt đầu playback (content hoặc preroll) ───────────────────
  // BẮT BUỘC dùng hàm này ở MỌI nơi thay vì gọi v.play() trực tiếp khi
  // đang paused (nút play giữa màn hình, tap video, phím Space/K). Lý do:
  // tryStartPreRoll() cần được gọi ĐỒNG BỘ, ngay bên trong call stack của
  // user gesture (click/tap) — nếu preroll ads có, nó swap src sang ad rồi
  // gọi play() ngay trong gesture đó, thỏa policy autoplay của iOS Safari.
  // Gọi play() cho ad qua useEffect/async khiến iOS reject play() âm thầm
  // vì không còn nằm trong "user activation" nữa (đồng bộ với EpisodeVideoPlayer).
  const startPlayback = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (tryStartPreRoll()) return; // đã swap sang ad + play() bên trong
    v.play().catch((err) =>
      console.warn("[MovieVideoPlayer] play() failed:", err),
    );
  }, [tryStartPreRoll]);

  // ── Fetch subtitle list khi movie thay đổi ───────────────────
  useEffect(() => {
    if (!movie?.id) return;
    movieSubtitleService
      .getSubtitles(movie.id)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        // Chỉ hiện subtitle đã Ready
        const ready = list.filter((s) => normalizeSubtitleStatus(s.status) === SUBTITLE_STATUS_READY);
        setSubtitles(ready);
        // Auto-select subtitle mặc định nếu có
        const def = ready.find((s) => s.isDefault);
        if (def) setSelSubId(def.id);
      })
      .catch(() => {});
  }, [movie?.id]);

  // ── Load content của subtitle được chọn ─────────────────────
  useEffect(() => {
    if (!selSubId || !movie?.id) {
      setCues([]);
      setActiveCue(null);
      return;
    }
    setSubLoading(true);
    movieSubtitleService
      .getSubtitleContent(movie.id, selSubId)
      .then((dto) => {
        setCues(parseCues(dto?.content ?? ""));
      })
      .catch(() => setCues([]))
      .finally(() => setSubLoading(false));
  }, [selSubId, movie?.id]);

  // ── Tìm cue active theo currentTime ─────────────────────────
  // ── Tìm cue active theo currentTime ─────────────────────────
  useEffect(() => {
    if (!cues.length) {
      setActiveCue(null);
      return;
    }
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
        if (prev?.start === found?.start && prev?.end === found?.end)
          return prev;
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

  const totalSec = duration || (movie?.duration ? movie.duration * 60 : 0);

  // Reset khi đổi nguồn
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setPlaying(false);
    setProgress(0);
    setVideoReady(false); // reset để preRoll effect chờ canplay mới
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
      // Nếu đang trong ad break, hook tự xử lý qua listener trên videoRef
      if (adManager.isAdPlayingRef.current) return;
      if (triggerPostRoll()) return;
      setPlaying(false);
      setShow(true);
      saveProgress(100, true);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      saveProgress(progressRef.current);
    };
    const onCanPlay = () => {
      setVideoReady(true);
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
  }, [videoUrl, resumeMinutes, triggerPostRoll]);

  // Âm lượng
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = muted ? 0 : vol / 100;
    v.muted = muted;
  }, [vol, muted]);

  // Playback rate — reset về 1x khi ad đang chạy
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = isAd ? 1 : playbackRate;
  }, [playbackRate, isAd]);

  // Track fullscreen state
  // iPhone Safari KHÔNG hỗ trợ Fullscreen API (`requestFullscreen`) trên
  // element bất kỳ (div) — chỉ iPad mới có. Trên iPhone, cách fullscreen
  // duy nhất là gọi `videoEl.webkitEnterFullscreen()` (API riêng WebKit,
  // chỉ tồn tại trên <video>) — và nó bắn sự kiện riêng
  // `webkitbeginfullscreen`/`webkitendfullscreen` trên chính <video>, KHÔNG
  // phải `fullscreenchange` trên document. Lắng nghe cả 2 loại để
  // isFullscreen luôn đúng trên mọi thiết bị (đồng bộ với EpisodeVideoPlayer).
  useEffect(() => {
    const onFsChange = () =>
      setIsFullscreen(
        !!(document.fullscreenElement || document.webkitFullscreenElement),
      );
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);

    const v = videoRef.current;
    const onIosBegin = () => setIsFullscreen(true);
    const onIosEnd = () => setIsFullscreen(false);
    v?.addEventListener("webkitbeginfullscreen", onIosBegin);
    v?.addEventListener("webkitendfullscreen", onIosEnd);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      v?.removeEventListener("webkitbeginfullscreen", onIosBegin);
      v?.removeEventListener("webkitendfullscreen", onIosEnd);
    };
  }, []);

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
      const dur =
        videoRef.current?.duration ??
        (movie?.duration ? movie.duration * 60 : 0);
      const mins = Math.floor(((pct / 100) * dur) / 60);
      if (mins < 1) return; // bỏ qua nếu duration chưa load
      movieService
        .updateWatchProgress(movie.id, mins, forceComplete || pct >= 95)
        .catch((e) => console.warn("[MovieVideoPlayer] saveProgress:", e));
    },
    [movie?.id, movie?.duration],
  );

  // Lưu định kỳ 30s khi đang phát
  useEffect(() => {
    if (!playing) {
      clearInterval(saveTimerRef.current);
      return;
    }
    saveTimerRef.current = setInterval(
      () => saveProgress(progressRef.current),
      15_000,
    );
    return () => clearInterval(saveTimerRef.current);
  }, [playing, saveProgress]);

  // Lưu khi unmount — dùng videoRef.current.duration trực tiếp
  useEffect(
    () => () => {
      const v = videoRef.current;
      if (progressRef.current > 1 && movie?.id) {
        const dur = v?.duration || (movie?.duration ? movie.duration * 60 : 0);
        if (dur < 1) return;
        movieService
          .updateWatchProgress(
            movie.id,
            Math.floor(((progressRef.current / 100) * dur) / 60),
            progressRef.current >= 95,
          )
          .catch(() => {});
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [movie?.id],
  );

  // ── Controls ─────────────────────────────────────────────────
  const togglePlay = () => {
    // Khoá play/pause qua control gốc trong lúc ad — video ad và video
    // phim dùng chung videoRef (kiến trúc single-video), nên nếu không
    // chặn ở đây, click lên <video> hoặc phím Space/K vẫn pause/play được
    // chính video ad, để lộ center-icon gốc đè lên UI của AdOverlay.
    if (isAd) return;
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      // Dùng startPlayback() thay vì gọi v.play() trực tiếp — nếu đây là
      // lần play đầu tiên và có preroll ads, cần swap+play() ad ngay trong
      // gesture này (xem giải thích ở khai báo startPlayback phía trên).
      startPlayback();
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
    const v = videoRef.current;
    if (!el) return;

    // Đang ở fullscreen → thoát ra (thử cả 2 kiểu API)
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      return;
    }

    // iPhone Safari KHÔNG hỗ trợ Fullscreen API trên div (`el.requestFullscreen`
    // undefined hoặc reject âm thầm) — chỉ iPad mới hỗ trợ. Trên iPhone, cách
    // duy nhất để fullscreen là gọi thẳng `webkitEnterFullscreen()` của chính
    // thẻ <video>. Ưu tiên thử chuẩn trước, fallback dần xuống API cũ hơn.
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (v?.webkitEnterFullscreen) {
      v.webkitEnterFullscreen();
    }
  };

  // ── Keyboard shortcuts ───────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      // Không trigger khi focus vào input/textarea
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      const v = videoRef.current;
      if (!v) return;
      switch (e.code) {
        case "Space":
        case "KeyK":
          e.preventDefault();
          // Khoá play/pause qua phím tắt trong lúc ad — xem giải thích ở
          // togglePlay(). ArrowLeft/ArrowRight bên dưới đã có isAd guard,
          // Space/K là chỗ bị bỏ sót.
          if (isAd) break;
          if (v.paused) {
            startPlayback();
            flashCenterIcon("play");
          } else {
            v.pause();
            flashCenterIcon("pause");
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (!isAd) {
            v.currentTime = Math.max(0, v.currentTime - 10);
            showKbHint("⏪ −10s");
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (!isAd) {
            v.currentTime = Math.min(v.duration, v.currentTime + 10);
            showKbHint("⏩ +10s");
          }
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
        default:
          break;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showKbHint, flashCenterIcon, isAd, startPlayback]);

  // ── Skip Intro / Recap visibility ────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      const t = v.currentTime;
      const { introStart, introEnd, recapStart, recapEnd } = movie ?? {};
      setShowSkipIntro(
        !!(
          introStart != null &&
          introEnd != null &&
          t >= introStart &&
          t < introEnd
        ),
      );
      setShowSkipRecap(
        !!(
          recapStart != null &&
          recapEnd != null &&
          t >= recapStart &&
          t < recapEnd
        ),
      );
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [movie]);

  const skipIntro = () => {
    const v = videoRef.current;
    if (!v || movie?.introEnd == null) return;
    v.currentTime = movie.introEnd;
    setShowSkipIntro(false);
  };

  const skipRecap = () => {
    const v = videoRef.current;
    if (!v || movie?.recapEnd == null) return;
    v.currentTime = movie.recapEnd;
    setShowSkipRecap(false);
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
    <>
      <style>{`
      :fullscreen .subtitle-overlay,
      :-webkit-full-screen .subtitle-overlay,
      :-moz-full-screen .subtitle-overlay {
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
          src={videoUrl} // ← luôn là contentUrl; hook swap src trực tiếp
          preload="auto" // Safari iOS cần "auto" để chủ động tải metadata sớm;
          // "metadata" trên WebKit thật thường trì hoãn/không fire durationchange,
          // khiến duration fallback về runtime TMDB và play() bị treo do readyState thấp.
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

        {/* ── Subtitle cue overlay — ẩn khi đang phát quảng cáo ── */}
        <AnimatePresence>
          {activeCue && selSubId && !isAd && (
            <motion.div
              key={activeCue.start}
              className="subtitle-overlay"
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
                  className="subtitle-line"
                  style={{
                    display: "block",
                    width: "100%",
                    color: "#fff",
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: isFullscreen
                      ? "clamp(20px, 2.4vw, 48px)"
                      : isMobile
                        ? 13
                        : 16,
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

        {/* ── Skip Intro button — ẩn khi đang phát quảng cáo ── */}
        <AnimatePresence>
          {showSkipIntro && !isAd && (
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

        {/* ── Skip Recap button — ẩn khi đang phát quảng cáo ── */}
        <AnimatePresence>
          {showSkipRecap && !isAd && (
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

        {/* ── Center play/pause button — hiện khi pause, hoặc khi flash icon.
            Ẩn hoàn toàn khi đang phát ad: control gốc bị khoá lúc ad chạy,
            chỉ AdOverlay được hiển thị UI. ── */}
        <AnimatePresence>
          {!isAd && (!playing || centerIcon) && (
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
                  boxShadow:
                    "0 4px 24px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.3)",
                  pointerEvents: centerIcon ? "none" : "all",
                  backdropFilter: "blur(4px)",
                  cursor: centerIcon ? "default" : "pointer",
                }}
                onClick={centerIcon ? undefined : togglePlay}
              >
                {centerIcon === "play" || (!centerIcon && !playing) ? (
                  <Play
                    size={26}
                    fill="#000"
                    color="#000"
                    style={{ marginLeft: 3 }}
                  />
                ) : (
                  <Pause size={26} fill="#000" color="#000" />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AD OVERLAY ───────────────────────────────────────── */}
        <AdOverlay adManager={adManager} showControls={show} />

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
                padding: "0 20px 18px",
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
              }}
            >
              {/* Seek bar */}
              <div
                style={{
                  marginBottom: 12,
                  position: "relative",
                  height: 4,
                  cursor: isAd ? "default" : "pointer",
                  paddingTop: 8,
                  paddingBottom: 8,
                  marginTop: -8,
                  boxSizing: "content-box",
                  transition: "height 0.15s ease",
                }}
                onClick={isAd ? undefined : seek}
                onMouseEnter={(e) => {
                  if (!isAd) {
                    const bar =
                      e.currentTarget.querySelector(".movie-track-bg");
                    if (bar) bar.style.height = "6px";
                  }
                }}
                onMouseLeave={(e) => {
                  const bar = e.currentTarget.querySelector(".movie-track-bg");
                  if (bar) bar.style.height = "3px";
                }}
              >
                {/* Track bg */}
                <div
                  className="movie-track-bg"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    height: 3,
                    marginTop: -1.5,
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.18)",
                    transition: "height 0.15s ease",
                  }}
                />
                {/* Buffered — ẩn khi ad */}
                {!isAd && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: 0,
                      height: 3,
                      marginTop: -1.5,
                      width: `${buffered}%`,
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.28)",
                    }}
                  />
                )}
                {/* Progress */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    height: 3,
                    marginTop: -1.5,
                    width: `${isAd ? adManager.adProgress : progress}%`,
                    borderRadius: 3,
                    background: isAd ? "#FFD600" : C.accent,
                  }}
                />
                {/* Thumb — ẩn khi ad */}
                {!isAd && (
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
                )}
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
                    onClick={() => !isAd && skipSec(-10)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: isAd ? "default" : "pointer",
                      color: "rgba(255,255,255,0.7)",
                      padding: 0,
                      display: "flex",
                      opacity: isAd ? 0.25 : 1,
                      transition: "opacity 0.2s",
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
                    {playing ? (
                      <Pause size={22} fill="white" />
                    ) : (
                      <Play size={22} fill="white" />
                    )}
                  </button>

                  <button
                    onClick={() => !isAd && skipSec(10)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: isAd ? "default" : "pointer",
                      color: "rgba(255,255,255,0.7)",
                      padding: 0,
                      display: "flex",
                      opacity: isAd ? 0.25 : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    <SkipForward size={18} />
                  </button>

                  {/* Volume */}
                  {!isMobile ? (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
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
                        style={{
                          width: 72,
                          accentColor: "white",
                          cursor: "pointer",
                        }}
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

                {/* Right: speed + subtitle + quality + fullscreen */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {/* ── Speed button + dropdown ── */}
                  <div ref={speedMenuRef} style={{ position: "relative" }}>
                    <button
                      onClick={() => {
                        setShowSpeedMenu((p) => !p);
                        setShowSubMenu(false);
                      }}
                      title="Tốc độ phát"
                      style={{
                        background:
                          playbackRate !== 1
                            ? "rgba(255,255,255,0.18)"
                            : "none",
                        border:
                          playbackRate !== 1
                            ? "1px solid rgba(255,255,255,0.3)"
                            : "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        color:
                          playbackRate !== 1
                            ? "#fff"
                            : "rgba(255,255,255,0.65)",
                        padding: "4px",
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
                          <div
                            style={{
                              padding: "8px 12px 6px",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            <p
                              style={{
                                fontFamily: "'Nunito',sans-serif",
                                fontSize: 10,
                                fontWeight: 800,
                                color: "rgba(255,255,255,0.4)",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                              }}
                            >
                              Tốc độ phát
                            </p>
                          </div>
                          {SPEED_OPTIONS.map((rate) => (
                            <button
                              key={rate}
                              onClick={() => {
                                setPlaybackRate(rate);
                                setShowSpeedMenu(false);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                                padding: "9px 12px",
                                background:
                                  playbackRate === rate
                                    ? "rgba(255,255,255,0.07)"
                                    : "none",
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "'Nunito',sans-serif",
                                fontSize: 13,
                                fontWeight: playbackRate === rate ? 700 : 500,
                                color:
                                  playbackRate === rate
                                    ? "#fff"
                                    : "rgba(255,255,255,0.65)",
                                textAlign: "left",
                                transition: "background 0.12s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(255,255,255,0.07)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  playbackRate === rate
                                    ? "rgba(255,255,255,0.07)"
                                    : "none")
                              }
                            >
                              {rate === 1 ? "Bình thường" : `${rate}x`}
                              {playbackRate === rate && (
                                <span style={{ color: C.accent, fontSize: 11 }}>
                                  ✓
                                </span>
                              )}
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
                          background: selSubId
                            ? "rgba(255,255,255,0.18)"
                            : "none",
                          border: selSubId
                            ? "1px solid rgba(255,255,255,0.3)"
                            : "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          color: selSubId ? "#fff" : "rgba(255,255,255,0.65)",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          transition: "all 0.15s",
                        }}
                      >
                        <Subtitles size={18} />
                        {subLoading && (
                          <span
                            style={{
                              fontSize: 9,
                              color: "rgba(255,255,255,0.5)",
                            }}
                          >
                            …
                          </span>
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
                            <div
                              style={{
                                padding: "8px 12px 6px",
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.08)",
                              }}
                            >
                              <p
                                style={{
                                  fontFamily: "'Nunito',sans-serif",
                                  fontSize: 10,
                                  fontWeight: 800,
                                  color: "rgba(255,255,255,0.4)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.08em",
                                }}
                              >
                                Phụ đề
                              </p>
                            </div>

                            {/* Tắt phụ đề */}
                            <button
                              onClick={() => {
                                setSelSubId(null);
                                setCues([]);
                                setActiveCue(null);
                                setShowSubMenu(false);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                                padding: "9px 12px",
                                background: !selSubId
                                  ? "rgba(255,255,255,0.07)"
                                  : "none",
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "'Nunito',sans-serif",
                                fontSize: 13,
                                fontWeight: !selSubId ? 700 : 500,
                                color: !selSubId
                                  ? "#fff"
                                  : "rgba(255,255,255,0.6)",
                                textAlign: "left",
                                transition: "background 0.12s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(255,255,255,0.07)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = !selSubId
                                  ? "rgba(255,255,255,0.07)"
                                  : "none")
                              }
                            >
                              Tắt phụ đề
                              {!selSubId && (
                                <span style={{ color: C.accent, fontSize: 11 }}>
                                  ✓
                                </span>
                              )}
                            </button>

                            {/* Danh sách ngôn ngữ */}
                            {subtitles.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => {
                                  setSelSubId(s.id);
                                  setShowSubMenu(false);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  width: "100%",
                                  padding: "9px 12px",
                                  background:
                                    selSubId === s.id
                                      ? "rgba(255,255,255,0.07)"
                                      : "none",
                                  border: "none",
                                  cursor: "pointer",
                                  fontFamily: "'Nunito',sans-serif",
                                  fontSize: 13,
                                  fontWeight: selSubId === s.id ? 700 : 500,
                                  color:
                                    selSubId === s.id
                                      ? "#fff"
                                      : "rgba(255,255,255,0.65)",
                                  textAlign: "left",
                                  gap: 8,
                                  transition: "background 0.12s",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(255,255,255,0.07)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    selSubId === s.id
                                      ? "rgba(255,255,255,0.07)"
                                      : "none")
                                }
                              >
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 800,
                                      padding: "1px 5px",
                                      borderRadius: 4,
                                      background: "rgba(255,255,255,0.1)",
                                      color: "rgba(255,255,255,0.5)",
                                      letterSpacing: "0.04em",
                                    }}
                                  >
                                    {(s.languageCode ?? "??").toUpperCase()}
                                  </span>
                                  {s.languageName || s.languageCode}
                                </span>
                                {selSubId === s.id && (
                                  <span
                                    style={{ color: C.accent, fontSize: 11 }}
                                  >
                                    ✓
                                  </span>
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <button
                    onClick={toggleFullscreen}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.7)",
                      padding: "4px",
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
    </>
  );
}