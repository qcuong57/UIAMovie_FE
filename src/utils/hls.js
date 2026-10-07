// src/utils/hls.js
// Ưu tiên hls.js (MSE) khi trình duyệt hỗ trợ — ổn định hơn HLS native trên Chrome/Edge.
// Chỉ rơi về HLS native (Safari/iOS iPhone, không có MSE) khi hls.js không dùng được.

import Hls from "hls.js";

let _native;
export function supportsNativeHls() {
  if (_native !== undefined) return _native;
  if (typeof document === "undefined") return false;
  _native = !!document
    .createElement("video")
    .canPlayType("application/vnd.apple.mpegurl");
  return _native;
}

export function supportsMse() {
  try {
    return Hls.isSupported();
  } catch {
    return false;
  }
}