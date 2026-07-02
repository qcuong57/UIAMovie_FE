// src/services/paymentService.js
// ─────────────────────────────────────────────────────────────────
// Payment & Subscription API Service
// Kết nối với PaymentController.cs tại /api/payments/*
//
// LƯU Ý: axiosInstance trong axios.js đã có interceptor:
//   (response) => response.data
// Tức là mọi response trả về từ axiosInstance đã là body JSON rồi.
// KHÔNG cần unwrap thêm .data nữa.
// ─────────────────────────────────────────────────────────────────

import axiosInstance from '../config/axios';

const paymentService = {
  // ── Plans ────────────────────────────────────────────────────────────────────

  /**
   * GET /api/payments/plans
   * @returns {Promise<Array<{ planId, name, priceVnd, durationDays, features }>>}
   */
  getPlans: async () => {
    try {
      return await axiosInstance.get('/payments/plans');
    } catch (error) {
      console.error('[paymentService] Error fetching plans:', error);
      throw error;
    }
  },

  // ── Create Order ─────────────────────────────────────────────────────────────

  /**
   * POST /api/payments/create-order
   * BE trả thẳng PaymentOrderResponseDTO (không wrap ApiResponseDTO).
   * axios interceptor đã unwrap response.data → response ở đây chính là:
   *   { orderId, orderCode, paymentUrl, amount, provider, expiredAt }
   *
   * @param {{ planId: string, paymentProvider?: string }} param
   * @returns {Promise<{ orderId, orderCode, paymentUrl, amount, provider, expiredAt }>}
   */
  createOrder: async ({ planId, paymentProvider = 'vnpay' }) => {
    try {
      const response = await axiosInstance.post('/payments/create-order', {
        planId,
        paymentProvider,
      });

      if (!response?.paymentUrl) {
        console.error('[paymentService] Unexpected response shape:', response);
        throw new Error('Không nhận được URL thanh toán.');
      }

      return response; // { orderId, orderCode, paymentUrl, amount, provider, expiredAt }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể tạo đơn thanh toán. Vui lòng thử lại.';
      console.error('[paymentService] Error creating order:', error);
      throw new Error(message);
    }
  },

  // ── Subscription Status ───────────────────────────────────────────────────────

  /**
   * GET /api/payments/subscription-status
   * BE trả SubscriptionStatusDTO trực tiếp:
   *   { isPremium, subscriptionType, expiredAt, daysRemaining, isExpiringSoon }
   *
   * @returns {Promise<{ isPremium, subscriptionType, expiredAt, daysRemaining, isExpiringSoon }>}
   */
  getSubscriptionStatus: async () => {
    try {
      return await axiosInstance.get('/payments/subscription-status');
    } catch (error) {
      console.error('[paymentService] Error fetching subscription status:', error);
      throw error;
    }
  },

  // ── Payment History ───────────────────────────────────────────────────────────

  /**
   * GET /api/payments/history
   * @returns {Promise<Array<{ orderCode, planName, amount, provider, status, createdAt, paidAt }>>}
   */
  getPaymentHistory: async () => {
    try {
      return await axiosInstance.get('/payments/history');
    } catch (error) {
      console.error('[paymentService] Error fetching payment history:', error);
      throw error;
    }
  },

  // ── Cancel Subscription ───────────────────────────────────────────────────────

  /**
   * Hủy gói Premium của chính mình.
   * Tái sử dụng endpoint admin revoke: DELETE /api/payments/admin/subscription/{userId}
   *
   * @param {string} userId - ID của user đang đăng nhập (lấy từ authService.getCurrentUser())
   * @returns {Promise<{ message: string }>}
   */
  cancelSubscription: async (userId) => {
    try {
      return await axiosInstance.delete(`/payments/admin/subscription/${userId}`);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể hủy gói. Vui lòng thử lại.';
      console.error('[paymentService] Error cancelling subscription:', error);
      throw new Error(message);
    }
  },

  cancelMySubscription: async () => {
  const res = await axiosInstance.delete('/payments/subscription/me');
  return res.data?.data ?? res.data;
},

  // ── Helpers ───────────────────────────────────────────────────────────────────

  /**
   * Kiểm tra nhanh user có đang là Premium hợp lệ không.
   * @returns {Promise<boolean>}
   */
  isPremium: async () => {
    try {
      const status = await paymentService.getSubscriptionStatus();
      return status?.isPremium === true;
    } catch {
      return false;
    }
  },

  // ── Admin: Grant Subscription ─────────────────────────────────────────────────

  /**
   * [Admin] Cấp hoặc gia hạn Premium cho user bất kỳ.
   * POST /api/payments/admin/grant-subscription
   *
   * @param {{ userId: string, planId: 'monthly_premium'|'yearly_premium', expiredAt?: string }} dto
   * @returns {Promise<{ message: string }>}
   */
  adminGrantSubscription: async (dto) => {
    try {
      return await axiosInstance.post('/payments/admin/grant-subscription', dto);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể cấp Premium. Vui lòng thử lại.';
      console.error('[paymentService] Error granting subscription:', error);
      throw new Error(message);
    }
  },

  // ── Admin: Revoke Subscription ────────────────────────────────────────────────

  /**
   * [Admin] Thu hồi Premium của user bất kỳ.
   * DELETE /api/payments/admin/subscription/{userId}
   *
   * @param {string} userId
   * @returns {Promise<{ message: string }>}
   */
  adminRevokeSubscription: async (userId) => {
    try {
      return await axiosInstance.delete(`/payments/admin/subscription/${userId}`);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể thu hồi Premium. Vui lòng thử lại.';
      console.error('[paymentService] Error revoking subscription:', error);
      throw new Error(message);
    }
  },

  // ── Admin: Revenue Summary ────────────────────────────────────────────────────

  /**
   * [Admin] Tổng quan doanh thu: tổng tiền, MoM growth, active Premium users...
   * GET /api/payments/admin/revenue/summary
   *
   * @returns {Promise<{ totalRevenue, momGrowth, activePremiumUsers, ... }>}
   */
  adminGetRevenueSummary: async () => {
    try {
      return await axiosInstance.get('/payments/admin/revenue/summary');
    } catch (error) {
      console.error('[paymentService] Error fetching revenue summary:', error);
      throw error;
    }
  },

  // ── Admin: Revenue Chart ──────────────────────────────────────────────────────

  /**
   * [Admin] Biểu đồ doanh thu theo ngày hoặc tháng.
   * GET /api/payments/admin/revenue/chart
   *
   * @param {{ groupBy?: 'day'|'month', year?: number, month?: number }} params
   *   - groupBy: 'month' (default) hoặc 'day'
   *   - year: năm cần xem (default: năm hiện tại)
   *   - month: bắt buộc khi groupBy='day'
   * @returns {Promise<Array<{ label, revenue }>>}
   */
  adminGetRevenueChart: async ({ groupBy = 'month', year, month } = {}) => {
    try {
      const params = { groupBy };
      if (year)  params.year  = year;
      if (month) params.month = month;

      return await axiosInstance.get('/payments/admin/revenue/chart', { params });
    } catch (error) {
      console.error('[paymentService] Error fetching revenue chart:', error);
      throw error;
    }
  },

  // ── Admin: Revenue by Plan ────────────────────────────────────────────────────

  /**
   * [Admin] Doanh thu split theo từng gói (monthly_premium / yearly_premium).
   * GET /api/payments/admin/revenue/by-plan
   *
   * @param {{ from?: string, to?: string }} params - ISO date strings, e.g. '2024-01-01'
   * @returns {Promise<Array<{ planId, planName, revenue, orderCount }>>}
   */
  adminGetRevenueByPlan: async ({ from, to } = {}) => {
    try {
      const params = {};
      if (from) params.from = from;
      if (to)   params.to   = to;

      return await axiosInstance.get('/payments/admin/revenue/by-plan', { params });
    } catch (error) {
      console.error('[paymentService] Error fetching revenue by plan:', error);
      throw error;
    }
  },

  // ── Admin: Orders ─────────────────────────────────────────────────────────────

  /**
   * [Admin] Danh sách tất cả đơn hàng — filter, search, phân trang.
   * GET /api/payments/admin/orders
   *
   * @param {{
   *   status?: string,       // 'success' | 'pending' | 'failed'
   *   planId?: string,       // 'monthly_premium' | 'yearly_premium'
   *   search?: string,       // email hoặc orderCode
   *   from?: string,         // ISO date string
   *   to?: string,           // ISO date string
   *   page?: number,         // default 1
   *   pageSize?: number,     // default 20
   * }} filter
   * @returns {Promise<{ items: Array, totalCount: number, page: number, pageSize: number }>}
   */
  adminGetOrders: async (filter = {}) => {
    try {
      return await axiosInstance.get('/payments/admin/orders', { params: filter });
    } catch (error) {
      console.error('[paymentService] Error fetching admin orders:', error);
      throw error;
    }
  },
};

export default paymentService;