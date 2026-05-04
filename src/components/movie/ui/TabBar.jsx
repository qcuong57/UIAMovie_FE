// src/components/movie/ui/TabBar.jsx
import React from "react";
import { C } from "./movieConstants";

/**
 * TabBar — thanh tab navigation dùng chung.
 *
 * Props:
 *   tabs      — Array<{ key: string, label: string }>
 *   activeTab — key của tab đang active
 *   onChange  — (key: string) => void
 *   isMobile  — boolean
 */
const TabBar = ({ tabs, activeTab, onChange, isMobile = false }) => (
  <div
    style={{
      display: "flex",
      borderBottom: `1px solid ${C.border}`,
      marginBottom: 32,
      overflowX: "auto",
    }}
  >
    {tabs.map((t) => (
      <button
        key={t.key}
        onClick={() => onChange(t.key)}
        style={{
          background: "none",
          border: "none",
          borderBottom: `2px solid ${activeTab === t.key ? C.accent : "transparent"}`,
          padding: isMobile ? "10px 12px" : "12px 20px",
          cursor: "pointer",
          fontFamily: "'Nunito',sans-serif",
          fontSize: isMobile ? 12 : 14,
          fontWeight: activeTab === t.key ? 700 : 500,
          color: activeTab === t.key ? C.text : C.textSub,
          transition: "all 0.2s",
          marginBottom: -1,
          whiteSpace: "nowrap",
        }}
      >
        {t.label}
      </button>
    ))}
  </div>
);

export default TabBar;