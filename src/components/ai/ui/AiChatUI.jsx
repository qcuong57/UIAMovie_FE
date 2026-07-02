import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconX, IconMovie } from "@tabler/icons-react";
import { W, MOODS } from "../config/aiChatConfig";
import { FONT_BODY } from "../../../context/homeTokens";

// Spring easing for mood button bounce
const SPRING_BOUNCE = { type: "spring", stiffness: 320, damping: 18 };

export const TypingDots = () => (
  <div
    style={{
      display: "flex",
      gap: 5,
      alignItems: "center",
      height: 18,
      padding: "2px 0",
    }}
  >
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: W.accent,
          display: "block",
        }}
        animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.2, 0.8] }}
        transition={{
          repeat: Infinity,
          duration: 1.2,
          delay: i * 0.18,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

export const MoodPicker = ({ onSelect, loading }) => (
  <div
    style={{
      padding: "13px 14px 14px",
      borderBottom: `1px solid ${W.border}`,
      background: W.surfaceUp,
    }}
  >
    <p
      style={{
        fontFamily: FONT_BODY,
        fontSize: 9.5,
        fontWeight: 600,
        color: W.textSub,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        margin: "0 0 10px",
      }}
    >
      Bạn đang cảm thấy thế nào?
    </p>
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}
    >
      {MOODS.map((m, i) => (
        <motion.button
          key={m.key}
          onClick={() => !loading && onSelect(m.key)}
          disabled={loading}
          initial={{ opacity: 0, y: 6, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...SPRING_BOUNCE, delay: i * 0.04 }}
          // Spring bounce on hover — the "cubic-bezier(0.34,1.56,0.64,1)" feel
          whileHover={
            loading
              ? {}
              : {
                  scale: 1.06,
                  y: -2,
                  transition: { type: "spring", stiffness: 340, damping: 16 },
                }
          }
          whileTap={
            loading
              ? {}
              : {
                  scale: 0.93,
                  transition: { type: "spring", stiffness: 420, damping: 20 },
                }
          }
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            padding: "9px 4px",
            borderRadius: 10,
            background: "transparent",
            border: `1px solid ${W.border}`,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.45 : 1,
          }}
          onMouseEnter={(e) => {
            if (loading) return;
            e.currentTarget.style.background = W.surfaceMid;
            e.currentTarget.style.borderColor = W.borderHi;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = W.border;
          }}
        >
          <span style={{ fontSize: 17 }}>{m.emoji}</span>
          <span
            style={{
              fontFamily: FONT_BODY,
              fontSize: 8.5,
              fontWeight: 500,
              color: W.textSub,
              textAlign: "center",
            }}
          >
            {m.label}
          </span>
        </motion.button>
      ))}
    </div>
  </div>
);

export const ProactiveBubble = ({ onOpen, onDismiss, message }) => (
  <motion.div
    initial={{ opacity: 0, y: 12, scale: 0.93 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 12, scale: 0.93 }}
    transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
    onClick={onOpen}
    style={{
      position: "fixed",
      bottom: 92,
      right: 24,
      zIndex: 9997,
      maxWidth: 234,
      background: W.surface,
      border: `1px solid ${W.borderHi}`,
      borderRadius: 14,
      padding: "11px 14px",
      boxShadow:
        "0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
      cursor: "pointer",
    }}
  >
    <button
      onClick={(e) => {
        e.stopPropagation();
        onDismiss();
      }}
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 3,
        borderRadius: 5,
        display: "flex",
        alignItems: "center",
        color: W.textDim,
        transition: "color 0.12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = W.textSub)}
      onMouseLeave={(e) => (e.currentTarget.style.color = W.textDim)}
    >
      <IconX size={10} />
    </button>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          flexShrink: 0,
          background: W.accentSoft,
          border: `1px solid rgba(229,24,30,0.2)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconMovie size={13} color={W.accent} />
      </div>
      <div>
        <p
          style={{
            fontFamily: FONT_BODY,
            fontSize: 9,
            fontWeight: 700,
            color: W.accent,
            margin: "0 0 3px",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          UIAMovie AI
        </p>
        <p
          style={{
            fontFamily: FONT_BODY,
            fontSize: 12,
            color: W.text,
            margin: 0,
            lineHeight: 1.5,
            paddingRight: 14,
          }}
        >
          {message}
        </p>
      </div>
    </div>
    {/* Tail */}
    <div
      style={{
        position: "absolute",
        bottom: -5,
        right: 22,
        width: 10,
        height: 10,
        background: W.surface,
        border: `1px solid ${W.borderHi}`,
        borderTop: "none",
        borderLeft: "none",
        transform: "rotate(45deg)",
      }}
    />
  </motion.div>
);

export const FabIcon = ({ isOpen }) => (
  <AnimatePresence mode="wait">
    {isOpen ? (
      <motion.div
        key="close"
        initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
        transition={{ duration: 0.16 }}
      >
        <IconX size={20} color="rgba(255,255,255,0.85)" />
      </motion.div>
    ) : (
      <motion.div
        key="open"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6 }}
        transition={{ duration: 0.16 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M16 6.5l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5L14 8.5l1.5-.5z"
            fill="#e5181e"
            fillOpacity="0.95"
          />
          <circle cx="8" cy="11" r="1.2" fill="#e5181e" fillOpacity="0.75" />
          <circle cx="11.5" cy="11" r="1.2" fill="#e5181e" fillOpacity="0.75" />
        </svg>
      </motion.div>
    )}
  </AnimatePresence>
);

export const HeaderIconBtn = ({
  onClick,
  title,
  active,
  accentActive,
  children,
}) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      background:
        active && accentActive
          ? W.accentSoft
          : active
            ? W.surfaceMid
            : "transparent",
      border: `1px solid ${active ? (accentActive ? "rgba(229,24,30,0.22)" : W.border) : "transparent"}`,
      cursor: "pointer",
      padding: "5px 6px",
      borderRadius: 8,
      color: active ? (accentActive ? W.accent : W.text) : W.textDim,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.15s",
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.color = W.textSub;
        e.currentTarget.style.background = W.surfaceMid;
        e.currentTarget.style.borderColor = W.border;
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.color = W.textDim;
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "transparent";
      }
    }}
  >
    {children}
  </button>
);
