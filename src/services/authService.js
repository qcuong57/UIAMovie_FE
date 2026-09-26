// src/services/authService.js
import axiosInstance from '../config/axios';

const extractData = (res) => (res && res.data !== undefined ? res.data : res);

const authService = {

  // ── Register ──────────────────────────────────────────────────────────────

  register: async ({ email, username, password, confirmPassword }) => {
    const res = await axiosInstance.post('/auth/register', {
      email,
      username,
      password,
      confirmPassword,
    });
    return extractData(res);
  },

  verifyRegisterOtp: async ({ email, code }) => {
    const res = await axiosInstance.post('/auth/register/verify-otp', { email, code });
    return extractData(res);
  },

  // ── Login ─────────────────────────────────────────────────────────────────

  login: async ({ email, password }) => {
    const res = await axiosInstance.post('/auth/login', { email, password });
    return extractData(res);
  },

  // ── OTP (Login 2FA) ───────────────────────────────────────────────────────

  sendOtp: async (userId) => {
    const res = await axiosInstance.post('/auth/otp/send', { userId });
    return extractData(res);
  },

  verifyOtp: async ({ userId, code }) => {
    const res = await axiosInstance.post('/auth/otp/verify', { userId, code });
    return extractData(res);
  },

  // ── 2FA ───────────────────────────────────────────────────────────────────

  enable2FA: async () => {
    const res = await axiosInstance.post('/auth/2fa/enable');
    return extractData(res);
  },

  confirmEnable2FA: async (code) => {
    const res = await axiosInstance.post('/auth/2fa/confirm', { code });
    return extractData(res);
  },

  disable2FA: async (code) => {
    const res = await axiosInstance.post('/auth/2fa/disable', { code });
    return extractData(res);
  },

  // ── Forgot / Reset Password ───────────────────────────────────────────────

  forgotPassword: async (email) => {
    const res = await axiosInstance.post('/auth/forgot-password', { email });
    return extractData(res);
  },

  resetPassword: async ({ email, code, newPassword, confirmPassword }) => {
    const res = await axiosInstance.post('/auth/reset-password', {
      email,
      code,
      newPassword,
      confirmPassword,
    });
    return extractData(res);
  },

  // ── Token ─────────────────────────────────────────────────────────────────

  refreshToken: async () => {
    // Không cần truyền refreshToken thủ công, cookie tự đính kèm
    const res = await axiosInstance.post('/auth/refresh-token');
    return extractData(res);
  },

  // ── Logout ────────────────────────────────────────────────────────────────

  logout: async () => {
    try {
      const res = await axiosInstance.post('/auth/logout');
      return extractData(res);
    } finally {
      authService.clearSession();
    }
  },

  // ── Session Helpers ───────────────────────────────────────────────────────

  saveSession: (data) => {
    if (!data) return;

    // CHỈ LƯU accessToken và profile người dùng (refreshToken đã nằm an toàn trong HttpOnly Cookie)
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
    }
    if (data.user) {
      localStorage.setItem(
        'currentUser',
        JSON.stringify({
          id: data.user.id,
          name: data.user.username,
          email: data.user.email,
          avatar: data.user.avatarUrl,
          role: data.user.role,
          is2FaEnabled: data.user.is2FaEnabled ?? false,
          isPremium: data.user.isPremium ?? false,
        })
      );
    }
  },

  refreshPremiumStatus: async () => {
    try {
      const res = await axiosInstance.get('/payments/subscription-status');
      const status = extractData(res);
      const raw = localStorage.getItem('currentUser');
      if (!raw) return;
      const user = JSON.parse(raw);
      user.isPremium = status?.isPremium === true;
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch {
      // Bỏ qua lỗi
    }
  },

  clearSession: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
  },

  getCurrentUser: () => {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isLoggedIn: () => !!localStorage.getItem('accessToken'),
};

export default authService;