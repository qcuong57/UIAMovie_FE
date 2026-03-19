// src/services/personService.js
import axiosInstance from '../config/axios';

const personService = {
  /**
   * Lấy danh sách diễn viên + đạo diễn của phim
   * GET /api/movies/:movieId/cast
   */
  getMovieCast: async (movieId) => {
    try {
      const response = await axiosInstance.get(`/movies/${movieId}/cast`);
      return response;
    } catch (error) {
      console.error('Error fetching movie cast:', error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết 1 người (tiểu sử, ngày sinh...)
   * GET /api/movies/tmdb/person/:personId
   */
  getPersonDetail: async (personId) => {
    try {
      const response = await axiosInstance.get(`/movies/tmdb/person/${personId}`);
      return response;
    } catch (error) {
      console.error('Error fetching person detail:', error);
      throw error;
    }
  },

  /**
   * Lấy toàn bộ ảnh của 1 người
   * GET /api/movies/tmdb/person/:personId/images
   */
  getPersonImages: async (personId) => {
    try {
      const response = await axiosInstance.get(`/movies/tmdb/person/${personId}/images`);
      return response;
    } catch (error) {
      console.error('Error fetching person images:', error);
      throw error;
    }
  },
};

export default personService;