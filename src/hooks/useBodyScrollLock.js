// src/hooks/useBodyScrollLock.js
// Khoá scroll nền khi overlay mở. Dùng chung cho Modal, BottomSheet, MobileSearchOverlay.
import { useEffect } from "react";

export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return;
    const { body, documentElement: html } = document;
    const prev = { body: body.style.overflow, html: html.style.overflow };
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      body.style.overflow = prev.body;
      html.style.overflow = prev.html;
    };
  }, [locked]);
}