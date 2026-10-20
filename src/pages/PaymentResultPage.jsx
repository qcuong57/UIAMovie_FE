// src/pages/PaymentResultPage.jsx
// QUAN TRỌNG: `status` trên URL chỉ là gợi ý để hiển thị — ai cũng gõ tay được.
//   VNPay: success | failed          SePay: pending_confirm | cancelled | failed
// Kết quả thật được XÁC MINH bằng cách tra đơn theo `orderCode` trong lịch sử thanh toán của user
// đang đăng nhập (do BE ghi sau khi xác thực callback của cổng: chữ ký VNPay / X-Secret-Key SePay).
// Chỉ khi đơn có status "success" trang mới báo thành công.
// Với SePay, trình duyệt thường được redirect về TRƯỚC khi IPN tới BE nên cần thăm dò lâu hơn.

import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Crown,
  ArrowRight,
  Home,
  RotateCcw,
  Loader2,
  Clock,
  Info,
  Mail,
} from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY, GOOGLE_FONTS } from "../context/homeTokens";
import authService from "../services/authService";
import paymentService from "../services/paymentService";

const ACCENT = C.accent ?? "#e5181e";
const GOLD = C.gold ?? "#f5c518";
const GREEN = C.green ?? "#46d369";

// phase: verifying | success | failed | cancelled | pending | unverified
const VIEWS = {
  verifying: {
    color: GOLD, Icon: Loader2, spin: true, onColor: "#000",
    title: "Đang xác nhận thanh toán",
    desc: "Chúng tôi đang chờ cổng thanh toán xác nhận giao dịch. Bạn đừng đóng trang này nhé.",
  },
  success: {
    color: GREEN, Icon: CheckCircle, onColor: "#000",
    title: "Thanh toán thành công",
    desc: "Premium đã được kích hoạt cho tài khoản của bạn. Bạn có thể xem phim Full HD / 4K và không còn quảng cáo.",
  },
  failed: {
    color: ACCENT, Icon: XCircle, onColor: "#fff",
    title: "Thanh toán chưa thành công",
    desc: "Giao dịch không hoàn tất. Hãy kiểm tra lại thông tin thanh toán hoặc thử một phương thức khác.",
  },
  cancelled: {
    color: GOLD, Icon: XCircle, onColor: "#000",
    title: "Bạn đã hủy thanh toán",
    desc: "Bạn chưa bị trừ tiền. Khi nào sẵn sàng, bạn có thể chọn lại gói và thanh toán.",
  },
  pending: {
    color: GOLD, Icon: Clock, onColor: "#000",
    title: "Giao dịch đang được xử lý",
    desc: "Cổng thanh toán chưa gửi xác nhận cuối cùng. Nếu tiền đã bị trừ, Premium sẽ tự kích hoạt khi giao dịch hoàn tất. Bạn thử kiểm tra lại sau vài phút.",
  },
  unverified: {
    color: GOLD, Icon: Info, onColor: "#000",
    title: "Đăng nhập để xem kết quả",
    desc: "Chúng tôi cần biết bạn là ai để tra cứu giao dịch này.",
  },
};

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS_WHEN_URL_SUCCESS = 10;

// Thời gian ở lại trang thành công trước khi tự về trang chủ (đủ để đọc thông báo email).
const AUTO_REDIRECT_SECONDS = 12;

