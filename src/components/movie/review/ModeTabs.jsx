// src/components/movie/shared/review/ModeTabs.jsx
import React from "react";
import {
  Tv,
  Film,
} from "lucide-react";
import { C } from "../../../context/homeTokens";

// ── ModeTabs — "Cả show" / "Theo tập" ─────────────────────────────────────
const ModeTabs = ({ mode, onChange }) => (
  <div
    role="tablist"
    style={{
      display: "flex",
      gap: 24,
      borderBottom: `1px solid ${C.border}`,
      marginBottom: 24,
    }}
  >
    {[
      { value: "show", label: "Cả show", Icon: Film },
      { value: "episode", label: "Theo tập", Icon: Tv },
    ].map(({ value, label, Icon }) => (
      <button
        key={value}
        type="button"
        role="tab"
        className="rv-tab"
        aria-selected={mode === value}
        onClick={() => onChange(value)}
      >
        <Icon size={15} />
        {label}
      </button>
    ))}
  </div>
);

export default ModeTabs;
