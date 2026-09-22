// src/services/recommendationService.js
import axiosInstance from '../config/axios';

const recommendationService = {
  /**
   * Lấy danh sách phim gợi ý cá nhân hóa (AI-based hoặc Trending fallback)
   * GET /api/recommendation/personalized?limit=...
   * @param {number} [limit=15]
   */
  getPersonalizedRecommendations: async (limit = 15) => {
    try {
      const response = await axiosInstance.get('/recommendation/personalized', {
        params: { limit },
      });
      const envelope = response.data ?? response;
      return envelope?.data ?? envelope;
    } catch (error) {
      console.error('[recommendationService] Error fetching recommendations:', error);
      throw error;
    }
  },
};

export default recommendationService;