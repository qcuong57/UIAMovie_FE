// src/components/admin/common/ConfirmDeleteModal.jsx
// Khung xác nhận xoá dùng chung (AdDeleteModal, AdSlotDeleteModal, và có thể cả AdminGenres...).
// Enter = xác nhận, Esc / bấm nền = đóng; mọi cách đóng đều bị khoá khi đang xoá.

import React, { useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  T,
  FONT_BODY as FONT,
  FONT_TITLE,
  ADMIN_GOOGLE_FONTS,
} from "../../../context/adminTokens";

const closeBtn = (busy) => ({
  width: 30,
  height: 30,
  borderRadius: "50%",
  background: T.surfaceAlt,
  border: `1px solid ${T.border}`,
  color: T.textSub,
  cursor: busy ? "not-allowed" : "pointer",
  opacity: busy ? 0.5 : 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export default function ConfirmDeleteModal({
  open,
  title,
  eyebrow = "Xác nhận",
  confirmLabel,
  busyLabel = "Đang xóa...",
  busy = false,
  onConfirm,
  onClose,
  children,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm-delete"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !busy && onClose()}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(3px)",
          }}
        >
          <style>{ADMIN_GOOGLE_FONTS}</style>
          <style>{`@keyframes cd-spin { to { transform: rotate(360deg); } }`}</style>

          <motion.form
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (!busy) onConfirm();
            }}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            style={{
              width: "min(440px, 100%)",
              background: T.surface,
              borderRadius: 16,
              border: `1px solid ${T.border}`,
              boxShadow: T.shadowLg,
              display: "flex",
              flexDirection: "column",
              fontFamily: FONT,
              overflow: "hidden",
            }}
          >
            <header
              style={{
                padding: "18px 20px",
                borderBottom: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: "#FEF2F2",
                    border: "1px solid rgba(220,38,38,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={16} color={T.red} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      color: T.textMuted,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      margin: "0 0 2px",
                      fontWeight: 600,
                    }}
                  >
                    {eyebrow}
                  </p>
                  <h2
                    style={{
                      fontFamily: FONT_TITLE,
                      fontSize: 16,
                      fontWeight: 700,
                      color: T.text,
                      margin: 0,
                    }}
                  >
                    {title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                aria-label="Đóng"
                style={closeBtn(busy)}
              >
                <X size={14} />
              </button>
            </header>

            <div
              style={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {children}
            </div>

            <footer
              style={{
                padding: "14px 20px",
                borderTop: `1px solid ${T.border}`,
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: T.surfaceAlt,
                  border: `1px solid ${T.border}`,
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.textSub,
                  cursor: busy ? "not-allowed" : "pointer",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busy}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  background: busy ? "#FEE2E2" : T.red,
                  border: `1px solid ${busy ? "rgba(220,38,38,0.3)" : "transparent"}`,
                  fontFamily: FONT,
                  fontSize: 13,
                  fontWeight: 600,
                  color: busy ? T.red : "#fff",
                  cursor: busy ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "background 0.15s",
                }}
              >
                {busy ? (
                  <>
                    <span
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: "50%",
                        border: "2px solid currentColor",
                        borderTopColor: "transparent",
                        animation: "cd-spin 0.7s linear infinite",
                      }}
                    />
                    {busyLabel}
                  </>
                ) : (
                  <>
                    <Trash2 size={13} /> {confirmLabel}
                  </>
                )}
              </button>
            </footer>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Hộp thông tin (tên đối tượng sắp xoá) và hộp cảnh báo vàng dùng chung trong nội dung modal. */
export const InfoBox = ({ title, children }) => (
  <div
    style={{
      padding: "12px 14px",
      borderRadius: 10,
      background: T.surfaceAlt,
      border: `1px solid ${T.border}`,
    }}
  >
    <p
      style={{
        fontFamily: FONT,
        fontSize: 13.5,
        fontWeight: 700,
        color: T.text,
        margin: "0 0 6px",
      }}
    >
      {title}
    </p>
    {children}
  </div>
);

export const WarnBox = ({ icon, children }) => (
  <div
    style={{
      padding: "11px 14px",
      borderRadius: 9,
      background: "#FFFBEB",
      border: "1px solid rgba(217,119,6,0.25)",
      display: "flex",
      alignItems: "flex-start",
      gap: 9,
    }}
  >
    <span style={{ flexShrink: 0, marginTop: 1, display: "flex" }}>{icon}</span>
    <p
      style={{
        fontFamily: FONT,
        fontSize: 12.5,
        color: "#92400E",
        margin: 0,
        lineHeight: 1.5,
      }}
    >
      {children}
    </p>
  </div>
);

export const IrreversibleNote = ({ children }) => (
  <p
    style={{
      fontFamily: FONT,
      fontSize: 13,
      color: T.textSub,
      margin: 0,
      lineHeight: 1.6,
    }}
  >
    Hành động này <strong style={{ color: T.text }}>không thể hoàn tác</strong>.{" "}
    {children}
  </p>
);