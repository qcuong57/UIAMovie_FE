// src/components/admin/ads/AdStatusBadge.jsx
// Nhãn trạng thái quảng cáo (Đang chạy / Tạm dừng) — dùng ở bảng và panel chi tiết.

import React from "react";
import { T, FONT_BODY as FONT } from "../../../context/adminTokens";

const GREEN = "#16A34A";

export default function AdStatusBadge({ isActive }) {
  const color = isActive ? GREEN : T.textMuted;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 20,
        background: isActive ? "#F0FDF4" : T.surfaceAlt,
        border: `1px solid ${isActive ? "rgba(22,163,74,0.25)" : T.border}`,
        fontFamily: FONT,
        fontSize: 11.5,
        fontWeight: 700,
        color,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      {isActive ? "Đang chạy" : "Tạm dừng"}
    </span>
  );
}