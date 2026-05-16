// src/components/movie/ui/PremiumGateModal.jsx
// Modal hiển thị khi user cố xem phim Premium mà chưa kích hoạt gói
// Usage: <PremiumGateModal open={show} onClose={() => setShow(false)} movieTitle="..." />

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Shield, Sparkles, Check } from "lucide-react";

// ── Design tokens — đồng bộ với homeTokens.js (đỏ-đen) ──────────────
const C = {
  bg:         "#000000",
  surface:    "#0d0d0d",
  surfaceAlt: "#111111",
  surfaceHigh:"#181818",
  border:     "rgba(255,255,255,0.06)",
  borderMid:  "rgba(255,255,255,0.10)",
  text:       "#f0f0f0",
  textSub:    "#888888",
  accent:     "#e5181e",
  accentSoft: "rgba(229,24,30,0.12)",
  accentGlow: "rgba(229,24,30,0.30)",
};

const PERKS = [
  { icon: <Zap      size={14} />, label: "Không quảng cáo, xem liền mạch"    },
  { icon: <Shield   size={14} />, label: "Chất lượng 4K HDR tối đa"           },
  { icon: <Sparkles size={14} />, label: "Truy cập toàn bộ kho phim Premium"  },
  { icon: <Check    size={14} />, label: "Xem đồng thời trên 4 thiết bị"      },
];

// ── UIA Logo mark (thay thế icon vương miện) ──────────────────────────
function UIAMark() {
  return (
    <div style={{
      width: 72, height: 72,
      borderRadius: "50%",
      background: "radial-gradient(135deg, #1a0000 0%, #0d0d0d 100%)",
      border: `2px solid ${C.accent}`,
      boxShadow: `0 0 0 6px rgba(229,24,30,0.10), 0 8px 28px rgba(229,24,30,0.35)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: "'Be Vietnam Pro', 'Nunito', sans-serif",
        fontSize: 20,
        fontWeight: 900,
        color: C.accent,
        letterSpacing: "0.06em",
        lineHeight: 1,
        userSelect: "none",
      }}>
        UIA
      </span>
    </div>
  );
}

export default function PremiumGateModal({ open, onClose, movieTitle, onUpgrade }) {
  const navigate = useNavigate();

  // Khoá scroll khi modal mở
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Đóng khi nhấn Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onClose?.();
      onUpgrade();
      return;
    }
    // Navigate trước, close sau để tránh component unmount trước khi navigate kịp
    navigate("/premium");
    setTimeout(() => onClose?.(), 50);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="pg-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.82)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              zIndex: 9998,
            }}
          />

          {/* ── Panel wrapper — căn giữa, tránh navbar ── */}
          <motion.div
            key="pg-panel"
            initial={{ opacity: 0, scale: 0.90, y: 28 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.94,  y: 14 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            style={{
              position: "fixed",
              /* Đẩy xuống để tránh navbar (~64px) và để lại khoảng trên */
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              /* padding top lớn hơn để không bị navbar che */
              paddingTop: 80,
              paddingBottom: 24,
              paddingLeft: 16,
              paddingRight: 16,
              zIndex: 9999,
              pointerEvents: "none",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                pointerEvents: "auto",
                width: "100%",
                maxWidth: 440,
                /* maxHeight để modal không cao hơn viewport - navbar */
                maxHeight: "calc(100vh - 104px)",
                overflowY: "auto",
                borderRadius: 20,
                background: C.surface,
                border: `1px solid rgba(229,24,30,0.20)`,
                boxShadow: `0 24px 72px rgba(0,0,0,0.75), 0 0 0 1px rgba(229,24,30,0.06) inset`,
                position: "relative",
                scrollbarWidth: "none",
              }}
            >
              {/* Red glow top */}
              <div style={{
                position: "absolute",
                top: -40, left: "50%",
                transform: "translateX(-50%)",
                width: 260, height: 100,
                background: "radial-gradient(ellipse, rgba(229,24,30,0.14) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />

              {/* ── Close ── */}
              <button
                onClick={onClose}
                style={{
                  position: "absolute", top: 14, right: 14,
                  width: 30, height: 30, borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${C.border}`,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: C.textSub,
                  transition: "background 0.15s",
                  zIndex: 2,
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(229,24,30,0.15)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              >
                <X size={14} />
              </button>

              {/* ── Header ── */}
              <div style={{
                padding: "36px 32px 24px",
                textAlign: "center",
                borderBottom: `1px solid ${C.border}`,
              }}>
                {/* UIA mark */}
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20, delay: 0.08 }}
                  style={{ display: "inline-flex", marginBottom: 18 }}
                >
                  <UIAMark />
                </motion.div>

                <h2 style={{
                  fontFamily: "'Be Vietnam Pro', 'Nunito', sans-serif",
                  fontSize: 21,
                  fontWeight: 800,
                  color: C.text,
                  marginBottom: 10,
                  letterSpacing: "-0.02em",
                }}>
                  Nội dung Premium
                </h2>

                {movieTitle && (
                  <p style={{
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: 13,
                    color: C.textSub,
                    lineHeight: 1.6,
                  }}>
                    <span style={{ color: C.accent, fontWeight: 700 }}>
                      "{movieTitle}"
                    </span>{" "}
                    là nội dung độc quyền dành riêng cho thành viên Premium.
                  </p>
                )}
              </div>

              {/* ── Perks ── */}
              <div style={{ padding: "20px 32px" }}>
                <p style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: C.accent,
                  marginBottom: 12,
                }}>
                  Quyền lợi thành viên
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {PERKS.map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + i * 0.06 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 13px",
                        borderRadius: 10,
                        background: C.surfaceAlt,
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <span style={{
                        color: C.accent,
                        flexShrink: 0,
                        opacity: 0.85,
                      }}>
                        {p.icon}
                      </span>
                      <span style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: 13,
                        color: C.text,
                        fontWeight: 500,
                      }}>
                        {p.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── CTA ── */}
              <div style={{
                padding: "4px 32px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}>
                {/* Primary — đỏ */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleUpgrade}
                  style={{
                    width: "100%",
                    padding: "13px 20px",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    background: C.accent,
                    color: "#ffffff",
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    boxShadow: `0 4px 14px rgba(229,24,30,0.28)`,
                    transition: "box-shadow 0.2s, background 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "#f02020";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(229,24,30,0.38)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = C.accent;
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(229,24,30,0.28)";
                  }}
                >
                  Kích hoạt Premium ngay
                </motion.button>

                {/* Secondary — outline */}
                <button
                  onClick={onClose}
                  style={{
                    width: "100%",
                    padding: "11px 20px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    cursor: "pointer",
                    background: "transparent",
                    color: C.textSub,
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    transition: "background 0.15s, color 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = C.surfaceAlt;
                    e.currentTarget.style.color = C.text;
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = C.textSub;
                    e.currentTarget.style.borderColor = C.border;
                  }}
                >
                  Để sau
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}