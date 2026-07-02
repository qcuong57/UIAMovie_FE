import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IconMovie,
  IconRefresh,
  IconX,
  IconMoodSmile,
  IconChevronDown,
  IconSend2,
} from "@tabler/icons-react";
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
import {
  ProactiveBubble,
  FabIcon,
  HeaderIconBtn,
  MoodPicker,
} from "./ui/AiChatUI";
import AiChatMessageBubble from "./AiChatMessageBubble";

// Expressive easing — "comes to rest" naturally, like Linear/Vercel panels
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
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
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
    if (
      !open &&
      last?.role === "assistant" &&
      messages.length > 1 &&
      !last._typing
    )
      setHasUnread(true);
  }, [messages, open]);

  useEffect(() => {
    if (open || proactiveShownRef.current) return;
    const delay = 30_000 + Math.random() * 15_000;
    idleTimerRef.current = setTimeout(() => {
      if (!open) {
        const path = location.pathname;
        const key =
          Object.keys(PROACTIVE_MESSAGES).find(
            (k) => path.startsWith(k) && k !== "/",
          ) ?? (path === "/" ? "/" : "default");
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

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", _typing: true },
    ]);
    setLoading(true);

    try {
      const { reply, movies, tvshows, intent, compareTable } =
        await aiService.chat(trimmed, buildHistory(nextMsgs));
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
        {
          role: "assistant",
          content: "Xin lỗi, không thể kết nối tới AI. Vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleMoodSelect = async (mood) => {
    setShowMoodPicker(false);
    await sendMessage(
      `Tôi đang cảm thấy ${mood}, gợi ý phim phù hợp cho tôi nhé!`,
    );
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
      {/* Proactive bubble */}
      <AnimatePresence>
        {proactive && !open && (
          <ProactiveBubble
            message={proactive}
            onOpen={() => setOpen(true)}
            onDismiss={() => setProactive(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── Main chat panel ─── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.3, ease: EASE_EXP }}
            style={{
              position: "fixed",
              bottom: 92,
              top: 72,
              right: 24,
              width: 372,
              zIndex: 9998,
              borderRadius: 20,
              background: W.bg,
              border: `1px solid ${W.border}`,
              // 4-layer shadow: ambient + depth + blur + red bottom-glow
              boxShadow: [
                "0 2px 6px rgba(0,0,0,0.3)",
                "0 12px 40px rgba(0,0,0,0.55)",
                "0 40px 100px rgba(0,0,0,0.75)",
                "0 56px 80px rgba(229,24,30,0.07)",
              ].join(", "),
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "12px 13px 11px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderBottom: `1px solid ${W.border}`,
                flexShrink: 0,
                background: W.surfaceUp,
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 11,
                  background: `linear-gradient(145deg, rgba(229,24,30,0.18), rgba(229,24,30,0.06))`,
                  border: `1px solid rgba(229,24,30,0.22)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 0 20px rgba(229,24,30,0.14)",
                }}
              >
                <IconMovie size={16} color={W.accent} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 800,
                    fontSize: 13.5,
                    color: "#fff",
                    letterSpacing: "0.01em",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  UIAMovie AI
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: "rgba(34,197,94,0.08)",
                      border: "1px solid rgba(34,197,94,0.18)",
                      borderRadius: 99,
                      padding: "1px 7px",
                    }}
                  >
                    <motion.span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: W.green,
                        display: "block",
                      }}
                      animate={{ opacity: [1, 0.35, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.2,
                        ease: "easeInOut",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: FONT_BODY,
                        fontSize: 8.5,
                        fontWeight: 600,
                        color: W.green,
                      }}
                    >
                      Live
                    </span>
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 10,
                    color: W.textDim,
                    marginTop: 1,
                  }}
                >
                  Trợ lý tìm phim & series thông minh
                </div>
              </div>
              <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                <HeaderIconBtn
                  onClick={() => setShowMoodPicker((v) => !v)}
                  title="Gợi ý theo tâm trạng"
                  active={showMoodPicker}
                  accentActive
                >
                  <IconMoodSmile size={15} />
                </HeaderIconBtn>
                {messages.length > 1 && (
                  <HeaderIconBtn
                    onClick={clearChat}
                    title="Cuộc trò chuyện mới"
                  >
                    <IconRefresh size={14} />
                  </HeaderIconBtn>
                )}
                <HeaderIconBtn onClick={() => setOpen(false)} title="Đóng">
                  <IconX size={15} />
                </HeaderIconBtn>
              </div>
            </div>

            {/* Mood picker — smooth max-height collapse (no "height: auto" jank) */}
            <AnimatePresence>
              {showMoodPicker && (
                <motion.div
                  initial={{ maxHeight: 0, opacity: 0 }}
                  animate={{ maxHeight: 220, opacity: 1 }}
                  exit={{ maxHeight: 0, opacity: 0 }}
                  transition={{ duration: 0.26, ease: EASE_EXP }}
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
                padding: "16px 13px 8px",
                scrollbarWidth: "none",
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
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Scroll-down button with hover lift */}
            <AnimatePresence>
              {showScrollDown && (
                <motion.button
                  initial={{ opacity: 0, y: 8, scale: 0.88 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.88 }}
                  transition={{ duration: 0.2, ease: EASE_EXP }}
                  whileHover={{
                    y: -2,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.65)",
                  }}
                  onClick={() => scrollToBottom()}
                  style={{
                    position: "absolute",
                    bottom: 86,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 10,
                    background: W.surfaceMid,
                    border: `1px solid ${W.borderHi}`,
                    borderRadius: 99,
                    padding: "5px 13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    color: W.textSub,
                    fontFamily: FONT_BODY,
                    fontSize: 10.5,
                    fontWeight: 600,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
                    transition: "box-shadow 0.18s",
                  }}
                >
                  <IconChevronDown size={12} /> Xuống dưới
                </motion.button>
              )}
            </AnimatePresence>

            {/* Quick-reply chips — staggered slide-up on mount */}
            <AnimatePresence>
              {isFirst && (
                <motion.div
                  key={`chips-${lastIntent}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: EASE_EXP }}
                  style={{
                    padding: "0 13px 8px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 5,
                    flexShrink: 0,
                  }}
                >
                  {currentChips.map((s, idx) => (
                    <motion.button
                      key={s.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.18,
                        delay: idx * 0.05,
                        ease: EASE_EXP,
                      }}
                      whileHover={{ y: -1, transition: { duration: 0.12 } }}
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
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        whiteSpace: "nowrap",
                        transition:
                          "color 0.15s, background 0.15s, border-color 0.15s",
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

            {/* Input area */}
            <div
              style={{
                padding: "8px 12px 13px",
                flexShrink: 0,
                borderTop: `1px solid ${W.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 8,
                  background: W.surfaceUp,
                  border: `1px solid ${overLimit ? W.warn : W.border}`,
                  borderRadius: 15,
                  padding: "7px 7px 7px 14px",
                  transition: "border-color 0.18s, box-shadow 0.18s",
                }}
                onFocusCapture={(e) => {
                  e.currentTarget.style.borderColor = overLimit
                    ? W.warn
                    : W.borderHi;
                  e.currentTarget.style.boxShadow = overLimit
                    ? "0 0 0 3px rgba(245,158,11,0.08)"
                    : "0 0 0 3px rgba(229,24,30,0.06)";
                }}
                onBlurCapture={(e) => {
                  e.currentTarget.style.borderColor = overLimit
                    ? W.warn
                    : W.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 90) + "px";
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
                {/* Send button — gradient active state + spring tap */}
                <motion.button
                  onClick={() => sendMessage(input)}
                  disabled={!canSend}
                  animate={{
                    background: canSend
                      ? `linear-gradient(135deg, ${W.accent} 0%, #b8111a 100%)`
                      : "rgba(255,255,255,0.04)",
                    boxShadow: canSend
                      ? "0 3px 16px rgba(229,24,30,0.38)"
                      : "none",
                  }}
                  transition={{ duration: 0.2 }}
                  whileHover={canSend ? { scale: 1.06 } : {}}
                  whileTap={
                    canSend
                      ? {
                          scale: 0.88,
                          transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 18,
                          },
                        }
                      : {}
                  }
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: "none",
                    cursor: canSend ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <IconSend2
                    size={14}
                    color={canSend ? "#fff" : W.textDim}
                    style={{ transform: "translateX(1px)" }}
                  />
                </motion.button>
              </div>

              <div
                style={{
                  marginTop: 7,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <p
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 9.5,
                    color: W.textDim,
                    letterSpacing: "0.02em",
                    margin: 0,
                  }}
                >
                  AI có thể mắc sai sót · Chỉ gợi ý phim có trong thư viện
                </p>
                {nearLimit && (
                  <span
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: 9.5,
                      fontWeight: 600,
                      color: overLimit ? W.warn : W.textDim,
                      flexShrink: 0,
                      marginLeft: 8,
                      transition: "color 0.15s",
                    }}
                  >
                    {inputLength}/{MAX_CHAT_LENGTH}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── FAB ─── */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{
          scale: 0.88,
          transition: { type: "spring", stiffness: 380, damping: 18 },
        }}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 54,
          height: 54,
          borderRadius: 16,
          background: open
            ? W.surfaceMid
            : `linear-gradient(145deg, #e8191f, #b01015)`,
          border: open ? `1px solid ${W.borderHi}` : "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          boxShadow: open
            ? "0 4px 20px rgba(0,0,0,0.5)"
            : "0 6px 28px rgba(229,24,30,0.5), 0 2px 10px rgba(0,0,0,0.5)",
          transition: "background 0.22s, border 0.22s, box-shadow 0.22s",
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
                top: -3,
                right: -3,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: W.green,
                border: "2px solid #080809",
                boxShadow: "0 0 8px rgba(34,197,94,0.5)",
              }}
            />
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}