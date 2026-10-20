// src/config/tokenStore.js
// accessToken chỉ sống trong bộ nhớ của tab (biến module), không ghi localStorage.
// Reload / mở tab mới → gọi /auth/refresh-token (cookie HttpOnly) để lấy lại.

let accessToken = null;
const listeners = new Set();

// Dọn token cũ còn sót trong localStorage từ phiên bản trước.
try {
  localStorage.removeItem('accessToken');
} catch {
  // bỏ qua
}

export const getAccessToken = () => accessToken;

export const setAccessToken = (token) => {
  accessToken = token || null;
  listeners.forEach((fn) => fn(accessToken));
};

export const clearAccessToken = () => setAccessToken(null);

// Dùng cho SignalR / nơi cần biết token đổi: const off = onAccessTokenChange(fn); off();
export const onAccessTokenChange = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};