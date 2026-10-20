// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'
import authService from './services/authService'

// Bắt đầu lấy lại accessToken (từ cookie HttpOnly) ngay từ đầu nhưng KHÔNG chờ:
// giao diện render liền bằng currentUser đã lưu. Request cần token tự chờ refresh xong
// (xem request interceptor trong config/axios.js). Gọi nhiều lần vẫn chỉ refresh một lần.
authService.initSession()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)