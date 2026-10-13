// src/services/watchProgressFlush.js
// Gửi tiến độ xem khi đóng tab / pagehide. Request thường bị huỷ lúc trang đóng,
// nên dùng fetch keepalive (qua axios fetch adapter, cần axios >= 1.7) —
// interceptor gắn Authorization vẫn chạy như bình thường. sendBeacon không gắn được header nên không dùng.
import axiosInstance from "../config/axios";

const KEEPALIVE = { adapter: "fetch", fetchOptions: { keepalive: true } };

export function flushMovieProgress({ movieId, seconds, durationSeconds, completed }) {
  return axiosInstance
    .post(
      "/movies/history",
      {
        movieId,
        progressMinutes: Math.floor(seconds / 60),
        progressSeconds: seconds,
        durationSeconds: durationSeconds > 0 ? durationSeconds : undefined,
        isCompleted: completed,
      },
      KEEPALIVE,
    )
    .catch(() => {});
}

export function flushEpisodeProgress({ tvShowId, episodeId, seconds, durationSeconds, completed }) {
  return axiosInstance
    .post(
      "/tvshows/history",
      {
        tvShowId,
        episodeId,
        progressSeconds: seconds,
        durationSeconds: durationSeconds > 0 ? durationSeconds : null,
        isCompleted: completed,
      },
      KEEPALIVE,
    )
    .catch(() => {});
}