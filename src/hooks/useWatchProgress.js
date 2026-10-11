// src/components/hooks/useWatchProgress.js
import { useCallback, useEffect, useRef } from "react";
import { vDur } from "../utils/playerUtils";

const SAVE_EVERY_MS = 15_000;
const COMPLETE_RATIO = 0.95;

/**
 * Lưu tiến độ xem: định kỳ khi đang phát, khi pause/ended (core gọi `save`), và khi unmount.
 * Vị trí lấy trực tiếp từ video.currentTime (giây thật), KHÔNG suy ra từ % × duration
 * (duration HLS / fallback / quảng cáo dễ sai → lệch hàng phút).
 *
 * @param {{
 *   videoRef: React.RefObject<HTMLVideoElement>,
 *   progressRef: React.MutableRefObject<number>,   // % hiện tại (0–100), chỉ dùng làm phương án cuối
 *   playing: boolean,
 *   videoReady?: boolean,                          // <video> đã mount (core.hasVideo)
 *   isAdPlayingRef?: React.MutableRefObject<boolean>,
 *   fallbackDurationSec?: number,
 *   onSave?: (p: { seconds: number, completed: boolean, durationSeconds: number }) => Promise<any> | void,
 * }} p
 * @returns {{ save: (pct: number, forceComplete?: boolean) => void }}
 */
export default function useWatchProgress({
  videoRef,
  progressRef,
  playing,
  videoReady = true,
  isAdPlayingRef,
  fallbackDurationSec = 0,
  onSave,
}) {
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const fallbackRef = useRef(fallbackDurationSec);
  fallbackRef.current = fallbackDurationSec;

  // Nhớ vị trí + duration của NỘI DUNG CHÍNH: lúc unmount videoRef.current đã là null
  const lastTimeRef = useRef(0);
  const lastDurRef = useRef(0);

  // Theo dõi currentTime của nội dung chính (bỏ qua khi đang chạy quảng cáo)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    const sync = () => {
      if (isAdPlayingRef?.current) return;
      const d = vDur(v);
      if (d) lastDurRef.current = d;
      const t = v.currentTime;
      if (Number.isFinite(t) && t > 0) lastTimeRef.current = t;
    };
    const events = ["timeupdate", "pause", "seeked", "durationchange", "loadedmetadata"];
    events.forEach((e) => v.addEventListener(e, sync));
    return () => events.forEach((e) => v.removeEventListener(e, sync));
  }, [videoRef, isAdPlayingRef, videoReady]);

  const save = useCallback(
    (pct, forceComplete = false) => {
      if (!onSaveRef.current) return;

      const v = videoRef.current;
      const adNow = !!isAdPlayingRef?.current;
      // Đang chạy quảng cáo: currentTime / duration / % đều là của QC → không lưu
      if (adNow) return;

      if (v) {
        const d = vDur(v);
        if (d) lastDurRef.current = d;
        const t = v.currentTime;
        if (Number.isFinite(t) && t > 0) lastTimeRef.current = t;
      }

      const dur = lastDurRef.current || fallbackRef.current || 0;
      let seconds = Math.floor(lastTimeRef.current);

      // Phương án cuối: chưa có currentTime nào nhưng có % và duration
      if (seconds < 1 && pct >= 1 && dur > 0) seconds = Math.floor((pct / 100) * dur);

      if (forceComplete && dur > 0) seconds = Math.floor(dur);
      if (dur > 0) seconds = Math.min(seconds, Math.floor(dur));
      if (seconds < 1) return; // chưa phát được giây nào → không ghi đè lịch sử cũ

      const completed =
        forceComplete || (dur > 0 ? seconds / dur >= COMPLETE_RATIO : pct >= COMPLETE_RATIO * 100);

      Promise.resolve(
        onSaveRef.current({ seconds, completed, durationSeconds: Math.floor(dur) }),
      ).catch((e) => console.warn("[VideoPlayer] saveProgress:", e));
    },
    [videoRef, isAdPlayingRef],
  );

  // Định kỳ khi đang phát
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      if (isAdPlayingRef?.current) return;
      save(progressRef.current);
    }, SAVE_EVERY_MS);
    return () => clearInterval(id);
  }, [playing, save, progressRef, isAdPlayingRef]);

  // Lưu khi unmount (đổi phim/tập, rời trang)
  useEffect(
    () => () => {
      if (lastTimeRef.current > 1) save(progressRef.current);
    },
    [save, progressRef],
  );

  return { save };
}