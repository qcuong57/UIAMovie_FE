// src/hooks/useDebouncedValue.js
// Trả về `value` sau khi ngừng đổi `delay` ms. Dùng cho ô tìm kiếm: gõ thoải mái, chỉ gọi API khi ngừng gõ
// (key của query chứa giá trị đã debounce nên mỗi lần gõ không bắn một request).
import { useEffect, useState } from "react";

export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}