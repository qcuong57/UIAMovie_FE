// src/hooks/player/useDevToolsGuard.js
// Rào cản nhẹ: chặn phím tắt DevTools, phát hiện DevTools đang mở. KHÔNG thay thế bảo mật phía server.
import { useEffect, useRef, useState } from "react";

const SIZE_GAP = 200;
const HITS_TO_LOCK = 2; // cần 2 lần liên tiếp mới khoá → giảm false positive
const INTERVAL_MS = 1000;

const isDevKey = (e) => {
  const k = e.key.toLowerCase();
  const mod = e.ctrlKey || e.metaKey;
  return (
    e.key === "F12" ||
    (mod && (e.shiftKey || e.altKey) && ["i", "j", "c"].includes(k)) ||
    (mod && k === "u")
  );
};

export default function useDevToolsGuard({ enabled, onDetect }) {
  const [opened, setOpened] = useState(false);
  const cbRef = useRef(onDetect);
  cbRef.current = onDetect;

  useEffect(() => {
    if (!enabled) {
      setOpened(false);
      return undefined;
    }
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    let hits = 0;
    let isOpen = false;

    const onKey = (e) => {
      if (isDevKey(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onCtx = (e) => e.preventDefault();

    const check = () => {
      if (document.hidden) return;
      const sizeHit =
        !coarse &&
        (window.outerWidth - window.innerWidth > SIZE_GAP ||
          window.outerHeight - window.innerHeight > SIZE_GAP);
      const t = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const debugHit = performance.now() - t > 100;

      hits = sizeHit || debugHit ? hits + 1 : 0;
      const next = hits >= HITS_TO_LOCK;
      if (next !== isOpen) {
        isOpen = next;
        setOpened(next);
        if (next) cbRef.current?.();
      }
    };

    window.addEventListener("keydown", onKey, true);
    window.addEventListener("contextmenu", onCtx);
    const id = setInterval(check, INTERVAL_MS);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("contextmenu", onCtx);
      clearInterval(id);
    };
  }, [enabled]);

  return opened;
}