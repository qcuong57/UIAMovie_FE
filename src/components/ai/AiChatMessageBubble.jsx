import React from "react";
import { motion } from "framer-motion";
import { W, renderMarkdown } from "./config/aiChatConfig";
import { FONT_BODY } from "../../context/homeTokens";
import { TypingDots } from "./ui/AiChatUI";
import { CompareCard, MovieCardsRow, TvShowCardsRow } from "./ui/AiChatMovies";

export default function AiChatMessageBubble({
  role,
  content,
  isTyping,
  movies,
  tvshows,
  onMovieClick,
  onTvShowClick,
  compareTable,
  intent,
  showLabel,
  suggestedActions = [],
  onActionClick,
}) {
  const isUser = role === "user";
  const showResults = !isUser && !isTyping;

  const compareItems = [
    ...(movies ?? []).map((m) => ({ ...m, _kind: "movie" })),
    ...(tvshows ?? []).map((t) => ({ ...t, _kind: "tv" })),
  ];
  
  // TỰ ĐỘNG NHẬN DIỆN SO SÁNH KHI CÓ DỮ LIỆU BẢNG HOẶC INTENT COMPARE
  const isCompare = (intent === "compare" || !!compareTable) && compareItems.length >= 2;

  // Lọc bỏ chuỗi bảng thô khỏi bong bóng tin nhắn chính nếu có
  let displayContent = content;
  if (typeof content === "string") {
    if (isCompare || content.includes("|")) {
      const pipeIndex = content.indexOf("|");
      displayContent = pipeIndex !== -1 ? content.substring(0, pipeIndex).trim() : content.trim();
    }
  }

  const handleCompareClick = (item) =>
    item?._kind === "tv" ? onTvShowClick?.(item) : onMovieClick?.(item);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        marginBottom: 16,
        gap: 6,
      }}
    >
      {/* Label */}
      {showLabel && (
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 10,
            fontWeight: 600,
            color: W.textDim,
            letterSpacing: "0.3px",
            display: "block",
            textAlign: isUser ? "right" : "left",
          }}
        >
          {isUser ? "Bạn" : "Trợ lý"}
        </span>
      )}

      {/* Message bubble container */}
      <div
        style={{
          maxWidth: isUser ? "78%" : "92%",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          gap: 8,
        }}
      >
        {/* Main message bubble */}
        {(displayContent || isTyping) && (
          <div
            style={{
              padding: "11px 14px",
              borderRadius: isUser ? "14px 14px 3px 14px" : "3px 14px 14px 14px",
              background: isUser ? W.userBg : W.surfaceUp,
              border: isUser ? "none" : `1px solid ${W.border}`,
              color: isUser ? "#fff" : W.text,
              fontFamily: FONT_BODY,
              fontSize: 13.5,
              lineHeight: 1.6,
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            {isTyping ? <TypingDots /> : isUser ? content : renderMarkdown(displayContent)}
          </div>
        )}

        {/* Comparison card — thẻ so sánh 2 phim trực quan */}
        {showResults && isCompare && (
          <CompareCard
            movieA={compareItems[0]}
            movieB={compareItems[1]}
            markdownTable={compareTable}
            onMovieClick={handleCompareClick}
          />
        )}

        {/* Movie cards list — chỉ hiện khi KHÔNG phải so sánh */}
        {showResults && !isCompare && movies?.length > 0 && (
          <MovieCardsRow movies={movies} onMovieClick={onMovieClick} />
        )}

        {/* TV Show cards list — chỉ hiện khi KHÔNG phải so sánh */}
        {showResults && !isCompare && tvshows?.length > 0 && (
          <TvShowCardsRow tvshows={tvshows} onTvShowClick={onTvShowClick} />
        )}

        {/* Quick Action Chips */}
        {showResults && suggestedActions?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {suggestedActions.map((action, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onActionClick?.(action)}
                style={{
                  padding: "5px 11px",
                  borderRadius: 99,
                  background: W.surfaceUp,
                  border: `1px solid ${W.borderHi}`,
                  color: W.textSub,
                  fontFamily: FONT_BODY,
                  fontSize: 11,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = W.text;
                  e.currentTarget.style.borderColor = W.accent;
                  e.currentTarget.style.background = W.surfaceMid;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = W.textSub;
                  e.currentTarget.style.borderColor = W.borderHi;
                  e.currentTarget.style.background = W.surfaceUp;
                }}
              >
                {action}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}