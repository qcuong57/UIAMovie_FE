// src/hooks/usePlaybackHeartbeat.js
// Đếm giây xem THẬT (đang phát + tab hiện + không phải quảng cáo), cứ đủ 15s gửi 1 heartbeat.
// BE: ClampSeconds cho phép 0–30s/beat và không vượt thời gian thực trôi qua → gửi đúng 15 là an toàn.
//
// - 404/403 → dừng hẳn (không tồn tại / Premium mà guest hoặc user free)
// - 429     → giãn nhịp 60s rồi thử lại
// - Đóng tab / đổi trang / unmount → gửi nốt số giây dư qua `flush` (fetch keepalive)
import { useEffect, useRef } from "react";

const BEAT_SECONDS = 15;
const BACKOFF_SECONDS = 60;

/**
 * @param {{
 *   enabled: boolean,
 *   isPlaying: boolean,
 *   send: (secs: number) => Promise<{ isCountedAsView?: boolean }>,
 *   flush?: (secs: number) => void,   // gửi không chờ kết quả, sống sót khi đóng tab
 * }} p
 */
export default function usePlaybackHeartbeat({ enabled, isPlaying, send, flush }) {
  const playingRef = useRef(false);
  const sendRef = useRef(send);
  const flushRef = useRef(flush);
  playingRef.current = isPlaying;
  sendRef.current = send;
  flushRef.current = flush;

  useEffect(() => {
    if (!enabled) return;
    let watched = 0;
    let stopped = false;
    let inFlight = false;
    let skipTicks = 0;

    const flushRest = () => {
      if (stopped || watched < 1 || !flushRef.current) return;
      const secs = Math.min(watched, BEAT_SECONDS);
      watched = 0;
      try {
        flushRef.current(secs);
      } catch {
        /* best-effort */
      }
    };

    const id = setInterval(async () => {
      if (skipTicks > 0) {
        skipTicks--;
        return;
      }
      if (stopped || inFlight || !playingRef.current || document.hidden) return;
      if (++watched < BEAT_SECONDS) return;
      watched = 0;
      inFlight = true;
      try {
        const res = await sendRef.current(BEAT_SECONDS);
        // BE không bao giờ reset IsCountedAsView → đã tính view thì dừng gửi
        if (res?.isCountedAsView) stopped = true;
      } catch (e) {
        const st = e?.response?.status;
        if (st === 404 || st === 403) stopped = true;
        else if (st === 429) skipTicks = BACKOFF_SECONDS;
        // lỗi mạng/khác: bỏ qua, beat sau thử lại
      } finally {
        inFlight = false;
      }
    }, 1000);

    window.addEventListener("pagehide", flushRest);

    return () => {
      clearInterval(id);
      window.removeEventListener("pagehide", flushRest);
      flushRest(); // unmount (đổi trang/tập trong SPA)
    };
  }, [enabled]);
}