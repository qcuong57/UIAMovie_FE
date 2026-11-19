// src/components/home/SectionBadge.jsx
// Badge dạng pill dùng chung cho mọi section trang chủ (MovieRow, TopRankedRow, CountryMovieRows, ...)
// Giống hệt kiểu badge đang có trong MovieRow: nền nhạt + viền + icon + chữ in hoa.
import React from "react";
import { FONT_BODY } from "../../context/homeTokens";

export default function SectionBadge({ icon: Icon, text, color, style }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: `${color}18`,
        border: `1px solid ${color}50`,
        borderRadius: 999,
        padding: "3px 10px",
        flexShrink: 0,
        ...style,
      }}
    >
      {Icon && <Icon size={10} color={color} strokeWidth={2.5} />}
      <span
        style={{
          fontFamily: FONT_BODY,
          fontSize: 10,
          fontWeight: 700,
          color,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  );
}