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
}) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        marginBottom: 12,
      }}
    >
      {showLabel && (
        <span
          style={{
            fontFamily: FONT_BODY,
            fontSize: 9.5,
            fontWeight: 600,
            color: W.textDim,
            margin: isUser ? "0 2px 4px 0" : "0 0 4px 2px",
          }}
        >
          {isUser ? "Bạn" : "Trợ lý"}
        </span>
      )}

      <div
        style={{
          maxWidth: isUser ? "78%" : "88%",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <div
          style={{
            padding: "9px 13px",
            borderRadius: isUser ? "14px 14px 3px 14px" : "3px 14px 14px 14px",
            background: isUser ? W.userBg : W.surfaceUp,
            border: isUser ? "none" : `1px solid ${W.border}`,
            color: isUser ? "#fff" : W.text,
            fontFamily: FONT_BODY,
            fontSize: 13,
            lineHeight: 1.65,
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {isTyping ? (
            <TypingDots />
          ) : isUser ? (
            content
          ) : (
            renderMarkdown(content)
          )}
        </div>

        {!isUser &&
          !isTyping &&
          intent === "compare" &&
          compareTable &&
          movies?.length >= 2 && (
            <CompareCard
              movieA={movies[0]}
              movieB={movies[1]}
              markdownTable={compareTable}
              onMovieClick={onMovieClick}
            />
          )}

        {!isUser && !isTyping && intent !== "compare" && movies?.length > 0 && (
          <MovieCardsRow movies={movies} onMovieClick={onMovieClick} />
        )}

        {!isUser && !isTyping && tvshows?.length > 0 && (
          <TvShowCardsRow tvshows={tvshows} onTvShowClick={onTvShowClick} />
        )}
      </div>
    </motion.div>
  );
}