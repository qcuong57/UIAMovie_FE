// src/services/tvShowService.js
// TV Show API Service — đồng bộ hoàn toàn với TvShowsController.cs

import axiosInstance from '../config/axios';

const tvShowService = {
  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC — Danh sách & tìm kiếm
  // ═══════════════════════════════════════════════════════════════════

  /**
   * GET /api/tvshows — danh sách có phân trang + filter.
   * Khớp hoàn toàn với FilterTvShowsDTO trên backend.
   *
   * @param {Object}   filter
   * @param {number}   [filter.page=1]
   * @param {number}   [filter.pageSize=20]
   * @param {string}   [filter.search]
   * @param {string[]} [filter.genreIds]
   * @param {number}   [filter.minRating]
   * @param {number}   [filter.maxRating]
   * @param {string}   [filter.originCountry]     - ISO 3166-1 alpha-2 (VD: "KR", "US")
   * @param {string}   [filter.fromFirstAirDate]  - "YYYY-MM-DD"
   * @param {string}   [filter.toFirstAirDate]    - "YYYY-MM-DD"
   * @param {string}   [filter.status]            - "Returning Series" | "Ended" | "Canceled"
   * @param {string}   [filter.sortBy]            - "rating" | "title" | "firstairdate"
   * @param {boolean}  [filter.sortDesc=true]
   * @param {string[]} [filter.ids]               - Danh sách ID cụ thể (AI mode)
   */
  getTvShows: async ({
    page             = 1,
    pageSize         = 20,
    search           = '',
    genreIds         = [],
    minRating,
    maxRating,
    originCountry    = '',
    fromFirstAirDate = '',
    toFirstAirDate   = '',
    status           = '',
    sortBy           = 'rating',
    sortDesc         = true,
    ids              = [],
  } = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('pageSize', pageSize);
      params.append('sortBy', sortBy);
      params.append('sortDesc', sortDesc);
      if (search)            params.append('search', search);
      if (minRating != null) params.append('minRating', minRating);
      if (maxRating != null) params.append('maxRating', maxRating);
      if (originCountry)     params.append('originCountry', originCountry);
      if (fromFirstAirDate)  params.append('fromFirstAirDate', fromFirstAirDate);
      if (toFirstAirDate)    params.append('toFirstAirDate', toFirstAirDate);
      if (status)            params.append('status', status);
      (genreIds ?? []).forEach(id => params.append('genreIds', id));
      (ids ?? []).forEach(id => params.append('ids', id));

      console.log('[tvShowService] GET /tvshows?' + params.toString());
      const response = await axiosInstance.get(`/tvshows?${params}`);
      // Controller: Ok(ApiResponseDTO<object> { Data = result }) — unwrap .data
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error fetching tvshows:', error);
      console.error('[tvShowService] Response data:', error?.response?.data);
      throw error;
    }
  },

  /**
   * GET /api/tvshows/{id} — chi tiết show.
   * LƯU Ý: Seasons CHỈ chứa metadata (SeasonNumber, Name, EpisodeCount).
   * Episodes KHÔNG được trả về ở đây — gọi getSeason() để load từng season.
   * @param {string} tvShowId - GUID
   */
  getTvShowById: async (tvShowId) => {
    try {
      const response = await axiosInstance.get(`/tvshows/${tvShowId}`);
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error fetching tvshow details:', error);
      throw error;
    }
  },

  /**
   * GET /api/tvshows/search?query=... — tìm theo tên.
   * @param {string} query
   */
  searchTvShows: async (query) => {
    try {
      if (!query?.trim()) return [];
      const response = await axiosInstance.get('/tvshows/search', {
        params: { query },
      });
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error searching tvshows:', error);
      throw error;
    }
  },

  /**
   * GET /api/tvshows/genre/{genreId} — lọc theo thể loại.
   * @param {string} genreId - GUID
   */
  getTvShowsByGenre: async (genreId) => {
    try {
      const response = await axiosInstance.get(`/tvshows/genre/${genreId}`);
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error fetching tvshows by genre:', error);
      throw error;
    }
  },

  /**
   * GET /api/tvshows/countries — danh sách quốc gia có TV show trong DB.
   * @returns {string[]}
   */
  getAvailableCountries: async () => {
    try {
      const response = await axiosInstance.get('/tvshows/countries');
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error fetching countries:', error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // SEASON / EPISODE — Load on-demand (lazy)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * GET /api/tvshows/{id}/seasons/{seasonNumber}
   * Trả về 1 season kèm đầy đủ episodes của season đó.
   * Gọi khi người dùng bấm vào 1 season cụ thể.
   * @param {string} tvShowId     - GUID
   * @param {number} seasonNumber
   */
  getSeason: async (tvShowId, seasonNumber) => {
    try {
      const response = await axiosInstance.get(`/tvshows/${tvShowId}/seasons/${seasonNumber}`);
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error fetching season:', error);
      throw error;
    }
  },

  /**
   * GET /api/tvshows/{id}/seasons/{seasonNumber}/episodes/{episodeNumber}
   * @param {string} tvShowId     - GUID
   * @param {number} seasonNumber
   * @param {number} episodeNumber
   */
  getEpisode: async (tvShowId, seasonNumber, episodeNumber) => {
    try {
      const response = await axiosInstance.get(
        `/tvshows/${tvShowId}/seasons/${seasonNumber}/episodes/${episodeNumber}`
      );
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error fetching episode:', error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // TMDB — Tìm kiếm & import
  // ═══════════════════════════════════════════════════════════════════

  /**
   * GET /api/tvshows/tmdb/search?query=...&page=...
   * Yêu cầu đăng nhập [Authorize].
   * @param {string} query
   * @param {number} [page=1]
   */
  searchTmdb: async (query, page = 1) => {
    try {
      const response = await axiosInstance.get('/tvshows/tmdb/search', {
        params: { query, page },
      });
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error searching TMDB:', error);
      throw error;
    }
  },

  /**
   * GET /api/tvshows/tmdb/trending?timeWindow=...
   * @param {string} [timeWindow='week'] - "day" | "week"
   */
  getTmdbTrending: async (timeWindow = 'week') => {
    try {
      const response = await axiosInstance.get('/tvshows/tmdb/trending', {
        params: { timeWindow },
      });
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error fetching TMDB trending:', error);
      throw error;
    }
  },

  /**
   * GET /api/tvshows/tmdb/{tmdbId} — preview trước khi import.
   * @param {number} tmdbId
   */
  getTmdbTvShow: async (tmdbId) => {
    try {
      const response = await axiosInstance.get(`/tvshows/tmdb/${tmdbId}`);
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error fetching TMDB tvshow:', error);
      throw error;
    }
  },

  /**
   * POST /api/tvshows/tmdb/{tmdbId}/import — import từ TMDB (Admin only).
   * Trả về 409 nếu show đã được import rồi.
   * @param {number} tmdbId
   * @returns {{ showId, genreCount, castCount, imageCount, seasonCount, episodeCount, hasDirector, personBioCount, personImageCount }}
   */
  importFromTmdb: async (tmdbId) => {
    try {
      const response = await axiosInstance.post(`/tvshows/tmdb/${tmdbId}/import`);
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error importing from TMDB:', error);
      // 409 = đã import rồi — caller tự xử lý error.response.data.message
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // FAVORITES — Yêu thích TV Show
  // ═══════════════════════════════════════════════════════════════════

  /**
   * GET /api/tvshows/favorites — danh sách TV shows yêu thích của user.
   * Yêu cầu đăng nhập [Authorize].
   * @returns {TvShowFavoriteDTO[]}
   */
  getFavorites: async () => {
    try {
      const response = await axiosInstance.get('/tvshows/favorites');
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error fetching favorites:', error);
      throw error;
    }
  },

  /**
   * POST /api/tvshows/favorites — thêm TV show vào yêu thích.
   * Body: AddTvShowFavoriteDTO { tvShowId: Guid }
   * Trả về 400 nếu đã có trong danh sách.
   * @param {string} tvShowId - GUID
   */
  addFavorite: async (tvShowId) => {
    try {
      const response = await axiosInstance.post('/tvshows/favorites', { tvShowId });
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error adding favorite:', error);
      throw error;
    }
  },

  /**
   * DELETE /api/tvshows/favorites/{tvShowId} — xóa TV show khỏi yêu thích.
   * Trả về 404 nếu không tìm thấy.
   * @param {string} tvShowId - GUID
   */
  removeFavorite: async (tvShowId) => {
    try {
      const response = await axiosInstance.delete(`/tvshows/favorites/${tvShowId}`);
      return response.data ?? response;
    } catch (error) {
      console.error('[tvShowService] Error removing favorite:', error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // WATCH HISTORY — Lịch sử xem
  // ═══════════════════════════════════════════════════════════════════

  /**
   * GET /api/tvshows/history — lịch sử xem của user hiện tại.
   * Yêu cầu đăng nhập [Authorize].
   * @returns {TvShowWatchHistoryDTO[]}
   */
  getWatchHistory: async () => {
    try {
      const response = await axiosInstance.get('/tvshows/history');
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error fetching watch history:', error);
      throw error;
    }
  },

  /**
   * POST /api/tvshows/history — cập nhật tiến trình xem.
   * Body: UpdateTvShowWatchProgressDTO { tvShowId, episodeId?, progressSeconds, isCompleted }
   * @param {string}  tvShowId        - GUID
   * @param {string|null} episodeId   - GUID hoặc null nếu track ở level show
   * @param {number}  progressSeconds - số giây đã xem
   * @param {boolean} isCompleted
   */
  updateWatchProgress: async (tvShowId, episodeId, progressSeconds, isCompleted) => {
    try {
      const response = await axiosInstance.post('/tvshows/history', {
        tvShowId,
        episodeId: episodeId ?? null,
        progressSeconds,
        isCompleted,
      });
      return response.data ?? response;
    } catch (error) {
      console.error('[tvShowService] Error updating watch progress:', error);
      throw error;
    }
  },

  /**
   * DELETE /api/tvshows/history/{historyId} — xóa 1 bản ghi lịch sử.
   * @param {string} historyId - GUID
   */
  deleteWatchHistory: async (historyId) => {
    try {
      const response = await axiosInstance.delete(`/tvshows/history/${historyId}`);
      return response.data ?? response;
    } catch (error) {
      console.error('[tvShowService] Error deleting watch history:', error);
      throw error;
    }
  },

  /**
   * DELETE /api/tvshows/history — xóa toàn bộ lịch sử xem.
   */
  clearWatchHistory: async () => {
    try {
      const response = await axiosInstance.delete('/tvshows/history');
      return response.data ?? response;
    } catch (error) {
      console.error('[tvShowService] Error clearing watch history:', error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // VIDEO — Upload & xóa video
  // ═══════════════════════════════════════════════════════════════════

  /**
   * POST /api/tvshows/{id}/videos — upload video lên Cloudinary (Admin only).
   * Gửi multipart/form-data: videoFile, videoType, quality?.
   * @param {string}   tvShowId  - GUID
   * @param {File}     videoFile - File object từ <input type="file">
   * @param {string}   videoType - "trailer" | "full" | ...
   * @param {string}   [quality] - "1080p" | "720p" | ...
   * @param {Function} [onUploadProgress] - callback(percent) theo dõi tiến trình
   * @returns {{ videoUrl: string }}
   */
  uploadVideo: async (tvShowId, videoFile, videoType, quality, onUploadProgress) => {
    try {
      const formData = new FormData();
      formData.append('videoFile', videoFile);
      formData.append('videoType', videoType);
      if (quality) formData.append('quality', quality);

      const response = await axiosInstance.post(
        `/tvshows/${tvShowId}/videos`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: onUploadProgress
            ? (e) => {
                const percent = Math.round((e.loaded * 100) / e.total);
                onUploadProgress(percent);
              }
            : undefined,
        }
      );
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error uploading video:', error);
      throw error;
    }
  },

  /**
   * POST /api/tvshows/episodes/{episodeId}/video — upload video cho 1 tập (Admin only).
   * @param {string}   episodeId - GUID
   * @param {File}     videoFile
   * @param {Function} [onUploadProgress] - callback(percent)
   * @returns {{ videoUrl: string }}
   */
  uploadEpisodeVideo: async (episodeId, videoFile, onUploadProgress) => {
    try {
      const formData = new FormData();
      formData.append('videoFile', videoFile);

      const response = await axiosInstance.post(
        `/tvshows/episodes/${episodeId}/video`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: onUploadProgress
            ? (e) => {
                const percent = Math.round((e.loaded * 100) / e.total);
                onUploadProgress(percent);
              }
            : undefined,
        }
      );
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error uploading episode video:', error);
      throw error;
    }
  },

  /**
   * DELETE /api/tvshows/episodes/{episodeId}/video — xóa video của 1 tập (Admin only).
   * @param {string} episodeId - GUID
   */
  deleteEpisodeVideo: async (episodeId) => {
    try {
      const response = await axiosInstance.delete(`/tvshows/episodes/${episodeId}/video`);
      return response.data ?? response;
    } catch (error) {
      console.error('[tvShowService] Error deleting episode video:', error);
      throw error;
    }
  },

  /**
   * Xóa cả trên Cloudinary lẫn DB.
   * @param {string} videoId - GUID
   */
  deleteVideo: async (videoId) => {
    try {
      const response = await axiosInstance.delete(`/tvshows/videos/${videoId}`);
      return response.data ?? response;
    } catch (error) {
      console.error('[tvShowService] Error deleting video:', error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN — CRUD
  // ═══════════════════════════════════════════════════════════════════

  /**
   * POST /api/tvshows — tạo TV show thủ công (Admin only).
   * @param {CreateTvShowDTO} dto
   * @returns {{ showId: string }}
   */
  createTvShow: async (dto) => {
    try {
      const response = await axiosInstance.post('/tvshows', dto);
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error creating tvshow:', error);
      throw error;
    }
  },

  /**
   * PUT /api/tvshows/{id} — cập nhật TV show (Admin only).
   * @param {string} tvShowId - GUID
   * @param {UpdateTvShowDTO} dto
   */
  updateTvShow: async (tvShowId, dto) => {
    try {
      const response = await axiosInstance.put(`/tvshows/${tvShowId}`, dto);
      return response.data ?? response;
    } catch (error) {
      console.error('[tvShowService] Error updating tvshow:', error);
      throw error;
    }
  },

  /**
   * DELETE /api/tvshows/{id} — xóa TV show (Admin only).
   * DB cascade sẽ tự xóa Seasons, Episodes, Cast liên quan.
   * @param {string} tvShowId - GUID
   */
  deleteTvShow: async (tvShowId) => {
    try {
      const response = await axiosInstance.delete(`/tvshows/${tvShowId}`);
      return response.data ?? response;
    } catch (error) {
      console.error('[tvShowService] Error deleting tvshow:', error);
      throw error;
    }
  },

  /**
   * POST /api/tvshows/{id}/sync — Đồng bộ tập mới từ TMDB (Admin only).
   * @param {string} tvShowId - GUID
   */
  syncNewEpisodes: async (tvShowId) => {
    try {
      const response = await axiosInstance.post(`/tvshows/${tvShowId}/sync`);
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error syncing new episodes:', error);
      throw error;
    }
  },
};

export default tvShowService;