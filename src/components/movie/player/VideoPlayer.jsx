// src/components/player/VideoPlayer.jsx
// Shell dùng chung cho Movie + Episode: chỉ ghép hook + component, không biết phim hay tập.
// Khác biệt giữa hai loại nằm hết ở props (xem MovieVideoPlayer / EpisodeVideoPlayer).

import React, { useCallback, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import "./player.css";

import { useIsMobile } from "../../../hooks/useIsMobile";
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

import PlayerControls from "./controls/PlayerControls";
import CenterPlayIcon from "./controls/CenterPlayIcon";
import SkipFlash from "./controls/SkipFlash";
import SkipButton from "./controls/SkipButton";
import SubtitleOverlay from "./controls/SubtitleOverlay";
import ErrorOverlay from "./controls/ErrorOverlay";

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
 *   onSaveProgress?: (p: { seconds: number, completed: boolean }) => Promise<any> | void,
 *   skipMarkers?: { introStart, introEnd, recapStart, recapEnd },
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
  onSaveProgress,
  skipMarkers,
  renderOverlay,
}) {
  const isMobile = useIsMobile();
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const saveRef = useRef(null);

  // Menu đang mở: "sub" | "speed" | "quality" | null — mở cái này tự đóng cái kia
  const [openMenu, setOpenMenu] = useState(null);
  const toggleMenu = useCallback((n) => setOpenMenu((m) => (m === n ? null : n)), []);
  const closeMenu = useCallback(() => setOpenMenu(null), []);

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
  });

  const { show, setShow, resetTimer, hideNow } = useControlsVisibility(videoRef);

  const core = useVideoPlayerCore({
    videoRef,
    videoUrl,
    playback,
    adManager,
    resumeSeconds,
    fallbackDurationSec,
    onPause: (pct) => saveRef.current?.(pct),
    onEnded: () => {
      setShow(true);
      saveRef.current?.(100, true);
    },
  });
  const { hasVideo, isAd, playing } = core;

  const { save } = useWatchProgress({
    videoRef,
    progressRef: core.progressRef,
    playing,
    fallbackDurationSec: playback?.durationSeconds || fallbackDurationSec,
    onSave: onSaveProgress,
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
    enabled: hasVideo,
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
    if (!isMobile) return core.togglePlay();
    if (!show) resetTimer();
    else hideNow();
  };

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
      onMouseMove={resetTimer}
      onMouseLeave={() => !videoRef.current?.paused && setShow(false)}
    >
      <video
        ref={videoRef}
        className="vp-video"
        src={core.useMse ? undefined : videoUrl} // hls.js tự gắn blob khi useMse
        preload="auto" // iOS Safari cần "auto" để tải metadata sớm
        playsInline
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

      <AdOverlay adManager={adManager} showControls={show} />

      <AnimatePresence>
        {show && (
          <PlayerControls
            isMobile={isMobile}
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
    </div>
  );
}