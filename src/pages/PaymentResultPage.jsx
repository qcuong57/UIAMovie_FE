// src/pages/PaymentResultPage.jsx
// Cinematic Luxury Style.
//
// QUAN TRỌNG: `status` trên URL chỉ là gợi ý để hiển thị — ai cũng gõ tay được.
//   VNPay: success | failed          SePay: pending_confirm | cancelled | failed
// Kết quả thật được XÁC MINH bằng cách tra đơn theo `orderCode` trong lịch sử thanh toán của user
// đang đăng nhập (do BE ghi sau khi xác thực callback của cổng: chữ ký VNPay / X-Secret-Key SePay).
// Chỉ khi đơn có status "success" trang mới báo thành công.
// Với SePay, trình duyệt thường được redirect về TRƯỚC khi IPN tới BE nên cần thăm dò lâu hơn.

import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Crown,
  ArrowRight,
  Home,
  RotateCcw,
  Sparkles,
  Loader2,
  Clock,
  Info,
} from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY, GOOGLE_FONTS } from "../context/homeTokens";
import { EASE_OUT_EXPO } from "../motion-configs/transitions";
import authService from "../services/authService";
import paymentService from "../services/paymentService";

const ACCENT = C.accent ?? "#e5181e";
const SUCCESS_COLOR = "#46d369";
const AMBER = "#facc15";

// IPN của cổng thanh toán và redirect của trình duyệt tới gần như cùng lúc (SePay có thể đến sau);
// đơn vẫn "pending" thêm vài giây. Thăm dò tối đa ~20s trước khi báo "đang xử lý".
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS_WHEN_URL_SUCCESS = 10;