// Giá trị `status` trên URL cho biết cổng báo "có vẻ thành công" (chưa xác minh).
const isUrlSuccessHint = (status) => status === "success" || status === "pending_confirm";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PaymentResultPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const urlStatus = params.get("status"); // chỉ là gợi ý, KHÔNG dùng làm kết quả
  const orderCode = params.get("orderCode");

  const [attempt, setAttempt] = useState(0); // tăng lên để chạy lại việc xác minh
  const [phase, setPhase] = useState(() => {
    if (!orderCode) return "failed";
    return authService.isLoggedIn() ? "verifying" : "unverified";
  });
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);

  const view = VIEWS[phase];
  const ViewIcon = view.Icon;
  const isSuccess = phase === "success";

  const reduceMotion = useReducedMotion();

  // Fonts + keyframes
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      ${GOOGLE_FONTS}
      @keyframes uia-spin { to { transform: rotate(360deg); } }
      .pay-btn { transition: background-color .15s, border-color .15s; }
      .pay-btn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
      .pay-btn--ghost:hover { background: rgba(255,255,255,0.08); }
      .pay-btn--primary:hover { filter: brightness(1.08); }
      @media (prefers-reduced-motion: reduce) { .pay-spin { animation: none !important; } }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Xác minh kết quả thật với BE.
  useEffect(() => {
    if (!orderCode || !authService.isLoggedIn()) return;

    let cancelled = false;
    setPhase("verifying");

    // URL báo thất bại/hủy: chỉ tra một lần (phòng trường hợp IPN đã xác nhận thành công).
    const maxPolls = isUrlSuccessHint(urlStatus) ? MAX_POLLS_WHEN_URL_SUCCESS : 1;

    (async () => {
      for (let i = 0; i < maxPolls; i++) {
        try {
          const order = await paymentService.getOrderByCode(orderCode);
          if (cancelled) return;

          if (order?.status === "success") {
            setPhase("success");
            return;
          }
          if (order?.status === "failed" || order?.status === "expired") {
            setPhase("failed");
            return;
          }
          // "pending" hoặc chưa thấy đơn: đợi rồi tra lại.
        } catch {
          if (cancelled) return;
          // Lỗi mạng tạm thời: coi như một lần thử hỏng và thử lại.
        }

        if (i < maxPolls - 1) {
          await sleep(POLL_INTERVAL_MS);
          if (cancelled) return;
        }
      }

      if (!cancelled) {
        if (isUrlSuccessHint(urlStatus)) setPhase("pending");
        else if (urlStatus === "cancelled") setPhase("cancelled");
        else setPhase("failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderCode, urlStatus, attempt]);

  // Đã xác minh thành công → đồng bộ cờ Premium trong hồ sơ đã lưu (Navbar, các trang khác).
  useEffect(() => {
    if (isSuccess) authService.refreshPremiumStatus();
  }, [isSuccess]);

  // Tự về trang chủ sau AUTO_REDIRECT_SECONDS giây (chỉ khi đã xác minh thành công).
  // Đếm ngược và điều hướng tách riêng: không gọi navigate() trong hàm cập nhật state
  // (React StrictMode chạy hàm đó 2 lần).
  useEffect(() => {
    if (!isSuccess) return;
    setCountdown(AUTO_REDIRECT_SECONDS);
    const timer = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [isSuccess]);

  useEffect(() => {
    if (isSuccess && countdown === 0) navigate("/", { replace: true });
  }, [isSuccess, countdown, navigate]);

  // ── Nút hành động theo từng phase ──────────────────────────────────────────
  const goHome = { label: "Về trang chủ", icon: Home, onClick: () => navigate("/") };
  const actions = {
    verifying: [],
    success: [
      { label: "Xem phim ngay", icon: Crown, trailing: ArrowRight, primary: true, onClick: () => navigate("/") },
    ],
    failed: [
      { label: "Thử lại", icon: RotateCcw, primary: true, onClick: () => navigate("/premium") },
      goHome,
    ],
    cancelled: [
      { label: "Chọn lại gói", icon: RotateCcw, primary: true, onClick: () => navigate("/premium") },
      goHome,
    ],
    pending: [
      { label: "Kiểm tra lại", icon: RotateCcw, primary: true, onClick: () => setAttempt((a) => a + 1) },
      goHome,
    ],
    unverified: [
      { label: "Đăng nhập", icon: ArrowRight, primary: true, onClick: () => navigate("/welcome") },
      goHome,
    ],
  }[phase];

  const fade = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

  const btnBase = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    width: "100%", padding: "13px 20px", borderRadius: 10,
    fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_BODY,
        color: C.text,
        padding: "40px 20px",
      }}
    >
      <motion.main
        {...fade}
        aria-live="polite"
        style={{
          width: "100%",
          maxWidth: 440,
          background: C.surfaceMid,
          border: `1px solid ${C.borderMid}`,
          borderRadius: 16,
          padding: "40px 32px 32px",
          textAlign: "center",
        }}
      >
        <div
          key={phase}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 64, height: 64, borderRadius: "50%", marginBottom: 20,
            background: view.color,
          }}
        >
          <ViewIcon
            size={32}
            color={view.onColor}
            strokeWidth={2}
            className={view.spin ? "pay-spin" : undefined}
            style={view.spin ? { animation: "uia-spin 1.1s linear infinite" } : undefined}
          />
        </div>

        <h1
          style={{
            fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 800,
            lineHeight: 1.3, margin: "0 0 10px", color: C.text,
          }}
        >
          {view.title}
        </h1>

        <p style={{ fontSize: 15, lineHeight: 1.65, color: C.textSub, margin: "0 auto 24px", maxWidth: 360 }}>
          {view.desc}
        </p>

        {orderCode && (
          <div
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
              background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: "12px 16px", marginBottom: 16, fontSize: 14, textAlign: "left",
            }}
          >
            <span style={{ color: C.textSub }}>Mã đơn hàng</span>
            <span style={{ fontFamily: "Consolas, Menlo, monospace", color: C.text, wordBreak: "break-all", textAlign: "right" }}>
              {orderCode}
            </span>
          </div>
        )}

        {isSuccess && (
          <>
            <div
              role="status"
              style={{
                display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left",
                background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 10,
                padding: "12px 16px", marginBottom: 16, fontSize: 13.5, lineHeight: 1.55, color: C.textSub,
              }}
            >
              <Mail size={18} color={GREEN} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                Biên nhận sẽ được gửi tới email tài khoản của bạn. Nếu sau vài phút chưa thấy, hãy xem
                trong thư mục <strong style={{ color: C.text }}>Spam</strong>.
              </span>
            </div>
            <p style={{ fontSize: 13, color: C.textSub, margin: "0 0 20px" }}>
              Tự động về trang chủ sau {countdown} giây
            </p>
          </>
        )}

        {actions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: isSuccess ? 0 : 8 }}>
            {actions.map(({ label, icon: Icon, trailing: Trailing, primary, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className={`pay-btn ${primary ? "pay-btn--primary" : "pay-btn--ghost"}`}
                style={
                  primary
                    ? { ...btnBase, background: view.color, color: view.onColor, border: "none" }
                    : { ...btnBase, background: "transparent", color: C.text, border: `1px solid ${C.borderBright}`, fontWeight: 600 }
                }
              >
                <Icon size={17} />
                {label}
                {Trailing && <Trailing size={17} />}
              </button>
            ))}
          </div>
        )}
      </motion.main>
    </div>
  );
};

export default PaymentResultPage;