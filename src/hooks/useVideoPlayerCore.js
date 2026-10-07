// src/components/hooks/useVideoPlayerCore.js
import { useCallback, useEffect, useRef, useState } from "react";
import useHlsSource from "./useHlsSource";
import { supportsMse } from "../utils/hls";
import { vDur, MEDIA_ERROR_LABELS } from "../utils/playerUtils";

/**
 * Lõi của player: state phát, listener của <video>, resume, âm lượng, tốc độ, HLS và các
 * hành động (play/pause, tua, seek). Không biết phim hay tập.
 *
 * Kiến trúc single-video: quảng cáo chạy trên chính videoRef (useAdManager swap src), nên mọi
 * listener ở đây đều bỏ qua khi `adManager.isAdPlayingRef.current` = true.
 *
 * @param {{
 *   videoRef,
 *   videoUrl: string|null,
 *   playback: object|null,               // kết quả normalizePlayback (cần isHls, durationSeconds)
 *   adManager: object,                   // kết quả useAdManager
 *   resumeSeconds?: number,              // vị trí bắt đầu (giây); 0 = từ đầu
 *   fallbackDurationSec?: number,        // dùng khi <video> chưa báo duration
 *   onPause?: (pct: number) => void,     // pause (không phải ad) → vd lưu tiến độ
 *   onEnded?: () => void,                // hết nội dung chính và không còn post-roll
 * }} p
 */
