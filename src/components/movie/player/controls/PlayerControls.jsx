// src/components/player/controls/PlayerControls.jsx
import React from "react";
import { motion } from "framer-motion";
import {
  Play, Pause, Volume1, Volume2, VolumeX, Maximize,
  SkipBack, SkipForward, Subtitles, Gauge, Settings,
} from "lucide-react";
import ProgressBar from "./ProgressBar";
import MenuDropdown from "./MenuDropdown";
import { fmtSecs } from "../../../../utils/playerUtils";

const VolumeIcon = ({ muted, vol }) =>
  muted || vol === 0 ? <VolumeX size={19} /> : vol < 50 ? <Volume1 size={19} /> : <Volume2 size={19} />;

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SPEED_ITEMS = SPEED_OPTIONS.map((r) => ({ id: r, label: r === 1 ? "Bình thường" : `${r}x` }));

/**
 * Thanh điều khiển dưới cùng. Nhóm prop theo chức năng để dễ đọc:
 *  transport {playing, adsReady, isAd, onTogglePlay, onSkip}
 *  volume    {muted, vol, onToggleMute, onChange}
 *  time      {curSec, totalSec}
 *  seekbar   {progress, buffered, onSeek}
 *  subtitles {list, selId, loading, onSelect}
 *  speed     {rate, onSelect}
 *  quality   {levels, level, autoHeight, onSelect}
 *  fullscreen{active, onToggle}
 *  menu      {open, toggle, close}
 */
export default function PlayerControls({
  isMobile, transport, volume, time, seekbar, subtitles, speed, quality, fullscreen, menu,
}) {
  const { playing, adsReady, isAd, onTogglePlay, onSkip } = transport;
  const volPct = volume.muted ? 0 : volume.vol;

  const subItems = [
    { id: null, label: "Tắt phụ đề" },
    ...subtitles.list.map((s) => ({
      id: s.id,
      label: s.languageName || s.languageCode,
      badge: (s.languageCode ?? "??").toUpperCase(),
    })),
  ];
  const qualityItems = [
    { id: -1, label: quality.autoHeight ? `Tự động (${quality.autoHeight}p)` : "Tự động" },
    ...quality.levels.map((l) => ({
      id: l.index,
      label: l.height ? `${l.height}p` : `${Math.round(l.bitrate / 1000)} kbps`,
    })),
  ];

  return (
    <motion.div
      className={`vp-controls${isMobile ? " vp-controls--mobile" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ProgressBar {...seekbar} isAd={isAd} locked={isAd} />

      <div className="vp-controls__row">
        <div className="vp-controls__group vp-controls__group--left">
          <button className="vp-ctrl-btn" title="Lùi 10 giây" data-disabled={isAd} onClick={() => onSkip(-10)}>
            <SkipBack size={19} />
          </button>

          <button
            className="vp-ctrl-btn vp-ctrl-btn--strong"
            onClick={onTogglePlay}
            title={!playing && !adsReady ? "Đang tải..." : playing ? "Tạm dừng" : "Phát"}
          >
            {playing ? (
              <Pause size={23} fill="currentColor" />
            ) : !adsReady ? (
              <span className="vp-spinner" />
            ) : (
              <Play size={23} fill="currentColor" style={{ marginLeft: 2 }} />
            )}
          </button>

          <button className="vp-ctrl-btn" title="Tiến 10 giây" data-disabled={isAd} onClick={() => onSkip(10)}>
            <SkipForward size={19} />
          </button>

          <div className="vp-volume">
            <button
              className="vp-ctrl-btn"
              onClick={volume.onToggleMute}
              title={volume.muted ? "Bật tiếng" : `Âm lượng ${volume.vol}%`}
            >
              <VolumeIcon muted={volume.muted} vol={volume.vol} />
            </button>
            {!isMobile && (
              <>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volPct}
                  onChange={(e) => volume.onChange(+e.target.value)}
                  className="vp-volume-slider"
                  style={{
                    background: `linear-gradient(to right, #fff 0%, #fff ${volPct}%, rgba(255,255,255,0.28) ${volPct}%, rgba(255,255,255,0.28) 100%)`,
                  }}
                />
                <span className="vp-volume__pct">{volPct}%</span>
              </>
            )}
          </div>

          <span className="vp-time">
            {fmtSecs(time.curSec)} / {fmtSecs(time.totalSec)}
          </span>
        </div>

        <div className="vp-controls__group vp-controls__group--right">
          {subtitles.list.length > 0 && (
            <MenuDropdown
              open={menu.open === "sub"}
              onClose={menu.close}
              title="Phụ đề"
              minWidth={175}
              items={subItems}
              activeId={subtitles.selId ?? null}
              onSelect={subtitles.onSelect}
              trigger={
                <button
                  className={`vp-ctrl-btn${subtitles.selId ? " is-active" : ""}`}
                  title="Phụ đề"
                  onClick={() => menu.toggle("sub")}
                >
                  <Subtitles size={19} />
                  {subtitles.loading && <span className="vp-ctrl-btn__hint">…</span>}
                </button>
              }
            />
          )}

          <MenuDropdown
            open={menu.open === "speed"}
            onClose={menu.close}
            title="Tốc độ phát"
            minWidth={130}
            items={SPEED_ITEMS}
            activeId={speed.rate}
            onSelect={speed.onSelect}
            trigger={
              <button
                className={`vp-ctrl-btn vp-ctrl-btn--pill${speed.rate !== 1 ? " is-active" : ""}`}
                title="Tốc độ phát"
                onClick={() => menu.toggle("speed")}
              >
                <Gauge size={18} />
                {speed.rate !== 1 && <span>{speed.rate}x</span>}
              </button>
            }
          />

          {quality.levels.length > 1 && (
            <MenuDropdown
              open={menu.open === "quality"}
              onClose={menu.close}
              title="Chất lượng"
              items={qualityItems}
              activeId={quality.level}
              onSelect={quality.onSelect}
              trigger={
                <button
                  className={`vp-ctrl-btn vp-ctrl-btn--pill${quality.level !== -1 ? " is-active" : ""}`}
                  title="Chất lượng"
                  onClick={() => menu.toggle("quality")}
                >
                  <Settings size={18} />
                  {quality.level !== -1 && (
                    <span>{quality.levels.find((l) => l.index === quality.level)?.height}p</span>
                  )}
                </button>
              }
            />
          )}

          <button
            className="vp-ctrl-btn"
            onClick={fullscreen.onToggle}
            title={fullscreen.active ? "Thoát toàn màn hình" : "Toàn màn hình"}
          >
            <Maximize size={19} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}