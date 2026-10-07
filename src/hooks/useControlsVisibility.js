// src/components/hooks/useControlsVisibility.js
import { useCallback, useEffect, useRef, useState } from "react";

const HIDE_AFTER_MS = 3500;

/**
 * Hiện/ẩn thanh điều khiển. Tự ẩn sau 3.5s không thao tác khi video đang phát.
 * @returns {{ show, setShow, resetTimer, hideNow }}
 */
export default function useControlsVisibility(videoRef) {
  const [show, setShow] = useState(true);
  const timerRef = useRef(null);

  // Hiện controls và hẹn giờ tự ẩn (nếu đang phát)
  const resetTimer = useCallback(() => {
    setShow(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShow(false);
    }, HIDE_AFTER_MS);
  }, [videoRef]);

  // Ẩn ngay và huỷ hẹn giờ (dùng cho tap lên video trên mobile)
  const hideNow = useCallback(() => {
    setShow(false);
    clearTimeout(timerRef.current);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { show, setShow, resetTimer, hideNow };
}
