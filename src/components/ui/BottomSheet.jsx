// src/components/ui/BottomSheet.jsx
// Mobile: bottom sheet bám đáy vùng nhìn thấy. Desktop: panel thả xuống dưới navbar.
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

const SPRING = { type: "spring", damping: 30, stiffness: 320 };

const BottomSheet = ({ isOpen, onClose, header, footer, children, maxWidth = 960 }) => {
  const isMobile = useIsMobile();
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const panelMotion = isMobile
    ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } }
    : {
        initial: { opacity: 0, y: -16, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -16, scale: 0.98 },
      };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="sheet-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
          style={{
            // inset:0 bám visual viewport thật của Safari/Chrome mobile.
            // KHÔNG dùng 100vh: nó tính cả vùng nằm sau thanh địa chỉ/toolbar.
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            justifyContent: "center",
            alignItems: isMobile ? "flex-end" : "flex-start",
            padding: isMobile ? 0 : "74px 16px 20px",
            background: "rgba(0,0,0,0.78)",
            backdropFilter: "blur(6px)",
          }}
        >
          <motion.div
            {...panelMotion}
            transition={SPRING}
            role="dialog"
            aria-modal="true"
            style={{
              width: "100%",
              maxWidth: isMobile ? "100%" : maxWidth,
              maxHeight: isMobile ? "88dvh" : "85%",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              background: "#121212",
              border: "1px solid rgba(255,255,255,0.12)",
              borderBottom: isMobile ? "none" : undefined,
              borderRadius: isMobile ? "20px 20px 0 0" : 16,
              boxShadow: "0 -8px 40px rgba(0,0,0,0.85)",
              overflow: "hidden",
            }}
          >
            {isMobile && (
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 2px" }}>
                <span style={{ width: 38, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.25)" }} />
              </div>
            )}

            {header && (
              <div style={{ flexShrink: 0, padding: isMobile ? "8px 16px 12px" : "20px 24px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {header}
              </div>
            )}

            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden", // chặn nội dung tràn ngang ra ngoài khung
                minWidth: 0,
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
                padding: isMobile ? "16px 16px 8px" : "16px 24px 8px",
              }}
            >
              {children}
            </div>

            {footer && (
              <div
                style={{
                  flexShrink: 0,
                  padding: isMobile
                    ? "12px 16px calc(12px + env(safe-area-inset-bottom, 0px))"
                    : "12px 24px 20px",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  background: "#121212",
                }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default BottomSheet;