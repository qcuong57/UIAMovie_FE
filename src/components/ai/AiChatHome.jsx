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
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "18px 16px 14px" }}>
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_EXP }}
      >
        <h2
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 20,
            fontWeight: 800,
            color: "#fff",
            margin: "0 0 5px",
          }}
        >
          Xin chào 👋
        </h2>
        <p
          style={{
            fontFamily: FONT_BODY,
            fontSize: 13,
            color: W.textSub,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          UIAMovie Concierge có thể giúp gì cho bạn hôm nay?
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05, ease: EASE_EXP }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 16,
          background: W.surfaceUp,
          border: `1px solid ${W.border}`,
          borderRadius: 13,
          padding: "10px 12px",
        }}
      >
        <IconSearch size={15} color={W.textDim} />
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
          }}
        />
      </motion.div>

      {/* Status card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1, ease: EASE_EXP }}
        style={{
          marginTop: 10,
          display: "flex",
          alignItems: "center",
          gap: 9,
          borderRadius: 13,
          border: `1px solid ${W.border}`,
          background: W.surfaceUp,
          padding: "11px 13px",
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
          <p style={{ margin: 0, fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, color: W.text }}>
            AI Concierge đang hoạt động
          </p>
          <p style={{ margin: "2px 0 0", fontFamily: FONT_BODY, fontSize: 10, color: W.textDim }}>
            Thường phản hồi trong vài giây
          </p>
        </div>
      </motion.div>

      {/* CTA — jump into chat */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15, ease: EASE_EXP }}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onOpenChat()}
        style={{
          marginTop: 12,
          width: "100%",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "13px 14px",
          borderRadius: 14,
          background: `linear-gradient(135deg, rgba(229,24,30,0.14), rgba(229,24,30,0.04))`,
          border: `1px solid rgba(229,24,30,0.22)`,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: W.accentSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconMessage2 size={16} color={W.accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, color: "#fff" }}>
            Nhắn tin cho Concierge
          </p>
          <p style={{ margin: "1px 0 0", fontFamily: FONT_BODY, fontSize: 10.5, color: W.textSub }}>
            Tìm phim, gợi ý theo cảm xúc, so sánh...
          </p>
        </div>
        <IconArrowUpRight size={15} color={W.accent} />
      </motion.button>

      {/* Suggested topics */}
      <p
        style={{
          marginTop: 22,
          marginBottom: 8,
          fontFamily: FONT_BODY,
          fontSize: 10,
          fontWeight: 700,
          color: W.textDim,
          letterSpacing: "0.06em",
        }}
      >
        Chủ đề gợi ý
      </p>
      <div style={{ borderRadius: 13, border: `1px solid ${W.border}`, overflow: "hidden" }}>
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
                gap: 10,
                padding: "11px 13px",
                background: "transparent",
                border: "none",
                borderBottom: i < HOME_TOPICS.length - 1 ? `1px solid ${W.border}` : "none",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = W.surfaceMid)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: W.surfaceMid,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={13} color={W.accent} />
              </div>
              <span style={{ flex: 1, fontFamily: FONT_BODY, fontSize: 12, color: W.text, fontWeight: 500 }}>
                {t.label}
              </span>
              <IconArrowUpRight size={13} color={W.textDim} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}