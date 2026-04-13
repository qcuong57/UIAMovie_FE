// src/services/authService.js
// Auth API Service — khớp hoàn toàn với AuthController.cs

import axiosInstance from '../config/axios';

const authService = {

  /**
   * Đăng ký tài khoản mới
   * POST /api/auth/register
   * Body: { email, username, password, confirmPassword }
   */
  register: async ({ email, username, password, confirmPassword }) => {
    const res = await axiosInstance.post('/auth/register', {
      email,
      username,
      password,
      confirmPassword,
    });
    return res.data;
  },

  /**
   * Đăng nhập
   * POST /api/auth/login
   * Body: { email, password }
   *
   * Response 1 — thành công (không 2FA):
   *   { accessToken, refreshToken, expiresIn, user: { id, email, username, ... } }
   *
   * Response 2 — cần 2FA:
   *   { requiresOtp: true, userId, message }
   */
  login: async ({ email, password }) => {
    const res = await axiosInstance.post('/auth/login', { email, password });
    return res.data;
  },

  /**
   * Gửi lại OTP
   * POST /api/auth/otp/send
   * Body: { userId }
   */
  sendOtp: async (userId) => {
    const res = await axiosInstance.post('/auth/otp/send', { userId });
    return res.data;
  },

  /**
   * Xác thực OTP (2FA hoặc bật 2FA)
   * POST /api/auth/otp/verify
   * Body: { userId, code }
   * Response: { accessToken, refreshToken, expiresIn, user }
   */
  verifyOtp: async ({ userId, code }) => {
    const res = await axiosInstance.post('/auth/otp/verify', { userId, code });
    return res.data;
  },

  /**
   * Quên mật khẩu — gửi OTP về email
   * POST /api/auth/forgot-password
   * Body: { email }
   */
  forgotPassword: async (email) => {
    const res = await axiosInstance.post('/auth/forgot-password', { email });
    return res.data;
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
    return res.data;
  },

  /**
   * Refresh access token
   * POST /api/auth/refresh-token
   * Body: { refreshToken }
   */
  refreshToken: async (refreshToken) => {
    const res = await axiosInstance.post('/auth/refresh-token', { refreshToken });
    return res.data;
  },

  /**
   * Đăng xuất
   * POST /api/auth/logout  (cần Bearer token)
   */
  logout: async () => {
    const res = await axiosInstance.post('/auth/logout');
    return res.data;
  },

  // ── Local storage helpers ─────────────────────────────────────────────────

  /** Lưu session sau khi login/verifyOtp thành công */
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
    }));
  },

  /** Xóa session local */
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