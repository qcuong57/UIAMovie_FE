// src/components/hooks/usePlayerShortcuts.js
import { useEffect, useRef } from "react";

/**
 * Phím tắt: Space/K phát-dừng, ←/→ tua 10s, F toàn màn hình, M tắt tiếng, C menu phụ đề.
 * Handler được giữ trong ref nên listener chỉ gắn 1 lần, không gắn lại mỗi render.
 *
 * @param {{ enabled: boolean, handlers: {
 *   onTogglePlay, onSeekBack, onSeekForward, onToggleFullscreen, onToggleMute, onToggleSubtitleMenu
 * } }} p
 */
export default function usePlayerShortcuts({ enabled, handlers }) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      const h = ref.current;
      switch (e.code) {
        case "Space":
        case "KeyK":
          e.preventDefault();
          h.onTogglePlay?.();
          break;
        case "ArrowLeft":
          e.preventDefault();
          h.onSeekBack?.();
          break;
        case "ArrowRight":
          e.preventDefault();
          h.onSeekForward?.();
          break;
        case "KeyF":
          e.preventDefault();
          h.onToggleFullscreen?.();
          break;
        case "KeyM":
          e.preventDefault();
          h.onToggleMute?.();
          break;
        case "KeyC":
          e.preventDefault();
          h.onToggleSubtitleMenu?.();
          break;
        default:
          break;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enabled]);
}
