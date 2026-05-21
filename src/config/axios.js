// src/config/axios.js

import axios from 'axios';

const API_BASE_URL =  'http://localhost:5000/api/';
// const API_BASE_URL =  'http://192.168.1.222:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
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
  refreshQueue.forEach(cb => error ? cb.reject(error) : cb.resolve(token));
  refreshQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response.data,

  async (error) => {
    const original = error.config;

    // 401 và chưa retry → thử refresh token
    if (error.response?.status === 401 && !original._retry) {

      // Auth endpoints (login/register/...) không refresh → trả lỗi thẳng về component
      const isAuthEndpoint = /\/(auth|Auth)\//i.test(original.url || '');
      if (isAuthEndpoint) {
        return Promise.reject(error); // giữ nguyên error để .response còn đầy đủ
      }

      const refreshToken = localStorage.getItem('refreshToken');

      // Không có refresh token → về landing
      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/welcome';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Đang refresh → xếp hàng chờ
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data;

        localStorage.setItem('accessToken',  accessToken);
        localStorage.setItem('refreshToken', newRefresh);

        axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        original.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/welcome';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error); // giữ nguyên .response để component đọc được message
  }
);

export default axiosInstance;