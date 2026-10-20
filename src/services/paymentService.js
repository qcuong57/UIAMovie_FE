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
import authService from './authService';
import { getApiErrorMessage } from '../utils/apiError';

const paymentService = {
  // ── Plans ────────────────────────────────────────────────────────────────────

  /**
   * GET /api/payments/plans
   * @returns {Promise<Array<{ planId, name, description, priceVnd, priceDisplay, durationDays, isMostPopular, features }>>}
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
   *   { orderId, orderCode, paymentUrl, paymentMethod, formFields, amount, provider, expiredAt }
   *
   *   - paymentMethod = "redirect"  (VNPay): chuyển trang tới paymentUrl
   *   - paymentMethod = "form_post" (SePay): POST form tới paymentUrl kèm formFields
   * Dùng paymentService.redirectToPayment(order) để xử lý cả hai trường hợp.
   *
   * @param {{ planId: string, paymentProvider?: 'vnpay'|'sepay' }} param
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

      if (
        response.paymentMethod === 'form_post' &&
        Object.keys(response.formFields ?? {}).length === 0
      ) {
        console.error('[paymentService] form_post without formFields:', response);
        throw new Error('Thiếu dữ liệu form thanh toán.');
      }

      return response;
    } catch (error) {
      console.error('[paymentService] Error creating order:', error);
      throw new Error(
        getApiErrorMessage(error, 'Không thể tạo đơn thanh toán. Vui lòng thử lại.')
      );
    }
  },

  /**
   * Chuyển user sang cổng thanh toán theo đúng kiểu BE yêu cầu.
   *   - "form_post" (SePay): tạo form ẩn rồi POST (giữ ĐÚNG thứ tự formFields BE trả về)
   *   - còn lại (VNPay): chuyển trang tới paymentUrl
   *
   * @param {{ paymentUrl: string, paymentMethod?: string, formFields?: Record<string,string> }} order
   */
  redirectToPayment: (order) => {
    if (order?.paymentMethod === 'form_post') {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = order.paymentUrl;
      form.style.display = 'none';

      Object.entries(order.formFields ?? {}).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      return;
    }

    window.location.href = order.paymentUrl;
  },

  // ── Subscription Status ───────────────────────────────────────────────────────

  /**
   * GET /api/payments/subscription-status
   *   { subscriptionType: 'Free'|'Premium', isPremium, expiredAt, daysRemaining, isExpiringSoon }
   * LƯU Ý: subscriptionType KHÔNG cho biết gói tháng hay năm (BE không lưu planId trên subscription).
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
   * status: 'pending' | 'success' | 'failed' | 'expired' (chữ thường); provider: 'vnpay' | 'sepay'
   * @returns {Promise<Array<{ id, orderCode, planName, amount, provider, status, failureReason, createdAt, paidAt }>>}
   */
  getPaymentHistory: async () => {
    try {
      return await axiosInstance.get('/payments/history');
    } catch (error) {
      console.error('[paymentService] Error fetching payment history:', error);
      throw error;
    }
  },

  /**
   * Tìm đơn của user hiện tại theo orderCode (lấy từ lịch sử thanh toán).
   * Dùng để XÁC MINH kết quả thanh toán thay vì tin `status` trên URL redirect.
   * Ném lỗi nếu gọi API thất bại; trả null nếu không có đơn nào khớp.
   *
   * @param {string} orderCode
   * @returns {Promise<object|null>}
   */
  getOrderByCode: async (orderCode) => {
    const history = await paymentService.getPaymentHistory();
    if (!Array.isArray(history)) return null;
    return history.find((o) => o.orderCode === orderCode) ?? null;
  },

  // ── Cancel Subscription ───────────────────────────────────────────────────────

  /**
   * User tự hủy gói Premium của chính mình.
   * DELETE /api/payments/subscription/me
   * BE xóa luôn gói (mất quyền Premium ngay), không giữ đến hết kỳ.
   *
   * @returns {Promise<{ message: string }>}
   */
  cancelMySubscription: async () => {
    let result;
    try {
      result = await axiosInstance.delete('/payments/subscription/me');
    } catch (error) {
      console.error('[paymentService] Error cancelling subscription:', error);
      throw new Error(getApiErrorMessage(error, 'Không thể hủy gói. Vui lòng thử lại.'));
    }

    // Tách riêng khỏi try/catch trên: refresh lỗi không làm thao tác hủy bị báo thất bại.
    await authService.refreshPremiumStatus();
    return result;
  },

  // ── Helpers ───────────────────────────────────────────────────────────────────

  /** @returns {Promise<boolean>} */
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
   * `expiredAt` là BẮT BUỘC và phải ở tương lai (ISO string). Thiếu thì BE hiểu là năm 0001
   * và trả 400 "Ngày hết hạn phải ở tương lai.".
   *
   * @param {{ userId: string, planId: 'monthly_premium'|'yearly_premium', expiredAt: string }} dto
   */
  adminGrantSubscription: async (dto) => {
    try {
      return await axiosInstance.post('/payments/admin/grant-subscription', dto);
    } catch (error) {
      console.error('[paymentService] Error granting subscription:', error);
      throw new Error(getApiErrorMessage(error, 'Không thể cấp Premium. Vui lòng thử lại.'));
    }
  },

  // ── Admin: Revoke Subscription ────────────────────────────────────────────────

  /**
   * [Admin] Thu hồi Premium của user bất kỳ.
   * DELETE /api/payments/admin/subscription/{userId}
   */
  adminRevokeSubscription: async (userId) => {
    try {
      return await axiosInstance.delete(`/payments/admin/subscription/${userId}`);
    } catch (error) {
      console.error('[paymentService] Error revoking subscription:', error);
      throw new Error(getApiErrorMessage(error, 'Không thể thu hồi Premium. Vui lòng thử lại.'));
    }
  },

  // ── Admin: Revenue Summary ────────────────────────────────────────────────────

  /**
   * [Admin] GET /api/payments/admin/revenue/summary
   * Ngày/tháng tính theo giờ VN; tiền là VND thật.
   * @returns {Promise<{
   *   totalRevenue, totalOrders, successOrders, pendingOrders, failedOrders, expiredOrders,
   *   successRate,          // success / (success + failed + expired), %
   *   averageOrderValue,
   *   todayRevenue, todayOrders,
   *   currentMonthRevenue, currentMonthOrders, lastMonthRevenue,
   *   monthOverMonthGrowth, // null khi tháng trước = 0
   *   activePremiumUsers, expiringIn7Days, generatedAt
   * }>}
   * LƯU Ý: pendingOrders chỉ gồm đơn còn hạn; failedOrders KHÔNG còn gồm đơn hết hạn (xem expiredOrders).
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
   * [Admin] GET /api/payments/admin/revenue/chart
   *
   * @param {{ groupBy?: 'day'|'month', year?: number, month?: number }} params
   *   - year: 2000–2100 (mặc định: năm hiện tại)
   *   - month: 1–12, BẮT BUỘC khi groupBy='day'
   * @returns {Promise<{ groupBy, dataPoints: Array<{ label, revenue, orders }>, totalRevenue, totalOrders }>}
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
   * [Admin] GET /api/payments/admin/revenue/by-plan
   * @param {{ from?: string, to?: string }} params - NGÀY theo giờ VN dạng 'yyyy-MM-dd', gồm cả ngày `to`
   * @returns {Promise<Array<{ planId, planName, revenue, orders, revenueShare }>>}
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
   * [Admin] GET /api/payments/admin/orders
   *
   * @param {{
   *   status?: string,       // 'pending' | 'success' | 'failed' | 'expired'
   *   planId?: string,       // 'monthly_premium' | 'yearly_premium'
   *   provider?: string,
   *   search?: string,       // email hoặc orderCode
   *   from?: string,         // 'yyyy-MM-dd' (ngày VN), lọc theo ngày tạo đơn
   *   to?: string,           // 'yyyy-MM-dd' (ngày VN), gồm cả ngày này; phải >= from
   *   page?: number,         // default 1
   *   pageSize?: number,     // default 20, tối đa 100
   * }} filter
   * @returns {Promise<{ items: Array, totalCount: number, pageNumber: number, pageSize: number }>}
   */
  adminGetOrders: async (filter = {}) => {
    try {
      return await axiosInstance.get('/payments/admin/orders', { params: filter });
    } catch (error) {
      console.error('[paymentService] Error fetching admin orders:', error);
      throw error;
    }
  },

  // ── Admin: Export Excel ───────────────────────────────────────────────────────

  /**
   * [Admin] GET /api/payments/admin/revenue/export → file .xlsx (3 sheet: Tổng quan / Theo gói / Đơn hàng).
   *
   * - from/to: NGÀY theo giờ VN 'yyyy-MM-dd', gồm cả ngày `to`.
   * - status: bỏ trống = chỉ xuất đơn 'success'. Đơn success lọc theo ngày THANH TOÁN, loại khác theo ngày TẠO.
   * - Tối đa 50.000 đơn; vượt quá BE trả 400 kèm hướng dẫn thu hẹp khoảng thời gian.
   *
   * Interceptor trả về response.data nên với responseType 'blob' ta nhận thẳng Blob. Header
   * Content-Disposition bị mất → tên file dựng lại theo đúng quy tắc của BE.
   *
   * @param {{ from?: string, to?: string, status?: string, provider?: string, planId?: string }} filter
   * @returns {Promise<{ blob: Blob, filename: string }>}
   */
  adminExportRevenue: async ({ from, to, status, provider, planId } = {}) => {
    const params = {};
    if (from)     params.from     = from;
    if (to)       params.to       = to;
    if (status)   params.status   = status;
    if (provider) params.provider = provider;
    if (planId)   params.planId   = planId;

    try {
      const blob = await axiosInstance.get('/payments/admin/revenue/export', {
        params,
        responseType: 'blob',
      });
      if (!(blob instanceof Blob)) throw new Error('Dữ liệu xuất không hợp lệ.');

      const compact = (d) => (d ? d.replaceAll('-', '') : '');
      const range = !from && !to ? 'toan-thoi-gian' : `${compact(from)}_${compact(to)}`;
      return { blob, filename: `doanh-thu_${range}.xlsx` };
    } catch (error) {
      console.error('[paymentService] Error exporting revenue:', error);

      // Khi responseType='blob', body lỗi {message} cũng là Blob → đọc ra để lấy thông điệp BE.
      let message;
      const data = error?.response?.data;
      if (data instanceof Blob) {
        try { message = JSON.parse(await data.text())?.message; } catch { /* không phải JSON */ }
      }
      throw new Error(message || getApiErrorMessage(error, 'Không thể xuất báo cáo. Vui lòng thử lại.'));
    }
  },
};

export default paymentService;