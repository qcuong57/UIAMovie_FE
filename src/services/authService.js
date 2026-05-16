// src/services/authService.js
// Auth API Service — khớp với AuthController.cs
//
// LƯU Ý: BE trả ApiResponseDTO<T> { data: T, message: string }
// Mỗi method unwrap res.data?.data để lấy payload thực.
// Cách tốt hơn: thêm interceptor vào axios.js:
//   axiosInstance.interceptors.response.use(
//     res => ({ ...res, data: res.data?.data ?? res.data }),
//     err => Promise.reject(err)
//   );
// Khi đó xóa hết ?.data ở các method bên dưới, chỉ dùng res.data là đủ.

import axiosInstance from '../config/axios';

const authService = {

  // ── Register ──────────────────────────────────────────────────────────────

  /**
   * Đăng ký tài khoản mới — Bước 1
   * POST /api/auth/register
   * Body: { email, username, password, confirmPassword }
   * Response: { email, requiresOtp: true }
   */
  register: async ({ email, username, password, confirmPassword }) => {
    const res = await axiosInstance.post('/auth/register', {
      email,
      username,
      password,
      confirmPassword,
    });
    return res.data?.data ?? res.data;
  },

  /**
   * Xác nhận OTP đăng ký — Bước 2
   * POST /api/auth/register/verify-otp
   * Body: { email, code }
   * Response: { message } (chưa có token — user cần login riêng)
   */
  verifyRegisterOtp: async ({ email, code }) => {
    const res = await axiosInstance.post('/auth/register/verify-otp', { email, code });
    return res.data?.data ?? res.data;
  },

  // ── Login ─────────────────────────────────────────────────────────────────

  /**
   * Đăng nhập
   * POST /api/auth/login
   * Body: { email, password }
   *
   * Response A — thành công (không 2FA):
   *   { accessToken, refreshToken, expiresIn, user: { id, email, username, ... } }
   *
   * Response B — cần 2FA:
   *   { requiresOtp: true, userId }
   */
  login: async ({ email, password }) => {
    const res = await axiosInstance.post('/auth/login', { email, password });
    return res.data?.data ?? res.data;
  },

  // ── OTP ───────────────────────────────────────────────────────────────────

  /**
   * Gửi lại OTP (khi OTP hết hạn hoặc không nhận được email)
   * POST /api/auth/otp/send
   * Body: { userId }
   */
  sendOtp: async (userId) => {
    const res = await axiosInstance.post('/auth/otp/send', { userId });
    return res.data?.data ?? res.data;
  },

  /**
   * Xác thực OTP (2FA login hoặc bật 2FA)
   * POST /api/auth/otp/verify
   * Body: { userId, code }
   * Response: { accessToken, refreshToken, expiresIn, user }
   */
  verifyOtp: async ({ userId, code }) => {
    const res = await axiosInstance.post('/auth/otp/verify', { userId, code });
    return res.data?.data ?? res.data;
  },

  // ── 2FA ───────────────────────────────────────────────────────────────────

  /**
   * Bật 2FA — gửi OTP về email để xác nhận
   * POST /api/auth/2fa/enable  [Authorize]
   * Sau đó gọi verifyOtp() để hoàn tất
   */
  enable2FA: async () => {
    const res = await axiosInstance.post('/auth/2fa/enable');
    return res.data?.data ?? res.data;
  },

  /**
   * Tắt 2FA — xác thực OTP rồi set Is2FaEnabled = false
   * POST /api/auth/2fa/disable  [Authorize]
   * Body: { userId, code }
   */
  disable2FA: async ({ userId, code }) => {
    const res = await axiosInstance.post('/auth/2fa/disable', { userId, code });
    return res.data?.data ?? res.data;
  },

  // ── Forgot / Reset Password ───────────────────────────────────────────────

  /**
   * Quên mật khẩu — gửi OTP về email
   * POST /api/auth/forgot-password
   * Body: { email }
   * Luôn trả OK dù email có tồn tại hay không (bảo mật)
   */
  forgotPassword: async (email) => {
    const res = await axiosInstance.post('/auth/forgot-password', { email });
    return res.data?.data ?? res.data;
  },

  /**
   * Đặt lại mật khẩu bằng OTP
   * POST /api/auth/reset-password
   * Body: { email, code, newPassword, confirmPassword }
   */
  resetPassword: async ({ email, code, newPassword, confirmPassword }) => {
    const res = await axiosInstance.post('/auth/reset-password', {
      email,
      code,
      newPassword,
      confirmPassword,
    });
    return res.data?.data ?? res.data;
  },

  // ── Token ─────────────────────────────────────────────────────────────────

  /**
   * Làm mới access token
   * POST /api/auth/refresh-token
   * Body: { refreshToken }
   * Response: { accessToken, refreshToken, expiresIn, user }
   */
  refreshToken: async (refreshToken) => {
    const res = await axiosInstance.post('/auth/refresh-token', { refreshToken });
    return res.data?.data ?? res.data;
  },

  // ── Logout ────────────────────────────────────────────────────────────────

  /**
   * Đăng xuất  [Authorize]
   * POST /api/auth/logout
   */
  logout: async () => {
    const res = await axiosInstance.post('/auth/logout');
    return res.data?.data ?? res.data;
  },

  // ── Session helpers (localStorage) ───────────────────────────────────────

  /** Lưu session sau khi login / verifyOtp thành công */
  saveSession: (data) => {
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('currentUser',  JSON.stringify({
      id:           data.user.id,
      name:         data.user.username,
      email:        data.user.email,
      avatar:       data.user.avatarUrl,
      role:         data.user.role,
      is2FaEnabled: data.user.is2FaEnabled ?? false,
      isPremium:    data.user.isPremium    ?? false,
    }));
  },

  /**
   * Gọi API subscription-status rồi cập nhật isPremium vào currentUser.
   * Nên gọi sau login và khi app khởi động (App.jsx / AuthContext).
   */
  refreshPremiumStatus: async () => {
    try {
      const status = await axiosInstance.get('/payments/subscription-status');
      const raw = localStorage.getItem('currentUser');
      if (!raw) return;
      const user = JSON.parse(raw);
      user.isPremium = status?.isPremium === true;
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch {
      // Giữ nguyên giá trị cũ nếu lỗi (chưa đăng nhập, network...)
    }
  },

  /** Xóa toàn bộ session local */
  clearSession: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  },

  /** Lấy user hiện tại từ localStorage */
  getCurrentUser: () => {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /** Kiểm tra đã đăng nhập chưa */
  isLoggedIn: () => !!localStorage.getItem('accessToken'),
};

export default authService;