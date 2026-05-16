// src/pages/PaymentResultPage.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Crown, ArrowRight, Home, RotateCcw } from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY, FONT_BEBAS, GOOGLE_FONTS } from "../context/homeTokens";

const ACCENT = C.accent ?? "#e5181e";

const PaymentResultPage = () => {
  const [params] = useSearchParams();
  const navigate  = useNavigate();

  const status    = params.get("status");    // "success" | "failed"
  const orderCode = params.get("orderCode"); // VD: "ORD-20260507-8CD2"

  const isSuccess = status === "success";

  // Inject fonts
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      ${GOOGLE_FONTS}
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-10px); }
      }
      @keyframes pulse-ring {
        0%   { box-shadow: 0 0 0 0 ${isSuccess ? "rgba(70,211,105,0.5)" : "rgba(229,24,30,0.5)"}; }
        70%  { box-shadow: 0 0 0 18px transparent; }
        100% { box-shadow: 0 0 0 0 transparent; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, [isSuccess]);

  // Auto-redirect về home sau 8 giây nếu thành công
  const [countdown, setCountdown] = useState(isSuccess ? 8 : null);
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); navigate("/"); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSuccess, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg ?? "#0d0d0d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_BODY,
        color: "#fff",
        padding: "24px",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "fixed", inset: 0, pointerEvents: "none",
          background: isSuccess
            ? "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(70,211,105,0.08) 0%, transparent 70%)"
            : "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(229,24,30,0.08) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          position: "relative",
          maxWidth: 480,
          width: "100%",
          background: C.surfaceMid ?? "#1a1a1a",
          border: `1px solid ${isSuccess ? "rgba(70,211,105,0.25)" : "rgba(229,24,30,0.25)"}`,
          borderRadius: 28,
          padding: "56px 44px 48px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: "absolute", top: 0, left: "10%", right: "10%", height: 2,
            background: isSuccess
              ? "linear-gradient(90deg, transparent, rgba(70,211,105,0.7), transparent)"
              : "linear-gradient(90deg, transparent, rgba(229,24,30,0.7), transparent)",
          }}
        />

        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 14 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 88,
            height: 88,
            borderRadius: "50%",
            marginBottom: 28,
            background: isSuccess ? "rgba(70,211,105,0.1)" : "rgba(229,24,30,0.1)",
            border: `2px solid ${isSuccess ? "rgba(70,211,105,0.4)" : "rgba(229,24,30,0.4)"}`,
            animation: "pulse-ring 2.5s ease-out infinite",
          }}
        >
          {isSuccess
            ? <CheckCircle size={44} color="#46d369" strokeWidth={1.8} />
            : <XCircle    size={44} color={ACCENT}   strokeWidth={1.8} />}
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(26px, 5vw, 34px)",
            fontWeight: 900,
            margin: "0 0 12px",
            color: "#fff",
          }}
        >
          {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
        </motion.h1>

        {/* Sub-text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.7,
            margin: "0 0 28px",
          }}
        >
          {isSuccess
            ? "Tài khoản của bạn đã được nâng cấp lên Premium. Hãy tận hưởng kho phim không giới hạn!"
            : "Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác."}
        </motion.p>

        {/* Order code */}
        {orderCode && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "8px 18px",
              marginBottom: 36,
              fontSize: 13,
              color: "rgba(255,255,255,0.45)",
              fontFamily: "monospace",
              letterSpacing: "0.05em",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.25)" }}>Mã giao dịch:</span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>{orderCode}</span>
          </motion.div>
        )}

        {/* Countdown (success only) */}
        {isSuccess && countdown !== null && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 28 }}
          >
            Tự động về trang chủ sau{" "}
            <span style={{ color: "#46d369", fontWeight: 700 }}>{countdown}s</span>
          </motion.p>
        )}

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {isSuccess ? (
            <button
              onClick={() => navigate("/")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "15px 32px",
                background: "linear-gradient(135deg, #46d369 0%, #2da84e 100%)",
                border: "none", borderRadius: 14, color: "#fff",
                fontFamily: FONT_BODY, fontSize: 15, fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 8px 28px rgba(70,211,105,0.35)",
                letterSpacing: "0.02em",
              }}
            >
              <Crown size={17} />
              Bắt đầu xem phim ngay
              <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/premium")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  padding: "15px 32px",
                  background: `linear-gradient(135deg, ${ACCENT} 0%, #b0000a 100%)`,
                  border: "none", borderRadius: 14, color: "#fff",
                  fontFamily: FONT_BODY, fontSize: 15, fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 8px 28px rgba(229,24,30,0.35)",
                  letterSpacing: "0.02em",
                }}
              >
                <RotateCcw size={16} />
                Thử lại
              </button>

              <button
                onClick={() => navigate("/")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  padding: "14px 32px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14, color: "rgba(255,255,255,0.6)",
                  fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Home size={16} />
                Về trang chủ
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PaymentResultPage;