// src/services/reviewService.js
// Maps 1-to-1 với RatingReviewController.cs
// Route prefix: /api/ratingreview

import axiosInstance from '../config/axios';

const BASE = '/ratingreview';

const reviewService = {
  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC — Tạo / Sửa / Xóa
  // ═══════════════════════════════════════════════════════════════════

  /**
   * POST /api/ratingreview — Tạo review mới.
   * Body: RatingReviewDTO
   *   • { movieId, rating, reviewText?, isSpoiler }           → review phim
   *   • { tvShowId, rating, reviewText?, isSpoiler }          → review cả show
   *   • { tvShowId, episodeId, rating, reviewText?, isSpoiler } → review tập
   */
  createReview: async (dto) => {
    const response = await axiosInstance.post(BASE, dto);
    return response; // { data: ApiResponseDTO<CreateReviewResponseDTO> }
  },

  /**
   * PUT /api/ratingreview/{reviewId} — Cập nhật review của mình.
   * Body: { rating, reviewText?, isSpoiler }
   */
  updateReview: async (reviewId, dto) => {
    const response = await axiosInstance.put(`${BASE}/${reviewId}`, dto);
    return response;
  },

  /**
   * DELETE /api/ratingreview/{reviewId} — Xóa review của mình.
   */
  deleteReview: async (reviewId) => {
    const response = await axiosInstance.delete(`${BASE}/${reviewId}`);
    return response;
  },

  /**
   * DELETE /api/ratingreview/admin/{reviewId} — Admin xóa review vi phạm.
   * Dùng endpoint riêng để bypass kiểm tra ownership.
   */
  adminDeleteReview: async (reviewId) => {
    const response = await axiosInstance.delete(`${BASE}/admin/${reviewId}`);
    return response;
  },

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC — Lấy danh sách reviews
  // ═══════════════════════════════════════════════════════════════════

  /**
   * GET /api/ratingreview/movies/{movieId}?pageNumber=&pageSize=
   * Returns: ApiResponseDTO<MovieReviewsResponseDTO>
   *   → .data.reviews: ReviewDTO[]
   */
  getMovieReviews: async (movieId, pageNumber = 1, pageSize = 8) => {
    const response = await axiosInstance.get(`${BASE}/movies/${movieId}`, {
      params: { pageNumber, pageSize },
    });
    return response; // caller reads response.data
  },

  /**
   * GET /api/ratingreview/tvshows/{tvShowId}?pageNumber=&pageSize=
   * Returns: ApiResponseDTO<TvShowReviewsResponseDTO>
   *   → .data.reviews: ReviewDTO[]
   */
  getTvShowReviews: async (tvShowId, pageNumber = 1, pageSize = 8) => {
    const response = await axiosInstance.get(`${BASE}/tvshows/${tvShowId}`, {
      params: { pageNumber, pageSize },
    });
    return response;
  },

  /**
   * GET /api/ratingreview/episodes/{episodeId}?pageNumber=&pageSize=
   * Returns: ApiResponseDTO<EpisodeReviewsResponseDTO>
   *   → .data.reviews: ReviewDTO[]
   */
  getEpisodeReviews: async (episodeId, pageNumber = 1, pageSize = 8) => {
    const response = await axiosInstance.get(`${BASE}/episodes/${episodeId}`, {
      params: { pageNumber, pageSize },
    });
    return response;
  },

  /**
   * GET /api/ratingreview?pageNumber=&pageSize= — Tất cả reviews (homepage carousel)
   * Returns: ApiResponseDTO<AllReviewsResponseDTO>
   */
  getAllReviews: async (pageNumber = 1, pageSize = 50) => {
    const response = await axiosInstance.get(BASE, {
      params: { pageNumber, pageSize },
    });
    return response;
  },

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC — Stats
  // ═══════════════════════════════════════════════════════════════════

  /**
   * GET /api/ratingreview/movies/{movieId}/stats
   * Returns: ApiResponseDTO<MovieRatingStatsDTO>
   *   → .data.averageRating, .data.totalReviews, .data.ratingDistribution
   */
  getMovieRatingStats: async (movieId) => {
    const response = await axiosInstance.get(`${BASE}/movies/${movieId}/stats`);
    return response;
  },

  /**
   * GET /api/ratingreview/tvshows/{tvShowId}/stats
   * Returns: ApiResponseDTO<TvShowRatingStatsDTO>
   */
  getTvShowRatingStats: async (tvShowId) => {
    const response = await axiosInstance.get(`${BASE}/tvshows/${tvShowId}/stats`);
    return response;
  },

  /**
   * GET /api/ratingreview/episodes/{episodeId}/stats
   * Returns: ApiResponseDTO<EpisodeRatingStatsDTO>
   */
  getEpisodeRatingStats: async (episodeId) => {
    const response = await axiosInstance.get(`${BASE}/episodes/${episodeId}/stats`);
    return response;
  },

  // ═══════════════════════════════════════════════════════════════════
  // AUTHENTICATED — Kiểm tra user đã review chưa
  // ═══════════════════════════════════════════════════════════════════

  /**
   * GET /api/ratingreview/check/movies/{movieId}
   * Returns: ApiResponseDTO<CheckReviewResponseDTO>
   *   → .data.hasReview: bool, .data.review: ReviewDTO | null
   */
  checkUserMovieReview: async (movieId) => {
    const response = await axiosInstance.get(`${BASE}/check/movies/${movieId}`);
    return response;
  },

  /**
   * GET /api/ratingreview/check/tvshows/{tvShowId}
   */
  checkUserTvShowReview: async (tvShowId) => {
    const response = await axiosInstance.get(`${BASE}/check/tvshows/${tvShowId}`);
    return response;
  },

  /**
   * GET /api/ratingreview/check/episodes/{episodeId}
   */
  checkUserEpisodeReview: async (episodeId) => {
    const response = await axiosInstance.get(`${BASE}/check/episodes/${episodeId}`);
    return response;
  },

  /**
   * GET /api/ratingreview/my — Tất cả reviews của user hiện tại
   * Returns: ApiResponseDTO<UserReviewsResponseDTO>
   */
  getMyReviews: async () => {
    const response = await axiosInstance.get(`${BASE}/my`);
    return response;
  },
};

export default reviewService;