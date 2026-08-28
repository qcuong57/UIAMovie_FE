// src/components/admin/common/Toast.jsx
// Hệ thống thông báo (toast) dùng chung cho toàn bộ trang admin — báo
// thành công / thất bại sau khi xác nhận một hành động (xóa, thêm, sửa phim,
// upload video, upload phụ đề...).
//
// CÁCH DÙNG:
// 1) Bọc app/khu vực admin bằng <ToastProvider> một lần ở gốc (VD trong
//    AdminLayout hoặc App.jsx):
//
//      import { ToastProvider } from './components/admin/common/Toast';
//      <ToastProvider>
//        <AdminMovies />
//        ...
//      </ToastProvider>
//
// 2) Trong bất kỳ component con nào, gọi hook useToast():
//
//      import { useToast } from '../common/Toast';
//      const toast = useToast();
//
//      toast.success('Xóa phim thành công');
//      toast.error('Xóa phim thất bại: ' + message);
//      // hoặc dạng đầy đủ:
//      toast.show({ type: 'success', title: 'Đã lưu', message: 'Cập nhật phim thành công' });

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { T, FONT_BODY as FONT } from '../../../context/adminTokens';

const ToastContext = createContext(null);

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    accent: '#16A34A',
    bg: '#F0FDF4',
    border: 'rgba(22,163,74,0.25)',
    freq: 880,
  },
  error: {
    icon: XCircle,
    accent: T.red ?? '#DC2626',
    bg: '#FEF2F2',
    border: 'rgba(220,38,38,0.25)',
    freq: 220,
  },
  warning: {
    icon: AlertTriangle,
    accent: '#D97706',
    bg: '#FFFBEB',
    border: 'rgba(217,119,6,0.25)',
    freq: 520,
  },
  info: {
    icon: Info,
    accent: T.accent ?? '#2563EB',
    bg: T.surfaceAlt ?? '#F3F4F6',
    border: T.border ?? 'rgba(0,0,0,0.1)',
    freq: 660,
  },
};

let idSeq = 0;
const nextId = () => `toast_${Date.now()}_${idSeq++}`;

const DEFAULT_DURATION = 3800;

// ══════════════════════════════════════════════════════════════════
// ÂM THANH — tạo chime ngắn bằng Web Audio API, không cần file audio
// ══════════════════════════════════════════════════════════════════
function playChime(freq = 660) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();

    const now = ctx.currentTime;
    const notes = [
      { f: freq, t: 0, dur: 0.11 },
      { f: freq * 1.5, t: 0.09, dur: 0.16 },
    ];

    notes.forEach(({ f, t, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0, now + t);
      gain.gain.linearRampToValueAtTime(0.16, now + t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + dur + 0.02);
    });

    setTimeout(() => ctx.close().catch(() => {}), 500);
  } catch {
    // Im lặng bỏ qua — vd trình duyệt chưa cho phép audio (chưa có tương tác user)
  }
}

export function ToastProvider({ children, defaultSoundEnabled = true }) {
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(defaultSoundEnabled);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const show = useCallback(({ type = 'info', title, message, duration = DEFAULT_DURATION, sound = true }) => {
    const id = nextId();
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
    if (sound && soundEnabled) {
      playChime(VARIANTS[type]?.freq ?? VARIANTS.info.freq);
    }
    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss, soundEnabled]);

  // Tiện ích rút gọn
  const success = useCallback((message, title = 'Thành công') => show({ type: 'success', title, message }), [show]);
  const error   = useCallback((message, title = 'Thất bại')   => show({ type: 'error',   title, message }), [show]);
  const warning = useCallback((message, title = 'Chú ý')      => show({ type: 'warning', title, message }), [show]);
  const info    = useCallback((message, title)                => show({ type: 'info',    title, message }), [show]);

  const ctxValue = { show, success, error, warning, info, dismiss, soundEnabled, setSoundEnabled };

  return (
    <ToastContext.Provider value={ctxValue}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast() phải được gọi bên trong <ToastProvider>');
  }
  return ctx;
}

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 340,
        maxWidth: 'calc(100vw - 40px)',
        pointerEvents: 'none',
      }}
    >
      <style>{`@keyframes toastProgress { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
      <AnimatePresence>
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const variant = VARIANTS[toast.type] ?? VARIANTS.info;
  const Icon = variant.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      style={{
        pointerEvents: 'auto',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        padding: '12px 14px',
        borderRadius: 12,
        background: T.surface,
        border: `1px solid ${variant.border}`,
        boxShadow: T.shadowLg ?? '0 8px 24px rgba(0,0,0,0.12)',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 26, height: 26, borderRadius: '50%',
          background: variant.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 1,
        }}
      >
        <Icon size={15} color={variant.accent} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.4 }}>
            {toast.title}
          </p>
        )}
        {toast.message && (
          <p style={{ fontFamily: FONT, fontSize: 12.5, color: T.textSub, margin: toast.title ? '2px 0 0' : 0, lineHeight: 1.5, wordBreak: 'break-word' }}>
            {toast.message}
          </p>
        )}
      </div>

      <button
        onClick={onDismiss}
        style={{
          flexShrink: 0,
          width: 20, height: 20, borderRadius: '50%',
          background: 'transparent', border: 'none',
          cursor: 'pointer', color: T.textMuted,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <X size={12} />
      </button>

      {/* Thanh tiến trình đếm ngược tự ẩn */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          height: 2, background: variant.accent,
          transformOrigin: 'left',
          animation: `toastProgress ${toast.duration ?? DEFAULT_DURATION}ms linear forwards`,
        }}
      />
    </motion.div>
  );
}