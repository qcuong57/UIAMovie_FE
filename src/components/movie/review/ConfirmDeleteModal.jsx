// src/components/movie/shared/review/ConfirmDeleteModal.jsx
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { C } from "../../../context/homeTokens";

// ── ConfirmDeleteModal — hộp thoại xác nhận xóa (dùng cho đánh giá & trả lời) ──
// preview: { rating?, label?, text? } — cho người dùng thấy đúng nội dung sắp xóa
const ConfirmDeleteModal = ({
  open,
  title,
  description,
  preview,
  confirmLabel = "Xóa",
  busy = false,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  // Khóa cuộn nền, đưa focus vào "Hủy" (lựa chọn an toàn), trả focus khi đóng
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      if (opener && document.contains(opener)) opener.focus?.();
    };
  }, [open]);

  // Esc để đóng, Tab xoay vòng trong hộp thoại
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (!busy) onCancelRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = dialogRef.current?.querySelectorAll(
        "button:not(:disabled)",
      );
      if (!nodes || !nodes.length) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!dialogRef.current.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="rvm-backdrop"
          className="rvm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !busy) onCancel?.();
          }}
        >
          <motion.div
            ref={dialogRef}
            className="rvm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="rvm-title"
            aria-describedby="rvm-desc"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rvm-body">
              <h2 id="rvm-title" className="rvm-title">
                {title}
              </h2>
              <p id="rvm-desc" className="rvm-desc">
                {description}
              </p>

              {preview && (
                <div className="rvm-preview">
                  {(preview.rating || preview.label) && (
                    <div className="rvm-preview-head">
                      {preview.rating ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color: C.gold,
                            fontWeight: 700,
                          }}
                        >
                          <Star
                            size={12}
                            style={{ fill: C.gold, color: C.gold }}
                          />
                          {preview.rating}/10
                        </span>
                      ) : null}
                      {preview.label && <span>{preview.label}</span>}
                    </div>
                  )}
                  <p className="rvm-preview-text">
                    {preview.text?.trim()
                      ? preview.text
                      : "Không có nhận xét, chỉ có điểm."}
                  </p>
                </div>
              )}
            </div>

            <div className="rvm-actions">
              <button
                ref={cancelBtnRef}
                type="button"
                className="rvm-btn rvm-cancel"
                onClick={onCancel}
                disabled={busy}
              >
                Hủy
              </button>
              <button
                type="button"
                className="rvm-btn rvm-danger"
                onClick={onConfirm}
                disabled={busy}
              >
                {busy ? (
                  <>
                    <span className="rvm-spin" aria-hidden="true" />
                    Đang xóa...
                  </>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default ConfirmDeleteModal;