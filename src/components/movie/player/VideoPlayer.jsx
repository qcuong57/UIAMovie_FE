// src/components/player/VideoPlayer.jsx
// Shell dùng chung cho Movie + Episode: chỉ ghép hook + component, không biết phim hay tập.
// Khác biệt giữa hai loại nằm hết ở props (xem MovieVideoPlayer / EpisodeVideoPlayer).

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import "./player.css";

import { useIsMobile } from "../../../hooks/useIsMobile";
import { useIsTouch } from "../../../hooks/useIsTouch";
import { shouldUseMse } from "../../../utils/hls";
import { useAdManager } from "../../../hooks/useAdManager";
import usePlayback from "../../../hooks/usePlayback";
import useSubtitles from "../../../hooks/useSubtitles";
import AdOverlay from "../shared/AdOverlay";
import PlaybackGate from "../shared/PlaybackGate";

import useVideoPlayerCore from "../../../hooks/useVideoPlayerCore";
import useFullscreen from "../../../hooks/useFullscreen";
import useControlsVisibility from "../../../hooks/useControlsVisibility";
import usePlayerShortcuts from "../../../hooks/usePlayerShortcuts";
import useWatchProgress from "../../../hooks/useWatchProgress";
import useSkipMarkers from "../../../hooks/useSkipMarkers";
import usePlaybackHeartbeat from "../../../hooks/usePlaybackHeartbeat";

import PlayerControls from "./controls/PlayerControls";
import CenterPlayIcon from "./controls/CenterPlayIcon";
import SkipFlash from "./controls/SkipFlash";
import SkipButton from "./controls/SkipButton";
import SubtitleOverlay from "./controls/SubtitleOverlay";
import ErrorOverlay from "./controls/ErrorOverlay";
import ResumePrompt from "./controls/ResumePrompt";

/**
 * @param {{
 *   playbackKey: string|null,                 // null = chưa sẵn sàng; đổi key = tải lại
 *   playbackLoader: () => Promise<object>,
 *   adContent: { type: "Movie"|"Episode", id: any, parentId?: any },
 *   isFreeUser?: boolean,
 *   subtitleService: object, subtitleOwnerId: any,
 *   backdropUrl?: string,
 *   accent?: string,                          // màu nhấn → CSS variable --vp-accent
 *   fallbackDurationSec?: number,
 *   resumeSeconds?: number,
 *   onSaveProgress?: (p: { seconds: number, completed: boolean, durationSeconds: number }) => Promise<any> | void,
 *   onFlushProgress?: (p: { seconds: number, completed: boolean, durationSeconds: number }) => void, // đóng tab / pagehide
 *   skipMarkers?: { introStart, introEnd, recapStart, recapEnd },
 *   onHeartbeat?: (secondsSinceLastBeat: number) => Promise<{ isCountedAsView: boolean }>, // đếm view (BE)
 *   onHeartbeatFlush?: (secondsSinceLastBeat: number) => void, // gửi nốt giây dư khi đóng tab/đổi trang
 *   renderOverlay?: (ctx: { isAd: boolean, secondsLeft: number }) => React.ReactNode,
 * }} props
 *
 * Lưu ý: nên đặt `key={id nội dung}` khi dùng, để đổi phim/tập thì player remount và
 * lưu tiến độ của nội dung cũ đúng cách (xem wrapper).
 */
