// src/config/axios.js

import axios from 'axios';

// Luôn có đúng 1 dấu "/" ở cuối để nối path không bị "//"
// const RAW_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/';
// const RAW_BASE_URL =  'http://192.168.1.222:5000/api';
const RAW_BASE_URL = 'http://localhost:5000/api/';
const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '') + '/';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // gửi/nhận HttpOnly cookie refreshToken
});

// ── REQUEST: đính token vào header ───────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE: tự refresh khi 401 ─────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue = []; // callbacks chờ token mới

const processQueue = (error, token = null) => {
  refreshQueue.forEach((cb) => (error ? cb.reject(error) : cb.resolve(token)));
  refreshQueue = [];
};

const clearSessionAndRedirect = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('currentUser');
  window.location.href = '/welcome';
};

axiosInstance.interceptors.response.use(
  (response) => response.data,

  async (error) => {
    const original = error.config;

    // Lỗi mạng / timeout (không có response) → trả thẳng về component
    if (!original || !error.response) {
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !original._retry) {
      // Auth endpoints (login/register/otp/...) không refresh → trả lỗi thẳng về component
      const isAuthEndpoint = /\/auth\//i.test(original.url || '');
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      // Khách chưa từng đăng nhập → không phải "hết phiên", để component tự xử lý
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        return Promise.reject(error);
      }

      // Đang refresh → xếp hàng chờ
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // refreshToken nằm trong HttpOnly cookie → chỉ cần withCredentials
        const res = await axios.post(
          `${API_BASE_URL}auth/refresh-token`,
          {},
          { withCredentials: true, timeout: 20000 }
        );

        // Backend trả ApiResponseDTO { data: { accessToken, ... }, message }
        const payload = res.data?.data ?? res.data;
        const newAccessToken = payload?.accessToken;
        if (!newAccessToken) throw new Error('Refresh response thiếu accessToken');

        localStorage.setItem('accessToken', newAccessToken);
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearSessionAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error); // giữ nguyên .response để component đọc được message
  }
);

export default axiosInstance;