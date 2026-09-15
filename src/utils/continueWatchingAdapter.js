// src/utils/continueWatchingAdapter.js
//
// Chuyển đổi WatchHistoryDTO (phim lẻ) và TvShowWatchHistoryDTO (phim bộ)
// từ backend thành 1 shape thống nhất cho <ContinueWatchingSection />.
//
// LÝ DO CẦN FILE NÀY:
// - WatchHistoryDTO lưu ProgressMinutes (phút), KHÔNG có tổng Duration của phim
//   → không tự tính được % tiến trình hay "còn lại bao nhiêu phút" nếu thiếu duration.
// - TvShowWatchHistoryDTO lưu ProgressSeconds (giây) + có thể có EpisodeRuntime (phút).
// - EpisodeId có thể null nếu user chưa từng xem tập cụ thể (track ở cấp show).
//
// Nếu bạn có sẵn Duration của movie (từ danh sách movie đã fetch trước đó, hoặc
// join thêm ở BE), truyền vào qua `movieDurationMap` để tính % chính xác.

/**
 * @param {import('../services/movieService').WatchHistoryDTO} dto
 * @param {Map<string, number>} [movieDurationMap] - movieId -> duration (phút), nếu có
 */
export function mapMovieHistoryToItem(dto, movieDurationMap) {
  const durationMinutes = movieDurationMap?.get(dto.movieId);
  const progressMinutes = dto.progressMinutes ?? 0;

  let progress; // %
  let remainingMinutes;
  if (durationMinutes && durationMinutes > 0) {
    progress = Math.min(100, Math.max(0, Math.round((progressMinutes / durationMinutes) * 100)));
    remainingMinutes = Math.max(0, durationMinutes - progressMinutes);
  }

  return {
    // dùng historyId làm id record, nhưng navigation phải dùng movieId
    id: dto.movieId,
    historyId: dto.id,
    isTvShow: false,
    title: dto.movieTitle,
    posterUrl: dto.posterUrl,
    backdropUrl: dto.posterUrl, // BE chưa trả backdrop riêng cho history, fallback poster
    isCompleted: dto.isCompleted,
    watchedAt: dto.watchedAt,

    // dữ liệu phục vụ progress bar + resume khi bấm Play
    progress,
    progressMinutes,
    currentTime: progressMinutes * 60, // giây, để đồng nhất đơn vị với TV show khi cần
    duration: durationMinutes ? durationMinutes * 60 : undefined,
    remainingMinutes,
  };
}

/**
 * @param {import('../services/tvShowService').TvShowWatchHistoryDTO} dto
 */
export function mapTvShowHistoryToItem(dto) {
  const progressSeconds = dto.progressSeconds ?? 0;
  const runtimeMinutes = dto.episodeRuntime; // phút, có thể null

  let progress;
  let remainingMinutes;
  if (runtimeMinutes && runtimeMinutes > 0) {
    const runtimeSeconds = runtimeMinutes * 60;
    progress = Math.min(100, Math.max(0, Math.round((progressSeconds / runtimeSeconds) * 100)));
    remainingMinutes = Math.max(0, Math.round((runtimeSeconds - progressSeconds) / 60));
  }

  return {
    id: dto.tvShowId,
    historyId: dto.id,
    isTvShow: true,
    title: dto.tvShowTitle,
    posterUrl: dto.posterUrl,
    backdropUrl: dto.posterUrl,
    isCompleted: dto.isCompleted,
    watchedAt: dto.watchedAt,

    // metadata tập — QUAN TRỌNG để resume đúng tập khi bấm Play
    episodeId: dto.episodeId ?? null,
    season: dto.seasonNumber ?? 1,
    episode: dto.episodeNumber ?? 1,
    episodeName: dto.episodeName,

    progress,
    currentTime: progressSeconds,
    duration: runtimeMinutes ? runtimeMinutes * 60 : undefined,
    remainingMinutes,
  };
}

/**
 * Gộp + sắp xếp lịch sử phim lẻ và phim bộ thành 1 mảng cho ContinueWatchingSection.
 * Loại bỏ các mục đã xem xong (isCompleted) — đúng UX "tiếp tục xem".
 *
 * @param {import('../services/movieService').WatchHistoryDTO[]} movieHistories
 * @param {import('../services/tvShowService').TvShowWatchHistoryDTO[]} tvHistories
 * @param {Map<string, number>} [movieDurationMap]
 */
export function buildContinueWatchingList(movieHistories = [], tvHistories = [], movieDurationMap) {
  const movieItems = movieHistories.map((h) => mapMovieHistoryToItem(h, movieDurationMap));
  const tvItems = tvHistories.map(mapTvShowHistoryToItem);

  return [...movieItems, ...tvItems]
    .filter((item) => !item.isCompleted)
    .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
}