// src/components/player/playerUtils.js

// HLS có thể báo duration = Infinity / NaN khi chưa tải manifest → dùng giá trị fallback.
export const vDur = (v, fb = 0) =>
  Number.isFinite(v?.duration) && v.duration > 0 ? v.duration : fb;

// Giây → mm:ss hoặc h:mm:ss
export const fmtSecs = (s) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(Math.floor(s % 60)).padStart(2, "0");
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
};

// MediaError chỉ có .code (số) + .message (thường rỗng trên WebKit) →
// map sang mô tả đọc được ngay trên điện thoại, không cần Safari Web Inspector.
export const MEDIA_ERROR_LABELS = {
  1: "MEDIA_ERR_ABORTED — người dùng/tab huỷ tải video",
  2: "MEDIA_ERR_NETWORK — lỗi mạng khi tải video (CORS, mất kết nối, URL sai...)",
  3: "MEDIA_ERR_DECODE — dữ liệu video hỏng hoặc trình duyệt decode lỗi",
  4: "MEDIA_ERR_SRC_NOT_SUPPORTED — định dạng/codec video không được trình duyệt hỗ trợ",
};
