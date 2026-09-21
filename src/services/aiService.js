// src/services/aiService.js
// ─── AI Service — wrapper toàn bộ /api/ai/* ──────────────────────────────────
//
// v8 — Tối ưu hóa Clean Architecture & Hỗ trợ Client Context:
//   [NEW] Hỗ trợ tham số clientContext (currentPath, currentMovieId, currentTvShowId)
//   [NEW] Đọc cấu trúc RESTful mới (message, items, actions, meta) song song backward compatibility
//   [FIX] Giới hạn lịch sử gửi lên 12 turns gần nhất theo chuẩn backend

import axiosInstance from '../config/axios';

const unwrap = (res) => {
  const body = res && typeof res === 'object' && 'data' in res ? res.data : res;
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return body.data;
  }
  return body;
};

const aiService = {

  // ── POST /api/ai/chat ─────────────────────────────────────────────────────
  //
  // @param {string} message
  // @param {Array<{role: string, content: string}>} history
  // @param {object|null} clientContext - { currentPath, currentMovieId, currentTvShowId, searchQuery }
  // @returns {Promise<{
  //   reply:            string,
  //   message:          string,
  //   movies:           MovieDTO[],
  //   tvshows:          TvShowSummaryDTO[],
  //   items:            Array<object>,
  //   intent:           string,
  //   compareTable:     string | null,
  //   suggestedActions: string[],
  //   meta:             object,
  // }>}
  chat: async (message, history = [], clientContext = null) => {
    const payload = {
      message,
      // Cắt tối đa 12 turn gần nhất theo chuẩn backend mới
      history: history
        .filter((h) => h.role === 'user' || h.role === 'assistant')
        .slice(-12)
        .map(({ role, content }) => ({
          role,
          content: content?.trim()?.slice(0, 2000) ?? '',
        })),
    };

    if (clientContext) {
      payload.clientContext = clientContext;
    }

    const res = await axiosInstance.post('/ai/chat', payload);
    const data = unwrap(res);

    const replyText =
      data?.message ?? data?.Message ?? data?.reply ?? data?.Reply ?? 'Xin lỗi, tôi đang bận. Vui lòng thử lại.';

    const rawActions = data?.actions ?? data?.Actions ?? [];
    const suggestedActions = Array.isArray(data?.suggestedActions ?? data?.SuggestedActions)
      ? (data.suggestedActions ?? data.SuggestedActions)
      : rawActions.map((a) => a.label || a.value || a);

    return {
      reply:            replyText,
      message:          replyText,
      movies:           Array.isArray(data?.movies ?? data?.Movies) ? (data.movies ?? data.Movies) : [],
      tvshows:          Array.isArray(data?.tvshows ?? data?.TvShows) ? (data.tvshows ?? data.TvShows) : [],
      items:            Array.isArray(data?.items ?? data?.Items) ? (data.items ?? data.Items) : [],
      intent:           data?.intent ?? data?.Intent ?? 'movie',
      compareTable:     data?.compareTable ?? data?.CompareTable ?? null,
      suggestedActions,
      meta:             data?.meta ?? data?.Meta ?? {},
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

  // ── GET /api/ai/recommend/tvshows ─────────────────────────────────────────
  getTvShowRecommendations: async () => {
    const res  = await axiosInstance.get('/ai/recommend/tvshows');
    const data = unwrap(res);
    return {
      tvshows: Array.isArray(data) ? data : [],
      message: res?.message ?? 'Gợi ý series cho bạn',
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

  // ── GET /api/ai/search/tvshows?q=... ─────────────────────────────────────
  smartSearchTvShows: async (query) => {
    if (!query?.trim()) return [];
    const res  = await axiosInstance.get('/ai/search/tvshows', {
      params: { q: query.trim() },
    });
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  },

  // ── POST /api/ai/mood ─────────────────────────────────────────────────────
  getMoodRecommend: async (mood) => {
    if (!mood?.trim()) return { mood: '', movies: [] };
    const res  = await axiosInstance.post('/ai/mood', { mood: mood.trim() });
    const data = unwrap(res);
    return {
      mood:   data?.mood ?? data?.Mood ?? mood,
      movies: Array.isArray(data?.movies ?? data?.Movies) ? (data.movies ?? data.Movies) : [],
    };
  },

  // ── POST /api/ai/compare ──────────────────────────────────────────────────
  compareMovies: async (movieIdA, movieIdB) => {
    if (!movieIdA || !movieIdB) throw new Error('Cần cung cấp 2 ID phim hợp lệ.');
    const res  = await axiosInstance.post('/ai/compare', { movieIdA, movieIdB });
    const data = unwrap(res);
    return {
      movieA:        data?.movieA ?? data?.MovieA ?? null,
      movieB:        data?.movieB ?? data?.MovieB ?? null,
      markdownTable: data?.markdownTable ?? data?.MarkdownTable ?? '',
    };
  },

  // ── POST /api/ai/review ───────────────────────────────────────────────────
  getReviewSummary: async (movieId) => {
    if (!movieId) throw new Error('Cần cung cấp Movie ID.');
    const res  = await axiosInstance.post('/ai/review', { movieId });
    const data = unwrap(res);
    return {
      movieId: data?.movieId ?? data?.MovieId ?? movieId,
      summary: data?.summary ?? data?.Summary ?? 'Chưa có đánh giá.',
    };
  },

};

export default aiService;