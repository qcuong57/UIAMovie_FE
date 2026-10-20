// src/services/authService.js
import axiosInstance, {
  refreshAccessToken,
  bootstrapSession,
  clearSession,
} from '../config/axios';
import { getAccessToken, setAccessToken } from '../config/tokenStore';
import { getStoredUser, setStoredUser, hasStoredUser } from '../config/sessionStore';

const extractData = (res) => (res && res.data !== undefined ? res.data : res);

const post = async (url, body) => extractData(await axiosInstance.post(url, body));

const authService = {

  // ── Register ──────────────────────────────────────────────────────────────

  register: ({ email, username, password, confirmPassword }) =>
    post('/auth/register', { email, username, password, confirmPassword }),

  verifyRegisterOtp: ({ email, code }) =>
    post('/auth/register/verify-otp', { email, code }),

  // ── Login ─────────────────────────────────────────────────────────────────

  login: ({ email, password }) => post('/auth/login', { email, password }),

  // ── OTP (Login 2FA) ───────────────────────────────────────────────────────

  sendOtp: (userId) => post('/auth/otp/send', { userId }),

  verifyOtp: ({ userId, code }) => post('/auth/otp/verify', { userId, code }),

  // ── 2FA ───────────────────────────────────────────────────────────────────

  enable2FA: () => post('/auth/2fa/enable'),

  confirmEnable2FA: (code) => post('/auth/2fa/confirm', { code }),

  disable2FA: (code) => post('/auth/2fa/disable', { code }),

  // ── Forgot / Reset Password ───────────────────────────────────────────────

  forgotPassword: (email) => post('/auth/forgot-password', { email }),

  resetPassword: ({ email, code, newPassword, confirmPassword }) =>
    post('/auth/reset-password', { email, code, newPassword, confirmPassword }),

  // ── Token ─────────────────────────────────────────────────────────────────

  /** Giữ để tương thích code cũ. Dùng chung single-flight với interceptor. */
  refreshToken: async () => ({ accessToken: await refreshAccessToken() }),

  /**
   * Gọi MỘT LẦN khi khởi động app (xem main.jsx), không cần chờ.
   * - Khách chưa từng đăng nhập: bỏ qua, trả false.
   * - Đã từng đăng nhập: lấy lại accessToken từ cookie HttpOnly, trả true nếu thành công.
   * Gọi nhiều lần (vd React StrictMode) vẫn chỉ refresh đúng một lần.
   */
  initSession: bootstrapSession,

  // ── Logout ────────────────────────────────────────────────────────────────

  logout: async () => {
    try {
      return await post('/auth/logout');
    } finally {
      clearSession();
    }
  },

  // ── Session Helpers ───────────────────────────────────────────────────────

  saveSession: (data) => {
    if (!data) return;

    // accessToken chỉ giữ trong bộ nhớ; refreshToken nằm trong HttpOnly Cookie.
    if (data.accessToken) {
      setAccessToken(data.accessToken);
    }
    if (data.user) {
      setStoredUser({
        id: data.user.id,
        name: data.user.username,
        email: data.user.email,
        avatar: data.user.avatarUrl,
        role: data.user.role,
        is2FaEnabled: data.user.is2FaEnabled ?? false,
        // BE trả subscriptionType ("free" | "standard" | "premium"), không có isPremium.
        // Giá trị tạm; refreshPremiumStatus (đã kiểm tra hạn) sẽ chốt lại.
        isPremium:
          data.user.isPremium ??
          String(data.user.subscriptionType || 'free').toLowerCase() !== 'free',
      });
    }
  },

  refreshPremiumStatus: async () => {
    try {
      const status = extractData(await axiosInstance.get('/payments/subscription-status'));
      const user = getStoredUser();
      if (!user) return;
      setStoredUser({ ...user, isPremium: status?.isPremium === true });
    } catch {
      // Bỏ qua lỗi
    }
  },

  clearSession,

  getCurrentUser: getStoredUser,

  // Dựa trên hồ sơ đã lưu (giống router), đúng ngay cả khi token đang được refresh nền.
  isLoggedIn: hasStoredUser,

  // Chỉ true sau khi đã có accessToken trong bộ nhớ.
  hasAccessToken: () => !!getAccessToken(),
};

export default authService;