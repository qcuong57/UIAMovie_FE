// src/hooks/useMinimumLoading.js
// Cổng "luôn hiện LoadingScreen" cho một trang.
//
// Vấn đề: React Query có cache → lần quay lại trang `isLoading` là false ngay từ frame đầu,
// LoadingScreen không bao giờ xuất hiện (hoặc chớp 1 frame rồi biến mất, chữ chưa gõ xong).
//
// Giải pháp: trả về `true` khi
//   • dữ liệu đang tải thật (isLoading), HOẶC
//   • trang mới mount chưa đủ `minMs` (đủ để chữ UIAMOVIE gõ xong + giữ 1 nhịp).
// Vì vậy: tải chậm → ở lại đến khi có data; có cache sẵn → vẫn hiện tối thiểu `minMs`.
// Hết cả hai điều kiện → trả về false → <AnimatePresence> chạy hiệu ứng "mở màn" (trượt lên).
//
// Mặc định tính theo LoadingScreen: 9 ký tự × 90ms ≈ 810ms gõ + ~300ms giữ → 1100ms.
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

export const MIN_LOADING_MS = 1100;

export function useMinimumLoading(isLoading, minMs = MIN_LOADING_MS) {
  const reduced = useReducedMotion();
  const wait = reduced ? 300 : minMs; // reduced motion: LoadingScreen chỉ gõ 0.2s
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setElapsed(true), wait);
    return () => clearTimeout(t);
  }, [wait]);

  return isLoading || !elapsed;
}