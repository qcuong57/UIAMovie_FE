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
   * GET /api/tvshows/search/actor?actorName=... — tìm theo tên diễn viên.
   * @param {string} actorName
   * @returns {TvShowDTO[]}
   */
  searchByActor: async (actorName) => {
    try {
      if (!actorName?.trim()) return [];
      const response = await axiosInstance.get('/tvshows/search/actor', {
        params: { actorName },
      });
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error searching tvshows by actor:', error);
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

  /**
   * Danh sách thể loại có sẵn trong DB nội bộ (khác getTmdbGenres — cái đó lấy từ TMDB).
   * Dùng cho ô chọn thể loại khi thêm/sửa TV show thủ công.
   * GET /api/tvshows/genres
   * @returns {Promise<Array<{id, name, description}>>}
   */
  getGenres: async () => {
    try {
      const response = await axiosInstance.get('/tvshows/genres');
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error fetching genres:', error);
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

  /**
   * PUT /api/tvshows/{id}/seasons/{seasonNumber} — sửa tiêu đề/mô tả/poster/ngày
   * phát sóng của 1 season đã tồn tại (Admin only). Không đụng tới episodes.
   * @param {string} tvShowId     - GUID
   * @param {number} seasonNumber
   * @param {UpdateSeasonDTO} dto - { name?, overview?, posterUrl?, airDate? }
   */
  updateSeason: async (tvShowId, seasonNumber, dto) => {
    try {
      const response = await axiosInstance.put(`/tvshows/${tvShowId}/seasons/${seasonNumber}`, dto);
      return response.data ?? response;
    } catch (error) {
      console.error('[tvShowService] Error updating season:', error);
      throw error;
    }
  },

  /**
   * PUT /api/tvshows/episodes/{episodeId} — sửa tiêu đề/mô tả/ảnh still/thời
   * lượng/rating/ngày phát sóng của 1 episode đã tồn tại (Admin only).
   * Không sửa VideoUrl — dùng uploadEpisodeVideo/deleteEpisodeVideo riêng.
   * @param {string} episodeId - GUID
   * @param {UpdateEpisodeDTO} dto - { title?, overview?, stillUrl?, runtime?, rating?, airDate? }
   */
  updateEpisode: async (episodeId, dto) => {
    try {
      const response = await axiosInstance.put(`/tvshows/episodes/${episodeId}`, dto);
      return response.data ?? response;
    } catch (error) {
      console.error('[tvShowService] Error updating episode:', error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // WATCH — Premium gate cho TV show & episode
  // ═══════════════════════════════════════════════════════════════════

  /**
   * GET /api/tvshows/{id}/watch — lấy video URLs của TV show (trailer/teaser).
   *   - Show FREE    → trả về videos cho mọi user (kể cả chưa đăng nhập)
   *   - Show PREMIUM → cần đăng nhập + có Premium hợp lệ → 401/403 nếu không đủ
   * @param {string} tvShowId - GUID
   * @returns {{ canWatch: boolean, videos: object[] }}
   */
  watchTvShow: async (tvShowId) => {
    try {
      const response = await axiosInstance.get(`/tvshows/${tvShowId}/watch`);
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error watching tvshow:', error);
      throw error;
    }
  },

  /**
   * GET /api/tvshows/{id}/seasons/{seasonNumber}/episodes/{episodeNumber}/watch
   * Lấy videoUrl của một episode cụ thể.
   *   - Show FREE    → trả về videoUrl cho mọi user
   *   - Show PREMIUM → cần đăng nhập + có Premium hợp lệ → 401/403 nếu không đủ
   * @param {string} tvShowId     - GUID
   * @param {number} seasonNumber
   * @param {number} episodeNumber
   * @returns {{ canWatch: boolean, videoUrl: string }}
   */
  watchEpisode: async (tvShowId, seasonNumber, episodeNumber) => {
    try {
      const response = await axiosInstance.get(
        `/tvshows/${tvShowId}/seasons/${seasonNumber}/episodes/${episodeNumber}/watch`
      );
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error watching episode:', error);
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
   * @param {Object}      dto
   * @param {string}      dto.tvShowId        - GUID
   * @param {string|null} dto.episodeId       - GUID hoặc null nếu track ở level show
   * @param {number}      dto.progressSeconds - số giây đã xem
   * @param {boolean}     dto.isCompleted
   */
  updateWatchProgress: async ({ tvShowId, episodeId, progressSeconds, isCompleted }) => {
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
          timeout: 10 * 60 * 1000, // 10 phút — video chính (main/clip/behind) có thể lớn
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
          timeout: 10 * 60 * 1000, // 10 phút — video tập phim có thể lớn, upload lên Cloudinary tốn thời gian
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

  /**
   * [Admin] Upload file trailer video lên Cloudinary (song song với trailer Youtube).
   * Backend tự tạo/ghi đè video có VideoType="trailer_upload" và set TrailerVideoUrl.
   * POST /api/tvshows/{id}/trailer/upload  (multipart/form-data, field "trailerFile")
   * @param {string}   tvShowId
   * @param {File}     trailerFile - File video trailer (mp4, ...)
   * @param {Function} [onProgress] - callback(percent: number)
   * @returns {Promise<{trailerVideoUrl: string}>}
   */
  uploadTrailerVideo: async (tvShowId, trailerFile, onProgress) => {
    try {
      const formData = new FormData();
      formData.append('trailerFile', trailerFile);

      const response = await axiosInstance.post(
        `/tvshows/${tvShowId}/trailer/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (onProgress && e.total) {
              onProgress(Math.round((e.loaded * 100) / e.total));
            }
          },
          timeout: 10 * 60 * 1000, // 10 phút cho file lớn
        },
      );
      return response.data ?? response;
    } catch (error) {
      console.error('[tvShowService] Error uploading trailer video:', error);
      throw error;
    }
  },

  /**
   * [Admin] Set/đổi link trailer Youtube thủ công (chạy song song với trailer upload,
   * không cần import lại từ TMDB).
   * PUT /api/tvshows/{id}/trailer/youtube
   * @param {string} tvShowId
   * @param {string} youtubeUrl - Link Youtube đầy đủ, VD: "https://www.youtube.com/watch?v=..."
   */
  setTrailerYoutube: async (tvShowId, youtubeUrl) => {
    try {
      const response = await axiosInstance.put(
        `/tvshows/${tvShowId}/trailer/youtube`,
        { youtubeUrl },
      );
      return response.data ?? response;
    } catch (error) {
      console.error('[tvShowService] Error setting Youtube trailer:', error);
      throw error;
    }
  },

  /**
   * POST /api/tvshows/{id}/seasons/{seasonNumber}/episodes — thêm 1 tập mới vào
   * season đã tồn tại (Admin only). Dùng ở trang chi tiết TV show khi sửa season,
   * khác với Seasons gửi kèm lúc createTvShow (chỉ áp dụng lúc tạo mới).
   * @param {string} tvShowId - GUID
   * @param {number} seasonNumber
   * @param {CreateEpisodeDTO} dto - { episodeNumber, title, overview?, stillUrl?, runtime?, rating?, airDate? }
   * @returns {Promise<EpisodeDTO>}
   */
  addEpisode: async (tvShowId, seasonNumber, dto) => {
    try {
      const response = await axiosInstance.post(`/tvshows/${tvShowId}/seasons/${seasonNumber}/episodes`, dto);
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error adding episode:', error);
      throw error;
    }
  },

  /**
   * DELETE /api/tvshows/episodes/{episodeId} — xóa 1 tập đã tồn tại (Admin only).
   * Đối xứng với addEpisode; backend tự dọn video trên Cloudinary nếu tập đã có video.
   * @param {string} episodeId - GUID
   */
  deleteEpisode: async (episodeId) => {
    try {
      const response = await axiosInstance.delete(`/tvshows/episodes/${episodeId}`);
      return response.data ?? response;
    } catch (error) {
      console.error('[tvShowService] Error deleting episode:', error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN — CRUD
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Tìm diễn viên/đạo diễn (Person) có sẵn trong DB theo tên — dùng cho ô autocomplete
   * khi thêm TV show thủ công hoặc chỉnh sửa cast của show import từ TMDB.
   * Cần tối thiểu 2 ký tự.
   * GET /api/tvshows/persons/search?query=...
   * @param {string} query
   * @returns {Promise<Array<{id, name, profileUrl, tmdbPersonId}>>}
   */
  searchPersons: async (query) => {
    try {
      if (!query || query.trim().length < 2) return [];
      const response = await axiosInstance.get('/tvshows/persons/search', {
        params: { query: query.trim() },
      });
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error searching persons:', error);
      throw error;
    }
  },

  /**
   * [Admin] Upload 1 ảnh (poster/backdrop/person) lên Cloudinary, trả về URL.
   * Dùng cho luồng thêm TV show thủ công: FE upload file HOẶC dán URL có sẵn
   * thẳng vào CreateTvShowDTO — cả 2 cách đều ra 1 chuỗi URL như nhau.
   * POST /api/tvshows/upload-image
   * @param {File}   file
   * @param {string} [type='poster'] - "poster" | "backdrop" | "person"
   * @returns {Promise<{ url: string }>}
   */
  uploadImage: async (file, type = 'poster') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      const response = await axiosInstance.post('/tvshows/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[tvShowService] Error uploading image:', error);
      throw error;
    }
  },

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
  /**
   * Lấy toàn bộ episodes của 1 TV show — dùng cho AdminReviews episode dropdown.
   * Không có endpoint "get all episodes" riêng, nên hàm này:
   *   1. Gọi getTvShowById() để lấy danh sách seasons (chỉ metadata, không có episodes).
   *   2. Gọi getSeason() song song cho mỗi season để lấy episodes.
   *   3. Gộp + trả về mảng phẳng episodes, mỗi item có thêm seasonNumber.
   * @param {string} tvShowId - GUID
   * @returns {Promise<Array<{ id, title, seasonNumber, episodeNumber, ... }>>}
   */
  getEpisodesByTvShow: async (tvShowId) => {
    try {
      const show = await tvShowService.getTvShowById(tvShowId);
      const seasons = show?.seasons ?? [];
      if (!seasons.length) return [];

      const seasonResults = await Promise.all(
        seasons.map(s => tvShowService.getSeason(tvShowId, s.seasonNumber).catch(() => null))
      );

      return seasonResults
        .filter(Boolean)
        .flatMap(season => {
          const eps = season?.episodes ?? season?.items ?? (Array.isArray(season) ? season : []);
          return eps.map(ep => ({
            ...ep,
            seasonNumber: ep.seasonNumber ?? season?.seasonNumber,
          }));
        });
    } catch (error) {
      console.error('[tvShowService] Error fetching all episodes:', error);
      throw error;
    }
  },

  /**
   * PATCH /api/tvshows/{id}/premium — bật/tắt Premium nhanh (Admin only).
   * Body: { isPremium: boolean }
   * @param {string}  tvShowId  - GUID
   * @param {boolean} isPremium
   */
  setPremium: async (tvShowId, isPremium) => {
    try {
      const response = await axiosInstance.patch(`/tvshows/${tvShowId}/premium`, { isPremium });
      return response.data ?? response;
    } catch (error) {
      console.error('[tvShowService] Error setting premium:', error);
      throw error;
    }
  },
};

export default tvShowService;