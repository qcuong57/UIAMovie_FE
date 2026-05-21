// src/services/movieService.js
// Movie API Service

import axiosInstance from '../config/axios';

const movieService = {
  /**
   * Lấy danh sách phim — khớp hoàn toàn với FilterMoviesDTO trên backend.
   * Tất cả filter đều được gửi lên server; không có client-side filter nào.
   *
   * @param {Object} filter
   * @param {number}   [filter.page=1]
   * @param {number}   [filter.pageSize=20]
   * @param {string}   [filter.search]          - Tìm theo tên phim
   * @param {string[]} [filter.genreIds]         - Mảng genre UUID
   * @param {number}   [filter.minRating]        - IMDb tối thiểu
   * @param {number}   [filter.maxRating]        - IMDb tối đa
   * @param {string}   [filter.originCountry]    - ISO 3166-1 alpha-2 (VD: "KR", "US")
   * @param {string}   [filter.fromReleaseDate]  - "YYYY-MM-DD"
   * @param {string}   [filter.toReleaseDate]    - "YYYY-MM-DD"
   * @param {string}   [filter.sortBy]           - "rating" | "title" | "releaseDate"
   * @param {boolean}  [filter.sortDesc=true]
   */
  getMovies: async ({
    page            = 1,
    pageSize        = 20,
    search          = '',
    genreIds        = [],
    minRating,
    maxRating,
    originCountry   = '',
    fromReleaseDate = '',
    toReleaseDate   = '',
    sortBy          = 'rating',
    sortDesc        = true,
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
      if (fromReleaseDate)   params.append('fromReleaseDate', fromReleaseDate);
      if (toReleaseDate)     params.append('toReleaseDate', toReleaseDate);
      // genreIds là mảng → append nhiều lần để backend nhận List<Guid>
      (genreIds ?? []).forEach((id) => params.append('genreIds', id));

      console.log('[movieService] GET /movies?' + params.toString());
      const response = await axiosInstance.get(`/movies?${params}`);
      return response.data;
    } catch (error) {
      console.error('[movieService] Error fetching movies:', error);
      console.error('[movieService] Response data:', error?.response?.data);
      console.error('[movieService] Request URL:', error?.config?.url);
      throw error;
    }
  },

  /**
   * Lấy phim theo quốc gia sản xuất
   * @param {string} countryCode - Mã ISO 3166-1 alpha-2, VD: "KR", "US", "JP"
   */
  getMoviesByCountry: async (countryCode) => {
    try {
      const response = await axiosInstance.get(`/movies/country/${countryCode}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching movies by country:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách quốc gia có phim trong DB
   */
  getAvailableCountries: async () => {
    try {
      const response = await axiosInstance.get('/movies/countries');
      return response.data;
    } catch (error) {
      console.error('Error fetching available countries:', error);
      throw error;
    }
  },

  /**
   * Lấy top 20 phim trending
   */
  getTrendingMovies: async () => {
    try {
      const response = await axiosInstance.get('/movies/trending');
      return response.data;
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      throw error;
    }
  },

  /**
   * Tìm kiếm phim theo tên
   * @param {string} query - Keyword tìm kiếm
   */
  searchMovies: async (query) => {
    try {
      if (!query?.trim()) return [];
      const response = await axiosInstance.get('/movies/search', {
        params: { query },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  },

  /**
   * Tìm phim theo tên diễn viên
   * @param {string} actorName - Tên diễn viên
   */
  searchMoviesByActor: async (actorName) => {
    try {
      if (!actorName?.trim()) return [];
      const response = await axiosInstance.get('/movies/search/actor', {
        params: { actorName },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching movies by actor:', error);
      throw error;
    }
  },

  /**
   * Lấy phim theo genre
   * @param {string} genreId - Genre ID
   */
  getMoviesByGenre: async (genreId) => {
    try {
      const response = await axiosInstance.get(`/movies/genre/${genreId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching movies by genre:', error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết phim
   * @param {string} movieId - Movie ID
   */
  getMovieById: async (movieId) => {
    try {
      const response = await axiosInstance.get(`/movies/${movieId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw error;
    }
  },

  /**
   * [Admin] Xóa phim
   * DELETE /api/movies/{id}
   * @param {string} movieId - Movie ID
   */
  deleteMovie: async (movieId) => {
    try {
      const response = await axiosInstance.delete(`/movies/${movieId}`);
      return response.data;
    } catch (error) {
      console.error('[movieService] Error deleting movie:', error);
      throw error;
    }
  },

  /**
   * [Admin] Bật / tắt Premium cho phim.
   * PATCH /api/movies/{id}/premium
   * @param {string}  movieId   - Movie ID
   * @param {boolean} isPremium - true = Premium, false = Free
   */
  setPremium: async (movieId, isPremium) => {
    try {
      const response = await axiosInstance.patch(`/movies/${movieId}/premium`, { isPremium });
      return response.data;
    } catch (error) {
      console.error('[movieService] Error setting premium:', error);
      throw error;
    }
  },

  /**
   * [Admin] Upload video cho phim
   * POST /api/movies/{id}/videos
   * @param {string}   movieId
   * @param {File}     videoFile  - File video (mp4, mkv, ...)
   * @param {string}   videoType  - "main" | "trailer" | "clip" | "behind"
   * @param {string}   quality    - "1080p" | "720p" | "480p" | "360p"
   * @param {Function} onProgress - callback(percent: number)
   */
  uploadVideo: async (movieId, videoFile, videoType, quality, onProgress) => {
    try {
      // ✅ Field name viết hoa chữ đầu để khớp với C# DTO
      const formData = new FormData();
      formData.append('VideoFile', videoFile);
      formData.append('VideoType', videoType);
      formData.append('Quality', quality);

      const response = await axiosInstance.post(
        `/movies/${movieId}/videos`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (onProgress && e.total) {
              onProgress(Math.round((e.loaded * 100) / e.total));
            }
          },
          timeout: 10 * 60 * 1000, // 10 phút cho file lớn
        }
      );
      return response.data;
    } catch (error) {
      console.error('[movieService] Error uploading video:', error);
      throw error;
    }
  },

  /**
   * [Admin] Xóa video
   * DELETE /api/movies/videos/{videoId}
   * @param {string} videoId
   */
  deleteVideo: async (videoId) => {
    try {
      const response = await axiosInstance.delete(`/movies/videos/${videoId}`);
      return response.data;
    } catch (error) {
      console.error('[movieService] Error deleting video:', error);
      throw error;
    }
  },

  /**
   * Lấy stream URL để phát phim (Premium gate)
   * GET /api/movies/{id}/watch
   * @param {string} movieId
   */
  watchMovie: async (movieId) => {
    try {
      const response = await axiosInstance.get(`/movies/${movieId}/watch`);
      return response.data;
    } catch (error) {
      console.error('[movieService] Error watching movie:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách phim yêu thích (cần đăng nhập)
   */
  getFavorites: async () => {
    try {
      const response = await axiosInstance.get('/movies/favorites');
      return response.data;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  },

  /**
   * Thêm phim vào yêu thích (cần đăng nhập)
   * @param {string} movieId - Movie ID
   */
  addFavorite: async (movieId) => {
    try {
      const response = await axiosInstance.post('/movies/favorites', { movieId });
      return response.data;
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  },

  /**
   * Xóa phim khỏi yêu thích (cần đăng nhập)
   * @param {string} movieId - Movie ID
   */
  removeFavorite: async (movieId) => {
    try {
      const response = await axiosInstance.delete(`/movies/favorites/${movieId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  },

  /**
   * Lấy lịch sử xem (cần đăng nhập)
   */
  getWatchHistory: async () => {
    try {
      const response = await axiosInstance.get('/movies/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching watch history:', error);
      throw error;
    }
  },

  /**
   * Cập nhật tiến trình xem phim (cần đăng nhập)
   * @param {string}  movieId         - Movie ID
   * @param {number}  progressMinutes - Tiến độ xem (phút)
   * @param {boolean} isCompleted     - Đã xem hết chưa
   */
  updateWatchProgress: async (movieId, progressMinutes, isCompleted = false) => {
    try {
      const response = await axiosInstance.post('/movies/history', {
        movieId,
        progressMinutes,
        isCompleted,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating watch progress:', error);
      throw error;
    }
  },

  /**
   * Xóa 1 mục khỏi lịch sử xem
   * @param {string} historyId - ID của WatchHistoryDTO (không phải movieId)
   */
  deleteWatchHistory: async (historyId) => {
    try {
      const response = await axiosInstance.delete(`/movies/history/${historyId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting watch history:', error);
      throw error;
    }
  },

  /**
   * Xóa toàn bộ lịch sử xem của user hiện tại
   */
  clearWatchHistory: async () => {
    try {
      const response = await axiosInstance.delete('/movies/history');
      return response.data;
    } catch (error) {
      console.error('Error clearing watch history:', error);
      throw error;
    }
  },
};

export default movieService;