import React from "react";
import { motion } from "framer-motion";
import { T } from "../../../context/adminTokens";

export const ActionBtn = ({ icon: Icon, onClick, title, variant = "default", size = 30 }) => {
  const styles = {
    default: { bg: T.bg, border: T.border, color: T.textSub },
    edit: { bg: "#EFF6FF", border: "rgba(59,130,246,0.25)", color: "#3B82F6" },
    shield: { bg: T.accentLight, border: `${T.accent}30`, color: T.accent },
    danger: { bg: "#FEF2F2", border: "rgba(220,38,38,0.2)", color: "#DC2626" },
    ban: { bg: "#FFF7ED", border: "rgba(234,88,12,0.25)", color: "#EA580C" },
    premium: { bg: "#FFFBEB", border: "rgba(217,119,6,0.3)", color: "#D97706" },
    unban: { bg: "#F0FDF4", border: "rgba(22,163,74,0.25)", color: "#16A34A" },
  };
  const s = styles[variant];
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      title={title}
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        flexShrink: 0,
        background: s.bg,
        border: `1px solid ${s.border}`,
        cursor: "pointer",
        color: s.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      <Icon size={size > 30 ? 16 : 13} strokeWidth={1.8} />
    </motion.button>
  );
};
