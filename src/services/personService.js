// src/services/personService.js
import axiosInstance from "../config/axios";

const personService = {
  /**
   * Lấy chi tiết 1 người từ TMDB (tiểu sử, ngày sinh...)
   * GET /api/movies/tmdb/person/:tmdbPersonId
   */
  getPersonDetail: async (tmdbPersonId) => {
    try {
      const response = await axiosInstance.get(
        `/movies/tmdb/person/${tmdbPersonId}`,
      );
      return response.data ?? response;
    } catch (error) {
      console.error("Error fetching person detail:", error);
      throw error;
    }
  },

  /**
   * Lấy ảnh profile của 1 người từ TMDB — trả về List<string> (mảng URL)
   * GET /api/movies/tmdb/person/:tmdbPersonId/images
   */
  getPersonImages: async (tmdbPersonId) => {
    try {
      const response = await axiosInstance.get(
        `/movies/tmdb/person/${tmdbPersonId}/images`,
      );
      return response.data ?? response;
    } catch (error) {
      console.error("Error fetching person images:", error);
      return [];
    }
  },

  /**
   * Lấy danh sách diễn viên + đạo diễn của phim (local DB)
   * GET /api/movies/:movieId/cast
   */
  getMovieCast: async (movieId) => {
    try {
      const response = await axiosInstance.get(`/movies/${movieId}/cast`);
      return response.data ?? response;
    } catch (error) {
      console.error("Error fetching movie cast:", error);
      throw error;
    }
  },
};

export default personService;
