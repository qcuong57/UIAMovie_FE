import React from "react";
import { motion } from "framer-motion";
import { IconWand } from "@tabler/icons-react";
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
}) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        gap: 8,
        alignItems: "flex-end",
        marginBottom: 14,
      }}
    >
      {/* Avatar */}
      {isUser ? (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${W.accent}, #a0101a)`,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(229,24,30,0.3)",
          }}
        >
          <span
            style={{
              fontFamily: FONT_BODY,
              fontSize: 9,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            B
          </span>
        </div>
      ) : (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: W.surfaceMid,
            border: `1px solid rgba(229,24,30,0.25)`,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 10px rgba(229,24,30,0.1)",
          }}
        >
          <IconWand size={12} color={W.accent} />
        </div>
      )}

      {/* Content */}
      <div
        style={{
          maxWidth: isUser ? "72%" : "84%",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Bubble */}
        <div
          style={{
            padding: "9px 13px",
            borderRadius: isUser ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
            background: isUser
              ? `linear-gradient(135deg, ${W.userBg}, #a01015)`
              : W.surfaceUp,
            border: isUser ? "none" : `1px solid ${W.border}`,
            color: isUser ? "#fff" : W.text,
            fontFamily: FONT_BODY,
            fontSize: 13,
            lineHeight: 1.65,
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            boxShadow: isUser
              ? "0 4px 16px rgba(229,24,30,0.2)"
              : "0 2px 8px rgba(0,0,0,0.25)",
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

        {/* Compare card */}
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

        {/* Movie cards — stagger is handled inside MovieCardsRow */}
        {!isUser && !isTyping && intent !== "compare" && movies?.length > 0 && (
          <MovieCardsRow movies={movies} onMovieClick={onMovieClick} />
        )}

        {/* TV Show cards — render bất cứ khi nào có tvshows, không giới hạn chỉ intent "tvshow" */}
        {!isUser && !isTyping && tvshows?.length > 0 && (
          <TvShowCardsRow tvshows={tvshows} onTvShowClick={onTvShowClick} />
        )}
      </div>
    </motion.div>
  );
}