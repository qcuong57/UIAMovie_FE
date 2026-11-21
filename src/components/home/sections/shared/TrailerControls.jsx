// src/components/home/sections/shared/TrailerControls.jsx
// Phần điều khiển trailer dùng chung cho TrailerRoom (trailer / billboard mobile) và BillboardSection (desktop).
import React, { useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const DEFAULT_VOLUME = 60; // 0–100

// Tiết kiệm dữ liệu: không tự phát trailer nếu người dùng bật Data Saver
export const dataSaver = () => typeof navigator !== 'undefined' && navigator.connection?.saveData === true;

/** Tắt/bật tiếng + âm lượng của trailer (không đổi src của trailer → không tải lại). */
export function useTrailerVolume() {
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  const toggleMute = useCallback(() => {
    if (muted && volume === 0) setVolume(DEFAULT_VOLUME);
    setMuted((m) => !m);
  }, [muted, volume]);

  const changeVolume = useCallback((v) => {
    setVolume(v);
    setMuted(v === 0);
  }, []);

  return { muted, volume, toggleMute, changeVolume };
}

// Nút + thanh trượt âm lượng. Vị trí do nơi dùng truyền qua `style` (top/right/bottom…); `compact` = ẩn thanh trượt (mobile).
export function VolumeControl({ muted, volume, onToggle, onVolume, compact = false, large = false, className, style }) {
  const shown = muted ? 0 : volume;
  const height = large ? 38 : 34;
  const button = large ? 36 : 32;
  const Icon = shown === 0 ? VolumeX : Volume2;
  return (
    <div
      style={{
        position: 'absolute', zIndex: 4, display: 'flex', alignItems: 'center', gap: large ? 6 : 4,
        height, borderRadius: height / 2, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(0,0,0,.6)', ...style,
      }}
    >
      <button
        type="button" className={className} aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'} onClick={onToggle}
        style={{ width: button, height: button, borderRadius: '50%', border: 'none', background: 'none', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
      >
        <Icon size={large ? 17 : 16} />
      </button>
      {!compact && (
        <input
          type="range" min={0} max={100} step={1} value={shown} aria-label="Âm lượng"
          onChange={(e) => onVolume(Number(e.target.value))}
          style={{ width: large ? 84 : 76, marginRight: 12, accentColor: '#fff', cursor: 'pointer' }}
        />
      )}
    </div>
  );
}