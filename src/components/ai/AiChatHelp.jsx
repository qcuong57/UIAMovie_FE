import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconSearch, IconChevronRight, IconChevronDown } from "@tabler/icons-react";
import { W, HELP_CATEGORIES } from "./config/aiChatConfig";
import { FONT_BODY, FONT_DISPLAY } from "../../context/homeTokens";

export default function AiChatHelp({ onAsk }) {
  const [query, setQuery] = useState("");
  const [openCat, setOpenCat] = useState(HELP_CATEGORIES[0]?.key ?? null);

  const q = query.trim().toLowerCase();
  const filtered = HELP_CATEGORIES.map((cat) => ({
    ...cat,
    items: q ? cat.items.filter((it) => it.q.toLowerCase().includes(q)) : cat.items,
  })).filter((cat) => cat.items.length > 0);

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 16px 14px" }}>
      <h2
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 17,
          fontWeight: 800,
          color: "#fff",
          margin: "0 0 10px",
        }}
      >
        Trung tâm trợ giúp
      </h2>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: W.surfaceUp,
          border: `1px solid ${W.border}`,
          borderRadius: 13,
          padding: "10px 12px",
          marginBottom: 14,
        }}
      >
        <IconSearch size={15} color={W.textDim} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm câu hỏi thường gặp..."
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
      </div>

      {filtered.length === 0 && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: W.textDim, padding: "10px 2px" }}>
          Không tìm thấy câu hỏi phù hợp — hãy hỏi Concierge trực tiếp nhé.
        </p>
      )}

      {filtered.map((cat) => {
        const isOpen = q.length > 0 || openCat === cat.key;
        return (
          <div
            key={cat.key}
            style={{
              marginBottom: 9,
              borderRadius: 13,
              border: `1px solid ${W.border}`,
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setOpenCat(openCat === cat.key ? null : cat.key)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 13px",
                background: W.surfaceUp,
                border: "none",
                cursor: "pointer",
              }}
            >
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: W.text }}>
                {cat.label}
              </span>
              {isOpen ? (
                <IconChevronDown size={14} color={W.textDim} />
              ) : (
                <IconChevronRight size={14} color={W.textDim} />
              )}
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  {cat.items.map((it) => (
                    <button
                      key={it.q}
                      onClick={() => onAsk(it.q)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 13px",
                        background: "transparent",
                        border: "none",
                        borderTop: `1px solid ${W.border}`,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = W.surfaceMid)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: W.textSub, lineHeight: 1.4 }}>
                        {it.q}
                      </span>
                      <IconChevronRight size={12} color={W.textDim} style={{ flexShrink: 0 }} />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}