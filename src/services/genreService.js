// src/services/genreService.js
// Genre API Service

import axiosInstance from '../config/axios';

const genreService = {
  /**
   * Lấy tất cả genres
   */
  getAllGenres: async () => {
    try {
      const response = await axiosInstance.get('/genres');
      return response;
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết genre
   * @param {string} genreId - Genre ID
   */
  getGenreById: async (genreId) => {
    try {
      const response = await axiosInstance.get(`/genres/${genreId}`);
      return response;
    } catch (error) {
      console.error('Error fetching genre:', error);
      throw error;
    }
  },

  /**
   * Tạo genre mới (Admin only)
   * @param {Object} data - { name, description }
   */
  createGenre: async (data) => {
    try {
      const response = await axiosInstance.post('/genres', data);
      return response;
    } catch (error) {
      console.error('Error creating genre:', error);
      throw error;
    }
  },

  /**
   * Cập nhật genre (Admin only)
   * @param {string} genreId - Genre ID
   * @param {Object} data - { name, description }
   */
  updateGenre: async (genreId, data) => {
    try {
      const response = await axiosInstance.put(`/genres/${genreId}`, data);
      return response;
    } catch (error) {
      console.error('Error updating genre:', error);
      throw error;
    }
  },

  /**
   * Xóa genre (Admin only)
   * @param {string} genreId - Genre ID
   */
  deleteGenre: async (genreId) => {
    try {
      const response = await axiosInstance.delete(`/genres/${genreId}`);
      return response;
    } catch (error) {
      console.error('Error deleting genre:', error);
      throw error;
    }
  },
};

export default genreService;