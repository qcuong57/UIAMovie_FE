// src/components/hooks/useFullscreen.js
import { useCallback, useEffect, useState } from "react";

/**
 * Fullscreen cho player, gồm 3 việc:
 *
 * 1. Theo dõi trạng thái fullscreen (chuẩn + webkit + sự kiện riêng của <video> trên iOS).
 * 2. "Fake fullscreen" cho iPhone Safari: iPhone không có Fullscreen API trên div, và
 *    video.webkitEnterFullscreen() chỉ đẩy riêng <video> vào layer native → phụ đề,
 *    AdOverlay, control bar (sibling của <video>) biến mất. Giải pháp: kéo dãn div wrapper
 *    bằng CSS (position: fixed) để mọi overlay vẫn là con của nó.
 * 3. Chặn cử chỉ pinch (gesturestart/gesturechange) — từ iOS 11, pinch trực tiếp trên
 *    <video> mở AVPlayer fullscreen gốc, làm overlay biến mất dù không dùng fake fullscreen.
 *    Khoá scroll nền + tô đen html/body khi ở fake fullscreen (tránh viền trắng ở notch).
 *
 * @param {{ wrapRef, videoRef, hasVideo: boolean }} p
 *   hasVideo: <video> chỉ mount sau khi Playback API trả URL → phải gắn lại listener khi xuất hiện.
 */
export default function useFullscreen({ wrapRef, videoRef, hasVideo }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFakeFullscreen, setIsFakeFullscreen] = useState(false);

  // 1) Theo dõi trạng thái fullscreen
  useEffect(() => {
    const onFsChange = () =>
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
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
  }, [hasVideo, videoRef]);

  // 2) Chặn pinch mở native fullscreen của iOS
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const prevent = (e) => e.preventDefault();
    v.addEventListener("gesturestart", prevent);
    v.addEventListener("gesturechange", prevent);
    return () => {
      v.removeEventListener("gesturestart", prevent);
      v.removeEventListener("gesturechange", prevent);
    };
  }, [hasVideo, videoRef]);

  // 3) Khoá scroll nền + nền đen khi fake fullscreen
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

  const toggleFullscreen = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;

    // Đang fake fullscreen → chỉ cần tắt state
    if (isFakeFullscreen) {
      setIsFakeFullscreen(false);
      setIsFullscreen(false);
      return;
    }
    // Đang fullscreen chuẩn → thoát (thử cả 2 kiểu API)
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      return;
    }
    // Vào fullscreen: ưu tiên API chuẩn, không có (iPhone) thì giả lập bằng CSS
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else {
      setIsFakeFullscreen(true);
      setIsFullscreen(true);
    }
  }, [wrapRef, isFakeFullscreen]);

  return { isFullscreen, isFakeFullscreen, toggleFullscreen };
}
