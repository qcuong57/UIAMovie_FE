// src/components/admin/dashboard/StatCard.jsx
import React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { T, ACCENT, FONT_BODY as FONT, FONT_TITLE } from "../../../context/adminTokens";
import { Skeleton } from "./DashboardPrimitives";

const DOWN = "#DC2626";

// Chip thay đổi: màu + mũi tên + dấu (không chỉ dựa vào màu) để người mù màu vẫn đọc được.
const Delta = ({ value }) => {
  const tone = value > 0 ? ACCENT : value < 0 ? DOWN : T.textMuted;
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 2, flexShrink: 0,
      fontFamily: FONT, fontSize: 11.5, fontWeight: 700, color: tone,
      background: `${tone}14`, padding: "1px 7px 1px 4px", borderRadius: 99,
    }}>
      <Icon size={13} aria-hidden="true" />
      {value > 0 ? "+" : ""}{value}%
    </span>
  );
};

/**
 * Thẻ chỉ số (KPI).
 *   label · value · hint (mô tả/so sánh) · icon + color (chip màu nhận diện) · delta (% thay đổi)
 * Nền trung tính, chỉ chip icon mang màu → 4 thẻ cạnh nhau không còn "tranh" sự chú ý.
 */
export const StatCard = ({ label, value, hint, icon: Icon, color = ACCENT, delta, loading }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
    padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, minHeight: 116,
  }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: T.textSub }}>{label}</span>
      {Icon && (
        <span style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: `${color}14`, color, display: "grid", placeItems: "center",
        }}>
          <Icon size={16} aria-hidden="true" />
        </span>
      )}
    </div>

    {loading ? (
      <Skeleton h={30} w="55%" r={6} />
    ) : (
      <span data-kpi-value="" style={{
        fontFamily: FONT_TITLE, fontSize: 28, fontWeight: 700, color: T.text,
        letterSpacing: "-0.02em", lineHeight: 1.1, fontVariantNumeric: "tabular-nums",
      }}>
        {value ?? "—"}
      </span>
    )}

    {loading ? (
      <Skeleton h={12} w="40%" r={4} />
    ) : (
      (delta != null || hint) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {delta != null && <Delta value={delta} />}
          {hint && <span style={{ fontFamily: FONT, fontSize: 12, color: T.textMuted, lineHeight: 1.4 }}>{hint}</span>}
        </div>
      )
    )}
  </div>
);

/** Hàng KPI responsive (4 → 2 → 1 cột). */
export const KpiGrid = ({ items, loading }) => (
  <div className="dg dg--4" data-dash-kpis="">
    {items.map((k) => <StatCard key={k.label} {...k} loading={loading} />)}
  </div>
);