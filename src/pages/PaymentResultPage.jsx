// src/pages/PaymentResultPage.jsx
// Redesigned: Cinematic Luxury Style
// Typography mạnh mẽ, easing cong mượt mà, spring animations, layout rộng rãi

import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Crown, ArrowRight, Home, RotateCcw, Sparkles } from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY, FONT_BEBAS, GOOGLE_FONTS } from "../context/homeTokens";
import SectionReveal from "../motion-configs/SectionReveal";
import {
  TRANSITION_SLOW,
  TRANSITION_SPRING,
  EASE_OUT_EXPO,
} from "../motion-configs/transitions";

const ACCENT = C.accent ?? "#e5181e";
const SUCCESS_COLOR = "#46d369";

const PaymentResultPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const status = params.get("status");
  const orderCode = params.get("orderCode");
  const isSuccess = status === "success";

  // Inject fonts + keyframes
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      ${GOOGLE_FONTS}
      
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-12px); }
      }
      
      @keyframes pulse-glow {
        0% { box-shadow: 0 0 0 0 ${isSuccess ? "rgba(70,211,105,0.6)" : "rgba(229,24,30,0.6)"}; }
        70% { box-shadow: 0 0 0 24px transparent; }
        100% { box-shadow: 0 0 0 0 transparent; }
      }
      
      @keyframes shimmer {
        0% { opacity: 0.5; }
        50% { opacity: 1; }
        100% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, [isSuccess]);

  // Auto-redirect after 8s (success only)
  const [countdown, setCountdown] = useState(isSuccess ? 8 : null);
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          navigate("/");
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSuccess, navigate]);

  // Icon variants
  const iconVariants = {
    hidden: { scale: 0, rotate: -30, opacity: 0 },
    visible: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 12,
        delay: 0.1,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2 + i * 0.1,
        duration: 0.6,
        ease: EASE_OUT_EXPO,
      },
    }),
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.6, duration: 0.7, ease: EASE_OUT_EXPO },
    },
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
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background: isSuccess
            ? "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(70,211,105,0.12) 0%, transparent 65%)"
            : "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(229,24,30,0.12) 0%, transparent 65%)",
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
          background: `linear-gradient(90deg, transparent, ${isSuccess ? "rgba(70,211,105,0.5)" : "rgba(229,24,30,0.5)"})`,
          zIndex: 0,
        }}
      />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.8,
          delay: 0.05,
          ease: EASE_OUT_EXPO,
        }}
        style={{
          position: "relative",
          maxWidth: 520,
          width: "100%",
          background: `linear-gradient(135deg, ${C.surfaceMid ?? "#0d0d0d"} 0%, ${C.surfaceHigh ?? "#181818"} 100%)`,
          border: `1px solid ${
            isSuccess
              ? "rgba(70,211,105,0.2)"
              : "rgba(229,24,30,0.2)"
          }`,
          borderRadius: 32,
          padding: "72px 56px 60px",
          textAlign: "center",
          overflow: "hidden",
          backdropFilter: "blur(8px)",
          boxShadow: `0 20px 60px ${
            isSuccess
              ? "rgba(70,211,105,0.08)"
              : "rgba(229,24,30,0.08)"
          }`,
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
            background: `linear-gradient(90deg, transparent, ${
              isSuccess
                ? "rgba(70,211,105,0.8)"
                : "rgba(229,24,30,0.8)"
            }, transparent)`,
          }}
        />

        {/* Icon with pulse */}
        <motion.div
          variants={iconVariants}
          initial="hidden"
          animate="visible"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            borderRadius: "50%",
            marginBottom: 36,
            background: isSuccess
              ? "linear-gradient(135deg, rgba(70,211,105,0.15) 0%, rgba(70,211,105,0.05) 100%)"
              : "linear-gradient(135deg, rgba(229,24,30,0.15) 0%, rgba(229,24,30,0.05) 100%)",
            border: `2px solid ${
              isSuccess
                ? "rgba(70,211,105,0.35)"
                : "rgba(229,24,30,0.35)"
            }`,
            animation: "pulse-glow 2.8s ease-out infinite",
          }}
        >
          {isSuccess ? (
            <CheckCircle size={50} color={SUCCESS_COLOR} strokeWidth={1.5} />
          ) : (
            <XCircle size={50} color={ACCENT} strokeWidth={1.5} />
          )}
        </motion.div>

        {/* Heading */}
        <motion.h1
          custom={0}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(32px, 6vw, 44px)",
            fontWeight: 900,
            margin: "0 0 16px",
            color: "#fff",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          {isSuccess ? "Thanh Toán Thành Công" : "Thanh Toán Thất Bại"}
        </motion.h1>

        {/* Subheading with accent */}
        <motion.div
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
            color: isSuccess ? SUCCESS_COLOR : ACCENT,
          }}
        >
          {isSuccess && <Sparkles size={16} />}
          <span>{isSuccess ? "PREMIUM ACTIVATED" : "TRY AGAIN"}</span>
          {isSuccess && <Sparkles size={16} />}
        </motion.div>

        {/* Description */}
        <motion.p
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
          {isSuccess
            ? "Tài khoản Premium của bạn đã được kích hoạt. Tận hưởng kho phim không giới hạn, chất lượng 4K, và xem không quảng cáo."
            : "Giao dịch không thành công. Vui lòng kiểm tra thông tin thanh toán hoặc chọn phương thức khác."}
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
              border: `1px solid rgba(255,255,255,0.08)`,
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
            <span
              style={{
                color: isSuccess ? SUCCESS_COLOR : ACCENT,
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              {orderCode}
            </span>
          </motion.div>
        )}

        {/* Countdown */}
        {isSuccess && countdown !== null && (
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
            <span style={{ color: SUCCESS_COLOR, fontWeight: 700 }}>
              {countdown}s
            </span>
          </motion.p>
        )}

        {/* CTA Buttons */}
        <motion.div
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {isSuccess ? (
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => navigate("/")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "16px 36px",
                background: `linear-gradient(135deg, ${SUCCESS_COLOR} 0%, #2da84e 100%)`,
                border: "none",
                borderRadius: 16,
                color: "#000",
                fontFamily: FONT_DISPLAY,
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: `0 12px 32px rgba(70,211,105,0.3)`,
                letterSpacing: "0.02em",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Crown size={18} />
              Xem Phim Ngay
              <ArrowRight size={18} />
            </motion.button>
          ) : (
            <>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => navigate("/premium")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  padding: "16px 36px",
                  background: `linear-gradient(135deg, ${ACCENT} 0%, #b0000a 100%)`,
                  border: "none",
                  borderRadius: 16,
                  color: "#fff",
                  fontFamily: FONT_DISPLAY,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: `0 12px 32px rgba(229,24,30,0.3)`,
                  letterSpacing: "0.02em",
                }}
              >
                <RotateCcw size={17} />
                Thử Lại
              </motion.button>

              <motion.button
                variants={buttonVariants}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/")}
                style={{
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
                }}
              >
                <Home size={17} />
                Về Trang Chủ
              </motion.button>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PaymentResultPage;