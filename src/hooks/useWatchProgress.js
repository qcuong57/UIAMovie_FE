// src/components/hooks/useWatchProgress.js
import { useCallback, useEffect, useRef } from "react";
import { vDur } from "../utils/playerUtils";

const SAVE_EVERY_MS = 15_000;

/**
 * Lưu tiến độ xem: định kỳ khi đang phát, khi pause/ended (core gọi `save`), và khi unmount.
 * Hook không biết phim hay tập — chỉ gọi `onSave({ seconds, completed })` do bên ngoài truyền vào
 * (Movie đổi sang phút, Episode gửi thẳng giây).
 *
 * @param {{
 *   videoRef: React.RefObject<HTMLVideoElement>,
 *   progressRef: React.MutableRefObject<number>,  // % hiện tại (0–100)
 *   playing: boolean,
 *   fallbackDurationSec?: number,                 // dùng khi <video> chưa có duration
 *   onSave?: (p: { seconds: number, completed: boolean }) => Promise<any> | void,
 * }} p
 * @returns {{ save: (pct: number, forceComplete?: boolean) => void }}
 */
export default function useWatchProgress({
  videoRef,
  progressRef,
  playing,
  fallbackDurationSec = 0,
  onSave,
}) {
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const fallbackRef = useRef(fallbackDurationSec);
  fallbackRef.current = fallbackDurationSec;
  // Nhớ duration thật gần nhất: lúc unmount videoRef.current đã là null
  const lastDurRef = useRef(0);

  const save = useCallback(
    (pct, forceComplete = false) => {
      if (!onSaveRef.current || pct < 1) return;
      const live = vDur(videoRef.current);
      if (live) lastDurRef.current = live;
      const dur = live || lastDurRef.current || fallbackRef.current;
      const seconds = Math.floor((pct / 100) * dur);
      if (seconds < 1) return; // duration chưa load
      Promise.resolve(onSaveRef.current({ seconds, completed: forceComplete || pct >= 95 })).catch(
        (e) => console.warn("[VideoPlayer] saveProgress:", e),
      );
    },
    [videoRef],
  );

  // Định kỳ khi đang phát
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => save(progressRef.current), SAVE_EVERY_MS);
    return () => clearInterval(id);
  }, [playing, save, progressRef]);

  // Lưu khi unmount
  useEffect(
    () => () => {
      if (progressRef.current > 1) save(progressRef.current);
    },
    [save, progressRef],
  );

  return { save };
}
