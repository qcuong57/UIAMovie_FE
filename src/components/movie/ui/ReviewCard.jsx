import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { C } from "./movieConstants";

const ReviewCard = ({ review, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.08 }}
    style={{
      padding: "20px 24px",
      background: C.card,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      marginBottom: 14,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: `hsl(${(review.author?.charCodeAt(0) || 200) * 7}, 40%, 28%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: 16,
            fontWeight: 800,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {review.author?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div>
          <p
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: C.text,
            }}
          >
            {review.author || "Ẩn danh"}
          </p>
          {review.created_at && (
            <p
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 11,
                color: C.textDim,
              }}
            >
              {new Date(review.created_at).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>
      {review.author_details?.rating && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            borderRadius: 20,
            background: C.accentSoft,
            border: `1px solid ${C.accentGlow}`,
          }}
        >
          <Star size={11} style={{ fill: C.gold, color: C.gold }} />
          <span
            style={{
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: C.gold,
            }}
          >
            {review.author_details.rating}
          </span>
        </div>
      )}
    </div>
    <p
      style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: 13.5,
        color: C.textSub,
        lineHeight: 1.75,
        display: "-webkit-box",
        WebkitLineClamp: 4,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      {review.content}
    </p>
  </motion.div>
);

export default ReviewCard;
