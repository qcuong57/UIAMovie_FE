// src/components/common/Toast.jsx
// Hệ thống thông báo (toast) dùng cho phần HOME/USER — theme tối đồng bộ
// với homeTokens.js. Bố cục/animation giống AdminToast (icon tròn, trượt
// vào từ bên phải, thanh tiến trình đếm ngược), chỉ khác màu nền + màu chữ
// (dark theme thay vì light theme của admin).
// Có phát âm thanh (chime) mỗi khi toast hiện lên, tạo bằng Web Audio API
// nên KHÔNG cần file mp3 nào cả.
//
// ── CÁCH DÙNG ────────────────────────────────────────────────────────
// 1) Bọc App (hoặc layout user) bằng <ToastProvider> MỘT LẦN ở gốc:
//
//      // src/App.jsx
//      import { ToastProvider } from './components/common/Toast';
//
//      function App() {
//        return (
//          <ToastProvider>
//            {/* toàn bộ route / layout user ở đây */}
//          </ToastProvider>
//        );
//      }
//
// 2) Trong bất kỳ component con nào, gọi hook useToast():
//
//      import { useToast } from '../../components/common/Toast';
//      const toast = useToast();
//
//      toast.success('Đã thêm vào Yêu thích');
//      toast.error('Không thể kết nối máy chủ');
//      toast.warning('Tài khoản của bạn sắp hết hạn Premium');
//      toast.info('Có tập mới vừa được cập nhật');
//
//      // hoặc dạng đầy đủ (custom title):
//      toast.show({ type: 'success', title: 'Đã lưu', message: 'Cập nhật hồ sơ thành công' });
//
// ── ÂM THANH ─────────────────────────────────────────────────────────
// Mặc định BẬT. Mỗi loại toast có một tiếng "ting" riêng (tần số khác
// nhau) để phân biệt success/error/warning/info bằng tai luôn.
// Muốn tắt âm cho 1 toast cụ thể:      toast.show({ ..., sound: false })
// Muốn tắt âm toàn cục (vd trong Settings, nút "Tắt âm thông báo"):
//      const toast = useToast();
//      toast.setSoundEnabled(false);
// Trình duyệt chặn autoplay audio cho tới khi user tương tác (click/tap)
// với trang — đây là giới hạn của browser, không phải bug. Toast đầu
// tiên xuất hiện SAU khi user đã click gì đó thì sẽ có tiếng bình thường.

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { C, FONT_DISPLAY, FONT_BODY } from '../../context/homeTokens';

const ToastContext = createContext(null);

// Trộn thêm alpha (hex 2 ký tự) vào sau 1 màu hex 6 ký tự, dùng để tạo
// nền tròn cho icon (giống bg pastel bên admin nhưng tính từ accent để
// hợp theme tối, không cần thêm token màu mới).
const withAlpha = (hex, alpha) => `${hex}${alpha}`;

// ── Theme theo từng loại — nền thẻ + viền dùng chung màu tối trung tính,
// chỉ khác nhau ở màu icon / nền tròn icon / viền tròn icon ──
const VARIANTS = {
  success: {
    icon: CheckCircle2,
    accent: C.green ?? '#46d369',
    iconBg: withAlpha(C.green ?? '#46d369', '26'),
    freq: 880, // La5 — tiếng cao, gọn, "tích cực"
  },
  error: {
    icon: XCircle,
    accent: C.accent ?? '#e5181e',
    iconBg: withAlpha(C.accent ?? '#e5181e', '26'),
    freq: 220, // trầm hơn, cảnh báo
  },
  warning: {
    icon: AlertTriangle,
    accent: C.gold ?? '#f5c518',
    iconBg: withAlpha(C.gold ?? '#f5c518', '26'),
    freq: 520,
  },
  info: {
    icon: Info,
    accent: '#7a8a9e',
    iconBg: 'rgba(122,138,158,0.18)',
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

    // 2 nốt nhỏ liền nhau (freq → freq*1.5) tạo cảm giác "ting~" nhẹ nhàng
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
      gain.gain.linearRampToValueAtTime(0.16, now + t + 0.012); // attack
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + dur); // decay

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + dur + 0.02);
    });

    // Tự đóng AudioContext sau khi phát xong để khỏi rò rỉ
    setTimeout(() => ctx.close().catch(() => {}), 500);
  } catch {
    // Im lặng bỏ qua — vd trình duyệt chưa cho phép audio (chưa có tương tác user)
  }
}

// ══════════════════════════════════════════════════════════════════
// PROVIDER
// ══════════════════════════════════════════════════════════════════
export function ToastProvider({ children, defaultSoundEnabled = true }) {
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(defaultSoundEnabled);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const show = useCallback(
    ({ type = 'info', title, message, duration = DEFAULT_DURATION, sound = true }) => {
      const id = nextId();
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (sound && soundEnabled) {
        playChime(VARIANTS[type]?.freq ?? VARIANTS.info.freq);
      }

      if (duration > 0) {
        timers.current[id] = setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss, soundEnabled],
  );

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

// ══════════════════════════════════════════════════════════════════
// VIEWPORT — góc trên-phải, dưới nav (paddingTop 68 giống các trang user)
// ══════════════════════════════════════════════════════════════════
function ToastViewport({ toasts, onDismiss }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 76,
        right: 20,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 360,
        maxWidth: 'calc(100vw - 40px)',
        pointerEvents: 'none',
      }}
    >
      {/* Thanh tiến trình đếm ngược ở đáy mỗi toast — giống admin */}
      <style>{`@keyframes toastProgress { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
      <AnimatePresence>
        {toasts.map((t) => (
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
        gap: 12,
        alignItems: 'flex-start',
        padding: '14px 16px',
        borderRadius: 14,
        background: C.surfaceHigh,
        border: `1px solid ${C.borderMid}`,
        boxShadow: '0 20px 40px -8px rgba(0,0,0,0.55), 0 8px 16px -4px rgba(0,0,0,0.35)',
      }}
    >
      {/* Icon trong vòng tròn nền mờ theo accent — giống bố cục admin */}
      <div
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: variant.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        }}
      >
        <Icon size={16} color={variant.accent} strokeWidth={2.25} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <p
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: C.text,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {toast.title}
          </p>
        )}
        {toast.message && (
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: 13,
              color: C.textSub,
              margin: toast.title ? '3px 0 0' : 0,
              lineHeight: 1.55,
              wordBreak: 'break-word',
            }}
          >
            {toast.message}
          </p>
        )}
      </div>

      <button
        onClick={onDismiss}
        aria-label="Đóng thông báo"
        style={{
          flexShrink: 0,
          width: 20,
          height: 20,
          marginTop: 1,
          borderRadius: '50%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: C.textDim,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = C.textSub; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = C.textDim; }}
      >
        <X size={13} />
      </button>

      {/* Thanh tiến trình đếm ngược tự ẩn — giống admin */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          background: variant.accent,
          transformOrigin: 'left',
          animation: `toastProgress ${toast.duration ?? DEFAULT_DURATION}ms linear forwards`,
        }}
      />
    </motion.div>
  );
}