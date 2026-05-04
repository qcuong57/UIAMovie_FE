// src/components/movie/tvshow/StatusBadge.jsx
import React from "react";
import { C } from "../ui/movieConstants";

export const STATUS_MAP = {
  Returning: 'Đang chiếu',
  Ended: 'Đã kết thúc',
  Canceled: 'Đã huỷ',
  Planned: 'Sắp ra mắt'
};
export const getStatus = (status) =>
  STATUS_MAP[status] ?? { label: status || "Không rõ", color: C.textDim };

export default function StatusBadge({ status }) {
  const { label, color } = getStatus(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "'Nunito', sans-serif",
        background: `${color}18`,
        color,
        border: `1px solid ${color}44`,
        letterSpacing: "0.04em",
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
      {label}
    </span>
  );
}