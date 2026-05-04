// src/components/movie/ui/EmptyState.jsx
import React from "react";
import { C } from "./movieConstants";

/**
 * EmptyState — placeholder khi không có dữ liệu.
 *
 * Props:
 *   icon     — emoji hoặc string (default "🎬")
 *   title    — dòng tiêu đề (required)
 *   subtitle — dòng mô tả nhỏ (optional)
 */
const EmptyState = ({
  icon = "🎬",
  title,
  subtitle,
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "60px 0",
      gap: 14,
    }}
  >
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: C.surfaceMid,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 28,
      }}
    >
      {icon}
    </div>

    {title && (
      <p
        style={{
          fontFamily: "'Nunito',sans-serif",
          fontSize: 16,
          fontWeight: 600,
          color: C.textSub,
        }}
      >
        {title}
      </p>
    )}

    {subtitle && (
      <p
        style={{
          fontFamily: "'Nunito',sans-serif",
          fontSize: 13,
          color: C.textDim,
          textAlign: "center",
          maxWidth: 300,
          lineHeight: 1.6,
        }}
      >
        {subtitle}
      </p>
    )}
  </div>
);

export default EmptyState;