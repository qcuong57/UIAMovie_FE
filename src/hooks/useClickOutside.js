// src/components/hooks/useClickOutside.js
import { useEffect, useRef } from "react";

/**
 * Gọi handler khi người dùng nhấn chuột ra ngoài `ref`.
 * Chỉ gắn listener khi `active` = true (vd: menu đang mở).
 * Thay cho 3 useEffect lặp lại (phụ đề / tốc độ / chất lượng).
 */
export default function useClickOutside(ref, handler, active = true) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!active) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handlerRef.current?.(e);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, active]);
}
