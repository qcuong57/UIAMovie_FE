// src/components/movie/ui/PremiumGateModal.jsx
// Modal hiển thị khi user cố xem phim Premium mà chưa kích hoạt gói
// Thiết kế v4: đồng bộ tinh thần "mềm, tròn, fluid" của PremiumPage —
// bo góc lớn, chuyển động spring, các khối pill-shaped. Sang trọng đến
// từ chất liệu (radial vignette rất nhẹ mô phỏng ánh sáng ấm, viền kép
// mảnh) chứ không phải glow rực hay gradient sặc sỡ kiểu AI. Điểm nhấn
// vàng đồng (gold) thay vì đỏ thuần cho cảm giác "premium" ấm áp hơn,
// đỏ thương hiệu chỉ còn ở nút CTA chính.
// Usage: <PremiumGateModal open={show} onClose={() => setShow(false)} movieTitle="..." />

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkle } from "lucide-react";
import { C, FONT_DISPLAY, FONT_BODY } from "../../../context/homeTokens";

const PERKS = [
  "Không quảng cáo",
  "Chất lượng 4K",
  "Toàn bộ kho phim Premium",
  "Xem trên 4 thiết bị cùng lúc",
];

// spring dùng chung — nhịp mềm, không nảy quá đà
const softSpring = { type: "spring", stiffness: 340, damping: 32, mass: 0.9 };

export default function PremiumGateModal({ open, onClose, movieTitle, onUpgrade }) {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

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
              background: "rgba(6,5,4,0.82)",
              zIndex: 9998,
            }}
          />

          {/* ── Panel wrapper ── */}
          <motion.div
            key="pg-panel"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={softSpring}
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              zIndex: 9999,
              pointerEvents: "none",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                pointerEvents: "auto",
                width: "100%",
                maxWidth: 420,
                maxHeight: "calc(100vh - 40px)",
                overflowY: "auto",
                borderRadius: 28,
                background: C.surfaceMid,
                border: `1px solid ${C.border}`,
                boxShadow: "0 40px 90px rgba(0,0,0,0.5), 0 12px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                position: "relative",
                scrollbarWidth: "none",
              }}
            >
              {/* ── Header — vignette ấm rất nhẹ, không phải glow ── */}
              <div style={{
                position: "relative",
                padding: "44px 34px 28px",
                overflow: "hidden",
                borderBottom: `1px solid ${C.border}`,
              }}>
                {/* vignette ánh sáng ấm, tâm lệch trên-trái, rất mờ */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(120% 100% at 18% -10%, rgba(245,197,24,0.10) 0%, rgba(245,197,24,0) 55%)",
                  pointerEvents: "none",
                }} />

                <button
                  onClick={onClose}
                  aria-label="Đóng"
                  style={{
                    position: "absolute", top: 18, right: 18,
                    width: 32, height: 32, borderRadius: "50%",
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${C.border}`,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: C.textSub,
                    transition: "background 0.18s, color 0.18s, transform 0.18s",
                    zIndex: 2,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.10)";
                    e.currentTarget.style.color = C.text;
                    e.currentTarget.style.transform = "scale(1.06)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = C.textSub;
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <X size={15} />
                </button>

                {/* badge pill nhỏ thay cho thanh đỏ vuông — mềm hơn, sang hơn */}
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px 5px 9px",
                  borderRadius: 999,
                  background: "rgba(245,197,24,0.10)",
                  border: "1px solid rgba(245,197,24,0.22)",
                  marginBottom: 18,
                }}>
                  <Sparkle size={11} color={C.gold} strokeWidth={2.5} />
                  <span style={{
                    fontFamily: FONT_BODY,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    color: C.gold,
                  }}>
                    PREMIUM
                  </span>
                </div>

                <h2 style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 22,
                  fontWeight: 800,
                  color: C.text,
                  lineHeight: 1.34,
                  letterSpacing: "-0.01em",
                  marginBottom: movieTitle ? 10 : 0,
                  position: "relative",
                }}>
                  {movieTitle
                    ? <>Nội dung này dành riêng cho thành viên Premium</>
                    : <>Nâng cấp để xem không giới hạn</>}
                </h2>

                {movieTitle && (
                  <p style={{
                    fontFamily: FONT_BODY,
                    fontSize: 13.5,
                    color: C.textSub,
                    lineHeight: 1.6,
                    position: "relative",
                  }}>
                    <span style={{ color: C.text, fontWeight: 600 }}>"{movieTitle}"</span> là nội dung độc quyền Premium.
                  </p>
                )}
              </div>

              {/* ── Perks — dạng pill mềm, xếp dọc ── */}
              <div style={{ padding: "22px 26px 6px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {PERKS.map((label, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...softSpring, delay: 0.05 + i * 0.045 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "11px 14px",
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.025)",
                      }}
                    >
                      <span style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "rgba(245,197,24,0.14)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                          <path d="M1 4.5L4 7.5L10 1" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span style={{
                        fontFamily: FONT_BODY,
                        fontSize: 13.5,
                        color: C.text,
                        fontWeight: 500,
                      }}>
                        {label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── CTA — nút pill đầy, elevation mềm ── */}
              <div style={{
                padding: "22px 26px 30px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}>
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.97 }}
                  transition={softSpring}
                  onClick={handleUpgrade}
                  style={{
                    width: "100%",
                    padding: "15px 20px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    background: C.accent,
                    color: "#ffffff",
                    fontFamily: FONT_BODY,
                    fontSize: 14.5,
                    fontWeight: 700,
                    boxShadow: "0 10px 24px rgba(229,24,30,0.28)",
                  }}
                >
                  Kích hoạt Premium
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={softSpring}
                  onClick={onClose}
                  style={{
                    width: "100%",
                    padding: "12px 20px",
                    borderRadius: 999,
                    border: `1px solid transparent`,
                    cursor: "pointer",
                    background: "transparent",
                    color: C.textSub,
                    fontFamily: FONT_BODY,
                    fontSize: 13,
                    fontWeight: 600,
                    transition: "color 0.18s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.textSub; }}
                >
                  Để sau
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}