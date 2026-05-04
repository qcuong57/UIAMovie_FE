// src/services/aiService.js
// ─── AI Service — wrapper toàn bộ /api/ai/* ──────────────────────────────────
//
// v5 fixes:
//   [FIX-1] getReviewSummary: đổi GET /ai/review-summary/{id} → POST /ai/review
//           cho đúng với AiController.cs [HttpPost("review")]

import axiosInstance from '../config/axios';

const unwrap = (res) => {
  if (res && typeof res === 'object' && 'data' in res) return res.data;
  return res;
};

const aiService = {

  // ── POST /api/ai/chat ─────────────────────────────────────────────────────
  //
  // @returns {Promise<{ reply: string, movies: MovieDTO[], intent: string, compareTable?: string }>}
  //
  // Backend trả: { success, data: { reply, movies, intent, compareTable? }, message }
  chat: async (message, history = []) => {
    const res = await axiosInstance.post('/ai/chat', {
      message,
      history: history
        .filter(h => h.role === 'user' || h.role === 'assistant')
        .slice(-20),
    });

    const data = unwrap(res);
    return {
      reply:        data?.reply        ?? 'Xin lỗi, tôi đang bận. Vui lòng thử lại.',
      movies:       Array.isArray(data?.movies) ? data.movies : [],
      intent:       data?.intent       ?? 'movie',
      compareTable: data?.compareTable ?? null,
    };
  },

  // ── GET /api/ai/recommend ─────────────────────────────────────────────────
  getRecommendations: async () => {
    const res  = await axiosInstance.get('/ai/recommend');
    const data = unwrap(res);
    return {
      movies:  Array.isArray(data) ? data : [],
      message: res?.message ?? 'Gợi ý cho bạn',
    };
  },

  // ── GET /api/ai/search?q=... ──────────────────────────────────────────────
  smartSearch: async (query) => {
    if (!query?.trim()) return [];
    const res  = await axiosInstance.get('/ai/search', {
      params: { q: query.trim() },
    });
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  // ── POST /api/ai/mood ─────────────────────────────────────────────────────
  //
  // @param  {string} mood - tâm trạng người dùng (vd: "buồn", "vui", "hồi hộp")
  // @returns {Promise<{ mood: string, movies: MovieDTO[] }>}
  getMoodRecommend: async (mood) => {
    if (!mood?.trim()) return { mood: '', movies: [] };
    const res  = await axiosInstance.post('/ai/mood', { mood: mood.trim() });
    const data = unwrap(res);
    return {
      mood:   data?.mood   ?? mood,
      movies: Array.isArray(data?.movies) ? data.movies : [],
    };
  },

  // ── POST /api/ai/compare ──────────────────────────────────────────────────
  //
  // @param  {string} movieIdA - UUID phim A
  // @param  {string} movieIdB - UUID phim B
  // @returns {Promise<{ movieA: MovieDTO, movieB: MovieDTO, markdownTable: string }>}
  compareMovies: async (movieIdA, movieIdB) => {
    if (!movieIdA || !movieIdB) throw new Error('Cần cung cấp 2 ID phim hợp lệ.');
    const res  = await axiosInstance.post('/ai/compare', { movieIdA, movieIdB });
    const data = unwrap(res);
    return {
      movieA:        data?.movieA        ?? null,
      movieB:        data?.movieB        ?? null,
      markdownTable: data?.markdownTable ?? '',
    };
  },

  // ── POST /api/ai/review ───────────────────────────────────────────────────
  //
  // [FIX-1] Đổi từ GET /ai/review-summary/{movieId} → POST /ai/review
  //         cho đúng với AiController.cs: [HttpPost("review")]
  //
  // @param  {string} movieId - UUID phim
  // @returns {Promise<{ movieId: string, summary: string }>}
  getReviewSummary: async (movieId) => {
    if (!movieId) throw new Error('Cần cung cấp Movie ID.');
    const res  = await axiosInstance.post('/ai/review', { movieId });
    const data = unwrap(res);
    return {
      movieId: data?.movieId ?? movieId,
      summary: data?.summary ?? 'Chưa có đánh giá.',
    };
  },

};

export default aiService;