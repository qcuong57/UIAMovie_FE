// src/utils/guestId.js
// Định danh guest bền vững: UUID lưu localStorage, gửi qua header X-Guest-Id.
// Không phụ thuộc cookie third-party (FE vercel.app ↔ API khác domain). BE tự fallback về cookie nếu header thiếu.
const KEY = "guest_id";

export function getGuestId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
            });
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null; // localStorage bị chặn → BE dùng cookie
  }
}

export const guestHeaders = () => {
  const id = getGuestId();
  return id ? { "X-Guest-Id": id } : {};
};