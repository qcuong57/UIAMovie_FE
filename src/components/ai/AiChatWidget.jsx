import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { IconChevronDown } from "@tabler/icons-react";
import aiService from "../../services/aiService";
import { FONT_BODY, FONT_DISPLAY } from "../../context/homeTokens";

import {
  W,
  MAX_CHAT_LENGTH,
  MAX_HISTORY,
  GREETING,
  INTENT_CHIPS,
  PROACTIVE_MESSAGES,
} from "./config/aiChatConfig";
import { ProactiveBubble, FabIcon, MoodPicker } from "./ui/AiChatUI";
import AiChatMessageBubble from "./AiChatMessageBubble";

const EASE_EXP = [0.16, 1, 0.3, 1];

export default function AiChatWidget() {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: GREETING },
  ]);
  const [loading, setLoading] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [lastIntent, setLastIntent] = useState("movie");
  const [proactive, setProactive] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const messagesRef = useRef(null);
  const idleTimerRef = useRef(null);
  const proactiveShownRef = useRef(false);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        scrollToBottom(false);
        inputRef.current?.focus();
      }, 100);
      setHasUnread(false);
      setProactive(null);
    }
  }, [open, scrollToBottom]);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open, scrollToBottom]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!open && last?.role === "assistant" && messages.length > 1 && !last._typing) {
      setHasUnread(true);
    }
  }, [messages, open]);

  useEffect(() => {
    if (open || proactiveShownRef.current) return;
    const delay = 30_000 + Math.random() * 15_000;
    idleTimerRef.current = setTimeout(() => {
      if (!open) {
        const path = location.pathname;
        const key =
          Object.keys(PROACTIVE_MESSAGES).find((k) => path.startsWith(k) && k !== "/") ??
          (path === "/" ? "/" : "default");
        setProactive(PROACTIVE_MESSAGES[key] ?? PROACTIVE_MESSAGES.default);
        proactiveShownRef.current = true;
      }
    }, delay);
    return () => clearTimeout(idleTimerRef.current);
  }, [open, location.pathname]);

  const handleScroll = () => {
    const el = messagesRef.current;
    if (!el) return;
    setShowScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 80);
  };

  const buildHistory = (msgs) =>
    msgs
      .slice(1)
      .filter((m) => !m._typing)
      .slice(-MAX_HISTORY)
      .map(({ role, content }) => ({ role, content }));

  const handleMovieClick = useCallback(
    (movie) => {
      const id = movie.id || movie.movieId;
      if (!id) return;
      navigate(`/movie/${id}/info`);
      setOpen(false);
    },
    [navigate],
  );

  const handleTvShowClick = useCallback(
    (show) => {
      const id = show.id || show.tvShowId || show.seriesId;
      if (!id) return;
      navigate(`/tv-show/${id}/info`);
      setOpen(false);
    },
    [navigate],
  );

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading || trimmed.length > MAX_CHAT_LENGTH) return;
    setShowMoodPicker(false);

    const userMsg = { role: "user", content: trimmed };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    setMessages((prev) => [...prev, { role: "assistant", content: "", _typing: true }]);
    setLoading(true);

    try {
      const { reply, movies, tvshows, intent, compareTable } = await aiService.chat(
        trimmed,
        buildHistory(nextMsgs),
      );
      setLastIntent(intent || "movie");
      setMessages((prev) => [
        ...prev.filter((m) => !m._typing),
        {
          role: "assistant",
          content: reply,
          movies: movies?.length ? movies : undefined,
          tvshows: tvshows?.length ? tvshows : undefined,
          intent: intent ?? "movie",
          compareTable: compareTable ?? null,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => !m._typing),
        { role: "assistant", content: "Xin lỗi, không thể kết nối tới AI. Vui lòng thử lại sau." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleMoodSelect = async (mood) => {
    setShowMoodPicker(false);
    await sendMessage(`Tôi đang cảm thấy ${mood.toLowerCase()}, gợi ý phim phù hợp cho tôi nhé!`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([{ role: "assistant", content: GREETING }]);
    setInput("");
    setLastIntent("movie");
    setShowMoodPicker(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const inputLength = input.length;
  const overLimit = inputLength > MAX_CHAT_LENGTH;
  const nearLimit = inputLength > MAX_CHAT_LENGTH - 50;
  const canSend = input.trim().length > 0 && !loading && !overLimit;
  const isFirst = messages.length === 1;
  const currentChips = INTENT_CHIPS[lastIntent] ?? INTENT_CHIPS.movie;

  return (
    <>
      <AnimatePresence>
        {proactive && !open && (
          <ProactiveBubble
            message={proactive}
            onOpen={() => setOpen(true)}
            onDismiss={() => setProactive(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.26, ease: EASE_EXP }}
            style={{
              position: "fixed",
              bottom: 92,
              top: 72,
              right: 24,
              width: 368,
              zIndex: 9998,
              borderRadius: 18,
              background: W.bg,
              border: `1px solid ${W.border}`,
              boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.35)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header — wordmark + status, no logo box, no badge chrome */}
            <div
              style={{
                padding: "15px 16px 13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: `1px solid ${W.border}`,
                flexShrink: 0,
              }}
            >
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, color: "#fff", letterSpacing: "0.01em" }}>
                  UIAMovie Trợ lý
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: W.textDim, marginTop: 2 }}>
                  Đang hoạt động
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {messages.length > 1 && (
                  <button
                    onClick={clearChat}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: FONT_BODY,
                      fontSize: 11,
                      fontWeight: 500,
                      color: W.textDim,
                      padding: "4px 2px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = W.textSub)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = W.textDim)}
                  >
                    Trò chuyện mới
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Đóng"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: FONT_BODY,
                    fontSize: 18,
                    lineHeight: 1,
                    color: W.textDim,
                    padding: "2px 2px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = W.textSub)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = W.textDim)}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Mood picker */}
            <AnimatePresence>
              {showMoodPicker && (
                <motion.div
                  initial={{ maxHeight: 0, opacity: 0 }}
                  animate={{ maxHeight: 200, opacity: 1 }}
                  exit={{ maxHeight: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: EASE_EXP }}
                  style={{ overflow: "hidden", flexShrink: 0 }}
                >
                  <MoodPicker onSelect={handleMoodSelect} loading={loading} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div
              ref={messagesRef}
              onScroll={handleScroll}
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden",
                padding: "16px 14px 8px",
                scrollbarWidth: "none",
                position: "relative",
              }}
            >
              {messages.map((msg, i) => (
                <AiChatMessageBubble
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  isTyping={msg._typing}
                  movies={msg.movies}
                  tvshows={msg.tvshows}
                  onMovieClick={handleMovieClick}
                  onTvShowClick={handleTvShowClick}
                  compareTable={msg.compareTable}
                  intent={msg.intent}
                  showLabel={i === 0 || messages[i - 1].role !== msg.role}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Scroll-down control */}
            <AnimatePresence>
              {showScrollDown && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => scrollToBottom()}
                  style={{
                    position: "absolute",
                    bottom: 130,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 10,
                    background: W.surfaceMid,
                    border: `1px solid ${W.borderHi}`,
                    borderRadius: 99,
                    padding: "5px 12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    color: W.textSub,
                    fontFamily: FONT_BODY,
                    fontSize: 10.5,
                    fontWeight: 500,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
                  }}
                >
                  <IconChevronDown size={12} /> Xuống dưới
                </motion.button>
              )}
            </AnimatePresence>

            {/* Quick-reply chips — only on first turn */}
            <AnimatePresence>
              {isFirst && (
                <motion.div
                  key={`chips-${lastIntent}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: EASE_EXP }}
                  style={{ padding: "0 14px 8px", display: "flex", flexWrap: "wrap", gap: 5, flexShrink: 0 }}
                >
                  {currentChips.map((s, idx) => (
                    <motion.button
                      key={s.label}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.16, delay: idx * 0.04 }}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => sendMessage(s.label)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 99,
                        background: "transparent",
                        border: `1px solid ${W.border}`,
                        cursor: "pointer",
                        color: W.textSub,
                        fontFamily: FONT_BODY,
                        fontSize: 11,
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        transition: "color 0.15s, background 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={(e) => {
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
                      {s.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mood toggle — plain text link, sits just above the composer */}
            <div style={{ padding: "0 14px 6px", flexShrink: 0 }}>
              <button
                onClick={() => setShowMoodPicker((v) => !v)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: FONT_BODY,
                  fontSize: 10.5,
                  fontWeight: 500,
                  color: showMoodPicker ? W.accent : W.textDim,
                  padding: "2px 0",
                }}
              >
                Gợi ý theo tâm trạng
              </button>
            </div>

            {/* Composer */}
            <div style={{ padding: "0 12px 13px", flexShrink: 0, borderTop: `1px solid ${W.border}`, paddingTop: 10 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 8,
                  background: W.surfaceUp,
                  border: `1px solid ${overLimit ? W.warn : W.border}`,
                  borderRadius: 14,
                  padding: "7px 7px 7px 14px",
                  transition: "border-color 0.18s",
                }}
                onFocusCapture={(e) => {
                  e.currentTarget.style.borderColor = overLimit ? W.warn : W.borderHi;
                }}
                onBlurCapture={(e) => {
                  e.currentTarget.style.borderColor = overLimit ? W.warn : W.border;
                }}
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 90) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi về phim, tâm trạng, so sánh..."
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    padding: "3px 0",
                    color: W.text,
                    fontFamily: FONT_BODY,
                    fontSize: 13,
                    lineHeight: 1.55,
                    resize: "none",
                    outline: "none",
                    scrollbarWidth: "none",
                    minHeight: 28,
                    maxHeight: 90,
                  }}
                />
                <motion.button
                  onClick={() => sendMessage(input)}
                  disabled={!canSend}
                  animate={{
                    background: canSend ? W.accent : "rgba(255,255,255,0.04)",
                  }}
                  transition={{ duration: 0.18 }}
                  whileTap={canSend ? { scale: 0.92 } : {}}
                  style={{
                    height: 32,
                    padding: "0 13px",
                    borderRadius: 9,
                    border: "none",
                    cursor: canSend ? "pointer" : "default",
                    fontFamily: FONT_BODY,
                    fontSize: 12,
                    fontWeight: 700,
                    color: canSend ? "#fff" : W.textDim,
                    flexShrink: 0,
                  }}
                >
                  Gửi
                </motion.button>
              </div>

              <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontFamily: FONT_BODY, fontSize: 9.5, color: W.textDim, margin: 0 }}>
                  AI có thể mắc sai sót
                </p>
                {nearLimit && (
                  <span style={{ fontFamily: FONT_BODY, fontSize: 9.5, fontWeight: 600, color: overLimit ? W.warn : W.textDim }}>
                    {inputLength}/{MAX_CHAT_LENGTH}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB — single word mark, no icon library glyph */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: 16,
          background: open ? W.surfaceMid : W.accent,
          border: open ? `1px solid ${W.borderHi}` : "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          boxShadow: open ? "0 4px 20px rgba(0,0,0,0.5)" : "0 6px 24px rgba(229,24,30,0.4)",
          transition: "background 0.2s, border 0.2s, box-shadow 0.2s",
        }}
      >
        <FabIcon isOpen={open} />
        <AnimatePresence>
          {hasUnread && !open && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 18 }}
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: W.green,
                border: "2px solid #080809",
              }}
            />
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}