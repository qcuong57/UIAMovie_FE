import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  IconSearch,
  IconMessage2,
  IconArrowUpRight,
  IconSparkles,
  IconFlame,
  IconArrowsShuffle,
  IconDeviceTv,
  IconCreditCard,
} from "@tabler/icons-react";
import { W, HOME_TOPICS } from "./config/aiChatConfig";
import { FONT_BODY, FONT_DISPLAY } from "../../context/homeTokens";

const EASE_EXP = [0.16, 1, 0.3, 1];

const TOPIC_ICONS = {
  mood: IconSparkles,
  trending: IconFlame,
  compare: IconArrowsShuffle,
  tvshow: IconDeviceTv,
  account: IconCreditCard,
};

export default function AiChatHome({ onOpenChat, onQuickAsk }) {
  const [q, setQ] = useState("");

  const submitSearch = () => {
    const trimmed = q.trim();
    if (!trimmed) return;
    onQuickAsk(trimmed);
    setQ("");
  };

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px 16px 16px" }}>
      {/* ──── Greeting ──── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_EXP }}
        style={{ marginBottom: 18 }}
      >
        <h2
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 22,
            fontWeight: 800,
            color: "#fff",
            margin: "0 0 6px",
            letterSpacing: "-0.5px",
          }}
        >
          Xin chào 👋
        </h2>
        <p
          style={{
            fontFamily: FONT_BODY,
            fontSize: 13.5,
            color: W.textSub,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          UIAMovie Concierge có thể giúp gì cho bạn hôm nay?
        </p>
      </motion.div>

      {/* ──── Search Input ──── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05, ease: EASE_EXP }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
          background: W.surfaceUp,
          border: `1.5px solid ${W.border}`,
          borderRadius: 12,
          padding: "11px 13px",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = W.borderHi;
          e.currentTarget.style.boxShadow = `0 0 12px ${W.accentGlow}`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = W.border;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <IconSearch size={16} color={W.textDim} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitSearch()}
          placeholder="Tìm phim, thể loại, diễn viên..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: W.text,
            fontFamily: FONT_BODY,
            fontSize: 13,
            WebkitFontSmoothing: "antialiased",
          }}
        />
      </motion.div>

      {/* ──── Status Card ──── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1, ease: EASE_EXP }}
        style={{
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderRadius: 12,
          border: `1.5px solid ${W.border}`,
          background: W.surfaceUp,
          padding: "12px 13px",
        }}
      >
        <motion.span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: W.green,
            flexShrink: 0,
          }}
          animate={{ opacity: [1, 0.35, 1] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontFamily: FONT_BODY,
              fontSize: 12,
              fontWeight: 700,
              color: W.text,
            }}
          >
            AI Concierge đang hoạt động
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontFamily: FONT_BODY,
              fontSize: 11,
              color: W.textDim,
            }}
          >
            Thường phản hồi trong vài giây
          </p>
        </div>
      </motion.div>

      {/* ──── CTA Button — Prominent & Clear ──── */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15, ease: EASE_EXP }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onOpenChat()}
        style={{
          marginBottom: 20,
          width: "100%",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 15px",
          borderRadius: 13,
          background: `linear-gradient(135deg, ${W.accent}, #a01015)`,
          border: `1.5px solid rgba(229,24,30,0.35)`,
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 4px 16px rgba(229,24,30,0.25)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(229,24,30,0.35)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(229,24,30,0.25)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconMessage2 size={18} color="#fff" strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontFamily: FONT_BODY,
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            Nhắn tin cho Concierge
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontFamily: FONT_BODY,
              fontSize: 11,
              color: "rgba(255,255,255,0.75)",
            }}
          >
            Tìm phim, gợi ý theo cảm xúc, so sánh...
          </p>
        </div>
        <IconArrowUpRight size={16} color="#fff" strokeWidth={2.2} />
      </motion.button>

      {/* ──── Suggested Topics ──── */}
      <p
        style={{
          marginBottom: 9,
          fontFamily: FONT_BODY,
          fontSize: 10.5,
          fontWeight: 700,
          color: W.textDim,
          letterSpacing: "0.5px",
        }}
      >
        Chủ đề gợi ý
      </p>
      <div
        style={{
          borderRadius: 12,
          border: `1.5px solid ${W.border}`,
          overflow: "hidden",
          background: W.surfaceUp,
        }}
      >
        {HOME_TOPICS.map((t, i) => {
          const Icon = TOPIC_ICONS[t.key] || IconSparkles;
          return (
            <motion.button
              key={t.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.18 + i * 0.04, ease: EASE_EXP }}
              onClick={() => onQuickAsk(t.text)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "12px 13px",
                background: "transparent",
                border: "none",
                borderBottom:
                  i < HOME_TOPICS.length - 1 ? `1px solid ${W.border}` : "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
                minHeight: 48,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = W.surfaceMid;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: W.accentSoft,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.15s",
                }}
              >
                <Icon size={14} color={W.accent} strokeWidth={2} />
              </div>
              <span
                style={{
                  flex: 1,
                  fontFamily: FONT_BODY,
                  fontSize: 12.5,
                  color: W.text,
                  fontWeight: 500,
                }}
              >
                {t.label}
              </span>
              <IconArrowUpRight size={14} color={W.textDim} strokeWidth={2} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}