// src/services/paymentService.js
// ─────────────────────────────────────────────────────────────────
// Payment & Subscription API Service
// Kết nối với PaymentController.cs tại /api/payments/*
// và AdminPlanController.cs tại /api/admin/plans
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
   * GET /api/payments/plans — các gói ĐANG BÁN (do admin cấu hình, không còn hardcode).
   * Gửi kèm token (nếu đã đăng nhập) để BE tính isEligible / ineligibleReason cho từng gói.
   * @returns {Promise<Array<{
   *   planId, name, description,
   *   priceVnd,            // 0 = gói miễn phí / dùng thử
   *   originalPriceVnd,    // giá gốc để gạch ngang (có thể null)
   *   priceDisplay, durationDays, isMostPopular, features,
   *   isTrial,
   *   allowedEmailDomains, // string[]; rỗng = ai cũng mua được (vd gói sinh viên: ['edu.vn'])
   *   endsAt,              // hạn chót ưu đãi (UTC) hoặc null
   *   isEligible,          // user hiện tại có mua được không (ẩn danh: luôn true)
   *   ineligibleReason     // lý do nếu isEligible = false
   * }>>}
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
   *   - paymentMethod = "none"      (gói miễn phí / dùng thử): BE đã kích hoạt xong,
   *                                 KHÔNG có paymentUrl, KHÔNG redirect. Caller làm mới trạng thái
   *                                 gói rồi chuyển tới trang kết quả.
   * Dùng paymentService.redirectToPayment(order) cho hai trường hợp đầu.
   *
   * BE trả 400 { message } khi gói không tồn tại / ngừng bán / user không đủ điều kiện
   * (đã dùng thử, sai domain email, ...) — message được ném lại nguyên văn.
   *
   * @param {{ planId: string, paymentProvider?: 'vnpay'|'sepay' }} param
   *   paymentProvider bị BE bỏ qua với gói miễn phí.
   */
  createOrder: async ({ planId, paymentProvider = 'vnpay' }) => {
    try {
      const response = await axiosInstance.post('/payments/create-order', {
        planId,
        paymentProvider,
      });

      // Gói 0đ: đã kích hoạt ở server, không có URL thanh toán
      if (response?.paymentMethod === 'none') return response;

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
   * KHÔNG gọi với paymentMethod = "none" (gói miễn phí không có URL).
   *
   * @param {{ paymentUrl: string, paymentMethod?: string, formFields?: Record<string,string> }} order
   */
  redirectToPayment: (order) => {
    if (order?.paymentMethod === 'none' || !order?.paymentUrl) {
      console.warn('[paymentService] redirectToPayment called without a payment URL:', order);
      return;
    }

    if (order.paymentMethod === 'form_post') {
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
   *   { subscriptionType: 'Free'|'Premium', isPremium, expiredAt, daysRemaining, isExpiringSoon,
   *     planId, planName }
   * planId / planName: gói của đơn đã kích hoạt gần nhất; null khi admin cấp tay hoặc không còn Premium.
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
   * status: 'pending' | 'success' | 'failed' | 'expired' | 'cancelled' (chữ thường);
   * provider: 'vnpay' | 'sepay' | 'free' ('free' = gói miễn phí / dùng thử, amount = 0)
   * 'cancelled' = đơn bị thay bằng đơn mới (user chọn lại gói). Trang lịch sử thanh toán nên hiển thị "Đã thay thế".
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
   * Hủy trong lúc dùng thử thì KHÔNG dùng thử lại được (lượt dùng thử đã được tính).
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
   * `planId` là mã gói bất kỳ trong bảng gói (lấy danh sách từ adminGetPlans), kể cả gói đã tắt bán.
   * `expiredAt` là BẮT BUỘC và phải ở tương lai (ISO string). Thiếu thì BE hiểu là năm 0001
   * và trả 400 "Ngày hết hạn phải ở tương lai.".
   *
   * @param {{ userId: string, planId: string, expiredAt: string }} dto
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

  // ── Admin: Plans (CRUD động) ──────────────────────────────────────────────────

  /**
   * [Admin] GET /api/admin/plans — TẤT CẢ gói, kể cả đã tắt bán.
   * @returns {Promise<Array<{
   *   id, planId, name, description, priceVnd, originalPriceVnd, durationDays,
   *   isMostPopular, isActive, sortOrder, features, isTrial, maxPerUser,
   *   allowedEmailDomains, startsAt, endsAt
   * }>>}
   */
  adminGetPlans: async () => {
    try {
      return await axiosInstance.get('/admin/plans');
    } catch (error) {
      console.error('[paymentService] Error fetching admin plans:', error);
      throw error;
    }
  },

  /**
   * [Admin] POST /api/admin/plans — tạo gói mới.
   * `planId` (a-z, 0-9, gạch dưới, 3–50 ký tự) không đổi được sau khi tạo.
   * Giá 0 = gói dùng thử: BE tự đặt isTrial = true và maxPerUser mặc định 1.
   * @param {object} dto - xem UpsertPlanDTO (planId, name, description, priceVnd, originalPriceVnd,
   *   durationDays, isMostPopular, isActive, sortOrder, features[], isTrial, maxPerUser,
   *   allowedEmailDomains, startsAt, endsAt)
   */
  adminCreatePlan: async (dto) => {
    try {
      return await axiosInstance.post('/admin/plans', dto);
    } catch (error) {
      console.error('[paymentService] Error creating plan:', error);
      throw new Error(getApiErrorMessage(error, 'Không thể tạo gói. Vui lòng thử lại.'));
    }
  },

  /**
   * [Admin] PUT /api/admin/plans/{id} — cập nhật gói (id = Guid, không phải planId).
   * Sửa gói không ảnh hưởng đơn cũ (đơn đã lưu sẵn tên, giá, số ngày lúc mua).
   */
  adminUpdatePlan: async (id, dto) => {
    try {
      return await axiosInstance.put(`/admin/plans/${id}`, dto);
    } catch (error) {
      console.error('[paymentService] Error updating plan:', error);
      throw new Error(getApiErrorMessage(error, 'Không thể cập nhật gói. Vui lòng thử lại.'));
    }
  },

  /**
   * [Admin] PATCH /api/admin/plans/{id}/active — bật/tắt bán gói.
   * Không có xóa cứng để giữ nguyên lịch sử đơn.
   */
  adminSetPlanActive: async (id, isActive) => {
    try {
      return await axiosInstance.patch(`/admin/plans/${id}/active`, { isActive });
    } catch (error) {
      console.error('[paymentService] Error toggling plan:', error);
      throw new Error(getApiErrorMessage(error, 'Không thể đổi trạng thái gói. Vui lòng thử lại.'));
    }
  },

  // ── Admin: Revenue Summary ────────────────────────────────────────────────────

  /**
   * [Admin] GET /api/payments/admin/revenue/summary
   * Ngày/tháng tính theo giờ VN; tiền là VND thật.
   * Đơn dùng thử (provider 'free', 0đ) KHÔNG được tính vào các chỉ số thanh toán dưới đây.
   * @returns {Promise<{
   *   totalRevenue,         // GỘP: số khách đã trả qua cổng, chưa trừ phí cổng / hoàn tiền
   *   totalOrders, successOrders, pendingOrders, failedOrders, expiredOrders, cancelledOrders,
   *   successRate,          // success / (success + failed + expired), %. KHÔNG tính pending và cancelled
   *   averageOrderValue,
   *   todayRevenue, todayOrders,
   *   currentMonthRevenue, currentMonthOrders, lastMonthRevenue,
   *   monthOverMonthGrowth, // null khi tháng trước = 0
   *   activePremiumUsers, expiringIn7Days, generatedAt
   * }>}
   * LƯU Ý: pendingOrders chỉ gồm đơn còn hạn; failedOrders KHÔNG gồm đơn hết hạn (xem expiredOrders);
   * cancelledOrders = đơn bị thay bằng đơn mới, có trong totalOrders nhưng không tính vào successRate.
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
   *   status?: string,       // 'pending' | 'success' | 'failed' | 'expired' | 'cancelled' (giá trị lạ → 400)
   *   planId?: string,       // mã gói bất kỳ (lấy danh sách từ adminGetPlans)
   *   provider?: string,     // 'vnpay' | 'sepay' | 'free'
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