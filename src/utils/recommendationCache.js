// src/utils/recommendationCache.js
// Bộ nhớ đệm localStorage cho gợi ý AI (tốn kém) — qua lần tải lại trang trong cùng ngày.
// - Mỗi người dùng đúng MỘT key (ghi đè theo ngày) → không phình localStorage mỗi ngày một key.
// - Xoá sạch khi đổi / đăng xuất tài khoản (xem config/queryClient.js).
const PREFIX = "rec_cache_";
const keyOf = (userId) => `${PREFIX}${userId || "guest"}`;

export const readRecommendationCache = (userId, day) => {
  try {
    const raw = localStorage.getItem(keyOf(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.day === day && Array.isArray(parsed.data) && parsed.data.length > 0) {
      return parsed.data;
    }
  } catch {
    /* hỏng → bỏ qua */
  }
  return null;
};

export const writeRecommendationCache = (userId, day, data) => {
  try {
    const current = keyOf(userId);
    // Dọn mọi key cũ (kể cả định dạng cũ `rec_cache_<user>_<day>` và của tài khoản khác)
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX) && k !== current) localStorage.removeItem(k);
    }
    localStorage.setItem(current, JSON.stringify({ day, data }));
  } catch {
    /* quota / private mode → bỏ qua */
  }
};

export const clearRecommendationCache = () => {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
};