export default function VideoPlayer({
  playbackKey,
  playbackLoader,
  adContent = {},
  isFreeUser = true,
  subtitleService,
  subtitleOwnerId,
  backdropUrl,
  accent,
  fallbackDurationSec = 0,
  resumeSeconds = 0,
  resumeOffer = 0, // giây đã xem lấy từ server → hiện popup hỏi (chỉ khi resumeSeconds = 0)
  onSaveProgress,
  onFlushProgress,
  skipMarkers,
  onHeartbeat,
  onHeartbeatFlush,
  renderOverlay,
}) {
  const narrow = useIsMobile();
  const touch = useIsTouch();
  const isMobile = narrow || touch; // điện thoại xoay ngang / iPad vẫn là mobile
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const saveRef = useRef(null);

  // Menu đang mở: "sub" | "speed" | "quality" | "settings" (mobile) | null — mở cái này tự đóng cái kia
  const [openMenu, setOpenMenu] = useState(null);
  const toggleMenu = useCallback((n) => setOpenMenu((m) => (m === n ? null : n)), []);
  const closeMenu = useCallback(() => setOpenMenu(null), []);

  // Lựa chọn trong popup: null = chưa chọn | "resume" | "restart"
  const [resumeChoice, setResumeChoice] = useState(null);
  const effectiveResume =
    resumeSeconds > 0 ? resumeSeconds : resumeChoice === "resume" ? resumeOffer : 0;

  // ── Dữ liệu: playback → ads → core ──
  const { status, playback, error, reload } = usePlayback(playbackLoader, playbackKey);
  const videoUrl = status === "ready" ? (playback?.playbackUrl ?? null) : null;

  const adManager = useAdManager({
    isFreeUser,
    contentType: adContent.type,
    contentId: adContent.id ?? null,
    parentId: adContent.parentId ?? null,
    videoRef,
    contentUrl: videoUrl,
    useMse: shouldUseMse(videoUrl, playback?.isHls),
    resumeSeconds: effectiveResume,
  });

  const { show, setShow, resetTimer, hideNow } = useControlsVisibility(videoRef);

  const core = useVideoPlayerCore({
    videoRef,
    videoUrl,
    playback,
    adManager,
    resumeSeconds: effectiveResume,
    fallbackDurationSec,
    onPause: (pct) => saveRef.current?.(pct),
    onEnded: () => {
      setShow(true);
      saveRef.current?.(100, true);
    },
  });
  const { hasVideo, isAd, playing } = core;

  // Popup chỉ hiện khi chưa phát gì (nếu user đã bấm play trước khi lịch sử tải xong thì thôi)
  const promptOpen =
    resumeOffer > 0 && resumeSeconds === 0 && resumeChoice === null &&
    !core.hasStarted && !playing && !isAd;

  // ── Đếm view: chỉ tính khi nội dung chính đang phát (không tính quảng cáo / pause / tab ẩn) ──
  // Phải gọi TRƯỚC early-return `if (!videoUrl)` để không vi phạm rules of hooks.
  // Callback bọc qua ref → identity ổn định, hook heartbeat không bị reset timer mỗi lần render
  const hbRef = useRef({});
  hbRef.current = { onHeartbeat, onHeartbeatFlush };
  const sendHb = useCallback((s) => hbRef.current.onHeartbeat?.(s), []);
  const flushHb = useCallback((s) => hbRef.current.onHeartbeatFlush?.(s), []);
  usePlaybackHeartbeat({
    enabled: !!onHeartbeat && !!videoUrl,
    isPlaying: !!playing && !isAd,
    send: sendHb,
    flush: flushHb,
  });

  const { save } = useWatchProgress({
    videoRef,
    progressRef: core.progressRef,
    playing,
    videoReady: hasVideo,
    isAdPlayingRef: adManager.isAdPlayingRef,
    fallbackDurationSec: playback?.durationSeconds || fallbackDurationSec,
    onSave: onSaveProgress,
    onFlush: onFlushProgress,
  });
  saveRef.current = save;

  const { isFullscreen, isFakeFullscreen, toggleFullscreen } = useFullscreen({
    wrapRef,
    videoRef,
    hasVideo,
  });

  const subs = useSubtitles({
    service: subtitleService,
    ownerId: subtitleOwnerId ?? null,
    videoRef,
    videoMounted: hasVideo,
    isAdPlayingRef: adManager.isAdPlayingRef,
  });

  const skip = useSkipMarkers({ videoRef, hasVideo, markers: skipMarkers });

  usePlayerShortcuts({
    enabled: hasVideo && !promptOpen, // popup đang mở → khoá phím Space/mũi tên
    handlers: {
      onTogglePlay: core.togglePlay,
      onSeekBack: () => core.skipBy(-10),
      onSeekForward: () => core.skipBy(10),
      onToggleFullscreen: toggleFullscreen,
      onToggleMute: () => core.setMuted((m) => !m),
      onToggleSubtitleMenu: () => toggleMenu("sub"),
    },
  });

  // Mobile: chạm video chỉ hiện/ẩn controls (tránh pause nhầm); desktop: toggle play
  const handleVideoTap = () => {
    if (isAd) return;
    // Desktop, hoặc lần chạm đầu khi chưa phát (phải play() ngay trong user gesture của iOS)
    if (!isMobile || (!core.hasStarted && videoRef.current?.paused)) return core.togglePlay();
    if (!show) resetTimer();
    else hideNow();
  };

  // Bấm nút trong popup = user gesture → play() ngay (iOS bắt buộc)
  const chooseResume = () => {
    setResumeChoice("resume");
    const v = videoRef.current;
    // Đã có metadata → seek ngay; chưa có → applyResume ở loadedmetadata sẽ lo (effectiveResume đã đổi)
    if (v && v.readyState >= 1) v.currentTime = resumeOffer;
    core.togglePlay();
  };
  const chooseRestart = () => {
    setResumeChoice("restart");
    core.togglePlay();
  };

  // Mobile không có mousemove → tự hẹn giờ ẩn controls khi bắt đầu phát
  useEffect(() => {
    if (isMobile && playing && !isAd) resetTimer();
  }, [isMobile, playing, isAd, resetTimer]);

  // ── Chưa có link phát: đang tải / paywall / lỗi ──
  if (!videoUrl) {
    return (
      <PlaybackGate
        status={status}
        playback={playback}
        error={error}
        onRetry={reload}
        backdropUrl={backdropUrl}
      />
    );
  }

  const curSec = Math.floor((core.progress / 100) * core.totalSec);
  const displayProgress = isAd ? (adManager.adProgress ?? 0) : core.progress;
  const rootClass = [
    "vp-root",
    isFakeFullscreen && "vp-root--fake-fs",
    !show && "vp-root--idle",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={wrapRef}
      className={rootClass}
      style={accent ? { "--vp-accent": accent } : undefined}
      // Chỉ chuột mới dùng hover. Trên cảm ứng, "mousemove" giả sinh ngay trước click sẽ bật
      // controls lên rồi handleVideoTap lại ẩn đi → không bao giờ gọi lại được controls.
      onPointerMove={(e) => e.pointerType === "mouse" && resetTimer()}
      onPointerLeave={(e) =>
        e.pointerType === "mouse" && !videoRef.current?.paused && setShow(false)
      }
    >
      <video
        ref={videoRef}
        className="vp-video"
        src={core.useMse ? undefined : videoUrl} // hls.js tự gắn blob khi useMse
        preload="auto" // iOS Safari cần "auto" để tải metadata sớm
        playsInline
        webkit-playsinline="true"
        x-webkit-airplay="allow"
        disableRemotePlayback
        onClick={handleVideoTap}
      />

      <ErrorOverlay error={core.videoError} />

      {!core.hasStarted && !playing && backdropUrl && (
        <img className="vp-backdrop" src={backdropUrl} alt="" />
      )}

      <SubtitleOverlay
        cue={subs.activeCue}
        visible={!!subs.selSubId && !isAd}
        controlsShown={show}
        isFullscreen={isFullscreen}
        isMobile={isMobile}
      />

      <SkipButton
        visible={skip.showSkipIntro && !isAd}
        label="Bỏ qua intro"
        onClick={skip.skipIntro}
        controlsShown={show}
      />
      <SkipButton
        visible={skip.showSkipRecap && !isAd}
        label="Bỏ qua recap"
        onClick={skip.skipRecap}
        controlsShown={show}
      />

      {renderOverlay?.({ isAd, secondsLeft: core.secondsLeft })}

      <CenterPlayIcon
        isAd={isAd}
        playing={playing}
        centerIcon={core.centerIcon}
        onToggle={core.togglePlay}
      />
      <SkipFlash skipFlash={core.skipFlash} isMobile={isMobile} />

      <AdOverlay adManager={adManager} showControls={show} compact={isMobile} />

      <AnimatePresence>
        {show && (
          <PlayerControls
            isMobile={isMobile}
            onActivity={resetTimer}
            transport={{
              playing,
              isAd,
              adsReady: adManager.adsReady,
              onTogglePlay: core.togglePlay,
              onSkip: core.skipBy,
            }}
            volume={{
              muted: core.muted,
              vol: core.vol,
              onToggleMute: () => core.setMuted((m) => !m),
              onChange: (v) => {
                core.setVol(v);
                if (v > 0) core.setMuted(false);
              },
            }}
            time={{ curSec, totalSec: core.totalSec }}
            seekbar={{
              progress: displayProgress,
              buffered: core.buffered,
              onSeek: core.seekToRatio,
            }}
            subtitles={{
              list: subs.subtitles,
              selId: subs.selSubId,
              loading: subs.loading,
              onSelect: subs.selectSubtitle,
            }}
            speed={{ rate: core.playbackRate, onSelect: core.setPlaybackRate }}
            quality={{
              levels: core.levels,
              level: core.level,
              autoHeight: core.autoHeight,
              onSelect: core.setLevel,
            }}
            fullscreen={{ active: isFullscreen || isFakeFullscreen, onToggle: toggleFullscreen }}
            menu={{ open: openMenu, toggle: toggleMenu, close: closeMenu }}
          />
        )}
      </AnimatePresence>

      <ResumePrompt
        open={promptOpen}
        seconds={resumeOffer}
        onResume={chooseResume}
        onRestart={chooseRestart}
      />
    </div>
  );
}