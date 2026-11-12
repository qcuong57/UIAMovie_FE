// src/App.jsx
import React from 'react';
import AppRouter from './router/AppRouter';
import { ToastProvider } from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  return (
    // Lưới an toàn ngoài cùng: bắt lỗi ở những nơi ErrorBoundary của route không phủ tới (vd. Navbar, router)
    <ErrorBoundary>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </ErrorBoundary>
  );
}