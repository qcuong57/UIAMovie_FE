// src/services/movieService.js
// Movie API Service

import axiosInstance from '../config/axios';

const movieService = {
  /**
   * Lấy danh sách phim (có filter, search, phân trang)
   * @param {number} page - Trang thứ mấy (default: 1)
   * @param {number} pageSize - Số phim per trang (default: 20)
   * @param {string} query - Tìm kiếm (optional)
   * @param {string} genreId - Lọc theo genre (optional)
   */
  getMovies: async (page = 1, pageSize = 20, query = '', genreId = '') => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('pageSize', pageSize);
      if (query) params.append('query', query);
      if (genreId) params.append('genreId', genreId);

      const response = await axiosInstance.get(`/movies?${params}`);
      return response;
    } catch (error) {
      console.error('Error fetching movies:', error);
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
      return response;
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
      return response;
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
      return response;
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
      if (!query?.trim()) {
        return [];
      }
      const response = await axiosInstance.get('/movies/search', {
        params: { query },
      });
      return response;
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
      return response;
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
      return response;
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
      return response;
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách phim yêu thích (cần đăng nhập)
   */
  getFavorites: async () => {
    try {
      const response = await axiosInstance.get('/movies/favorites');
      return response;
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
      const response = await axiosInstance.post('/movies/favorites', {
        movieId,
      });
      return response;
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
      return response;
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
      return response;
    } catch (error) {
      console.error('Error fetching watch history:', error);
      throw error;
    }
  },

  /**
   * Cập nhật tiến trình xem phim (cần đăng nhập)
   * @param {string} movieId - Movie ID
   * @param {number} progressMinutes - Tiến độ xem (phút)
   * @param {boolean} isCompleted - Đã xem hết chưa
   */
  updateWatchProgress: async (movieId, progressMinutes, isCompleted = false) => {
    try {
      const response = await axiosInstance.post('/movies/history', {
        movieId,
        progressMinutes,
        isCompleted,
      });
      return response;
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
      return response;
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
      return response;
    } catch (error) {
      console.error('Error clearing watch history:', error);
      throw error;
    }
  },
};

export default movieService;