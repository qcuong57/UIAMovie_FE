// src/config/axios.js

import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore';
import { hasStoredUser, clearStoredUser, subscribeStoredUser } from './sessionStore';

// Luôn có đúng 1 dấu "/" ở cuối để nối path không bị "//".
// Dev: không đặt VITE_API_URL → localhost.
// Production: VITE_API_URL=https://<api-domain>/api (hoặc /api khi đã có proxy cùng domain).
// const RAW_BASE_URL =  'http://localhost:5000/api/';
const RAW_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/';
const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '') + '/';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // gửi/nhận HttpOnly cookie refreshToken
});

// Các endpoint auth công khai: không cần token → không chờ bootstrap, không refresh khi 401.
// (2fa/* và logout cần token nên KHÔNG nằm trong danh sách này.)
// Có neo cuối (/, hết chuỗi hoặc ?) để không khớp nhầm kiểu /auth/login-history.
const PUBLIC_AUTH =
  /\/auth\/(login|register|otp|forgot-password|reset-password|refresh-token)(\/|$|\?)/i;

// Refresh thất bại do phiên thật sự không còn hợp lệ (khác với lỗi mạng/timeout/429).
// KHÔNG tính 403: BE trả 403 khi Origin không nằm trong whitelist (vd. preview deploy),
// đó là lỗi cấu hình chứ không phải hết phiên nên không được xoá hồ sơ người dùng.
export const isAuthFailure = (err) =>
  err?.code === 'NO_ACCESS_TOKEN' || err?.response?.status === 401;

// ── REFRESH (single-flight) ──────────────────────────────────────────────────
// Dùng chung cho interceptor 401 và bước khởi động. Mọi lời gọi đồng thời trong tab
// dùng chung một promise; giữa các tab dùng Web Locks để không refresh song song
// bằng cùng một cookie (BE xoay refresh token mỗi lần).
// Sau lỗi tạm thời (mạng, timeout, 429, 5xx) không gọi lại ngay: tránh mỗi request kế tiếp
// lại đập vào /refresh-token và làm rate limit nặng thêm.
const TRANSIENT_FAILURE_COOLDOWN_MS = 5000;
let refreshPromise = null;
let lastTransientFailure = null; // { at, error }

const withRefreshLock = (task) =>
  typeof navigator !== 'undefined' && navigator.locks?.request
    ? navigator.locks.request('uiamovie-refresh-token', task)
    : task();

