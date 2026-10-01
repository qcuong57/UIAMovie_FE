// src/services/reviewService.js
// Maps 1-to-1 với RatingReviewController.cs
// Route prefix: /api/ratingreview

import axiosInstance from '../config/axios';

const BASE = '/ratingreview';

const reviewService = {
  // ═══════════════════════════════════════════════════════════════════
  // AUTHENTICATED — Tạo / Sửa / Xóa review
  // ═══════════════════════════════════════════════════════════════════

  /**
   * POST /api/ratingreview — Tạo review mới.
   * Body: RatingReviewDTO
   *   • { movieId, rating, reviewText?, isSpoiler }             → review phim
   *   • { tvShowId, rating, reviewText?, isSpoiler }            → review cả show
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

  /** DELETE /api/ratingreview/{reviewId} — Xóa review của mình. */
  deleteReview: async (reviewId) => {
    const response = await axiosInstance.delete(`${BASE}/${reviewId}`);
    return response;
  },

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC — Lấy danh sách / chi tiết reviews
  // ═══════════════════════════════════════════════════════════════════

  /** GET /api/ratingreview/{reviewId} — Chi tiết 1 review. Returns: ApiResponseDTO<ReviewDTO> */
  getReviewById: async (reviewId) => {
    const response = await axiosInstance.get(`${BASE}/${reviewId}`);
    return response;
  },

  /**
   * GET /api/ratingreview/movies/{movieId}?pageNumber=&pageSize=
   * Returns: ApiResponseDTO<MovieReviewsResponseDTO> → .data.reviews: ReviewDTO[]
   */
  getMovieReviews: async (movieId, pageNumber = 1, pageSize = 8) => {
    const response = await axiosInstance.get(`${BASE}/movies/${movieId}`, {
      params: { pageNumber, pageSize },
    });
    return response;
  },

  /**
   * GET /api/ratingreview/tvshows/{tvShowId}?pageNumber=&pageSize=
   * Returns: ApiResponseDTO<TvShowReviewsResponseDTO>
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

  /** GET /api/ratingreview/movies/{movieId}/stats → ApiResponseDTO<MovieRatingStatsDTO> */
  getMovieRatingStats: async (movieId) => {
    const response = await axiosInstance.get(`${BASE}/movies/${movieId}/stats`);
    return response;
  },

  /** GET /api/ratingreview/tvshows/{tvShowId}/stats → ApiResponseDTO<TvShowRatingStatsDTO> */
  getTvShowRatingStats: async (tvShowId) => {
    const response = await axiosInstance.get(`${BASE}/tvshows/${tvShowId}/stats`);
    return response;
  },

  /** GET /api/ratingreview/episodes/{episodeId}/stats → ApiResponseDTO<EpisodeRatingStatsDTO> */
  getEpisodeRatingStats: async (episodeId) => {
    const response = await axiosInstance.get(`${BASE}/episodes/${episodeId}/stats`);
    return response;
  },

  // ═══════════════════════════════════════════════════════════════════
  // REPLIES — Trả lời review (MỚI)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * GET /api/ratingreview/{reviewId}/replies?pageNumber=&pageSize=  (public)
   * Returns: ApiResponseDTO<ReviewRepliesResponseDTO>
   *   → .data.ratingReviewId, .data.totalReplies, .data.replies: ReplyDTO[]
   * Sắp xếp CreatedAt tăng dần (cũ → mới). pageSize tối đa 100 (vượt sẽ bị reset về 20).
   */
  getReplies: async (reviewId, pageNumber = 1, pageSize = 5) => {
    const response = await axiosInstance.get(`${BASE}/${reviewId}/replies`, {
      params: { pageNumber, pageSize },
    });
    return response;
  },

  /**
   * POST /api/ratingreview/{reviewId}/replies  (Authorize)
   * Body: { replyText, parentReplyId? }  — replyText tối đa 2000 ký tự
   *   parentReplyId: id của reply đang được trả lời (bỏ trống = trả lời thẳng review).
   *   Lồng tối đa 1 cấp: trả lời reply con thì server tự gắn về reply gốc kèm @tag.
   * Returns: ApiResponseDTO<CreateReplyResponseDTO> → .data.replyId
   */
  createReply: async (reviewId, replyText, parentReplyId = null) => {
    const response = await axiosInstance.post(`${BASE}/${reviewId}/replies`, {
      replyText,
      parentReplyId,
    });
    return response;
  },

  /**
   * PUT /api/ratingreview/replies/{replyId}  (Authorize, chỉ chủ reply)
   * Body: { replyText }
   */
  updateReply: async (replyId, replyText) => {
    const response = await axiosInstance.put(`${BASE}/replies/${replyId}`, { replyText });
    return response;
  },

  /** DELETE /api/ratingreview/replies/{replyId}  (Authorize, chỉ chủ reply) */
  deleteReply: async (replyId) => {
    const response = await axiosInstance.delete(`${BASE}/replies/${replyId}`);
    return response;
  },

  // ═══════════════════════════════════════════════════════════════════
  // AUTHENTICATED — Kiểm tra user đã review chưa
  // ═══════════════════════════════════════════════════════════════════

  /**
   * GET /api/ratingreview/check/movies/{movieId}
   * Returns: ApiResponseDTO<CheckReviewResponseDTO> → .data.hasReview, .data.review
   */
  checkUserMovieReview: async (movieId) => {
    const response = await axiosInstance.get(`${BASE}/check/movies/${movieId}`);
    return response;
  },

  /** GET /api/ratingreview/check/tvshows/{tvShowId} */
  checkUserTvShowReview: async (tvShowId) => {
    const response = await axiosInstance.get(`${BASE}/check/tvshows/${tvShowId}`);
    return response;
  },

  /** GET /api/ratingreview/check/episodes/{episodeId} */
  checkUserEpisodeReview: async (episodeId) => {
    const response = await axiosInstance.get(`${BASE}/check/episodes/${episodeId}`);
    return response;
  },

  /** GET /api/ratingreview/my — Tất cả reviews của user hiện tại */
  getMyReviews: async () => {
    const response = await axiosInstance.get(`${BASE}/my`);
    return response;
  },

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN — Role Admin
  // ═══════════════════════════════════════════════════════════════════

  /** DELETE /api/ratingreview/admin/{reviewId} — Admin xóa review vi phạm. */
  adminDeleteReview: async (reviewId) => {
    const response = await axiosInstance.delete(`${BASE}/admin/${reviewId}`);
    return response;
  },

  /** DELETE /api/ratingreview/admin/replies/{replyId} — Admin xóa reply vi phạm. */
  adminDeleteReply: async (replyId) => {
    const response = await axiosInstance.delete(`${BASE}/admin/replies/${replyId}`);
    return response;
  },
};

export default reviewService;