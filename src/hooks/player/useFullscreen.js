// src/hooks/useFullscreen.js
import { useCallback, useEffect, useState } from "react";

/**
 * Fullscreen cho player:
 *
 * 1. Theo dõi trạng thái fullscreen (chuẩn + webkit + sự kiện riêng của <video> trên iOS),
 *    đồng thời khoá xoay ngang khi vào fullscreen (như Netflix) và mở khoá khi thoát.
 * 2. "Fake fullscreen" cho iPhone Safari (không có Fullscreen API trên div): kéo dãn wrapper
 *    bằng CSS position: fixed. Để fixed thật sự phủ cả viewport, tạm vô hiệu hoá mọi thuộc tính
 *    của thẻ cha tạo "containing block" (transform, filter, backdrop-filter, will-change,
 *    contain, perspective) — nếu không, navbar vẫn lộ ra.
 * 3. Chặn pinch (gesturestart/gesturechange) mở AVPlayer gốc của iOS.
 *    Khoá scroll nền + tô đen html/body khi fake fullscreen.
 */

const CONTAINING_PROPS = [
  "transform",
  "filter",
  "backdropFilter",
  "webkitBackdropFilter",
  "willChange",
  "contain",
  "perspective",
];

const lockLandscape = () => {
  try {
    const p = screen.orientation?.lock?.("landscape");
    if (p && p.catch) p.catch(() => {});
  } catch {}
};
const unlockOrientation = () => {
  try {
    screen.orientation?.unlock?.();
  } catch {}
};

export default function useFullscreen({ wrapRef, videoRef, hasVideo }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFakeFullscreen, setIsFakeFullscreen] = useState(false);

  // 1) Theo dõi trạng thái fullscreen + khoá/mở khoá hướng màn hình
  useEffect(() => {
    const onFsChange = () => {
      const active = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(active);
      if (active) lockLandscape();
      else unlockOrientation();
    };
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
      unlockOrientation();
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

  // 3) Fake fullscreen: khoá scroll, nền đen, gỡ containing block của thẻ cha
  useEffect(() => {
    if (!isFakeFullscreen) return;

    const prevOverflow = document.body.style.overflow;
    const prevBodyBg = document.body.style.backgroundColor;
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    document.body.style.overflow = "hidden";
    document.body.style.backgroundColor = "#000";
    document.documentElement.style.backgroundColor = "#000";
    // Cờ toàn cục để CSS ẩn navbar của site (xem index.css: html.vp-fs ...)
    document.documentElement.classList.add("vp-fs");

    const saved = [];
    let el = wrapRef.current?.parentElement;
    while (el && el !== document.documentElement) {
      const cs = getComputedStyle(el);
      const touched = {};
      for (const prop of CONTAINING_PROPS) {
        const val = cs[prop];
        const isSet =
          val && val !== "none" && val !== "auto" && val !== "normal" && val !== "";
        if (isSet) {
          touched[prop] = el.style[prop];
          el.style[prop] = prop === "contain" || prop === "willChange" ? "initial" : "none";
        }
      }
      if (Object.keys(touched).length) saved.push([el, touched]);
      el = el.parentElement;
    }

    // Cuộn lên đầu để iOS thu gọn thanh địa chỉ (nếu có thể)
    window.scrollTo(0, 1);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.backgroundColor = prevBodyBg;
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.documentElement.classList.remove("vp-fs");
      for (const [node, props] of saved) {
        for (const [prop, old] of Object.entries(props)) node.style[prop] = old;
      }
    };
  }, [isFakeFullscreen, wrapRef]);

  const toggleFullscreen = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;

    // Đang fake fullscreen → tắt
    if (isFakeFullscreen) {
      setIsFakeFullscreen(false);
      setIsFullscreen(false);
      unlockOrientation();
      return;
    }
    // Đang fullscreen chuẩn → thoát
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      return;
    }
    // Vào fullscreen: ưu tiên API chuẩn, không có (iPhone) thì giả lập bằng CSS
    if (el.requestFullscreen) {
      el.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else {
      setIsFakeFullscreen(true);
      setIsFullscreen(true);
      lockLandscape(); // iOS thường từ chối, không sao
    }
  }, [wrapRef, isFakeFullscreen]);

  return { isFullscreen, isFakeFullscreen, toggleFullscreen };
}