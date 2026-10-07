// src/services/playbackService.js
// Playback API — khớp PlaybackController.cs  (route: /api/playback)
// axiosInstance đã có baseURL = ".../api" nên chỉ cần "/playback/...".

import axiosInstance from "../config/axios";

// ── Chuẩn hoá response + bắt 401/403 (đặt cùng file để không phụ thuộc utils/playback.js) ──
/**
 * Chuẩn hóa response từ Playback API về một object đồng nhất.
 * Chấp nhận cả 3 dạng: DTO thẳng (200), { message, code, data } (401/403), hoặc axios response.
 */
function normalizePlayback(res) {
  if (!res) return null;
  const raw = res.data?.data ?? res.data ?? res;

  const playbackUrl = raw.playbackUrl || raw.videoUrl || null;
  const isHls =
    raw.streamingType?.toUpperCase() === "HLS" ||
    (typeof playbackUrl === "string" && playbackUrl.includes(".m3u8"));

  return {
    contentType: raw.contentType || null,
    contentId: raw.contentId || null,
    parentId: raw.parentId || null,
    title: raw.title || null,
    isPremium: raw.isPremium ?? false,
    canWatch: raw.canWatch ?? false,
    requiresPremium: raw.requiresPremium ?? false,
    blockReason: raw.blockReason || raw.code || null,
    message: raw.message || null,
    playbackUrl,
    videoUrl: playbackUrl, // Tương thích component cũ
    streamingType: isHls ? "HLS" : raw.streamingType || "MP4",
    isHls,
    videoId: raw.videoId || null,
    provider: raw.provider || "Cloudinary",
    quality: raw.quality || null,
    durationSeconds: raw.durationSeconds || null,
    seasonNumber: raw.seasonNumber || null,
    episodeNumber: raw.episodeNumber || null,
    episodeTitle: raw.episodeTitle || null,
  };
}

// Dựng object "bị chặn" từ body lỗi 401/403. BE gửi kèm `data` (PlaybackResponseDTO
// đầy đủ: title, episodeTitle, isPremium...) nên gộp vào để UI paywall có thông tin hiển thị.
function buildBlocked(errData, fallbackReason, fallbackMessage) {
  const base = normalizePlayback(errData?.data) ?? {};
  return {
    ...base,
    canWatch: false,
    requiresPremium: true,
    blockReason: errData?.code || base.blockReason || fallbackReason,
    message: errData?.message || fallbackMessage,
    playbackUrl: null,
    videoUrl: null,
    isHls: false,
  };
}

/**
 * Thực thi request gọi playback; bắt 401/403 để UI hiển thị paywall thay vì crash.
 * 404 / lỗi mạng → throw (usePlayback sẽ chuyển thành trạng thái "error").
 */
async function fetchPlayback(requestFn) {
  try {
    const res = await requestFn();
    return normalizePlayback(res);
  } catch (error) {
    const status = error?.response?.status;
    const errData = error?.response?.data;

    if (status === 401) {
      return buildBlocked(errData, "LOGIN_REQUIRED", "Vui lòng đăng nhập để xem nội dung này.");
    }
    if (status === 403) {
      return buildBlocked(errData, "PREMIUM_REQUIRED", "Nội dung này yêu cầu gói thành viên Premium.");
    }
    throw error;
  }
}

const playbackService = {
  /** GET /api/playback/movie/{movieId} */
  getMoviePlayback: (movieId) =>
    fetchPlayback(() => axiosInstance.get(`/playback/movie/${movieId}`)),

  /** GET /api/playback/tv/{tvShowId}/episode/{episodeId} */
  getEpisodePlayback: (tvShowId, episodeId) =>
    fetchPlayback(() =>
      axiosInstance.get(`/playback/tv/${tvShowId}/episode/${episodeId}`),
    ),

  /** GET /api/playback/tv/{tvShowId}/season/{n}/episode/{m} */
  getEpisodePlaybackByNumber: (tvShowId, seasonNumber, episodeNumber) =>
    fetchPlayback(() =>
      axiosInstance.get(
        `/playback/tv/${tvShowId}/season/${seasonNumber}/episode/${episodeNumber}`,
      ),
    ),
};

export { normalizePlayback, fetchPlayback };
export default playbackService;