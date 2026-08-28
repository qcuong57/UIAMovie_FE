// src/App.jsx
import React from 'react';
import AppRouter from './router/AppRouter';
import { ToastProvider } from './components/common/Toast';

export default function App() {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}