export default function useVideoPlayerCore({
  videoRef,
  videoUrl,
  playback,
  adManager,
  resumeSeconds = 0,
  fallbackDurationSec = 0,
  onPause,
  onEnded,
}) {
  const hasVideo = !!videoUrl;
  const isAd = !!adManager.currentAd;
  const { triggerPostRoll, tryStartPreRoll, adsReady, isAdPlayingRef } = adManager;

  // ── State ─────────────────────────────────────────────────────
  const [playing, setPlaying] = useState(false);
  // Chỉ hiện ảnh backdrop TRƯỚC lần phát đầu; sau đó pause thì giữ khung hình đang dừng.
  const [hasStarted, setHasStarted] = useState(false);
  // { code, message, src } — hiện thẳng trên màn hình để debug trên mobile (không có DevTools)
  const [videoError, setVideoError] = useState(null);
  const [muted, setMuted] = useState(false);
  const [vol, setVol] = useState(80);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progress, setProgress] = useState(0); // %
  const [buffered, setBuffered] = useState(0); // %
  const [duration, setDuration] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(Infinity); // cho "tập tiếp theo"

  const [centerIcon, setCenterIcon] = useState(null); // "play" | "pause"
  const [skipFlash, setSkipFlash] = useState(null); // { dir: "back" | "forward", id }

  const progressRef = useRef(0);
  const hasResumedRef = useRef(false);
  const centerTimerRef = useRef(null);
  const flashTimerRef = useRef(null);

  // Callback từ ngoài giữ trong ref → effect listener không phải gắn lại mỗi render
  const cbRef = useRef({});
  cbRef.current = { onPause, onEnded };

  // ── HLS: Safari phát native, Chrome/Firefox dùng hls.js (MSE) ──
  const hls = useHlsSource({
    videoRef,
    url: videoUrl,
    isHls: playback?.isHls,
    isAd,
    onFatalError: setVideoError,
  });
  const { useMse } = hls;

  const totalSec =
    (Number.isFinite(duration) && duration > 0 ? duration : 0) ||
    playback?.durationSeconds ||
    fallbackDurationSec;
  const totalSecRef = useRef(0);
  totalSecRef.current = totalSec;

  // ── Reset khi đổi nguồn ───────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setPlaying(false);
    setProgress(0);
    setSecondsLeft(Infinity);
    hasResumedRef.current = false;
    setHasStarted(false);
    // hls.js (MSE) tự quản lý nguồn — v.load() ở đây sẽ phá MediaSource vừa gắn
    if (!useMse) v.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl]);

  // ── Listener của <video> ──────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const adNow = () => isAdPlayingRef.current;

    const onTimeUpdate = () => {
      if (adNow()) return; // currentTime/duration lúc này là của ad
      // Có vị trí resume mà chưa seek xong → bỏ qua tick, tránh nháy "00:00"
      if (resumeSeconds > 0 && !hasResumedRef.current) return;
      const dur = vDur(v, totalSecRef.current);
      if (!dur) return;
      const pct = Math.min(100, (v.currentTime / dur) * 100);
      setProgress(Math.round(pct * 100) / 100);
      progressRef.current = pct;
      setSecondsLeft(Math.ceil(dur - v.currentTime));
    };
    const onDurationChange = () => {
      if (!adNow()) setDuration(vDur(v));
    };
    const onBufferProgress = () => {
      if (adNow()) return;
      const dur = vDur(v, totalSecRef.current);
      if (!dur || !v.buffered.length) return;
      setBuffered(Math.round((v.buffered.end(v.buffered.length - 1) / dur) * 1000) / 10);
    };
    const onEndedEvt = () => {
      if (adNow()) return; // đang trong ad break → useAdManager tự xử lý
      if (triggerPostRoll()) return;
      setPlaying(false);
      setSecondsLeft(0);
      cbRef.current.onEnded?.();
    };
    const onPlay = () => {
      setPlaying(true);
      setHasStarted(true);
    };
    const onPauseEvt = () => {
      setPlaying(false);
      if (!adNow()) cbRef.current.onPause?.(progressRef.current);
    };

    // Resume ngay khi có metadata (chưa phát frame nào) → không nhá hình từ giây 0.
    // canplay là phương án dự phòng nếu loadedmetadata không fire (hls.js, vài edge-case).
    const applyResume = () => {
      if (hasResumedRef.current) return;
      if (resumeSeconds > 0) v.currentTime = resumeSeconds;
      hasResumedRef.current = true;
    };
    const onLoadedMetadata = () => {
      if (adNow()) return;
      applyResume();
    };
    const onCanPlay = () => {
      // Không áp resume cho canplay của ad, nếu không ad bị seek tới giây resume → kết thúc ngay
      if (adNow()) return;
      setVideoError(null); // load được thì xoá lỗi cũ
      applyResume();
    };
    const onError = () => {
      const err = v.error;
      // Chrome/Firefox không phát m3u8 native: lỗi này chỉ là khoảnh khắc useAdManager đặt
      // src=m3u8 sau ad, hls.js sẽ gắn lại ngay → không hiện overlay lỗi.
      if (err?.code === 4 && /\.m3u8/i.test(v.currentSrc || "") && supportsMse()) return;
      const info = {
        code: err?.code ?? null,
        message: MEDIA_ERROR_LABELS[err?.code] ?? err?.message ?? "Lỗi không xác định",
        src: v.currentSrc || videoUrl,
      };
      console.error("[VideoPlayer] <video> error:", info, err);
      setVideoError(info);
    };

    const events = {
      timeupdate: onTimeUpdate,
      durationchange: onDurationChange,
      progress: onBufferProgress,
      ended: onEndedEvt,
      play: onPlay,
      pause: onPauseEvt,
      loadedmetadata: onLoadedMetadata,
      canplay: onCanPlay,
      error: onError,
    };
    Object.entries(events).forEach(([n, h]) => v.addEventListener(n, h));
    return () => Object.entries(events).forEach(([n, h]) => v.removeEventListener(n, h));
  }, [videoRef, videoUrl, resumeSeconds, triggerPostRoll, isAdPlayingRef]);

  // Âm lượng
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = muted ? 0 : vol / 100;
    v.muted = muted;
  }, [videoRef, vol, muted, hasVideo]);

  // Tốc độ — về 1x khi ad đang chạy
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = isAd ? 1 : playbackRate;
  }, [videoRef, playbackRate, isAd, hasVideo]);

  useEffect(
    () => () => {
      clearTimeout(centerTimerRef.current);
      clearTimeout(flashTimerRef.current);
    },
    [],
  );

  // ── Hiệu ứng phản hồi ─────────────────────────────────────────
  const flashCenterIcon = useCallback((type) => {
    setCenterIcon(type);
    clearTimeout(centerTimerRef.current);
    centerTimerRef.current = setTimeout(() => setCenterIcon(null), 700);
  }, []);

  const triggerSkipFlash = useCallback((dir) => {
    setSkipFlash({ dir, id: Date.now() + Math.random() });
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setSkipFlash(null), 550);
  }, []);

  // ── Hành động ─────────────────────────────────────────────────
  // BẮT BUỘC dùng hàm này thay vì v.play() trực tiếp: tryStartPreRoll() phải được gọi ĐỒNG BỘ
  // trong call stack của user gesture (iOS Safari reject play() ngoài user activation).
  const startPlayback = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (tryStartPreRoll()) return; // đã swap sang ad + play() bên trong
    v.play().catch((err) => {
      console.warn("[VideoPlayer] play() failed:", err);
      // AbortError = play() bị ngắt bởi pause()/đổi nguồn (race bình thường) — không phải lỗi thật
      if (err?.name === "AbortError") return;
      // play() bị reject không bắn sự kiện "error" trên <video> → tự set để hiện overlay
      setVideoError({
        code: "PLAY_REJECTED",
        message: `play() bị từ chối: ${err?.name ?? ""} ${err?.message ?? err}`,
        src: v.currentSrc || videoUrl,
      });
    });
  }, [videoRef, tryStartPreRoll, videoUrl]);

  // Khoá play/pause lúc ad (ad và phim dùng chung videoRef nên phải chặn ở đây)
  const togglePlay = useCallback(() => {
    if (isAd) return;
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      // Danh sách ads chưa fetch xong → chặn lần play đầu, nếu không preroll bị bỏ qua
      // vĩnh viễn trong session (lỗi "ads hiện trên PC, mất trên mobile")
      if (!adsReady) return;
      startPlayback();
      flashCenterIcon("play");
    } else {
      v.pause();
      flashCenterIcon("pause");
    }
  }, [isAd, adsReady, videoRef, startPlayback, flashCenterIcon]);

  const skipBy = useCallback(
    (sec) => {
      if (isAd) return;
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = Math.max(0, Math.min(vDur(v, Infinity), v.currentTime + sec));
      triggerSkipFlash(sec < 0 ? "back" : "forward");
    },
    [isAd, videoRef, triggerSkipFlash],
  );

  // ratio: 0..1 trên thanh tiến trình
  const seekToRatio = useCallback(
    (ratio) => {
      if (isAd) return;
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = Math.min(1, Math.max(0, ratio)) * vDur(v, totalSecRef.current);
    },
    [isAd, videoRef],
  );

  return {
    // trạng thái
    hasVideo,
    isAd,
    playing,
    hasStarted,
    videoError,
    progress,
    buffered,
    totalSec,
    secondsLeft,
    centerIcon,
    skipFlash,
    progressRef,
    // âm lượng / tốc độ
    muted,
    setMuted,
    vol,
    setVol,
    playbackRate,
    setPlaybackRate,
    // chất lượng (hls)
    levels: hls.levels,
    level: hls.level,
    setLevel: hls.setLevel,
    autoHeight: hls.autoHeight,
    useMse,
    // hành động
    togglePlay,
    skipBy,
    seekToRatio,
  };
}
