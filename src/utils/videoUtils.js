// src/utils/videoUtils.js
// Helper để phân biệt trailer là file video trực tiếp (mp4/webm/hls...) hay
// link YouTube — vì YouTube không phải file media, không thể gán thẳng vào
// thẻ <video src="...">, phải nhúng qua <iframe> player của YouTube.

const YT_PATTERNS = [
  /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
];

export function getYoutubeVideoId(url) {
  if (!url) return null;
  for (const re of YT_PATTERNS) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export function isYoutubeUrl(url) {
  return Boolean(getYoutubeVideoId(url));
}

// Build URL nhúng cho <iframe>. loop=1 trên YouTube bắt buộc phải kèm
// playlist=<cùng id> thì mới lặp lại đúng 1 video (quirk của YouTube API).
export function getYoutubeEmbedUrl(url, { autoplay = true, muted = true, loop = true } = {}) {
  const id = getYoutubeVideoId(url);
  if (!id) return null;
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: muted ? "1" : "0",
    controls: "0",
    modestbranding: "1",
    playsinline: "1",
    rel: "0",
    iv_load_policy: "3",
    loop: loop ? "1" : "0",
    ...(loop ? { playlist: id } : {}),
  });
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}