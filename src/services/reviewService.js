// src/services/reviewService.js
// Review/Rating API Service

import axiosInstance from '../config/axios';

// NOTE: axiosInstance đã unwrap response.data trong interceptor rồi,
// nên tất cả response ở đây = response.data từ server.
// Để callers dùng res.data nhất quán, ta wrap lại thành { data: payload }.
const wrap = (payload) => ({ data: payload });

const reviewService = {
  /**
   * Lấy reviews của phim
   * @param {string} movieId - Movie ID
   * @param {number} pageNumber - Trang (default: 1)
   * @param {number} pageSize - Số items per trang (default: 20)
   */
  getMovieReviews: async (movieId, pageNumber = 1, pageSize = 20) => {
    try {
      const payload = await axiosInstance.get(
        `/ratingreview/movies/${movieId}`,
        { params: { pageNumber, pageSize } }
      );
      return wrap(payload);
    } catch (error) {
      console.error('Error fetching movie reviews:', error);
      throw error;
    }
  },

  /**
   * Lấy thống kê rating của phim
   * @param {string} movieId - Movie ID
   */
  getMovieRatingStats: async (movieId) => {
    try {
      const payload = await axiosInstance.get(
        `/ratingreview/movies/${movieId}/stats`
      );
      return wrap(payload);
    } catch (error) {
      console.error('Error fetching rating stats:', error);
      throw error;
    }
  },

  /**
   * Lấy review theo ID
   * @param {string} reviewId - Review ID
   */
  getReviewById: async (reviewId) => {
    try {
      const payload = await axiosInstance.get(`/ratingreview/${reviewId}`);
      return wrap(payload);
    } catch (error) {
      console.error('Error fetching review:', error);
      throw error;
    }
  },

  /**
   * Tạo review mới (cần đăng nhập)
   * @param {Object} data - { movieId, rating, reviewText, isSpoiler }
   */
  createReview: async (data) => {
    try {
      const payload = await axiosInstance.post('/ratingreview', data);
      return wrap(payload);
    } catch (error) {
      console.error('Error creating review:', error);
      // Re-throw với message rõ ràng từ server (axios interceptor đã extract rồi)
      throw error;
    }
  },

  /**
   * Cập nhật review (cần đăng nhập)
   * @param {string} reviewId - Review ID
   * @param {Object} data - { rating, reviewText, isSpoiler }
   */
  updateReview: async (reviewId, data) => {
    try {
      const payload = await axiosInstance.put(
        `/ratingreview/${reviewId}`,
        data
      );
      return wrap(payload);
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  },

  /**
   * Xóa review (cần đăng nhập)
   * @param {string} reviewId - Review ID
   */
  deleteReview: async (reviewId) => {
    try {
      const payload = await axiosInstance.delete(`/ratingreview/${reviewId}`);
      return wrap(payload);
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },

  /**
   * Lấy reviews của user hiện tại (cần đăng nhập)
   */
  getMyReviews: async () => {
    try {
      const payload = await axiosInstance.get('/ratingreview/my');
      return wrap(payload);
    } catch (error) {
      console.error('Error fetching my reviews:', error);
      throw error;
    }
  },

  /**
   * Kiểm tra user đã review phim này chưa (cần đăng nhập)
   * @param {string} movieId - Movie ID
   */
  checkUserReview: async (movieId) => {
    try {
      const payload = await axiosInstance.get(
        `/ratingreview/check/${movieId}`
      );
      return wrap(payload);
    } catch (error) {
      console.error('Error checking review:', error);
      throw error;
    }
  },
};

export default reviewService;