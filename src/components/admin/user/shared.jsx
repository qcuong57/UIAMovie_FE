import React from "react";
import { motion } from "framer-motion";
import {
  X,
} from "lucide-react";
import { T, FONT_BODY as FONT } from "../../../context/adminTokens";

const modalBase = {
  position: "fixed",
  inset: 0,
  margin: "auto",
  width: "min(420px, calc(100vw - 24px))",
  height: "fit-content",
  maxHeight: "calc(100dvh - 24px)",
  zIndex: 300,
  background: T.surface,
  borderRadius: 16,
  border: `1px solid ${T.border}`,
  boxShadow: "0 20px 60px rgba(0,0,0,0.14)",
  display: "flex",
  flexDirection: "column",
  fontFamily: FONT,
  overflow: "hidden",
};

export const Backdrop = ({ onClose }) => (
  <motion.div
    key="bd"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.3)",
      backdropFilter: "blur(3px)",
      zIndex: 299,
    }}
  />
);

export const ModalMotion = ({ children }) => (
  <motion.div
    key="modal"
    data-admin-modal=""
    initial={{ opacity: 0, scale: 0.97, y: 8 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.97, y: 8 }}
    transition={{ type: "spring", stiffness: 340, damping: 30 }}
    style={modalBase}
  >
    {children}
  </motion.div>
);

export const CloseBtn = ({ onClose }) => (
  <button
    onClick={onClose}
    style={{
      width: 30,
      height: 30,
      borderRadius: "50%",
      background: T.bg,
      border: `1px solid ${T.border}`,
      cursor: "pointer",
      color: T.textSub,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <X size={13} />
  </button>
);

export const ConfirmBtn = ({
  onClick,
  disabled,
  loading,
  bg,
  color,
  border,
  icon: Icon,
  label,
}) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      padding: "8px 18px",
      borderRadius: 8,
      background: loading ? `${bg}99` : bg,
      border: `1px solid ${border ?? "transparent"}`,
      cursor: disabled || loading ? "not-allowed" : "pointer",
      fontFamily: FONT,
      fontSize: 13,
      fontWeight: 600,
      color,
      display: "flex",
      alignItems: "center",
      gap: 6,
      transition: "background 0.15s",
    }}
  >
    {loading ? (
      <>
        <div
          style={{
            width: 13,
            height: 13,
            borderRadius: "50%",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            animation: "spin 0.7s linear infinite",
          }}
        />{" "}
        Đang xử lý...
      </>
    ) : (
      <>
        {Icon && <Icon size={13} />} {label}
      </>
    )}
  </button>
);

export const CancelBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 16px",
      borderRadius: 8,
      background: T.bg,
      border: `1px solid ${T.border}`,
      cursor: "pointer",
      fontFamily: FONT,
      fontSize: 13,
      fontWeight: 600,
      color: T.textSub,
    }}
  >
    Hủy
  </button>
);
