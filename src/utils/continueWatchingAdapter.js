// src/utils/continueWatchingAdapter.js
//
// Chuyển đổi WatchHistoryDTO (phim lẻ) và TvShowWatchHistoryDTO (phim bộ)
// từ backend thành 1 shape thống nhất cho <ContinueWatchingSection />.
//
// LÝ DO CẦN FILE NÀY:
// - WatchHistoryDTO có ProgressSeconds (giây) + Duration (giây); ProgressMinutes chỉ còn để tương thích.
// - TvShowWatchHistoryDTO lưu ProgressSeconds (giây) + có thể có EpisodeRuntime (phút).
// - EpisodeId có thể null nếu user chưa từng xem tập cụ thể (track ở cấp show).
//
// Nếu bạn có sẵn Duration của movie (từ danh sách movie đã fetch trước đó, hoặc
// join thêm ở BE), truyền vào qua `movieDurationMap` để tính % chính xác.

/**
 * @param {import('../services/movieService').WatchHistoryDTO} dto
 * @param {Map<string, number>} [movieDurationMap] - movieId -> duration (phút), chỉ dùng khi BE chưa có duration
 */
export function mapMovieHistoryToItem(dto, movieDurationMap) {
  // BE trả ProgressSeconds (giây thật) + Duration (giây). Chỉ bản ghi rất cũ mới thiếu → rơi về phút.
  const progressSeconds =
    Number(dto.progressSeconds) > 0 ? Number(dto.progressSeconds) : (dto.progressMinutes ?? 0) * 60;

  const mapMinutes = movieDurationMap?.get(dto.movieId);
  const durationSeconds =
    Number(dto.duration) > 0 ? Number(dto.duration) : mapMinutes > 0 ? mapMinutes * 60 : undefined;

  let progress; // %
  let remainingMinutes;
  if (durationSeconds) {
    progress = Math.min(100, Math.max(0, Math.round((progressSeconds / durationSeconds) * 100)));
    remainingMinutes = Math.max(0, Math.round((durationSeconds - progressSeconds) / 60));
  } else if (Number(dto.progressPercentage) > 0) {
    progress = Math.min(100, Math.round(Number(dto.progressPercentage)));
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

    // dữ liệu phục vụ progress bar + resume khi bấm Play (đơn vị: giây)
    progress,
    progressMinutes: Math.floor(progressSeconds / 60),
    currentTime: progressSeconds,
    duration: durationSeconds,
    remainingMinutes,
  };
}

/**
 * @param {import('../services/tvShowService').TvShowWatchHistoryDTO} dto
 */
export function mapTvShowHistoryToItem(dto) {
  const progressSeconds = dto.progressSeconds ?? 0;
  const runtimeMinutes = dto.episodeRuntime; // phút, có thể null
  // Ưu tiên duration thật từ player (BE đã fallback runtime * 60), thiếu mới dùng runtime TMDB
  const durationSeconds =
    Number(dto.durationSeconds) > 0
      ? Number(dto.durationSeconds)
      : runtimeMinutes > 0
        ? runtimeMinutes * 60
        : undefined;

  let progress;
  let remainingMinutes;
  if (durationSeconds) {
    progress = Math.min(100, Math.max(0, Math.round((progressSeconds / durationSeconds) * 100)));
    remainingMinutes = Math.max(0, Math.round((durationSeconds - progressSeconds) / 60));
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
    duration: durationSeconds,
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
  // Mỗi show chỉ 1 thẻ: lấy bản ghi mới nhất rồi mới lọc completed
  // (nếu dùng GET /tvshows/continue-watching thì BE đã làm sẵn, bước này vô hại)
  const latestTv = Object.values(
    tvHistories.reduce((acc, h) => {
      const cur = acc[h.tvShowId];
      if (!cur || new Date(h.watchedAt) > new Date(cur.watchedAt)) acc[h.tvShowId] = h;
      return acc;
    }, {}),
  );
  const tvItems = latestTv.map(mapTvShowHistoryToItem);

  return [...movieItems, ...tvItems]
    .filter((item) => !item.isCompleted)
    .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
}