export const refreshAccessToken = () => {
  if (!refreshPromise) {
    if (lastTransientFailure && Date.now() - lastTransientFailure.at < TRANSIENT_FAILURE_COOLDOWN_MS) {
      return Promise.reject(lastTransientFailure.error);
    }

    refreshPromise = withRefreshLock(() =>
      axios.post(`${API_BASE_URL}auth/refresh-token`, {}, { withCredentials: true, timeout: 20000 })
    )
      .then((res) => {
        // Backend trả ApiResponseDTO { data: { accessToken, ... }, message }
        const payload = res.data?.data ?? res.data;
        const newAccessToken = payload?.accessToken;
        if (!newAccessToken) {
          const err = new Error('Refresh response thiếu accessToken');
          err.code = 'NO_ACCESS_TOKEN';
          throw err;
        }
        setAccessToken(newAccessToken);
        lastTransientFailure = null;
        return newAccessToken;
      })
      .catch((err) => {
        lastTransientFailure = isAuthFailure(err) ? null : { at: Date.now(), error: err };
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// ── BOOTSTRAP (không chặn render) ────────────────────────────────────────────
// Gọi 1 lần khi mở app. Giao diện render ngay bằng currentUser đã lưu; refresh chạy nền.
// Mọi request cần token tự chờ promise này (xem request interceptor).
// Khách chưa từng đăng nhập: resolve false ngay, không gọi mạng.
let bootPromise = null;

export const resetBootstrap = () => {
  bootPromise = null;
};

/** Xoá toàn bộ phiên phía client (token trong bộ nhớ + hồ sơ) và cho phép bootstrap chạy lại. */
export const clearSession = () => {
  clearAccessToken();
  clearStoredUser();
  resetBootstrap();
};

export const bootstrapSession = () => {
  if (!bootPromise) {
    const current = (async () => {
      if (getAccessToken()) return true;
      if (!hasStoredUser()) return false; // khách

      try {
        try {
          await refreshAccessToken();
        } catch (firstErr) {
          // 401 có thể do cookie mới chưa kịp lưu (reload liên tục): đợi chút rồi thử lại một lần
          // trước khi xoá phiên. Lỗi mạng/timeout thì ném thẳng ra.
          if (!isAuthFailure(firstErr)) throw firstErr;
          await new Promise((r) => setTimeout(r, 600));
          await refreshAccessToken();
        }
        return true;
      } catch (err) {
        if (import.meta.env?.DEV) {
          console.warn('[bootstrap] refresh failed:', err?.response?.status, err?.response?.data, err?.code);
        }
        if (isAuthFailure(err)) {
          // Phiên hết hạn thật → xoá hồ sơ + token
          clearSession();
        } else if (bootPromise === current) {
          // Lỗi mạng/timeout: giữ hồ sơ và KHÔNG cache kết quả `false`,
          // để request kế tiếp thử refresh lại.
          bootPromise = null;
        }
        return false;
      }
    })();
    bootPromise = current;
  }
  return bootPromise;
};

// ── Token mới cho nơi KHÔNG đi qua axios (SignalR, fetch...) ─────────────────
const isExpiringSoon = (token, skewSeconds = 30) => {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(b64));
    return !exp || exp * 1000 - Date.now() < skewSeconds * 1000;
  } catch {
    return true;
  }
};

/** Chờ bootstrap, và refresh nếu token sắp hết hạn. Trả '' nếu là khách / không lấy được. */
export const getFreshAccessToken = async () => {
  await bootstrapSession();
  const token = getAccessToken();

  if (!token) {
    // Khách → không có gì để lấy.
    if (!hasStoredUser()) return '';
    // Đã đăng nhập nhưng bootstrap thất bại (vd. lỗi mạng) → thử refresh trực tiếp.
    try {
      return await refreshAccessToken();
    } catch {
      return '';
    }
  }

  if (!isExpiringSoon(token)) return token;
  try {
    return await refreshAccessToken();
  } catch {
    return getAccessToken() || '';
  }
};

// Đồng bộ giữa các tab: tab khác đăng xuất → bỏ token ở tab này;
// tab khác đăng nhập → cho phép lấy token qua cookie ở request kế tiếp.
subscribeStoredUser(() => {
  if (!hasStoredUser()) {
    clearAccessToken();
  } else if (!getAccessToken()) {
    resetBootstrap();
  }
});

const clearSessionAndRedirect = () => {
  clearSession();
  if (window.location.pathname !== '/welcome') {
    window.location.href = '/welcome';
  }
};

// ── REQUEST: chờ bootstrap (nếu cần) rồi đính token từ bộ nhớ ────────────────
axiosInstance.interceptors.request.use(
  async (config) => {
    if (!PUBLIC_AUTH.test(config.url || '')) {
      await bootstrapSession();
    }
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE: tự refresh khi 401 ─────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response.data,

  async (error) => {
    const original = error.config;

    // Lỗi mạng / timeout (không có response) → trả thẳng về component
    if (!original || !error.response) {
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !original._retry) {
      // Endpoint auth công khai (login/register/otp/...) → trả lỗi thẳng về component
      if (PUBLIC_AUTH.test(original.url || '')) {
        return Promise.reject(error);
      }

      // Khách chưa từng đăng nhập → không phải "hết phiên", để component tự xử lý.
      if (!getAccessToken() && !hasStoredUser()) {
        return Promise.reject(error);
      }

      original._retry = true;

      let newAccessToken;
      try {
        newAccessToken = await refreshAccessToken();
      } catch (refreshError) {
        if (isAuthFailure(refreshError)) clearSessionAndRedirect();
        return Promise.reject(refreshError);
      }

      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosInstance(original);
    }

    return Promise.reject(error); // giữ nguyên .response để component đọc được message
  }
);

export default axiosInstance;