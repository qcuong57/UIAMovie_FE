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
  Check,
  Gauge,
  FastForward,
  Volume1,
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
  // ── Debug lỗi phát video trên mobile (không có DevTools) ──────
  // MediaError.code: 1=ABORTED, 2=NETWORK, 3=DECODE, 4=SRC_NOT_SUPPORTED
  const [videoError, setVideoError] = useState(null); // { code, message, src }
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [show, setShow] = useState(true);
  const [vol, setVol] = useState(80);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // "Fake fullscreen" cho iPhone Safari: iPhone không hỗ trợ Fullscreen API
  // trên div, và `video.webkitEnterFullscreen()` (fullscreen gốc của iOS)
  // sẽ đẩy CHỈ riêng <video> vào 1 layer native tách biệt khỏi cây DOM của
  // trang — khiến phụ đề, AdOverlay, control bar (đều là sibling của
  // <video>, không phải con) biến mất hoàn toàn. Giải pháp: không gọi
  // webkitEnterFullscreen nữa, thay vào đó "giả lập" fullscreen bằng CSS —
  // kéo dãn chính div wrapper (position: fixed, phủ kín viewport) để mọi
  // overlay vẫn là con của nó và tiếp tục hiển thị bình thường.
  const [isFakeFullscreen, setIsFakeFullscreen] = useState(false);

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

  // ── Skip 10s flash overlay (mờ tràn nửa trái/phải) ───────────
  const [skipFlash, setSkipFlash] = useState(null); // { dir: "back" | "forward", id }
  const skipFlashTimer = useRef(null);
  const triggerSkipFlash = useCallback((dir) => {
    setSkipFlash({ dir, id: Date.now() + Math.random() });
    clearTimeout(skipFlashTimer.current);
    skipFlashTimer.current = setTimeout(() => setSkipFlash(null), 550);
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
  const { triggerPostRoll, tryStartPreRoll, adsReady } = adManager;
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
    v.play().catch((err) => {
      console.warn("[MovieVideoPlayer] play() failed:", err);
      // play() bị reject không tự bắn sự kiện "error" trên <video> (không
      // phải lỗi decode/network, mà là bị trình duyệt chặn autoplay) —
      // nên phải tự set videoError ở đây để hiện overlay debug trên mobile.
      setVideoError({
        code: "PLAY_REJECTED",
        message: `play() bị từ chối: ${err?.name ?? ""} ${err?.message ?? err}`,
        src: v.currentSrc || videoUrl,
      });
    });
  }, [tryStartPreRoll, videoUrl]);

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
      setVideoError(null); // load được thì xoá lỗi cũ (nếu có, vd sau khi user thử reload)
      if (hasResumedRef.current) return;
      if (resumeMinutes > 0) v.currentTime = resumeMinutes * 60;
      hasResumedRef.current = true;
    };
    // MediaError chỉ có .code (số) + .message (thường rỗng trên WebKit) —
    // tự map sang mô tả tiếng Việt để đọc được ngay trên điện thoại mà
    // không cần Safari Web Inspector / máy Mac.
    const MEDIA_ERROR_LABELS = {
      1: "MEDIA_ERR_ABORTED — người dùng/tab huỷ tải video",
      2: "MEDIA_ERR_NETWORK — lỗi mạng khi tải video (CORS, mất kết nối, URL sai...)",
      3: "MEDIA_ERR_DECODE — dữ liệu video hỏng hoặc trình duyệt decode lỗi",
      4: "MEDIA_ERR_SRC_NOT_SUPPORTED — định dạng/codec video không được trình duyệt hỗ trợ",
    };
    const onError = () => {
      const err = v.error;
      const info = {
        code: err?.code ?? null,
        message:
          MEDIA_ERROR_LABELS[err?.code] ?? err?.message ?? "Lỗi không xác định",
        src: v.currentSrc || videoUrl,
      };
      console.error("[MovieVideoPlayer] <video> error:", info, err);
      setVideoError(info);
    };

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("durationchange", onDurationChange);
    v.addEventListener("progress", onBufferProgress);
    v.addEventListener("ended", onEnded);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("error", onError);

    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("durationchange", onDurationChange);
      v.removeEventListener("progress", onBufferProgress);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("error", onError);
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

  // ── Chặn cử chỉ pinch kích hoạt native fullscreen video của iOS ──────
  // ĐÂY LÀ NGUYÊN NHÂN THẬT của việc phụ đề/AdOverlay biến mất trên mobile
  // thật (không phải do toggleFullscreen()/isFakeFullscreen ở trên).
  // Từ iOS 11, Safari cho phép người dùng "pinch" (zoom 2 ngón) TRỰC TIẾP
  // trên thẻ <video> để mở AVPlayer fullscreen gốc của hệ điều hành — cử
  // chỉ này hoàn toàn độc lập với playsInline và với toggleFullscreen() tự
  // viết, nên không cách nào chặn được qua state hay logic fullscreen phía
  // trên. Vì native player đó chỉ render riêng <video>, mọi sibling của nó
  // (phụ đề .subtitle-overlay, AdOverlay, control bar) bị loại khỏi layer
  // hiển thị → biến mất, dù logic "fake fullscreen" hoàn toàn không chạy.
  // `gesturestart`/`gesturechange` là sự kiện riêng của WebKit bắn ra khi
  // bắt đầu cử chỉ đa điểm chạm (pinch) — gọi preventDefault() để chặn
  // hành vi mặc định (mở native fullscreen) mà không ảnh hưởng tap/click.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const preventPinchFullscreen = (e) => e.preventDefault();
    v.addEventListener("gesturestart", preventPinchFullscreen);
    v.addEventListener("gesturechange", preventPinchFullscreen);
    return () => {
      v.removeEventListener("gesturestart", preventPinchFullscreen);
      v.removeEventListener("gesturechange", preventPinchFullscreen);
    };
  }, []);

  // ── Khoá scroll nền + tô đen html/body khi đang ở "fake fullscreen" ──
  // Vì đây không phải fullscreen thật (chỉ là div fixed phủ viewport),
  // trang phía sau vẫn có thể cuộn được nếu không khoá overflow thủ công.
  // Tô nền html/body thành đen: nếu thiếu `viewport-fit=cover` trong meta
  // viewport (hoặc trên các máy notch/dynamic-island khi xoay ngang),
  // Safari sẽ để lộ nền mặc định (trắng) của trang ở vùng an toàn 2 bên
  // (notch + vùng home-indicator) — đây chính là "viền trắng 2 bên" khi
  // xoay ngang. Set nền đen ở html/body đảm bảo dù có lộ ra thì vẫn đen.
  useEffect(() => {
    if (!isFakeFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    const prevBodyBg = document.body.style.backgroundColor;
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    document.body.style.overflow = "hidden";
    document.body.style.backgroundColor = "#000";
    document.documentElement.style.backgroundColor = "#000";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.backgroundColor = prevBodyBg;
      document.documentElement.style.backgroundColor = prevHtmlBg;
    };
  }, [isFakeFullscreen]);

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
      // FIX: chặn lần play ĐẦU TIÊN nếu danh sách ads chưa fetch xong (allAds
      // vẫn null). Nếu không chặn, tryStartPreRoll() bên trong startPlayback()
      // sẽ thấy allAds null → bỏ qua preroll vĩnh viễn cho session này (bug
      // "ads hiện trên PC, mất trên mobile" do mạng mobile chậm hơn, chưa kịp
      // fetch xong lúc user tap). UI nút Play sẽ hiện spinner nhỏ trong lúc chờ
      // — chờ xong user tap lại thì play() vẫn đồng bộ trong đúng gesture đó.
      if (!adsReady) return;
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

  // Chạm trực tiếp lên <video> trên mobile. Trước đây dùng chung togglePlay
  // với desktop nên chỉ 1 chạm là pause/play ngay — rất dễ bấm nhầm khi
  // người dùng chỉ muốn chạm để xem tiến trình / hiện lại thanh điều khiển
  // (kiểu Netflix/YouTube). Tách riêng: trên mobile, chạm khi controls đang
  // ẩn chỉ hiện controls lên (không đổi trạng thái phát); chạm khi controls
  // đã hiện sẵn thì ẩn đi. Chỉ nút play/pause ở giữa hoặc trên thanh điều
  // khiển mới thực sự toggle play — nơi người dùng bấm có chủ đích rõ ràng.
  const handleVideoTap = () => {
    if (isAd) return;
    if (isMobile) {
      if (!show) {
        resetTimer();
        return;
      }
      setShow(false);
      clearTimeout(timerRef.current);
      return;
    }
    togglePlay();
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
    triggerSkipFlash(sec < 0 ? "back" : "forward");
  };

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    const v = videoRef.current;
    if (!el) return;

    // Đang ở "fake fullscreen" (iPhone) → thoát bằng cách tắt state, không
    // có API fullscreen thật nào để gọi exit ở đây.
    if (isFakeFullscreen) {
      setIsFakeFullscreen(false);
      setIsFullscreen(false);
      return;
    }

    // Đang ở fullscreen chuẩn (Fullscreen API) → thoát ra (thử cả 2 kiểu API)
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      return;
    }

    // iPhone Safari KHÔNG hỗ trợ Fullscreen API trên div (`el.requestFullscreen`
    // sẽ là undefined) — chỉ iPad mới hỗ trợ. Trên iPhone, KHÔNG dùng
    // `v.webkitEnterFullscreen()` nữa: API này chỉ fullscreen riêng thẻ
    // <video> trong 1 layer native của iOS, khiến phụ đề và AdOverlay (vốn
    // là sibling của <video>) bị ẩn mất hoàn toàn. Thay vào đó, giả lập
    // fullscreen bằng CSS (div wrapper position: fixed phủ kín viewport) —
    // mọi overlay vẫn nằm trong cùng cây DOM nên vẫn hiển thị bình thường.
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else {
      setIsFakeFullscreen(true);
      setIsFullscreen(true);
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
            if (!adsReady) break;
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
            triggerSkipFlash("back");
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (!isAd) {
            v.currentTime = Math.min(v.duration, v.currentTime + 10);
            triggerSkipFlash("forward");
          }
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "KeyM":
          e.preventDefault();
          setMuted((m) => !m);
          break;
        case "KeyC":
          e.preventDefault();
          setShowSubMenu((p) => !p);
          break;
        default:
          break;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showKbHint, flashCenterIcon, triggerSkipFlash, isAd, startPlayback]);

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
  // Thanh tiến trình chạy theo % của ad khi đang phát ad, và theo % của
  // nội dung chính khi không (đồng bộ với EpisodeVideoPlayer).
  const displayProgress = isAd ? (adManager.adProgress ?? 0) : progress;

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
      :-moz-full-screen .subtitle-overlay,
      .mv-fake-fullscreen .subtitle-overlay {
        bottom: 96px !important;
      }

      /* ── Nút điều khiển kiểu YouTube: vòng tròn mờ khi hover, gọn & tinh tế ── */
      .vp-ctrl-btn {
        position: relative;
        background: none;
        border: none;
        cursor: pointer;
        color: rgba(255,255,255,0.78);
        padding: 8px;
        margin: -8px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
      }
      .vp-ctrl-btn:hover { background: rgba(255,255,255,0.14); color: #fff; }
      .vp-ctrl-btn:active { transform: scale(0.90); }
      .vp-ctrl-btn.is-active { color: #fff; }
      .vp-ctrl-btn.is-active::after {
        content: "";
        position: absolute;
        left: 50%;
        bottom: 2px;
        transform: translateX(-50%);
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: ${C.accent};
      }
      .vp-ctrl-btn[data-disabled="true"] { opacity: 0.3; cursor: default; pointer-events: none; }

      /* ── Thanh âm lượng: track mảnh + núm tinh tế, sáng dần khi hover ── */
      .vp-volume-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 72px;
        height: 3px;
        border-radius: 2px;
        background: rgba(255,255,255,0.28);
        outline: none;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .vp-volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 1px 4px rgba(0,0,0,0.5);
        transition: transform 0.12s ease;
        margin-top: 0;
      }
      .vp-volume-slider:hover::-webkit-slider-thumb { transform: scale(1.2); }
      .vp-volume-slider::-moz-range-thumb {
        width: 12px; height: 12px; border-radius: 50%;
        background: #fff; border: none; box-shadow: 0 1px 4px rgba(0,0,0,0.5);
      }
      .vp-volume-slider::-moz-range-track {
        height: 3px; border-radius: 2px; background: rgba(255,255,255,0.28);
      }

      /* ── Thanh tiến trình: vùng bấm rộng, track mảnh, núm chỉ hiện khi hover (như YouTube) ── */
      .vp-progress-wrap {
        position: relative;
        padding: 8px 0;
        margin: -8px 0 2px;
        cursor: pointer;
      }
      .vp-progress-track { position: relative; height: 3px; border-radius: 3px; transition: height 0.15s ease; }
      .vp-progress-wrap:hover .vp-progress-track { height: 5px; }
      .vp-progress-thumb {
        opacity: 0;
        transform: translate(-50%,-50%) scale(0.6);
        transition: opacity 0.15s ease, transform 0.15s ease;
      }
      .vp-progress-wrap:hover .vp-progress-thumb { opacity: 1; transform: translate(-50%,-50%) scale(1); }

      /* ── Nút bỏ qua intro/recap: mờ dần sang trọng khi hover ── */
      .vp-skip-btn { transition: background 0.15s ease, border-color 0.15s ease; }
      .vp-skip-btn:hover { background: rgba(32,32,32,0.94) !important; border-color: rgba(255,255,255,0.34) !important; }

      @keyframes vp-spin { to { transform: rotate(360deg); } }
    `}</style>
      <div
        ref={wrapRef}
        className={isFakeFullscreen ? "mv-fake-fullscreen" : undefined}
        style={{
          position: isFakeFullscreen ? "fixed" : "relative",
          top: isFakeFullscreen ? 0 : undefined,
          left: isFakeFullscreen ? 0 : undefined,
          width: isFakeFullscreen ? "100vw" : "100%",
          height: isFakeFullscreen ? "100dvh" : undefined,
          borderRadius: isFakeFullscreen ? 0 : 12,
          overflow: "hidden",
          aspectRatio: isFakeFullscreen ? "auto" : "16/9",
          background: "#000",
          cursor: show ? "default" : "none",
          // z-index tối đa để đảm bảo nổi trên mọi header/navbar cố định
          // của trang khi ở fake fullscreen (vì đây không phải fullscreen
          // thật nên không tự nổi trên layer khác như Fullscreen API).
          zIndex: isFakeFullscreen ? 2147483647 : undefined,
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
            // Lớp phòng vệ CSS bổ sung cho việc chặn pinch ở effect phía trên —
            // touch-action: manipulation tắt double-tap-zoom mặc định của trình
            // duyệt trên phần tử này (không tắt hoàn toàn pinch nhưng giảm khả
            // năng trình duyệt "nuốt" cử chỉ trước khi tới JS listener).
            touchAction: "manipulation",
          }}
          onClick={handleVideoTap}
        />

        {/* ── Debug overlay: hiện lỗi video ngay trên màn hình (dùng để
            debug trên điện thoại khi không có Mac/Safari Inspector).
            Có thể xoá khối này sau khi đã xác định xong nguyên nhân. ── */}
        {videoError && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 40,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: 20,
              textAlign: "center",
              background: "rgba(0,0,0,0.88)",
              color: "#fff",
              fontFamily: "'Nunito',sans-serif",
            }}
          >
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#f87171" }}>
              Lỗi phát video (code: {String(videoError.code)})
            </p>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.85, maxWidth: 340 }}>
              {videoError.message}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 10,
                opacity: 0.5,
                maxWidth: 340,
                wordBreak: "break-all",
              }}
            >
              {videoError.src}
            </p>
          </div>
        )}

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

        {/* ── Skip 10s flash overlay — mờ tràn nửa trái (lùi) hoặc
            nửa phải (tiến) mỗi khi bấm nút tua hoặc phím tắt ── */}
        <AnimatePresence>
          {skipFlash && (
            <motion.div
              key={skipFlash.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: skipFlash.dir === "back" ? 0 : "50%",
                width: "50%",
                background:
                  skipFlash.dir === "back"
                    ? "linear-gradient(to right, rgba(0,0,0,0.5), transparent)"
                    : "linear-gradient(to left, rgba(0,0,0,0.5), transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                zIndex: 25,
              }}
            >
              <motion.div
                initial={{ scale: 0.75, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.22 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  color: "#fff",
                }}
              >
                {skipFlash.dir === "back" ? (
                  <SkipBack size={isMobile ? 26 : 34} fill="#fff" />
                ) : (
                  <SkipForward size={isMobile ? 26 : 34} fill="#fff" />
                )}
                <span
                  style={{
                    fontFamily: "'Nunito',sans-serif",
                    fontWeight: 800,
                    fontSize: isMobile ? 13 : 15,
                    whiteSpace: "nowrap",
                  }}
                >
                  {skipFlash.dir === "back" ? "−10 giây" : "+10 giây"}
                </span>
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
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
                padding: isMobile ? "32px 14px 14px" : "56px 20px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* Progress bar — kiểu YouTube: vùng bấm rộng, track mảnh gọn, núm hiện khi hover */}
              <div
                onClick={isAd ? undefined : seek}
                className="mv-progress-bar vp-progress-wrap"
                style={{ cursor: isAd ? "default" : "pointer" }}
              >
                <div
                  className="vp-progress-track"
                  style={{ background: "rgba(255,255,255,0.22)" }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      height: "100%",
                      width: `${buffered}%`,
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.32)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      height: "100%",
                      width: `${displayProgress}%`,
                      borderRadius: 3,
                      background: isAd ? "#FFD600" : C.accent,
                      boxShadow: isAd
                        ? "none"
                        : `0 0 6px ${C.accent}66`,
                    }}
                  />
                  <div
                    className="vp-progress-thumb"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: `${displayProgress}%`,
                      width: 13,
                      height: 13,
                      borderRadius: "50%",
                      background: "white",
                      boxShadow: "0 1px 6px rgba(0,0,0,0.6)",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? 18 : 22,
                  }}
                >
                  <button
                    onClick={() => !isAd && skipSec(-10)}
                    title="Lùi 10 giây"
                    className="vp-ctrl-btn"
                    data-disabled={isAd}
                  >
                    <SkipBack size={19} />
                  </button>
                  <button
                    onClick={togglePlay}
                    title={
                      !playing && !adsReady
                        ? "Đang tải..."
                        : playing
                          ? "Tạm dừng"
                          : "Phát"
                    }
                    className="vp-ctrl-btn"
                    style={{ color: "#fff" }}
                  >
                    {playing ? (
                      <Pause size={23} fill="currentColor" />
                    ) : !adsReady ? (
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "#fff",
                          borderRadius: "50%",
                          display: "inline-block",
                          animation: "vp-spin 0.7s linear infinite",
                        }}
                      />
                    ) : (
                      <Play size={23} fill="currentColor" style={{ marginLeft: 2 }} />
                    )}
                  </button>
                  <button
                    onClick={() => !isAd && skipSec(10)}
                    title="Tiến 10 giây"
                    className="vp-ctrl-btn"
                    data-disabled={isAd}
                  >
                    <SkipForward size={19} />
                  </button>

                  {!isMobile ? (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <button
                        onClick={() => setMuted(!muted)}
                        title={muted ? "Bật tiếng" : "Tắt tiếng"}
                        className="vp-ctrl-btn"
                      >
                        {muted || vol === 0 ? (
                          <VolumeX size={19} />
                        ) : vol < 50 ? (
                          <Volume1 size={19} />
                        ) : (
                          <Volume2 size={19} />
                        )}
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
                        className="vp-volume-slider"
                        style={{
                          background: `linear-gradient(to right, #fff 0%, #fff ${
                            muted ? 0 : vol
                          }%, rgba(255,255,255,0.28) ${
                            muted ? 0 : vol
                          }%, rgba(255,255,255,0.28) 100%)`,
                        }}
                      />
                      <span
                        style={{
                          color: "rgba(255,255,255,0.65)",
                          fontSize: 12,
                          fontFamily: "'Nunito',sans-serif",
                          minWidth: 30,
                          textAlign: "right",
                        }}
                      >
                        {muted ? 0 : vol}%
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setMuted(!muted)}
                      title={muted ? "Bật tiếng" : `Âm lượng ${vol}%`}
                      className="vp-ctrl-btn"
                    >
                      {muted || vol === 0 ? (
                        <VolumeX size={19} />
                      ) : vol < 50 ? (
                        <Volume1 size={19} />
                      ) : (
                        <Volume2 size={19} />
                      )}
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

                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  {/* ── Speed button + dropdown ── */}
                  <div ref={speedMenuRef} style={{ position: "relative" }}>
                    <button
                      onClick={() => {
                        setShowSpeedMenu((p) => !p);
                        setShowSubMenu(false);
                      }}
                      title="Tốc độ phát"
                      className={`vp-ctrl-btn${playbackRate !== 1 ? " is-active" : ""}`}
                      style={{
                        gap: 4,
                        fontFamily: "'Nunito',sans-serif",
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.02em",
                        borderRadius: 16,
                        padding: "8px 9px",
                      }}
                    >
                      <Gauge size={18} />
                      {playbackRate !== 1 && <span>{playbackRate}x</span>}
                    </button>

                    <AnimatePresence>
                      {showSpeedMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.97 }}
                          transition={{ duration: 0.14 }}
                          style={{
                            position: "absolute",
                            bottom: "calc(100% + 10px)",
                            right: 0,
                            background: "rgba(20,20,20,0.97)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 10,
                            overflow: "hidden",
                            minWidth: 130,
                            boxShadow: "0 8px 28px rgba(0,0,0,0.6)",
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
                                fontWeight: 700,
                                color: "rgba(255,255,255,0.4)",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                margin: 0,
                              }}
                            >
                              Tốc độ phát
                            </p>
                          </div>

                          {SPEED_OPTIONS.map((rate) => {
                            const active = playbackRate === rate;
                            return (
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
                                  background: active
                                    ? "rgba(255,255,255,0.08)"
                                    : "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  fontFamily: "'Nunito',sans-serif",
                                  fontSize: 13,
                                  fontWeight: active ? 700 : 500,
                                  color: active ? "#fff" : "rgba(255,255,255,0.62)",
                                  textAlign: "left",
                                  transition: "background 0.12s",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(255,255,255,0.08)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background = active
                                    ? "rgba(255,255,255,0.08)"
                                    : "transparent")
                                }
                              >
                                {rate === 1 ? "Bình thường" : `${rate}x`}
                                {active && (
                                  <Check size={14} color={C.accent} strokeWidth={2.75} />
                                )}
                              </button>
                            );
                          })}
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
                        className={`vp-ctrl-btn${selSubId ? " is-active" : ""}`}
                      >
                        <Subtitles size={19} />
                        {subLoading && (
                          <span
                            style={{
                              fontSize: 9,
                              color: "rgba(255,255,255,0.5)",
                              marginLeft: 2,
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
                            initial={{ opacity: 0, y: 6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.97 }}
                            transition={{ duration: 0.14 }}
                            style={{
                              position: "absolute",
                              bottom: "calc(100% + 10px)",
                              right: 0,
                              background: "rgba(20,20,20,0.97)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: 10,
                              overflow: "hidden",
                              minWidth: 175,
                              boxShadow: "0 8px 28px rgba(0,0,0,0.6)",
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
                                  fontWeight: 700,
                                  color: "rgba(255,255,255,0.4)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.06em",
                                  margin: 0,
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
                                  ? "rgba(255,255,255,0.08)"
                                  : "transparent",
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "'Nunito',sans-serif",
                                fontSize: 13,
                                fontWeight: !selSubId ? 700 : 500,
                                color: !selSubId
                                  ? "#fff"
                                  : "rgba(255,255,255,0.62)",
                                textAlign: "left",
                                transition: "background 0.12s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(255,255,255,0.08)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = !selSubId
                                  ? "rgba(255,255,255,0.08)"
                                  : "transparent")
                              }
                            >
                              Tắt phụ đề
                              {!selSubId && (
                                <Check size={14} color={C.accent} strokeWidth={2.75} />
                              )}
                            </button>

                            {/* Danh sách ngôn ngữ */}
                            {subtitles.map((s) => {
                              const active = selSubId === s.id;
                              return (
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
                                    background: active
                                      ? "rgba(255,255,255,0.08)"
                                      : "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    fontFamily: "'Nunito',sans-serif",
                                    fontSize: 13,
                                    fontWeight: active ? 700 : 500,
                                    color: active
                                      ? "#fff"
                                      : "rgba(255,255,255,0.62)",
                                    textAlign: "left",
                                    gap: 8,
                                    transition: "background 0.12s",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                      "rgba(255,255,255,0.08)")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = active
                                      ? "rgba(255,255,255,0.08)"
                                      : "transparent")
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
                                  {active && (
                                    <Check size={14} color={C.accent} strokeWidth={2.75} />
                                  )}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <button
                    onClick={toggleFullscreen}
                    title={isFullscreen || isFakeFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                    className="vp-ctrl-btn"
                  >
                    <Maximize size={19} />
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