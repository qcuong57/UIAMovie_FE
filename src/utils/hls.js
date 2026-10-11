// src/utils/hls.js
// Chọn nguồn phát HLS:
//  - iPhone/iPad (WebKit): LUÔN phát native. iOS 17.1+ có ManagedMediaSource nên Hls.isSupported()
//    = true, nhưng hls.js + MMS gắn nguồn bằng <source> con → xung đột với việc swap v.src của
//    useAdManager (single-video) và cần disableRemotePlayback → video đứng im / không quay lại phim sau ad.
//  - Android/desktop: dùng hls.js (MSE) để có ABR + menu chất lượng.
import Hls from "hls.js";

let _native;
export function supportsNativeHls() {
  if (_native !== undefined) return _native;
  if (typeof document === "undefined") return false;
  _native = !!document.createElement("video").canPlayType("application/vnd.apple.mpegurl");
  return _native;
}

// iPhone, iPod, iPad (kể cả iPadOS giả danh Macintosh) — mọi trình duyệt trên iOS đều là WebKit
export function isAppleTouch() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function supportsMse() {
  try {
    if (isAppleTouch() && supportsNativeHls()) return false;
    return Hls.isSupported();
  } catch {
    return false;
  }
}

export const isHlsUrl = (u) => /\.m3u8(\?|#|$)/i.test(u || "");

// isHls từ playback có thể thiếu/undefined → suy từ đuôi URL
export function shouldUseMse(url, isHls) {
  return !!url && !!(isHls ?? isHlsUrl(url)) && supportsMse();
}