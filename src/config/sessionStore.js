// src/config/sessionStore.js
// Nơi DUY NHẤT đọc/ghi hồ sơ người dùng ('currentUser') trong localStorage.
// - currentUser là hồ sơ hiển thị (không nhạy cảm) và là dấu hiệu "đã từng đăng nhập".
// - accessToken KHÔNG nằm ở đây (xem tokenStore.js).
// - Phát sự kiện cho cả thay đổi trong tab này lẫn từ tab khác (event 'storage'),
//   để UI và token luôn đồng bộ khi đăng nhập/đăng xuất ở nơi khác.

const KEY = 'currentUser';
const listeners = new Set();

// Cache theo chuỗi thô để getStoredUser() trả về CÙNG một object khi dữ liệu không đổi
// (bắt buộc với useSyncExternalStore, nếu không sẽ render lặp vô hạn).
let cachedRaw;
let cachedUser = null;

const readRaw = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const getStoredUser = () => {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedUser = raw ? JSON.parse(raw) : null;
    } catch {
      cachedUser = null;
    }
  }
  return cachedUser;
};

export const hasStoredUser = () => !!getStoredUser();

const notify = () => listeners.forEach((fn) => fn());

export const setStoredUser = (user) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(user));
  } catch {
    // bỏ qua (private mode / hết dung lượng)
  }
  notify();
};

export const clearStoredUser = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // bỏ qua
  }
  notify();
};

/** Đăng ký lắng nghe thay đổi hồ sơ (cùng tab + tab khác). Trả về hàm huỷ. */
export const subscribeStoredUser = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// Tab khác đăng nhập/đăng xuất → localStorage đổi → sự kiện 'storage' chỉ bắn ở các tab còn lại.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === null) notify(); // key === null: localStorage.clear()
  });
}