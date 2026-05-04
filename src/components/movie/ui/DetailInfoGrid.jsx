// src/components/movie/ui/DetailInfoGrid.jsx
import React from "react";
import { C } from "./movieConstants";

/**
 * DetailInfoGrid — grid thông tin chi tiết dùng trong tab "Thêm thông tin".
 *
 * Props:
 *   rows     — Array<[label: string, value: string]>
 *   isMobile — boolean
 */
const DetailInfoGrid = ({ rows, isMobile = false }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: "12px 40px",
      maxWidth: 560,
    }}
  >
    {rows.map(([label, value]) => (
      <div
        key={label}
        style={{
          borderBottom: `1px solid ${C.border}`,
          paddingBottom: 12,
        }}
      >
        <p
          style={{
            fontFamily: "'Nunito',sans-serif",
            fontSize: 11,
            color: C.textDim,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 4,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontFamily: "'Nunito',sans-serif",
            fontSize: 14,
            color: C.text,
            fontWeight: 500,
          }}
        >
          {value}
        </p>
      </div>
    ))}
  </div>
);

export default DetailInfoGrid;