import React from "react";
import { C } from "./movieConstants";

const StatPill = ({ icon: Icon, label, value }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 12px",
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 40,
    }}
  >
    <Icon size={13} style={{ color: C.accent, flexShrink: 0 }} />
    <span
      style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: 11,
        color: C.textDim,
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: 12,
        fontWeight: 600,
        color: C.text,
      }}
    >
      {value}
    </span>
  </div>
);

export default StatPill;
