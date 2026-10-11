// src/services/viewStatsService.js
// View Stats API Service — đồng bộ với ViewStatsController.cs (/api/admin/view-stats)
// Chỉ admin gọi được. Token do axiosInstance (../config/axios) tự gắn.

import axiosInstance from '../config/axios';

/** Bóc envelope ApiResponseDTO { data, message } → data (chấp nhận cả response trả mảng/object trần). */
const unwrap = (response) => {
  const envelope = response?.data ?? response;
  return envelope?.data ?? envelope;
};

const viewStatsService = {
  /**
   * GET /api/admin/view-stats/overview — số liệu view theo kỳ (cho biểu đồ + KPI).
   * Trả về ViewStatsOverviewDTO { granularity, contentType, from, to, totalViews,
   *   totalWatchHours, totalUniqueUsers, points[] }.
   *
   * @param {Object}  [filter]
   * @param {string}  [filter.granularity='day']   - "day" | "week" | "month" | "quarter" | "year"
   * @param {string}  [filter.contentType='all']   - "all" | "movie" | "tvshow"
   * @param {string}  [filter.from]                - "YYYY-MM-DD" (bỏ trống → mặc định theo granularity)
   * @param {string}  [filter.to]                  - "YYYY-MM-DD" (bỏ trống → hôm nay)
   * @param {string}  [filter.contentId]           - GUID phim/show cụ thể
   */
  getOverview: async ({
    granularity = 'day',
    contentType = 'all',
    from        = '',
    to          = '',
    contentId   = '',
  } = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('granularity', granularity);
      params.append('contentType', contentType);
      if (from)      params.append('from', from);
      if (to)        params.append('to', to);
      if (contentId) params.append('contentId', contentId);

      const response = await axiosInstance.get(`/admin/view-stats/overview?${params}`);
      return unwrap(response);
    } catch (error) {
      console.error('[viewStatsService] Error fetching overview:', error);
      console.error('[viewStatsService] Response data:', error?.response?.data);
      throw error;
    }
  },

  /**
   * GET /api/admin/view-stats/top — top nội dung xem nhiều nhất (TopContentDTO[]).
   * @param {Object} [filter]
   * @param {string} [filter.contentType='all']
   * @param {string} [filter.from]  - "YYYY-MM-DD"
   * @param {string} [filter.to]    - "YYYY-MM-DD"
   * @param {number} [filter.take=10] - 1..50
   */
  getTop: async ({
    contentType = 'all',
    from        = '',
    to          = '',
    take        = 10,
  } = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('contentType', contentType);
      params.append('take', take);
      if (from) params.append('from', from);
      if (to)   params.append('to', to);

      const response = await axiosInstance.get(`/admin/view-stats/top?${params}`);
      return unwrap(response);
    } catch (error) {
      console.error('[viewStatsService] Error fetching top content:', error);
      console.error('[viewStatsService] Response data:', error?.response?.data);
      throw error;
    }
  },

  /**
   * GET /api/admin/view-stats/genres — lượt xem theo thể loại (GenreStatDTO[]).
   * @param {Object} [filter]
   * @param {string} [filter.contentType='all']
   * @param {string} [filter.from]  - "YYYY-MM-DD"
   * @param {string} [filter.to]    - "YYYY-MM-DD"
   */
  getGenres: async ({ contentType = 'all', from = '', to = '' } = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('contentType', contentType);
      if (from) params.append('from', from);
      if (to)   params.append('to', to);

      const response = await axiosInstance.get(`/admin/view-stats/genres?${params}`);
      return unwrap(response);
    } catch (error) {
      console.error('[viewStatsService] Error fetching genre stats:', error);
      console.error('[viewStatsService] Response data:', error?.response?.data);
      throw error;
    }
  },
};

export default viewStatsService;