// Giá trị `status` trên URL cho biết cổng báo "có vẻ thành công" (chưa xác minh).
const isUrlSuccessHint = (status) => status === "success" || status === "pending_confirm";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// phase: verifying | success | failed | cancelled | pending | unverified
const VIEWS = {
  verifying: {
    color: AMBER, dark: "#d99a06", rgb: "250,204,21", Icon: Loader2, spin: true,
    title: "Đang Xác Nhận Thanh Toán", tag: "ĐANG XỬ LÝ",
    desc: "Vui lòng đợi trong giây lát, chúng tôi đang xác nhận giao dịch với cổng thanh toán.",
  },
  success: {
    color: SUCCESS_COLOR, dark: "#2da84e", rgb: "70,211,105", Icon: CheckCircle,
    title: "Thanh Toán Thành Công", tag: "PREMIUM ACTIVATED",
    desc: "Tài khoản Premium của bạn đã được kích hoạt. Tận hưởng kho phim không giới hạn, chất lượng Full HD / 4K, và xem không quảng cáo.",
  },
  failed: {
    color: ACCENT, dark: "#b0000a", rgb: "229,24,30", Icon: XCircle,
    title: "Thanh Toán Thất Bại", tag: "TRY AGAIN",
    desc: "Giao dịch không thành công. Vui lòng kiểm tra thông tin thanh toán hoặc chọn phương thức khác.",
  },
  cancelled: {
    color: AMBER, dark: "#d99a06", rgb: "250,204,21", Icon: XCircle,
    title: "Bạn Đã Hủy Thanh Toán", tag: "CHƯA THANH TOÁN",
    desc: "Giao dịch chưa được thực hiện và bạn chưa bị trừ tiền. Bạn có thể chọn lại gói và thanh toán bất cứ lúc nào.",
  },
  pending: {
    color: AMBER, dark: "#d99a06", rgb: "250,204,21", Icon: Clock,
    title: "Giao Dịch Đang Được Xử Lý", tag: "CHỜ XÁC NHẬN",
    desc: "Chúng tôi chưa nhận được xác nhận cuối cùng từ cổng thanh toán. Nếu bạn đã bị trừ tiền, gói Premium sẽ tự kích hoạt khi giao dịch hoàn tất — hãy kiểm tra lại sau ít phút.",
  },
  unverified: {
    color: AMBER, dark: "#d99a06", rgb: "250,204,21", Icon: Info,
    title: "Chưa Thể Xác Nhận", tag: "CẦN ĐĂNG NHẬP",
    desc: "Hãy đăng nhập để xem kết quả giao dịch của bạn.",
  },
};

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
  const [countdown, setCountdown] = useState(8);

  const view = VIEWS[phase];
  const ViewIcon = view.Icon;
  const isSuccess = phase === "success";

  // Fonts + keyframes (màu quầng sáng lấy từ biến CSS --glow nên không phải tiêm lại khi đổi phase)
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      ${GOOGLE_FONTS}
      @keyframes pulse-glow {
        0% { box-shadow: 0 0 0 0 var(--glow); }
        70% { box-shadow: 0 0 0 24px transparent; }
        100% { box-shadow: 0 0 0 0 transparent; }
      }
      @keyframes uia-spin { to { transform: rotate(360deg); } }
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

  // Tự về trang chủ sau 8s (chỉ khi đã xác minh thành công).
  // Đếm ngược và điều hướng tách riêng: không gọi navigate() trong hàm cập nhật state
  // (React StrictMode chạy hàm đó 2 lần).
  useEffect(() => {
    if (!isSuccess) return;
    setCountdown(8);
    const timer = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [isSuccess]);

  useEffect(() => {
    if (isSuccess && countdown === 0) navigate("/", { replace: true });
  }, [isSuccess, countdown, navigate]);

  // ── Nút hành động theo từng phase ──────────────────────────────────────────
  const goHome = { label: "Về Trang Chủ", icon: Home, onClick: () => navigate("/") };
  const actions = {
    verifying: [],
    success: [
      { label: "Xem Phim Ngay", icon: Crown, trailing: ArrowRight, primary: true, onClick: () => navigate("/") },
    ],
    failed: [
      { label: "Thử Lại", icon: RotateCcw, primary: true, onClick: () => navigate("/premium") },
      goHome,
    ],
    cancelled: [
      { label: "Chọn Lại Gói", icon: RotateCcw, primary: true, onClick: () => navigate("/premium") },
      goHome,
    ],
    pending: [
      { label: "Kiểm Tra Lại", icon: RotateCcw, primary: true, onClick: () => setAttempt((a) => a + 1) },
      goHome,
    ],
    unverified: [
      { label: "Đăng Nhập", icon: ArrowRight, primary: true, onClick: () => navigate("/welcome") },
      goHome,
    ],
  }[phase];

  const primaryTextColor = phase === "failed" ? "#fff" : "#000";

  const iconVariants = {
    hidden: { scale: 0, rotate: -30, opacity: 0 },
    visible: {
      scale: 1, rotate: 0, opacity: 1,
      transition: { type: "spring", stiffness: 150, damping: 12, delay: 0.1 },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1, y: 0,
      transition: { delay: 0.2 + i * 0.1, duration: 0.6, ease: EASE_OUT_EXPO },
    }),
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.7, ease: EASE_OUT_EXPO } },
    hover: { scale: 1.04, transition: { duration: 0.3 } },
    tap: { scale: 0.97, transition: { duration: 0.15 } },
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg ?? "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_BODY,
        color: "#fff",
        padding: "40px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Cinematic background glow */}
      <motion.div
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse 80% 50% at 50% 40%, rgba(${view.rgb},0.12) 0%, transparent 65%)`,
        }}
      />

      {/* Accent line top-right */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "40%",
          height: "2px",
          background: `linear-gradient(90deg, transparent, rgba(${view.rgb},0.5))`,
          zIndex: 0,
        }}
      />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.05, ease: EASE_OUT_EXPO }}
        style={{
          position: "relative",
          maxWidth: 520,
          width: "100%",
          background: `linear-gradient(135deg, ${C.surfaceMid ?? "#0d0d0d"} 0%, ${C.surfaceHigh ?? "#181818"} 100%)`,
          border: `1px solid rgba(${view.rgb},0.2)`,
          borderRadius: 32,
          padding: "72px 56px 60px",
          textAlign: "center",
          overflow: "hidden",
          backdropFilter: "blur(8px)",
          boxShadow: `0 20px 60px rgba(${view.rgb},0.08)`,
          zIndex: 10,
        }}
      >
        {/* Top decorative line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: "1px",
            background: `linear-gradient(90deg, transparent, rgba(${view.rgb},0.8), transparent)`,
          }}
        />

        {/* Icon with pulse */}
        <motion.div
          key={phase}
          variants={iconVariants}
          initial="hidden"
          animate="visible"
          style={{
            "--glow": `rgba(${view.rgb},0.6)`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            borderRadius: "50%",
            marginBottom: 36,
            background: `linear-gradient(135deg, rgba(${view.rgb},0.15) 0%, rgba(${view.rgb},0.05) 100%)`,
            border: `2px solid rgba(${view.rgb},0.35)`,
            animation: "pulse-glow 2.8s ease-out infinite",
          }}
        >
          <ViewIcon
            size={50}
            color={view.color}
            strokeWidth={1.5}
            style={view.spin ? { animation: "uia-spin 1.1s linear infinite" } : undefined}
          />
        </motion.div>

        {/* Heading */}
        <motion.h1
          key={`h-${phase}`}
          custom={0}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(28px, 6vw, 40px)",
            fontWeight: 900,
            margin: "0 0 16px",
            color: "#fff",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          {view.title}
        </motion.h1>

        {/* Subheading with accent */}
        <motion.div
          key={`t-${phase}`}
          custom={1}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 32,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.05em",
            color: view.color,
          }}
        >
          {isSuccess && <Sparkles size={16} />}
          <span>{view.tag}</span>
          {isSuccess && <Sparkles size={16} />}
        </motion.div>

        {/* Description */}
        <motion.p
          key={`d-${phase}`}
          custom={2}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          style={{
            fontSize: "clamp(14px, 2.5vw, 16px)",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.8,
            margin: "0 0 36px",
            fontWeight: 500,
          }}
        >
          {view.desc}
        </motion.p>

        {/* Order code badge */}
        {orderCode && (
          <motion.div
            custom={3}
            variants={textVariants}
            initial="hidden"
            animate="visible"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "12px 20px",
              marginBottom: 40,
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
              fontFamily: "monospace",
              letterSpacing: "0.08em",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.2)" }}>GIAO DỊCH</span>
            <span style={{ color: view.color, fontWeight: 700, letterSpacing: "0.02em" }}>
              {orderCode}
            </span>
          </motion.div>
        )}

        {/* Countdown (chỉ khi đã xác minh thành công) */}
        {isSuccess && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.35)",
              marginBottom: 36,
              fontWeight: 500,
            }}
          >
            Về trang chủ trong{" "}
            <span style={{ color: SUCCESS_COLOR, fontWeight: 700 }}>{countdown}s</span>
          </motion.p>
        )}

        {/* CTA Buttons */}
        {actions.length > 0 && (
          <motion.div
            key={`a-${phase}`}
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {actions.map(({ label, icon: Icon, trailing: Trailing, primary, onClick }) => (
              <motion.button
                key={label}
                variants={buttonVariants}
                whileHover={primary ? "hover" : { scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                whileTap={primary ? "tap" : { scale: 0.98 }}
                onClick={onClick}
                style={
                  primary
                    ? {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        padding: "16px 36px",
                        background: `linear-gradient(135deg, ${view.color} 0%, ${view.dark} 100%)`,
                        border: "none",
                        borderRadius: 16,
                        color: primaryTextColor,
                        fontFamily: FONT_DISPLAY,
                        fontSize: 15,
                        fontWeight: 800,
                        cursor: "pointer",
                        boxShadow: `0 12px 32px rgba(${view.rgb},0.3)`,
                        letterSpacing: "0.02em",
                      }
                    : {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        padding: "15px 36px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 16,
                        color: "rgba(255,255,255,0.5)",
                        fontFamily: FONT_BODY,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.3s ease-out",
                      }
                }
              >
                <Icon size={primary ? 18 : 17} />
                {label}
                {Trailing && <Trailing size={18} />}
              </motion.button>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentResultPage;