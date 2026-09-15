import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconX } from "@tabler/icons-react";
import { W, MOODS } from "../config/aiChatConfig";
import { FONT_BODY } from "../../../context/homeTokens";

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

// Plain text pills — no emoji, no grid chrome
export const MoodPicker = ({ onSelect, loading }) => (
  <div
    style={{
      padding: "12px 14px 13px",
      borderBottom: `1px solid ${W.border}`,
      background: W.surfaceUp,
    }}
  >
    <p
      style={{
        fontFamily: FONT_BODY,
        fontSize: 10.5,
        fontWeight: 500,
        color: W.textSub,
        margin: "0 0 9px",
      }}
    >
      Bạn đang cảm thấy thế nào?
    </p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {MOODS.map((m, i) => (
        <motion.button
          key={m}
          onClick={() => !loading && onSelect(m)}
          disabled={loading}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: i * 0.03 }}
          whileHover={loading ? {} : { y: -1 }}
          whileTap={loading ? {} : { scale: 0.96 }}
          style={{
            padding: "6px 12px",
            borderRadius: 99,
            background: "transparent",
            border: `1px solid ${W.border}`,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.45 : 1,
            fontFamily: FONT_BODY,
            fontSize: 11,
            fontWeight: 500,
            color: W.textSub,
            transition: "color 0.15s, background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            if (loading) return;
            e.currentTarget.style.color = W.text;
            e.currentTarget.style.background = W.surfaceMid;
            e.currentTarget.style.borderColor = W.borderHi;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = W.textSub;
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = W.border;
          }}
        >
          {m}
        </motion.button>
      ))}
    </div>
  </div>
);

// Quiet notification card — text only, no icon badge
export const ProactiveBubble = ({ onOpen, onDismiss, message }) => (
  <motion.div
    initial={{ opacity: 0, y: 12, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 12, scale: 0.96 }}
    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
    onClick={onOpen}
    style={{
      position: "fixed",
      bottom: 92,
      right: 24,
      zIndex: 9997,
      maxWidth: 226,
      background: W.surface,
      border: `1px solid ${W.borderHi}`,
      borderRadius: 13,
      padding: "12px 14px",
      boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
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
        color: W.textDim,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = W.textSub)}
      onMouseLeave={(e) => (e.currentTarget.style.color = W.textDim)}
    >
      <IconX size={10} />
    </button>
    <p
      style={{
        fontFamily: FONT_BODY,
        fontSize: 9.5,
        fontWeight: 600,
        color: W.accent,
        margin: "0 0 4px",
      }}
    >
      UIAMovie
    </p>
    <p
      style={{
        fontFamily: FONT_BODY,
        fontSize: 12,
        color: W.text,
        margin: 0,
        lineHeight: 1.5,
        paddingRight: 12,
      }}
    >
      {message}
    </p>
  </motion.div>
);

// FAB glyph — the one icon this widget actually needs
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
      <motion.span
        key="open"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6 }}
        transition={{ duration: 0.16 }}
        style={{
          fontFamily: FONT_BODY,
          fontWeight: 800,
          fontSize: 15,
          color: "#fff",
          letterSpacing: "-0.02em",
        }}
      >
        UIA
      </motion.span>
    )}
  </AnimatePresence>
);

export const HeaderIconBtn = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "5px 6px",
      borderRadius: 8,
      color: W.textDim,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "color 0.15s",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.color = W.textSub)}
    onMouseLeave={(e) => (e.currentTarget.style.color = W.textDim)}
  >
    {children}
  </button>
);