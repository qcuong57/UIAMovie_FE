// src/hooks/useIsTouch.js — thiết bị cảm ứng (kể cả điện thoại xoay ngang > 768px, iPad)
import { useState, useEffect } from "react";

export function useIsTouch() {
  const q = "(pointer: coarse)";
  const [v, setV] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const h = (e) => setV(e.matches);
    mq.addEventListener("change", h);
    setV(mq.matches);
    return () => mq.removeEventListener("change", h);
  }, []);
  return v;
}